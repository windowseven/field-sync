import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupWsServer } from './sockets/wsServer.js';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import logger from './utils/logger.js';
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

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const securityPolicies = getSecurityPolicies();

const app = express();
const httpServer = createServer(app);

// Raw WebSocket server (used by frontend socketManager.ts)
setupWsServer(httpServer);

// ─── Middlewares ─────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'",
        process.env.NODE_ENV === 'production'
          ? `wss://${new URL(FRONTEND_URL).hostname}`
          : `ws://localhost:${process.env.PORT || 5000}`,
        FRONTEND_URL,
      ],
    },
  },
}));

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

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
app.use('/api/v1/auth/forgot-password', otpLimiter);
app.use('/api/v1/auth/verify-otp', otpLimiter);
app.use('/api/v1/auth/resend-otp', otpLimiter);
app.use('/api/v1', apiLimiter);
app.use('/api/v1/invitations/validate', inviteValidationLimiter);
app.use('/api/v1/invitations/email/validate', inviteValidationLimiter);

// ─── Request logging ────────────────────────────────────────
app.use((req, res, next) => {
  const startedAt = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    recordApiRequest({
      timestamp: startedAt,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs,
      ip: req.ip,
    });
    logger.http(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${durationMs}ms)`);
  });

  next();
});

// ─── Basic Routes ───────────────────────────────────────────
app.get('/', (req, res) => {
  res.redirect(FRONTEND_URL);
});

app.get('/health', async (req, res) => {
  try {
    await checkConnection();
    res.status(200).json({
      status: 'OK',
      database: 'Connected',
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.status(503).json({
      status: 'Service Unavailable',
      database: 'Disconnected',
      timestamp: new Date().toISOString(),
    });
  }
});

// ─── CSRF token endpoint (must be before CSRF protection) ───
app.get('/api/v1/auth/csrf', csrfTokenEndpoint);

// ─── CSRF protection for mutation routes ────────────────────
app.use('/api/v1', csrfProtection);

// ─── API Routes ─────────────────────────────────────────────
app.use('/api/v1', mainRouter);

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

// ─── Global Error Handler ───────────────────────────────────
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const status = err.status || 'error';

  logger.error(`${err.name}: ${err.message}`);

  res.status(statusCode).json({
    status,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

export { app, httpServer };
