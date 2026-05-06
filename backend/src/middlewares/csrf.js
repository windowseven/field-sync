import crypto from 'crypto';
import logger from '../utils/logger.js';

const CSRF_SECRET = process.env.CSRF_SECRET || crypto.randomBytes(32).toString('hex');
const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

// In-memory CSRF token store (per-session)
// In production, use Redis or DB-backed sessions
const csrfTokens = new Map();

// Clean expired tokens every 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of csrfTokens) {
    if (now > data.expiresAt) {
      csrfTokens.delete(token);
    }
  }
}, 30 * 60 * 1000);

/**
 * Generate a CSRF token
 */
function generateCsrfToken() {
  const token = crypto.randomBytes(32).toString('hex');
  csrfTokens.set(token, {
    expiresAt: Date.now() + TOKEN_EXPIRY_MS,
  });
  return token;
}

/**
 * Validate a CSRF token
 */
function validateCsrfToken(token) {
  if (!token) return false;
  const data = csrfTokens.get(token);
  if (!data) return false;
  if (Date.now() > data.expiresAt) {
    csrfTokens.delete(token);
    return false;
  }
  return true;
}

/**
 * CSRF Token Endpoint — GET /api/v1/auth/csrf
 * Returns a fresh CSRF token for the client to use
 */
export const csrfTokenEndpoint = (req, res) => {
  const token = generateCsrfToken();

  // Also set as a readable cookie (for SPA convenience)
  const isHttps = req.protocol === 'https';
  res.cookie('XSRF-TOKEN', token, {
    httpOnly: false, // Client needs to read this
    secure: isHttps,
    sameSite: 'Lax',
    maxAge: TOKEN_EXPIRY_MS,
    path: '/',
  });

  res.json({
    status: 'success',
    data: { csrfToken: token },
  });
};

/**
 * CSRF Protection Middleware
 * Validates X-CSRF-Token header on state-changing requests
 * Safe methods (GET, HEAD, OPTIONS) are exempt
 */
export const csrfProtection = (req, res, next) => {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];

  if (safeMethods.includes(req.method)) {
    return next();
  }

  // Skip CSRF for auth endpoints that don't require it
  const csrfExemptPaths = [
    '/auth/login',
    '/auth/register',
    '/auth/refresh',
    '/auth/forgot-password',
    '/auth/verify-otp',
    '/auth/resend-otp',
    '/auth/reset-password',
  ];

  const requestPath = req.path;
  if (csrfExemptPaths.some(p => requestPath.startsWith(p))) {
    return next();
  }

  const csrfToken =
    req.headers['x-csrf-token'] ||
    req.headers['x-xsrf-token'] ||
    req.cookies?.['XSRF-TOKEN'];

  if (!validateCsrfToken(csrfToken)) {
    logger.warn(`CSRF validation failed for ${req.method} ${req.path}`);
    return res.status(403).json({
      status: 'error',
      message: 'CSRF token missing or invalid. Refresh the page and try again.',
    });
  }

  next();
};
