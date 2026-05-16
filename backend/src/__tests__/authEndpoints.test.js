jest.mock('../config/database.js', () => {
  const mockPool = { query: jest.fn(), getConnection: jest.fn() };
  return { __esModule: true, default: mockPool };
});

jest.mock('../services/emailService.js', () => {
  const mockSend = jest.fn();
  return {
    __esModule: true,
    sendOtpEmail: mockSend,
    EmailDeliveryError: class EmailDeliveryError extends Error {
      constructor(msg) { super(msg); this.name = 'EmailDeliveryError'; }
    },
  };
});

jest.mock('./auditLogController.js', () => {
  const mockLogAudit = jest.fn(() => Promise.resolve());
  return { __esModule: true, logAudit: mockLogAudit };
});

jest.mock('../utils/tokenBlacklist.js', () => {
  const mockAddToBlacklist = jest.fn();
  return { __esModule: true, addToBlacklist: mockAddToBlacklist };
});

jest.mock('../utils/logger.js', () => {
  return {
    __esModule: true,
    default: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn(), http: jest.fn() },
  };
});

jest.mock('../utils/securityPolicyStore.js', () => ({
  __esModule: true,
  getSecurityPolicies: jest.fn(() => ({
    password: { minLength: 8, requireUppercase: true, requireNumbers: true, requireSymbols: false },
    session: { accessTokenExpiryHours: 24, refreshTokenExpiryDays: 7 },
    rateLimits: { loginAttempts: 10, otpAttempts: 5, globalWindowMinutes: 15, globalApiLimit: 100, lockoutDurationMinutes: 15, inviteValidationWindow: 15, inviteValidationLimit: 10 },
  })),
}));

jest.mock('../utils/platformConfigStore.js', () => ({
  __esModule: true,
  getPlatformControls: jest.fn(() => Promise.resolve({ registrationBlocked: false })),
}));

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';
import * as authController from '../controllers/authController.js';

const TEST_SECRET = 'test-secret-key-for-testing-only';
const OLD_SECRET = process.env.JWT_SECRET;
const OLD_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

function mockReqRes() {
  const req = { headers: {}, body: {}, user: null, ip: '127.0.0.1', get: () => 'test-agent' };
  const res = { _status: 0, _json: null, status(code) { this._status = code; return this; }, json(obj) { this._json = obj; return this; } };
  const next = jest.fn();
  return { req, res, next };
}

async function callController(fn, req, res, next) {
  try { await fn(req, res, next); } catch (err) { next(err); }
}

describe('Auth Controller — Login', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = TEST_SECRET;
    process.env.JWT_REFRESH_SECRET = TEST_SECRET + '-refresh';
  });

  afterAll(() => {
    process.env.JWT_SECRET = OLD_SECRET;
    process.env.JWT_REFRESH_SECRET = OLD_REFRESH_SECRET;
  });

  beforeEach(() => { jest.clearAllMocks(); });

  test('returns 401 for non-existent email', async () => {
    pool.query.mockResolvedValueOnce([[]]);
    const { req, res, next } = mockReqRes();
    req.body = { email: 'nobody@test.com', password: 'Password1' };

    await callController(authController.login, req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  test('returns 401 for wrong password', async () => {
    const hashed = await bcrypt.hash('RealPass1', 4);
    pool.query.mockResolvedValueOnce([[{ id: 'u1', email: 'user@test.com', password_hash: hashed, role: 'field_agent', verification_code: null }]]);
    const { req, res, next } = mockReqRes();
    req.body = { email: 'user@test.com', password: 'WrongPass1' };

    await callController(authController.login, req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  test('returns 403 for unverified user', async () => {
    const hashed = await bcrypt.hash('RealPass1', 4);
    pool.query.mockResolvedValueOnce([[{ id: 'u1', email: 'user@test.com', password_hash: hashed, role: 'field_agent', verification_code: '123456' }]]);
    const { req, res, next } = mockReqRes();
    req.body = { email: 'user@test.com', password: 'RealPass1' };

    await callController(authController.login, req, res, next);

    expect(res._status).toBe(403);
    expect(res._json.code).toBe('EMAIL_NOT_VERIFIED');
  });

  test('returns 200 with tokens for valid credentials', async () => {
    const hashed = await bcrypt.hash('RealPass1', 4);
    pool.query.mockResolvedValueOnce([[{
      id: 'u1', email: 'user@test.com', password_hash: hashed, role: 'field_agent',
      name: 'Test User', first_name: 'Test', avatar: null, verification_code: null,
    }]]);
    const { req, res, next } = mockReqRes();
    req.body = { email: 'user@test.com', password: 'RealPass1' };

    await callController(authController.login, req, res, next);

    expect(res._status).toBe(200);
    expect(res._json.status).toBe('success');
    expect(res._json.data.token).toBeDefined();
    expect(res._json.data.refreshToken).toBeDefined();
    expect(res._json.data.user.email).toBe('user@test.com');
  });
});

describe('Auth Controller — Register', () => {
  beforeEach(() => { jest.clearAllMocks(); });

  test('returns 409 for already registered (verified) email', async () => {
    pool.query.mockResolvedValueOnce([[{ id: 'u1', name: 'Test', first_name: 'Test', email: 'existing@test.com', role: 'field_agent', verification_code: null }]]);
    const { req, res, next } = mockReqRes();
    req.body = { name: 'Test User', first_name: 'Test', email: 'existing@test.com', password: 'StrongPass1' };

    await callController(authController.register, req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 409 }));
  });

  test('registers a new user successfully', async () => {
    pool.query.mockResolvedValueOnce([[]]).mockResolvedValueOnce([{ insertId: 'new-uuid' }]);
    const { req, res, next } = mockReqRes();
    req.body = { name: 'New User', first_name: 'New', email: 'new@test.com', password: 'StrongPass1' };

    await callController(authController.register, req, res, next);

    expect(res._status).toBe(201);
    expect(res._json.status).toBe('success');
    expect(res._json.data.email).toBe('new@test.com');
  });

  test('blocks registration when platform control blocks it', async () => {
    const { getPlatformControls } = require('../utils/platformConfigStore.js');
    getPlatformControls.mockResolvedValue({ registrationBlocked: true });
    const { req, res, next } = mockReqRes();
    req.body = { name: 'Test', first_name: 'Test', email: 't@test.com', password: 'StrongPass1' };

    await callController(authController.register, req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });
});
