import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupWsServer, getConnectedClientsSnapshot } from './sockets/wsServer.js';

// Load environment variables (instrument.js loaded via --import loads .env first)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import * as Sentry from '@sentry/node';
import logger from './utils/logger.js';
import { requestId } from './utils/requestId.js';
import { recordApiRequest } from './utils/requestMetrics.js';
import { recordRateLimitBlock, registerRateLimitRule } from './utils/rateLimitMetrics.js';
import { getSecurityPolicies } from './utils/securityPolicyStore.js';
import mainRouter from './routes/index.js';
import { checkConnection } from './config/database.js';
import { csrfProtection, csrfTokenEndpoint } from './middlewares/csrf.js';

// ─── Validate required environment variables ────────────────
const REQUIRED_ENV = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'DB_PASSWORD'];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    logger.error(`Missing required environment variable: ${key}`);
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const getFrontendUrl = () => {
  const configuredUrl = process.env.FRONTEND_URL;

  if (
    configuredUrl &&
    !(process.env.NODE_ENV === 'production' && configuredUrl.includes('localhost'))
  ) {
    return configuredUrl;
  }

  if (process.env.RENDER_EXTERNAL_HOSTNAME) {
    return `https://${process.env.RENDER_EXTERNAL_HOSTNAME}`;
  }

  return process.env.NODE_ENV === 'production'
    ? 'https://field-sync.onrender.com'
    : 'http://localhost:3000';
};

const FRONTEND_URL = getFrontendUrl();
const securityPolicies = getSecurityPolicies();

const app = express();
const httpServer = createServer(app);

// Render terminates TLS and forwards requests to the Node process.
// Trust the first proxy so req.ip and express-rate-limit use X-Forwarded-For correctly.
app.set('trust proxy', 1);

// Raw WebSocket server (used by frontend socketManager.ts)
setupWsServer(httpServer);

// ─── Request ID (first middleware for tracing) ──────────────
app.use(requestId);

// ─── Middlewares ─────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https://*.gravatar.com", "https://*.googleusercontent.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      workerSrc: ["'self'", "blob:"],
      connectSrc: ["'self'",
        process.env.NODE_ENV === 'production'
          ? `wss://${new URL(FRONTEND_URL).hostname}`
          : `ws://localhost:${process.env.PORT || 5000}`,
        FRONTEND_URL,
        "https://*.ingest.us.sentry.io",
      ],
      frameAncestors: ["'none'"],
    },
  },
  frameguard: { action: 'deny' },
}));

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Rate Limiting ──────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: securityPolicies.rateLimits.lockoutDurationMinutes * 60 * 1000,
  max: securityPolicies.rateLimits.loginAttempts,
  message: { status: 'error', message: 'Too many auth requests, try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    recordRateLimitBlock({
      name: 'auth',
      path: req.originalUrl,
      ip: req.ip,
    });

    res.status(429).json({ status: 'error', message: 'Too many auth requests, try again later' });
  },
});

const otpLimiter = rateLimit({
  windowMs: securityPolicies.rateLimits.lockoutDurationMinutes * 60 * 1000,
  max: securityPolicies.rateLimits.otpAttempts,
  message: { status: 'error', message: 'Too many OTP requests, try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    recordRateLimitBlock({
      name: 'otp',
      path: req.originalUrl,
      ip: req.ip,
    });

    res.status(429).json({ status: 'error', message: 'Too many OTP requests, try again later' });
  },
});

const apiLimiter = rateLimit({
  windowMs: securityPolicies.rateLimits.globalWindowMinutes * 60 * 1000,
  max: securityPolicies.rateLimits.globalApiLimit,
  message: { status: 'error', message: 'Too many requests, try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    recordRateLimitBlock({
      name: 'api',
      path: req.originalUrl,
      ip: req.ip,
    });

    res.status(429).json({ status: 'error', message: 'Too many requests, try again later' });
  },
});

const inviteValidationLimiter = rateLimit({
  windowMs: securityPolicies.rateLimits.inviteValidationWindow * 60 * 1000,
  max: securityPolicies.rateLimits.inviteValidationLimit,
  message: { status: 'error', message: 'Too many invitation validation attempts, try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    recordRateLimitBlock({
      name: 'invite_validation',
      path: req.originalUrl,
      ip: req.ip,
    });

    res.status(429).json({ status: 'error', message: 'Too many invitation validation attempts, try again later' });
  },
});

registerRateLimitRule({
  name: 'auth',
  path: '/api/v1/auth',
  windowMs: securityPolicies.rateLimits.lockoutDurationMinutes * 60 * 1000,
  max: securityPolicies.rateLimits.loginAttempts,
  description: 'Login endpoint',
});

registerRateLimitRule({
  name: 'otp',
  path: '/api/v1/auth/(forgot-password|verify-otp|resend-otp)',
  windowMs: securityPolicies.rateLimits.lockoutDurationMinutes * 60 * 1000,
  max: securityPolicies.rateLimits.otpAttempts,
  description: 'OTP and recovery endpoints',
});

registerRateLimitRule({
  name: 'api',
  path: '/api/v1',
  windowMs: securityPolicies.rateLimits.globalWindowMinutes * 60 * 1000,
  max: securityPolicies.rateLimits.globalApiLimit,
  description: 'All versioned API routes',
});

registerRateLimitRule({
  name: 'invite_validation',
  path: '/api/v1/invitations/(validate|email/validate)',
  windowMs: securityPolicies.rateLimits.inviteValidationWindow * 60 * 1000,
  max: securityPolicies.rateLimits.inviteValidationLimit,
  description: 'Invitation code/token validation (prevents brute-force enumeration)',
});

app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);
app.use('/api/v1/auth/reset-password', authLimiter);
app.use('/api/v1/auth/forgot-password', otpLimiter);
app.use('/api/v1/auth/verify-otp', otpLimiter);
app.use('/api/v1/auth/resend-otp', otpLimiter);
app.use('/api/v1', apiLimiter);
app.use('/api/v1/invitations/validate', inviteValidationLimiter);
app.use('/api/v1/invitations/email/validate', inviteValidationLimiter);

// ─── Request logging ────────────────────────────────────────
app.use((req, res, next) => {
  const startedAt = Date.now();
  const reqId = req.id;

  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    recordApiRequest({
      timestamp: startedAt,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs,
      ip: req.ip,
      requestId: reqId,
    });
    logger.http(`[${reqId}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${durationMs}ms)`);
  });

  next();
});

// ─── Basic Routes ───────────────────────────────────────────
app.get('/health', async (req, res) => {
  let dbOk = false;
  try {
    await checkConnection();
    dbOk = true;
  } catch {
    dbOk = false;
  }

  const wsSnapshot = getConnectedClientsSnapshot();
  const overall = dbOk ? 'OK' : 'Service Unavailable';

  res.status(dbOk ? 200 : 503).json({
    status: overall,
    database: dbOk ? 'Connected' : 'Disconnected',
    websocket: {
      connected: wsSnapshot.total,
      byRole: wsSnapshot.byRole,
    },
    timestamp: new Date().toISOString(),
  });
});

app.get('/health/ws', (req, res) => {
  const snapshot = getConnectedClientsSnapshot();
  res.json({
    status: 'OK',
    connected: snapshot.total,
    byRole: snapshot.byRole,
    timestamp: new Date().toISOString(),
  });
});

// ─── CSRF token endpoint (must be before CSRF protection) ───
app.get('/api/v1/auth/csrf', csrfTokenEndpoint);

// ─── CSRF protection for mutation routes ────────────────────
app.use('/api/v1', csrfProtection);

// ─── API Routes ─────────────────────────────────────────────
app.use('/api/v1', mainRouter);

// ─── Debug Sentry endpoint (for verification) ────────────────
app.get('/debug-sentry', (req, res) => {
  Sentry.logger.info('User triggered test error', {
    action: 'test_error_endpoint',
  });
  Sentry.metrics.count('test_counter', 1);
  throw new Error('My first Sentry error!');
});

// ─── 404 handler ────────────────────────────────────────────
app.all('*', (req, res, next) => {
  // If request accepts HTML (browser), pass control to Next.js
  // If request accepts JSON (API client), return 404 JSON
  if (req.accepts('html')) {
    return next();
  }
  res.status(404).json({
    status: 'error',
    message: `Can't find ${req.originalUrl} on this server!`,
  });
});

// ─── Sentry error handler (must be before generic handler) ─
if (process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

// ─── Global Error Handler ───────────────────────────────────
app.use((err, req, res, next) => {
  const reqId = req?.id || '-';
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let code = err.code;

  // Handle Zod validation errors from asyncHandler
  if (err.name === 'ZodError') {
    statusCode = 400;
    message = err.issues.map(i => i.message).join('; ');
  }

  const level = statusCode >= 500 ? 'error' : 'warn';
  logger[level](`[${reqId}] ${err.name}: ${err.message}`);
  if (err.stack && statusCode >= 500) logger.debug(err.stack);
  res.status(statusCode).json({
    status: statusCode >= 500 ? 'error' : 'fail',
    ...(code ? { code } : {}),
    message: statusCode >= 500 && process.env.NODE_ENV === 'production'
      ? 'Internal Server Error'
      : message,
    ...(process.env.NODE_ENV === 'development' && err.stack ? { stack: err.stack } : {}),
  });
});

export { app, httpServer };
