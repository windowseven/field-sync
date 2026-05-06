// ============================================================
// FieldSync – Token Manager
// Secure token storage, retrieval, validation & expiry
// ============================================================

import { STORAGE_KEYS } from "@/types/auth.types";
import type { TokenPayload } from "@/types/auth.types";

// ─── Storage Strategy ────────────────────────────────────────
// Security note: Prefer HTTP-only cookies in production (set by backend).
// When cookies are used, the backend sets them — frontend never touches them.
// This file handles the "fallback" client-side token when cookies aren't used.
// In production with HTTP-only cookies, most of these helpers become no-ops.
//
// Never store passwords, OTPs, or private keys here.

const isClient = typeof window !== "undefined";

function setAccessTokenCookie(token: string | null, rememberMe: boolean): void {
  if (!isClient) return;
  try {
    const isHttps = window.location.protocol === "https:";
    const secure = isHttps ? "; Secure" : "";
    const sameSite = "; SameSite=Lax";
    const path = "; Path=/";
    const maxAge = rememberMe ? `; Max-Age=${60 * 60 * 24 * 30}` : ""; // 30 days

    if (!token) {
      document.cookie = `fs_access_token=; Max-Age=0${path}${sameSite}${secure}`;
      return;
    }

    document.cookie = `fs_access_token=${token}${path}${sameSite}${secure}${maxAge}`;
  } catch {
    // ignore cookie failures (e.g., blocked by policy)
  }
}

// ─── Detect storage preference ───────────────────────────────
// If rememberMe = true → localStorage (persists across tabs + sessions)
// If rememberMe = false → sessionStorage (cleared on tab close)
function getStorage(key: string): Storage | null {
  if (!isClient) return null;
  try {
    const rememberMe = localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === "true";
    return rememberMe ? localStorage : sessionStorage;
  } catch {
    return sessionStorage;
  }
}

// ─── Token Operations ────────────────────────────────────────

export const tokenManager = {
  // Store access token
  setToken(token: string, rememberMe = false): void {
    if (!isClient) return;
    try {
      if (rememberMe) {
        localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, "true");
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
      } else {
        sessionStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
      }
      setAccessTokenCookie(token, rememberMe);
    } catch (e) {
      console.error("[TokenManager] Failed to store token:", e);
    }
  },

  // Retrieve access token from whichever storage it was saved in
  getToken(): string | null {
    if (!isClient) return null;
    try {
      return (
        localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) ??
        sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
      );
    } catch {
      return null;
    }
  },

  // Store refresh token (always in localStorage for cross-session persistence)
  setRefreshToken(token: string): void {
    if (!isClient) return;
    try {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
    } catch (e) {
      console.error("[TokenManager] Failed to store refresh token:", e);
    }
  },

  getRefreshToken(): string | null {
    if (!isClient) return null;
    try {
      return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    } catch {
      return null;
    }
  },

  // Store session expiry (Unix ms)
  setExpiry(expiryMs: number): void {
    if (!isClient) return;
    try {
      const storage = getStorage(STORAGE_KEYS.SESSION_EXPIRY);
      storage?.setItem(STORAGE_KEYS.SESSION_EXPIRY, String(expiryMs));
    } catch {}
  },

  getExpiry(): number | null {
    if (!isClient) return null;
    try {
      const val =
        localStorage.getItem(STORAGE_KEYS.SESSION_EXPIRY) ??
        sessionStorage.getItem(STORAGE_KEYS.SESSION_EXPIRY);
      return val ? Number(val) : null;
    } catch {
      return null;
    }
  },

  // Full clear — called on logout or auth failure
  clearAll(): void {
    if (!isClient) return;
    try {
      const keys = Object.values(STORAGE_KEYS);
      keys.forEach((key) => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
      setAccessTokenCookie(null, false);
    } catch (e) {
      console.error("[TokenManager] Failed to clear tokens:", e);
    }
  },

  // ─── JWT Decoding (client-side, no verification) ────────────
  // WARNING: Never trust client-decoded JWT for security decisions.
  // Use this ONLY for reading non-sensitive claims (role, expiry) for UX.
  // All real authorization MUST be verified by the backend.
  decodeToken(token: string): TokenPayload | null {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;

      const payload = parts[1];
      // Base64url → Base64 → decode
      const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
      const decoded = JSON.parse(atob(base64));
      return decoded as TokenPayload;
    } catch {
      return null;
    }
  },

  // Check if token is expired (client-side UX check only)
  isTokenExpired(token: string): boolean {
    const payload = this.decodeToken(token);
    if (!payload) return true;

    const now = Math.floor(Date.now() / 1000);
    // Add 30s buffer to prevent edge-case requests
    return payload.exp < now + 30;
  },

  // How many ms until token expires (0 if already expired)
  getTimeToExpiry(token: string): number {
    const payload = this.decodeToken(token);
    if (!payload) return 0;

    const nowMs = Date.now();
    const expiryMs = payload.exp * 1000;
    return Math.max(0, expiryMs - nowMs);
  },

  // Get token role (UX use only — backend must verify)
  getTokenRole(token: string) {
    return this.decodeToken(token)?.role ?? null;
  },
};

// ─── Last Activity Tracking (for inactivity timer) ───────────
export const activityTracker = {
  updateLastActivity(): void {
    if (!isClient) return;
    try {
      localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, String(Date.now()));
    } catch {}
  },

  getLastActivity(): number {
    if (!isClient) return Date.now();
    try {
      const val = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY);
      return val ? Number(val) : Date.now();
    } catch {
      return Date.now();
    }
  },

  getIdleMs(): number {
    return Date.now() - this.getLastActivity();
  },
};

// ─── Cross-tab Logout Signal ─────────────────────────────────
// When user logs out in one tab, other tabs detect the signal
export const crossTabSignal = {
  broadcastLogout(): void {
    if (!isClient) return;
    try {
      // Using storage event as broadcast channel
      localStorage.setItem(STORAGE_KEYS.LOGOUT_SIGNAL, String(Date.now()));
      // Remove immediately so next logout triggers again
      setTimeout(() => {
        localStorage.removeItem(STORAGE_KEYS.LOGOUT_SIGNAL);
      }, 100);
    } catch {}
  },

  onLogoutSignal(callback: () => void): () => void {
    if (!isClient) return () => {};

    const handler = (event: StorageEvent) => {
      if (event.key === STORAGE_KEYS.LOGOUT_SIGNAL && event.newValue) {
        callback();
      }
    };

    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  },
};
