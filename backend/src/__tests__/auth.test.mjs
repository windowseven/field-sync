import jwt from 'jsonwebtoken';
import { authenticateToken, authorizeRole } from '../middlewares/auth.js';
import { addToBlacklist } from '../utils/tokenBlacklist.js';

const TEST_SECRET = 'test-secret-key-for-testing-only';

function mockReqRes() {
  const req = { headers: {}, user: null };
  const res = {
    _status: 0,
    _json: null,
    status(code) { this._status = code; return this; },
    json(obj) { this._json = obj; return this; },
  };
  return { req, res };
}

function signTestToken(payload) {
  return jwt.sign(payload, TEST_SECRET, { expiresIn: '1h' });
}

describe('authenticateToken middleware', () => {
  const OLD_SECRET = process.env.JWT_SECRET;

  beforeAll(() => {
    process.env.JWT_SECRET = TEST_SECRET;
  });

  afterAll(() => {
    process.env.JWT_SECRET = OLD_SECRET;
  });

  test('rejects request with no token', () => {
    const { req, res } = mockReqRes();
    let called = false;
    authenticateToken(req, res, () => { called = true; });

    expect(called).toBe(false);
    expect(res._status).toBe(401);
    expect(res._json.message).toContain('No token');
  });

  test('rejects request with empty token', () => {
    const { req, res } = mockReqRes();
    req.headers['authorization'] = 'Bearer ';
    let called = false;
    authenticateToken(req, res, () => { called = true; });

    expect(called).toBe(false);
    expect(res._status).toBe(401);
  });

  test('rejects request with malformed token', () => {
    const { req, res } = mockReqRes();
    req.headers['authorization'] = 'Bearer not-a-valid-token';
    let called = false;
    authenticateToken(req, res, () => { called = true; });

    expect(called).toBe(false);
    expect(res._status).toBe(401);
  });

  test('accepts request with valid token', () => {
    const token = signTestToken({ userId: 'user-1', role: 'admin', email: 'admin@test.com', jti: 'jti-valid' });
    const { req, res } = mockReqRes();
    req.headers['authorization'] = `Bearer ${token}`;
    let called = false;
    authenticateToken(req, res, () => { called = true; });

    expect(called).toBe(true);
    expect(req.user.id).toBe('user-1');
    expect(req.user.role).toBe('admin');
    expect(req.user.email).toBe('admin@test.com');
    expect(req.tokenJti).toBe('jti-valid');
  });

  test('rejects request with blacklisted jti', () => {
    const jti = 'jti-blacklisted';
    addToBlacklist(jti, 60000);

    const token = signTestToken({ userId: 'user-1', role: 'admin', email: 'admin@test.com', jti });
    const { req, res } = mockReqRes();
    req.headers['authorization'] = `Bearer ${token}`;
    let called = false;
    authenticateToken(req, res, () => { called = true; });

    expect(called).toBe(false);
    expect(res._status).toBe(401);
    expect(res._json.message).toContain('revoked');
  });

  test('rejects expired token', () => {
    const expiredToken = jwt.sign(
      { userId: 'user-1', role: 'admin', email: 'admin@test.com', jti: 'jti-expired' },
      TEST_SECRET,
      { expiresIn: '0s' }
    );

    const { req, res } = mockReqRes();
    req.headers['authorization'] = `Bearer ${expiredToken}`;

    // Wait 1 second for expiry
    return new Promise(resolve => {
      setTimeout(() => {
        let called = false;
        authenticateToken(req, res, () => { called = true; });
        expect(called).toBe(false);
        expect(res._status).toBe(401);
        resolve();
      }, 1100);
    });
  });

  test('extracts user data from token correctly', () => {
    const userData = { userId: 'user-2', role: 'field_agent', email: 'agent@test.com', jti: 'jti-userdata' };
    const token = signTestToken(userData);
    const { req, res } = mockReqRes();
    req.headers['authorization'] = `Bearer ${token}`;

    let called = false;
    authenticateToken(req, res, () => { called = true; });

    expect(called).toBe(true);
    expect(req.user).toEqual({
      id: 'user-2',
      role: 'field_agent',
      email: 'agent@test.com',
    });
  });
});

describe('authorizeRole middleware', () => {
  test('allows request when user has required role', () => {
    const { req, res } = mockReqRes();
    req.user = { id: '1', role: 'admin', email: 'admin@test.com' };

    let called = false;
    authorizeRole(['admin'])(req, res, () => { called = true; });

    expect(called).toBe(true);
  });

  test('denies request when user lacks required role', () => {
    const { req, res } = mockReqRes();
    req.user = { id: '1', role: 'field_agent', email: 'agent@test.com' };

    let called = false;
    authorizeRole(['admin'])(req, res, () => { called = true; });

    expect(called).toBe(false);
    expect(res._status).toBe(403);
    expect(res._json.message).toContain('Permission denied');
  });

  test('denies request when no user in request', () => {
    const { req, res } = mockReqRes();

    let called = false;
    authorizeRole(['admin'])(req, res, () => { called = true; });

    expect(called).toBe(false);
    expect(res._status).toBe(403);
  });

  test('allows multiple roles', () => {
    const { req: req1, res: res1 } = mockReqRes();
    req1.user = { id: '1', role: 'supervisor' };

    let called1 = false;
    authorizeRole(['admin', 'supervisor'])(req1, res1, () => { called1 = true; });
    expect(called1).toBe(true);

    const { req: req2, res: res2 } = mockReqRes();
    req2.user = { id: '2', role: 'team_leader' };

    let called2 = false;
    authorizeRole(['admin', 'supervisor'])(req2, res2, () => { called2 = true; });
    expect(called2).toBe(false);
  });
});
