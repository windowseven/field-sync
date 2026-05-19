import crypto from 'crypto';
import logger from '../utils/logger.js';

const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

export const csrfTokenEndpoint = (req, res) => {
  const token = generateCsrfToken();

  const isHttps = req.protocol === 'https';
  res.cookie('XSRF-TOKEN', token, {
    httpOnly: false,
    secure: isHttps,
    sameSite: 'Strict',
    maxAge: TOKEN_EXPIRY_MS,
    path: '/',
  });

  res.json({
    status: 'success',
    data: { csrfToken: token },
  });
};

export const csrfProtection = (req, res, next) => {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];

  if (safeMethods.includes(req.method)) {
    return next();
  }

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

  const headerToken =
    req.headers['x-csrf-token'] ||
    req.headers['x-xsrf-token'];

  const cookieToken = req.cookies?.['XSRF-TOKEN'];

  if (!headerToken || !cookieToken || headerToken !== cookieToken) {
    logger.warn(`CSRF validation failed for ${req.method} ${req.path}`);
    return res.status(403).json({
      status: 'error',
      message: 'CSRF token missing or invalid. Refresh the page and try again.',
    });
  }

  next();
};
