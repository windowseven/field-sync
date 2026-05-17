import { db, type SyncItem } from '../db/syncDatabase';
import { http } from './httpClient';
import { toast } from 'sonner';

class SyncService {
  private isProcessing = false;

  /**
   * Enqueue a new operation for synchronization
   */
  async enqueue(type: SyncItem['type'], label: string, data: any) {
    const item: SyncItem = {
      type,
      label,
      data,
      status: 'pending',
      timestamp: new Date().toISOString(),
      retries: 0,
      size: `${Math.round(JSON.stringify(data).length / 1024)} KB`
    };

    await db.syncQueue.add(item);
    
    // Attempt to process immediately if online
    if (typeof window !== 'undefined' && navigator.onLine) {
      this.processQueue();
    } else {
      toast.info('Offline. Submission saved locally and will sync when online.');
    }
  }

  /**
   * Calculate backoff delay in ms based on retry count
   */
  private getBackoffDelay(retries: number): number {
    if (retries === 0) return 0;
    const baseMs = 2000;
    const maxMs = 60000;
    const delay = Math.min(baseMs * Math.pow(2, retries - 1) + Math.random() * 1000, maxMs);
    return delay;
  }

  /**
   * Process all pending items in the queue
   */
  async processQueue() {
    if (this.isProcessing) return;
    if (typeof window !== 'undefined' && !navigator.onLine) return;

    const pendingItems = await db.syncQueue
      .where('status')
      .equals('pending')
      .or('status')
      .equals('failed')
      .toArray();

    if (pendingItems.length === 0) return;

    const now = Date.now();
    const dueItems = pendingItems.filter(item => {
      if (item.status === 'pending') return true;
      const delay = this.getBackoffDelay(item.retries || 0);
      const lastAttempt = item.lastAttemptAt ? new Date(item.lastAttemptAt).getTime() : 0;
      return (now - lastAttempt) >= delay;
    });

    if (dueItems.length === 0) return;

    this.isProcessing = true;
    console.log(`[Sync] Processing ${dueItems.length} items...`);

    try {
      const response: any = await http.post('/sync/batch', { items: dueItems });

      if (response.status === 'success') {
        const { results } = response.data;
        
        for (const res of results) {
          if (res.status === 'success') {
            await db.syncQueue.update(res.id, { status: 'synced', retries: 0, error: undefined, lastAttemptAt: undefined });
          } else {
            const item = await db.syncQueue.get(res.id);
            if (item) {
              await db.syncQueue.update(res.id, { 
                status: 'failed', 
                retries: (item.retries || 0) + 1,
                error: res.message,
                lastAttemptAt: new Date().toISOString()
              });
            }
          }
        }
        
        toast.success(`Synced ${results.filter((r: any) => r.status === 'success').length} items`);
      }
    } catch (error) {
      console.error('[Sync] Batch processing failed:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Initialize sync listeners
   */
  init() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      console.log('[Sync] Back online, triggering sync...');
      this.processQueue();
    });

    // Also process on start
    this.processQueue();

    // Periodically check every 5 minutes
    setInterval(() => this.processQueue(), 5 * 60 * 1000);
  }
}

export const syncService = new SyncService();
