import { getSecurityPolicies } from '../utils/securityPolicyStore.js';

describe('securityPolicyStore', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV };
    delete process.env.JWT_EXPIRES_IN;
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  test('returns default policies when no env vars are set', () => {
    const policies = getSecurityPolicies();
    expect(policies.password.minLength).toBe(8);
    expect(policies.password.requireUppercase).toBe(true);
    expect(policies.password.requireNumbers).toBe(true);
    expect(policies.password.requireSymbols).toBe(false);
    expect(policies.session.accessTokenExpiryHours).toBe(24);
    expect(policies.session.refreshTokenExpiryDays).toBe(7);
    expect(policies.rateLimits.loginAttempts).toBe(10);
    expect(policies.rateLimits.otpAttempts).toBe(3);
    expect(policies.rateLimits.lockoutDurationMinutes).toBe(15);
  });

  test('parses JWT_EXPIRES_IN as hours', () => {
    process.env.JWT_EXPIRES_IN = '2h';
    const policies = getSecurityPolicies();
    expect(policies.session.accessTokenExpiryHours).toBe(2);
  });

  test('parses JWT_EXPIRES_IN in days', () => {
    process.env.JWT_EXPIRES_IN = '7d';
    const policies = getSecurityPolicies();
    expect(policies.session.accessTokenExpiryHours).toBe(168);
  });

  test('parses JWT_EXPIRES_IN in minutes', () => {
    process.env.JWT_EXPIRES_IN = '30m';
    const policies = getSecurityPolicies();
    expect(policies.session.accessTokenExpiryHours).toBeCloseTo(0.5, 3);
  });

  test('parses JWT_EXPIRES_IN in seconds', () => {
    process.env.JWT_EXPIRES_IN = '3600s';
    const policies = getSecurityPolicies();
    expect(policies.session.accessTokenExpiryHours).toBe(1);
  });

  test('returns fallback for invalid JWT_EXPIRES_IN', () => {
    process.env.JWT_EXPIRES_IN = 'invalid';
    const policies = getSecurityPolicies();
    expect(policies.session.accessTokenExpiryHours).toBe(24);
  });

  test('returns fallback for empty JWT_EXPIRES_IN', () => {
    process.env.JWT_EXPIRES_IN = '';
    const policies = getSecurityPolicies();
    expect(policies.session.accessTokenExpiryHours).toBe(24);
  });

  test('rate limit values are all positive numbers', () => {
    const policies = getSecurityPolicies();
    const limits = Object.values(policies.rateLimits);
    limits.forEach(value => {
      expect(typeof value).toBe('number');
      expect(value).toBeGreaterThan(0);
    });
  });

  test('session config has all required fields', () => {
    const policies = getSecurityPolicies();
    expect(policies.session).toHaveProperty('accessTokenExpiryHours');
    expect(policies.session).toHaveProperty('refreshTokenExpiryDays');
    expect(policies.session).toHaveProperty('maxDevices');
    expect(policies.session).toHaveProperty('forceLogoutOnSuspicion');
    expect(policies.session).toHaveProperty('requireReauthOnSensitive');
  });
});
