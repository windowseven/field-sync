const MAX_WINDOW_MS = 24 * 60 * 60 * 1000;
const MAX_RECENT_ERRORS = 50;
const MAX_ENTRIES = 100000;

const requestEntries = [];

function pruneOldRequests(now = Date.now()) {
  const cutoff = now - MAX_WINDOW_MS;
  while (requestEntries.length > 0 && requestEntries[0].timestamp < cutoff) {
    requestEntries.shift();
  }
  if (requestEntries.length > MAX_ENTRIES) {
    requestEntries.splice(0, requestEntries.length - MAX_ENTRIES);
  }
}

function round(value, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function cleanPath(path = '/') {
  return path.split('?')[0] || '/';
}

function percentile(values, target) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((target / 100) * sorted.length) - 1));
  return sorted[index];
}

export function recordApiRequest({
  timestamp = Date.now(),
  method = 'GET',
  path = '/',
  status = 200,
  durationMs = 0,
  ip = 'unknown',
} = {}) {
  requestEntries.push({
    timestamp,
    method,
    path: cleanPath(path),
    status: Number(status) || 0,
    durationMs: Number(durationMs) || 0,
    ip,
  });

  pruneOldRequests(timestamp);
}

export function getApiRequestSeries(hours = 24, now = new Date()) {
  const current = new Date(now);
  current.setMinutes(0, 0, 0);

  pruneOldRequests(current.getTime());

  const buckets = [];
  const bucketMap = new Map();

  for (let i = hours - 1; i >= 0; i -= 1) {
    const bucketDate = new Date(current);
    bucketDate.setHours(current.getHours() - i);

    const key = bucketDate.toISOString().slice(0, 13);
    const bucket = {
      key,
      time: bucketDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      api: 0,
      errors: 0,
      latency: 0,
    };

    buckets.push(bucket);
    bucketMap.set(key, { bucket, durations: [] });
  }

  for (const entry of requestEntries) {
    const requestDate = new Date(entry.timestamp);
    requestDate.setMinutes(0, 0, 0);
    const key = requestDate.toISOString().slice(0, 13);
    const mapped = bucketMap.get(key);
    if (!mapped) continue;

    mapped.bucket.api += 1;
    if (entry.status >= 400) {
      mapped.bucket.errors += 1;
    }
    mapped.durations.push(entry.durationMs);
  }

  for (const { bucket, durations } of bucketMap.values()) {
    bucket.latency = durations.length > 0 ? round(durations.reduce((sum, value) => sum + value, 0) / durations.length) : 0;
  }

  return buckets;
}

export function getApiMonitorSnapshot(hours = 24) {
  pruneOldRequests();

  const now = Date.now();
  const cutoff = now - hours * 60 * 60 * 1000;
  const windowEntries = requestEntries.filter((entry) => entry.timestamp >= cutoff);
  const totalRequests = windowEntries.length;
  const errorEntries = windowEntries.filter((entry) => entry.status >= 400);
  const durations = windowEntries.map((entry) => entry.durationMs);

  const endpointMap = new Map();
  const methodMap = new Map();

  for (const entry of windowEntries) {
    methodMap.set(entry.method, (methodMap.get(entry.method) || 0) + 1);

    const key = `${entry.method} ${entry.path}`;
    if (!endpointMap.has(key)) {
      endpointMap.set(key, {
        endpoint: key,
        method: entry.method,
        path: entry.path,
        requests: 0,
        errors: 0,
        durations: [],
      });
    }

    const target = endpointMap.get(key);
    target.requests += 1;
    target.durations.push(entry.durationMs);
    if (entry.status >= 400) {
      target.errors += 1;
    }
  }

  const endpoints = Array.from(endpointMap.values())
    .map((endpoint) => {
      const avgLatency = endpoint.durations.length > 0
        ? round(endpoint.durations.reduce((sum, value) => sum + value, 0) / endpoint.durations.length)
        : 0;
      const p99 = round(percentile(endpoint.durations, 99));
      const errorRate = endpoint.requests > 0 ? round((endpoint.errors / endpoint.requests) * 100, 2) : 0;

      return {
        endpoint: endpoint.endpoint,
        method: endpoint.method,
        requests: endpoint.requests,
        avgLatency,
        p99,
        errorRate,
        status: errorRate >= 5 ? 'critical' : errorRate >= 1 ? 'warning' : 'healthy',
      };
    })
    .sort((a, b) => b.requests - a.requests)
    .slice(0, 12);

  const methodBreakdown = Array.from(methodMap.entries())
    .map(([method, count]) => ({ method, count }))
    .sort((a, b) => b.count - a.count);

  const recentErrors = errorEntries
    .slice(-MAX_RECENT_ERRORS)
    .reverse()
    .map((entry) => ({
      time: new Date(entry.timestamp).toISOString(),
      method: entry.method,
      endpoint: entry.path,
      status: entry.status,
      message: `HTTP ${entry.status}`,
      ip: entry.ip,
      durationMs: entry.durationMs,
    }));

  return {
    series: getApiRequestSeries(hours).map((bucket) => ({
      time: bucket.time,
      requests: bucket.api,
      errors: bucket.errors,
      latency: bucket.latency,
    })),
    totalRequests,
    totalErrors: errorEntries.length,
    errorRate: totalRequests > 0 ? round((errorEntries.length / totalRequests) * 100, 2) : 0,
    avgLatencyMs: durations.length > 0 ? round(durations.reduce((sum, value) => sum + value, 0) / durations.length) : 0,
    p99LatencyMs: round(percentile(durations, 99)),
    endpoints,
    methodBreakdown,
    recentErrors,
  };
}

export function getRequestCount(hours = 24) {
  pruneOldRequests();
  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  return requestEntries.filter((entry) => entry.timestamp >= cutoff).length;
}
