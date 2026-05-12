import { csrfTokenEndpoint, csrfProtection } from '../middlewares/csrf.js';

function mockReqRes() {
  const req = {
    protocol: 'http',
    method: 'POST',
    path: '/api/v1/projects',
    headers: {},
    cookies: {},
  };
  const res = {
    _status: 0,
    _json: null,
    _cookie: null,
    status(code) { this._status = code; return this; },
    json(obj) { this._json = obj; return this; },
    cookie(name, value, opts) { this._cookie = { name, value, opts }; return this; },
  };
  return { req, res };
}

describe('CSRF Middleware', () => {
  describe('csrfTokenEndpoint', () => {
    test('returns a CSRF token in JSON response', () => {
      const { req, res } = mockReqRes();
      csrfTokenEndpoint(req, res);

      expect(res._json).toBeDefined();
      expect(res._json.status).toBe('success');
      expect(res._json.data.csrfToken).toBeDefined();
      expect(typeof res._json.data.csrfToken).toBe('string');
      expect(res._json.data.csrfToken.length).toBeGreaterThan(0);
    });

    test('sets XSRF-TOKEN cookie with httpOnly and strict sameSite', () => {
      const { req, res } = mockReqRes();
      csrfTokenEndpoint(req, res);

      expect(res._cookie).toBeDefined();
      expect(res._cookie.name).toBe('XSRF-TOKEN');
      expect(res._cookie.opts.httpOnly).toBe(true);
      expect(res._cookie.opts.sameSite).toBe('Strict');
    });

    test('token in JSON matches token in cookie', () => {
      const { req, res } = mockReqRes();
      csrfTokenEndpoint(req, res);

      expect(res._json.data.csrfToken).toBe(res._cookie.value);
    });
  });

  describe('csrfProtection', () => {
    test('allows safe methods (GET) without token', () => {
      const { req, res } = mockReqRes();
      req.method = 'GET';

      let called = false;
      csrfProtection(req, res, () => { called = true; });

      expect(called).toBe(true);
    });

    test('allows safe methods (HEAD, OPTIONS) without token', () => {
      for (const method of ['HEAD', 'OPTIONS']) {
        const { req, res } = mockReqRes();
        req.method = method;
        let called = false;
        csrfProtection(req, res, () => { called = true; });
        expect(called).toBe(true);
      }
    });

    test('allows exempt auth paths without token', () => {
      const exemptPaths = [
        '/auth/login',
        '/auth/register',
        '/auth/refresh',
        '/auth/forgot-password',
        '/auth/verify-otp',
        '/auth/resend-otp',
        '/auth/reset-password',
      ];

      for (const path of exemptPaths) {
        const { req, res } = mockReqRes();
        req.method = 'POST';
        req.path = path;
        let called = false;
        csrfProtection(req, res, () => { called = true; });
        expect(called).toBe(true);
      }
    });

    test('rejects mutation requests without CSRF token', () => {
      const { req, res } = mockReqRes();
      req.method = 'POST';
      req.path = '/api/v1/projects';

      let called = false;
      csrfProtection(req, res, () => { called = true; });

      expect(called).toBe(false);
      expect(res._status).toBe(403);
      expect(res._json.message).toContain('CSRF token');
    });

    test('accepts mutation requests with valid CSRF token in header', () => {
      // First get a token
      const tokenReq = { protocol: 'http', headers: {}, cookies: {} };
      const tokenRes = { _json: null, _cookie: null, status() { return this; }, json(obj) { this._json = obj; }, cookie(n, v, o) { this._cookie = { name: n, value: v, opts: o }; } };
      csrfTokenEndpoint(tokenReq, tokenRes);

      const csrfToken = tokenRes._json.data.csrfToken;

      // Now use it
      const { req, res } = mockReqRes();
      req.method = 'POST';
      req.path = '/api/v1/projects';
      req.headers['x-csrf-token'] = csrfToken;

      let called = false;
      csrfProtection(req, res, () => { called = true; });

      expect(called).toBe(true);
    });

    test('rejects mutation requests with invalid CSRF token', () => {
      const { req, res } = mockReqRes();
      req.method = 'POST';
      req.path = '/api/v1/projects';
      req.headers['x-csrf-token'] = 'invalid-token';

      let called = false;
      csrfProtection(req, res, () => { called = true; });

      expect(called).toBe(false);
      expect(res._status).toBe(403);
    });

    test('accepts XSRF-TOKEN from cookie as fallback', () => {
      // First get a token
      const tokenReq = { protocol: 'http', headers: {}, cookies: {} };
      const tokenRes = { _json: null, _cookie: null, status() { return this; }, json(obj) { this._json = obj; }, cookie(n, v, o) { this._cookie = { name: n, value: v, opts: o }; } };
      csrfTokenEndpoint(tokenReq, tokenRes);

      const csrfToken = tokenRes._cookie.value;

      const { req, res } = mockReqRes();
      req.method = 'POST';
      req.path = '/api/v1/projects';
      req.cookies['XSRF-TOKEN'] = csrfToken;

      let called = false;
      csrfProtection(req, res, () => { called = true; });

      expect(called).toBe(true);
    });

    test('x-xsrf-token header is also accepted', () => {
      const tokenReq = { protocol: 'http', headers: {}, cookies: {} };
      const tokenRes = { _json: null, _cookie: null, status() { return this; }, json(obj) { this._json = obj; }, cookie(n, v, o) { this._cookie = { name: n, value: v, opts: o }; } };
      csrfTokenEndpoint(tokenReq, tokenRes);

      const { req, res } = mockReqRes();
      req.method = 'POST';
      req.path = '/api/v1/projects';
      req.headers['x-xsrf-token'] = tokenRes._json.data.csrfToken;

      let called = false;
      csrfProtection(req, res, () => { called = true; });

      expect(called).toBe(true);
    });
  });
});
