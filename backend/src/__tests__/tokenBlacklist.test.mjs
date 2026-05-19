import { addToBlacklist, isBlacklisted, getBlacklistSize } from '../utils/tokenBlacklist.js';

describe('tokenBlacklist', () => {
  test('addToBlacklist stores a jti and isBlacklisted returns true', async () => {
    const jti = 'test-jti-001';
    await addToBlacklist(jti, 60000);
    expect(await isBlacklisted(jti)).toBe(true);
  });

  test('isBlacklisted returns false for unknown jti', async () => {
    expect(await isBlacklisted('nonexistent-jti')).toBe(false);
  });

  test('isBlacklisted returns false for empty jti', async () => {
    expect(await isBlacklisted(null)).toBe(false);
    expect(await isBlacklisted(undefined)).toBe(false);
    expect(await isBlacklisted('')).toBe(false);
  });

  test('isBlacklisted returns false after TTL expires', async () => {
    const jti = 'expired-jti';
    await addToBlacklist(jti, 10);
    expect(await isBlacklisted(jti)).toBe(true);
    await new Promise(r => setTimeout(r, 50));
    expect(await isBlacklisted(jti)).toBe(false);
  });

  test('getBlacklistSize returns correct count', async () => {
    const before = await getBlacklistSize();
    await addToBlacklist('size-test-1', 60000);
    await addToBlacklist('size-test-2', 60000);
    expect(await getBlacklistSize()).toBe(before + 2);
  });

  test('blacklist handles multiple jti independently', async () => {
    const jti1 = 'multi-1';
    const jti2 = 'multi-2';
    await addToBlacklist(jti1, 60000);
    await addToBlacklist(jti2, 60000);
    expect(await isBlacklisted(jti1)).toBe(true);
    expect(await isBlacklisted(jti2)).toBe(true);
  });

  test('adding same jti again overwrites with new TTL', async () => {
    const jti = 'renewed-jti';
    await addToBlacklist(jti, 10);
    await addToBlacklist(jti, 60000);
    expect(await isBlacklisted(jti)).toBe(true);
  });
});
