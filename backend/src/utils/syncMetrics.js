const MAX_WINDOW_MS = 24 * 60 * 60 * 1000;
const syncBatches = [];

function prune(now = Date.now()) {
  const cutoff = now - MAX_WINDOW_MS;
  while (syncBatches.length > 0 && syncBatches[0].timestamp < cutoff) {
    syncBatches.shift();
  }
}

export function recordSyncBatch({
  timestamp = Date.now(),
  itemCount = 0,
  successCount = 0,
  failureCount = 0,
  failedItems = [],
} = {}) {
  syncBatches.push({
    timestamp,
    itemCount,
    successCount,
    failureCount,
    failedItems,
  });

  prune(timestamp);
}

export function getSyncSnapshot() {
  prune();

  const failedItems = syncBatches
    .flatMap((batch) => batch.failedItems.map((item) => ({
      ...item,
      timestamp: batch.timestamp,
    })))
    .slice(-20)
    .reverse();

  return {
    batches: syncBatches
      .slice(-20)
      .reverse()
      .map((batch, index) => ({
        id: `sync-${syncBatches.length - index}`,
        timestamp: batch.timestamp,
        itemCount: batch.itemCount,
        successCount: batch.successCount,
        failureCount: batch.failureCount,
        status: batch.failureCount > 0 ? 'warning' : 'healthy',
      })),
    totalBatches24h: syncBatches.length,
    totalItems24h: syncBatches.reduce((sum, batch) => sum + batch.itemCount, 0),
    failedItems24h: syncBatches.reduce((sum, batch) => sum + batch.failureCount, 0),
    failedItems,
    lastBatchAt: syncBatches.at(-1)?.timestamp || null,
  };
}
