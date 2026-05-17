import { jest } from '@jest/globals';
import { ensureTestDatabase, createTestPool, runMigrations } from '../helpers/e2eDb.js';

let pool;
const mockLogger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn(), http: jest.fn() };
const mockLogAudit = jest.fn(() => Promise.resolve());
const mockGetSecurityPolicies = jest.fn(() => ({
  password: { minLength: 4, requireUppercase: false, requireNumbers: false, requireSymbols: false },
  session: { accessTokenExpiryHours: 24, refreshTokenExpiryDays: 7 },
  rateLimits: {},
}));
const mockGetPlatformControls = jest.fn(() => Promise.resolve({ registrationBlocked: false }));

jest.unstable_mockModule('../../config/database.js', async () => {
  await ensureTestDatabase();
  pool = createTestPool();
  await runMigrations(pool);
  return { default: pool, checkConnection: async () => {} };
});
jest.unstable_mockModule('../controllers/auditLogController.js', () => ({ logAudit: mockLogAudit }));
jest.unstable_mockModule('../../utils/logger.js', () => ({ default: mockLogger }));
jest.unstable_mockModule('../../utils/securityPolicyStore.js', () => ({ getSecurityPolicies: mockGetSecurityPolicies }));
jest.unstable_mockModule('../../utils/platformConfigStore.js', () => ({ getPlatformControls: mockGetPlatformControls }));
jest.unstable_mockModule('../../utils/tokenBlacklist.js', () => ({ addToBlacklist: jest.fn() }));

const TEST_SECRET = 'e2e-test-jwt-secret-key';

function mockReqRes() {
  const req = { headers: {}, body: {}, user: null, ip: '127.0.0.1', get: () => 'e2e-test-agent' };
  const res = { _status: 200, _json: null, status(c) { this._status = c; return this; }, json(o) { this._json = o; return this; } };
  return { req, res };
}

describe('auth E2E (real database)', () => {
  let register, login;

  beforeAll(async () => {
    process.env.JWT_SECRET = TEST_SECRET;
    process.env.JWT_REFRESH_SECRET = TEST_SECRET + '-refresh';

    const auth = await import('../../controllers/authController.js');
    register = auth.register;
    login = auth.login;

    await pool.query("DELETE FROM users WHERE email LIKE 'e2e-test-%'");
  }, 30000);

  afterAll(async () => {
    await pool.query("DELETE FROM users WHERE email LIKE 'e2e-test-%'");
    if (pool) await pool.end();
    delete process.env.JWT_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
  }, 10000);

  beforeEach(() => jest.clearAllMocks());

  it('creates a user and persists to database', async () => {
    const { req, res } = mockReqRes();
    req.body = {
      name: 'e2e-test-user',
      first_name: 'E2E',
      email: 'e2e-test-user@example.com',
      password: 'TestPass123!',
      role: 'field_agent',
    };

    await register(req, res);

    expect(res._status).toBe(201);
    expect(res._json.status).toBe('success');

    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [res._json.data.id]);
    expect(rows.length).toBe(1);
    expect(rows[0].email).toBe('e2e-test-user@example.com');
    expect(rows[0].role).toBe('field_agent');
  });

  it('rejects duplicate email', async () => {
    const { req, res } = mockReqRes();
    req.body = {
      name: 'e2e-test-user-dup',
      first_name: 'E2E',
      email: 'e2e-test-user@example.com',
      password: 'TestPass123!',
    };

    await register(req, res);

    expect(res._status).toBe(409);
    expect(res._json.status).toBe('error');
  });

  it('validates login against real database', async () => {
    const { req, res } = mockReqRes();
    req.body = { email: 'e2e-test-user@example.com', password: 'TestPass123!' };

    await login(req, res);

    expect(res._status).toBe(200);
    expect(res._json.status).toBe('success');
    expect(res._json.data.token).toBeTruthy();
  });

  it('rejects wrong password', async () => {
    const { req, res } = mockReqRes();
    req.body = { email: 'e2e-test-user@example.com', password: 'WrongPassword!' };

    await login(req, res);

    expect(res._status).toBe(401);
  });
});
