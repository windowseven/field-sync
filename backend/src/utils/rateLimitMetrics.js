const MAX_WINDOW_MS = 24 * 60 * 60 * 1000;

const blockedEvents = [];
const rateLimitRules = new Map();

function prune(now = Date.now()) {
  const cutoff = now - MAX_WINDOW_MS;
  while (blockedEvents.length > 0 && blockedEvents[0].timestamp < cutoff) {
    blockedEvents.shift();
  }
}

export function registerRateLimitRule(rule) {
  if (!rule?.name) return;
  rateLimitRules.set(rule.name, {
    name: rule.name,
    path: rule.path,
    windowMs: rule.windowMs,
    max: rule.max,
    description: rule.description || '',
  });
}

export function recordRateLimitBlock({
  name,
  path,
  ip = 'unknown',
  timestamp = Date.now(),
} = {}) {
  blockedEvents.push({
    name,
    path,
    ip,
    timestamp,
  });

  prune(timestamp);
}

export function getRateLimitSnapshot() {
  prune();

  const blockedByRule = new Map();
  const blockedByIp = new Map();
  const blockedByHour = new Map();

  for (const event of blockedEvents) {
    blockedByRule.set(event.name, (blockedByRule.get(event.name) || 0) + 1);
    blockedByIp.set(event.ip, (blockedByIp.get(event.ip) || 0) + 1);
    const hourKey = new Date(event.timestamp).toISOString().slice(0, 13);
    blockedByHour.set(hourKey, (blockedByHour.get(hourKey) || 0) + 1);
  }

  const rules = Array.from(rateLimitRules.values()).map((rule) => ({
    ...rule,
    blockedRequests24h: blockedByRule.get(rule.name) || 0,
  }));

  const blockedIps = Array.from(blockedByIp.entries())
    .map(([ip, count]) => ({
      ip,
      count,
      lastSeen: blockedEvents.filter((event) => event.ip === ip).slice(-1)[0]?.timestamp || null,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    rules,
    totalBlocked24h: blockedEvents.length,
    blockedIps,
    recentBlocks: blockedEvents.slice(-50).reverse(),
    blockedByHour: Array.from(blockedByHour.entries())
      .map(([bucket, count]) => ({ bucket, count }))
      .sort((a, b) => a.bucket.localeCompare(b.bucket)),
    lastBlockedAt: blockedEvents.at(-1)?.timestamp || null,
  };
}
