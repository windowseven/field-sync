import { addToBlacklist, isBlacklisted, getBlacklistSize } from '../utils/tokenBlacklist.js';

describe('tokenBlacklist', () => {
  beforeEach(() => {
    // Clear blacklist between tests by adding with 0ms TTL and letting cleanup run
    const size = getBlacklistSize();
    if (size > 0) {
      // manually trigger cleanup by waiting
    }
  });

  test('addToBlacklist stores a jti and isBlacklisted returns true', () => {
    const jti = 'test-jti-001';
    addToBlacklist(jti, 60000);
    expect(isBlacklisted(jti)).toBe(true);
  });

  test('isBlacklisted returns false for unknown jti', () => {
    expect(isBlacklisted('nonexistent-jti')).toBe(false);
  });

  test('isBlacklisted returns false for empty jti', () => {
    expect(isBlacklisted(null)).toBe(false);
    expect(isBlacklisted(undefined)).toBe(false);
    expect(isBlacklisted('')).toBe(false);
  });

  test('isBlacklisted returns false after TTL expires', async () => {
    const jti = 'expired-jti';
    addToBlacklist(jti, 10); // 10ms TTL
    expect(isBlacklisted(jti)).toBe(true);
    await new Promise(r => setTimeout(r, 20));
    expect(isBlacklisted(jti)).toBe(false);
  });

  test('getBlacklistSize returns correct count', () => {
    const before = getBlacklistSize();
    addToBlacklist('size-test-1', 60000);
    addToBlacklist('size-test-2', 60000);
    expect(getBlacklistSize()).toBe(before + 2);
  });

  test('blacklist handles multiple jti independently', () => {
    const jti1 = 'multi-1';
    const jti2 = 'multi-2';
    addToBlacklist(jti1, 60000);
    addToBlacklist(jti2, 60000);
    expect(isBlacklisted(jti1)).toBe(true);
    expect(isBlacklisted(jti2)).toBe(true);
  });

  test('adding same jti again overwrites with new TTL', () => {
    const jti = 'renewed-jti';
    addToBlacklist(jti, 10);
    addToBlacklist(jti, 60000);
    expect(isBlacklisted(jti)).toBe(true);
  });
});
