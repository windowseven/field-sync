import { jest } from '@jest/globals';

const mockQuery = jest.fn();
const mockGetConnection = jest.fn();
const mockLogAudit = jest.fn(() => Promise.resolve());
const mockAddToBlacklist = jest.fn();
const mockSendOtpEmail = jest.fn();
const mockGetSecurityPolicies = jest.fn(() => ({
  password: { minLength: 4, requireUppercase: false, requireNumbers: false, requireSymbols: false },
  session: { accessTokenExpiryHours: 24, refreshTokenExpiryDays: 7 },
  rateLimits: {},
}));
const mockGetPlatformControls = jest.fn(() => Promise.resolve({ registrationBlocked: false }));
const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn(), http: jest.fn() };

jest.unstable_mockModule('../config/database.js', () => ({ default: { query: mockQuery, getConnection: mockGetConnection } }));
jest.unstable_mockModule('../controllers/auditLogController.js', () => ({ logAudit: mockLogAudit }));
jest.unstable_mockModule('../services/emailService.js', () => ({
  sendOtpEmail: mockSendOtpEmail,
  EmailDeliveryError: class EmailDeliveryError extends Error { constructor(m) { super(m); this.name = 'EmailDeliveryError'; } },
}));
jest.unstable_mockModule('../utils/tokenBlacklist.js', () => ({ addToBlacklist: mockAddToBlacklist }));
jest.unstable_mockModule('../utils/logger.js', () => ({ default: mockLogger }));
jest.unstable_mockModule('../utils/securityPolicyStore.js', () => ({ getSecurityPolicies: mockGetSecurityPolicies }));
jest.unstable_mockModule('../utils/platformConfigStore.js', () => ({ getPlatformControls: mockGetPlatformControls }));

const TEST_SECRET = 'test-secret-key-for-testing-only';

function mockReqRes() {
  const req = { headers: {}, body: {}, user: null, ip: '127.0.0.1', get: () => 'test-agent' };
  const res = { _status: 200, _json: null, status(c) { this._status = c; return this; }, json(o) { this._json = o; return this; } };
  return { req, res };
}

describe('auth endpoints', () => {
  let login, forgotPassword, resendOtp, logout, refresh, verifyOtp, resetPassword, register;

  beforeAll(async () => {
    process.env.JWT_SECRET = TEST_SECRET;
    process.env.JWT_REFRESH_SECRET = TEST_SECRET + '-refresh';
    const mod = await import('../controllers/authController.js');
    login = mod.login;
    forgotPassword = mod.forgotPassword;
    resendOtp = mod.resendOtp;
    logout = mod.logout;
    refresh = mod.refresh;
    verifyOtp = mod.verifyOtp;
    resetPassword = mod.resetPassword;
    register = mod.register;
  });

  afterAll(() => {
    delete process.env.JWT_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
  });

  beforeEach(() => jest.clearAllMocks());

  describe('login', () => {
    test('401 for unknown email', async () => {
      mockQuery.mockResolvedValueOnce([[]]);
      const { req, res } = mockReqRes();
      req.body = { email: 'x@y.com', password: 'P1' };
      await login(req, res, () => {});
      expect(res._status).toBe(401);
    });

    test('200 for valid credentials', async () => {
      const bcrypt = (await import('bcryptjs')).default;
      const hash = await bcrypt.hash('P1', 4);
      mockQuery.mockResolvedValueOnce([[
        { id: 'u1', email: 'u@t.com', password_hash: hash, role: 'fa', name: 'U', first_name: 'U', avatar: null, verification_code: null },
      ]]);
      const { req, res } = mockReqRes();
      req.body = { email: 'u@t.com', password: 'P1' };
      await login(req, res, () => {});
      expect(res._status).toBe(200);
      expect(res._json.status).toBe('success');
      expect(res._json.data.token).toBeDefined();
    });

    test('403 for unverified email', async () => {
      const bcrypt = (await import('bcryptjs')).default;
      const hash = await bcrypt.hash('P1', 4);
      mockQuery.mockResolvedValueOnce([[
        { id: 'u1', email: 'u@t.com', password_hash: hash, role: 'fa', name: 'U', first_name: 'U', avatar: null, verification_code: '123456' },
      ]]);
      const { req, res } = mockReqRes();
      req.body = { email: 'u@t.com', password: 'P1' };
      await login(req, res, () => {});
      expect(res._status).toBe(403);
      expect(res._json.code).toBe('EMAIL_NOT_VERIFIED');
    });
  });

  describe('register', () => {
    test('409 for existing verified email', async () => {
      mockQuery.mockResolvedValue([[{ id: 'u1', name: 'Test', first_name: 'T', email: 'e@t.com', role: 'fa', verification_code: null }]]);
      const { req, res } = mockReqRes();
      req.body = { name: 'Test', first_name: 'T', email: 'e@t.com', password: 'Strong1' };
      await register(req, res, () => {});
      expect(res._status).toBe(409);
    });

    test('201 for new user', async () => {
      mockQuery.mockResolvedValueOnce([[]]).mockResolvedValueOnce([{ affectedRows: 1 }]);
      const { req, res } = mockReqRes();
      req.body = { name: 'New', first_name: 'N', email: 'n@t.com', password: 'Strong1' };
      await register(req, res, () => {});
      expect(res._status).toBe(201);
    });

    test('403 when registration blocked', async () => {
      mockGetPlatformControls.mockResolvedValue({ registrationBlocked: true });
      const { req, res } = mockReqRes();
      req.body = { name: 'Test', first_name: 'T', email: 't@t.com', password: 'Strong1' };
      await register(req, res, () => {});
      expect(res._status).toBe(403);
    });
  });

  describe('forgotPassword', () => {
    test('200 even when email missing', async () => {
      mockQuery.mockResolvedValueOnce([[]]);
      const { req, res } = mockReqRes();
      req.body = { email: 'x@y.com' };
      await forgotPassword(req, res, () => {});
      expect(res._status).toBe(200);
    });
  });

  describe('resendOtp', () => {
    test('200 when email not found', async () => {
      mockQuery.mockResolvedValueOnce([[]]);
      const { req, res } = mockReqRes();
      req.body = { email: 'x@y.com' };
      await resendOtp(req, res, () => {});
      expect(res._status).toBe(200);
    });
  });

  describe('logout', () => {
    test('200', async () => {
      const jwt = (await import('jsonwebtoken')).default;
      const t = jwt.sign({ userId: 'u1', jti: 'j', type: 'access' }, TEST_SECRET, { expiresIn: '1h' });
      const { req, res } = mockReqRes();
      req.user = { id: 'u1' };
      req.headers.authorization = `Bearer ${t}`;
      await logout(req, res, () => {});
      expect(res._status).toBe(200);
    });
  });

  describe('refresh', () => {
    test('400 for missing token', async () => {
      const { req, res } = mockReqRes();
      req.body = {};
      await refresh(req, res, () => {});
      expect(res._status).toBe(400);
    });

    test('200 for valid token', async () => {
      const jwt = (await import('jsonwebtoken')).default;
      const rt = jwt.sign({ userId: 'u1', jti: 'j', type: 'refresh' }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
      mockQuery.mockResolvedValueOnce([[{ id: 'u1', name: 'U', email: 'u@t.com', role: 'fa' }]]);
      const { req, res } = mockReqRes();
      req.body = { refreshToken: rt };
      await refresh(req, res, () => {});
      expect(res._status).toBe(200);
      expect(res._json.data.token).toBeDefined();
    });
  });

  describe('verifyOtp', () => {
    test('400 for invalid OTP', async () => {
      mockQuery.mockResolvedValueOnce([[]]);
      const { req, res } = mockReqRes();
      req.body = { email: 'u@t.com', otp: '000000' };
      await verifyOtp(req, res, () => {});
      expect(res._status).toBe(400);
    });
  });

  describe('resetPassword', () => {
    test('400 for invalid token', async () => {
      mockQuery.mockResolvedValueOnce([[]]);
      const { req, res } = mockReqRes();
      req.body = { token: 'bad', password: 'NewPass1' };
      await resetPassword(req, res, () => {});
      expect(res._status).toBe(400);
    });
  });
});
