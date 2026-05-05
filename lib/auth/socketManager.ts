// ============================================================
// FieldSync – WebSocket Auth Manager
// Secure real-time socket connection with auth tokens
// Handles auth, reconnects, and graceful disconnects
// ============================================================

import { tokenManager } from "@/lib/auth/tokenManager";

type SocketEvent = string;
type SocketHandler = (data: unknown) => void;

interface SocketOptions {
  path?: string;
  reconnectIntervals?: number[];  // ms between retries
  onAuthError?: () => void;
  onConnected?: () => void;
  onDisconnected?: () => void;
}

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL ?? (process.env.NODE_ENV === 'production' ? 'wss://api.fieldsync.com' : 'ws://localhost:5000');

// ─── FieldSync Socket Manager ────────────────────────────────
class FieldSyncSocket {
  private ws: WebSocket | null = null;
  private handlers = new Map<SocketEvent, Set<SocketHandler>>();
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private isIntentionalClose = false;
  private options: SocketOptions = {};
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  // ─── Connect with auth ─────────────────────────────────────
  connect(options: SocketOptions = {}): void {
    this.options = options;
    this.isIntentionalClose = false;
    this.establishConnection();
  }

  private establishConnection(): void {
    const token = tokenManager.getToken();

    if (!token || tokenManager.isTokenExpired(token)) {
      console.warn("[Socket] No valid token — cannot connect.");
      this.options.onAuthError?.();
      return;
    }

    // Attach token as query param (or use a ticket system)
    // In production: prefer a short-lived ticket from /api/auth/socket-ticket
    const url = `${WS_BASE}${this.options.path ?? "/ws"}?token=${encodeURIComponent(token)}`;

    try {
      this.ws = new WebSocket(url);
      this.setupHandlers();
    } catch (err) {
      console.error("[Socket] Connection failed:", err);
      this.scheduleReconnect();
    }
  }

  private setupHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.reconnectAttempt = 0;
      this.startHeartbeat();
      this.options.onConnected?.();
      this.emit("connected", null);
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data as string);

        // Auth error from server
        if (message.type === "auth_error" || message.type === "unauthorized") {
          console.warn("[Socket] Auth error from server.");
          this.options.onAuthError?.();
          this.close();
          return;
        }

        // Dispatch to registered handlers
        if (message.type) {
          this.emit(message.type, message.data);
        }
      } catch {
        // Non-JSON messages — pass raw
        this.emit("raw_message", event.data);
      }
    };

    this.ws.onerror = () => {
      // Don't log error details in production (info leakage)
      if (process.env.NODE_ENV === "development") {
        console.warn("[Socket] WebSocket error occurred.");
      }
    };

    this.ws.onclose = (event) => {
      this.stopHeartbeat();
      this.options.onDisconnected?.();
      this.emit("disconnected", { code: event.code });

      if (!this.isIntentionalClose) {
        this.scheduleReconnect();
      }
    };
  }

  // ─── Send message with auth ────────────────────────────────
  send(type: string, data?: unknown): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn("[Socket] Cannot send — not connected.");
      return;
    }

    const token = tokenManager.getToken();
    if (!token) {
      this.options.onAuthError?.();
      return;
    }

    this.ws.send(
      JSON.stringify({
        type,
        data,
        token, // Re-attach token on each message for server-side per-message auth
      })
    );
  }

  // ─── Subscribe to event ────────────────────────────────────
  on(event: SocketEvent, handler: SocketHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);

    // Return unsubscribe function
    return () => this.off(event, handler);
  }

  off(event: SocketEvent, handler: SocketHandler): void {
    this.handlers.get(event)?.delete(handler);
  }

  private emit(event: SocketEvent, data: unknown): void {
    this.handlers.get(event)?.forEach((handler) => {
      try {
        handler(data);
      } catch (err) {
        console.error(`[Socket] Handler error for '${event}':`, err);
      }
    });
  }

  // ─── Heartbeat (keep-alive) ────────────────────────────────
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "ping" }));
      }
    }, 30_000); // every 30s
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // ─── Reconnect with backoff ────────────────────────────────
  private scheduleReconnect(): void {
    const intervals = this.options.reconnectIntervals ?? [1000, 2000, 5000, 10000, 30000];
    const delay = intervals[Math.min(this.reconnectAttempt, intervals.length - 1)];

    this.reconnectAttempt++;

    this.reconnectTimer = setTimeout(() => {
      // Validate token before reconnecting
      const token = tokenManager.getToken();
      if (!token || tokenManager.isTokenExpired(token)) {
        this.options.onAuthError?.();
        return;
      }

      this.establishConnection();
    }, delay);
  }

  // ─── Clean disconnect ─────────────────────────────────────
  close(): void {
    this.isIntentionalClose = true;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close(1000, "Intentional disconnect");
      this.ws = null;
    }
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Singleton socket instance
export const fieldSyncSocket = new FieldSyncSocket();
