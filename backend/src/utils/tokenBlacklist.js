// In-memory JWT token blacklist
// TTL-based cleanup to prevent memory leaks
// For production, replace with Redis

const blacklist = new Map();

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [jti, expiresAt] of blacklist) {
    if (now > expiresAt) {
      blacklist.delete(jti);
    }
  }
}, CLEANUP_INTERVAL_MS);
cleanupTimer.unref(); // Don't prevent process exit

export function addToBlacklist(jti, ttlMs) {
  blacklist.set(jti, Date.now() + ttlMs);
}

export function isBlacklisted(jti) {
  if (!jti) return false;
  const expiresAt = blacklist.get(jti);
  if (!expiresAt) return false;
  if (Date.now() > expiresAt) {
    blacklist.delete(jti);
    return false;
  }
  return true;
}

export function getBlacklistSize() {
  return blacklist.size;
}
