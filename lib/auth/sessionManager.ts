// ============================================================
// FieldSync – Session Manager
// Inactivity timeout + multi-tab sync + remember-me
// ============================================================

import { SESSION_CONFIG, STORAGE_KEYS } from "@/types/auth.types";
import { activityTracker, crossTabSignal, tokenManager } from "./tokenManager";

type LogoutCallback = (reason: "inactivity" | "token_expired" | "manual" | "cross_tab") => void;
type WarningCallback = (msRemaining: number) => void;

// ─── Session Manager ─────────────────────────────────────────
class SessionManager {
  private inactivityTimer: ReturnType<typeof setTimeout> | null = null;
  private warningTimer: ReturnType<typeof setTimeout> | null = null;
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private crossTabCleanup: (() => void) | null = null;
  private onLogout: LogoutCallback | null = null;
  private onWarning: WarningCallback | null = null;

  // ─── Start session monitoring ─────────────────────────────
  start({
    onLogout,
    onWarning,
    onRefreshNeeded,
  }: {
    onLogout: LogoutCallback;
    onWarning?: WarningCallback;
    onRefreshNeeded?: () => void;
  }): void {
    this.onLogout = onLogout;
    this.onWarning = onWarning ?? null;

    this.setupActivityListeners();
    this.resetInactivityTimer();
    this.setupCrossTabSync();

    if (onRefreshNeeded) {
      this.scheduleTokenRefresh(onRefreshNeeded);
    }
  }

  // ─── Stop session monitoring ──────────────────────────────
  stop(): void {
    this.clearAllTimers();
    this.removeActivityListeners();
    this.crossTabCleanup?.();
    this.crossTabCleanup = null;
    this.onLogout = null;
    this.onWarning = null;
  }

  // ─── Activity event listeners ─────────────────────────────
  private activityHandler = (): void => {
    activityTracker.updateLastActivity();
    this.resetInactivityTimer();
  };

  private setupActivityListeners(): void {
    SESSION_CONFIG.ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, this.activityHandler, { passive: true });
    });
  }

  private removeActivityListeners(): void {
    SESSION_CONFIG.ACTIVITY_EVENTS.forEach((event) => {
      window.removeEventListener(event, this.activityHandler);
    });
  }

  // ─── Inactivity timer ─────────────────────────────────────
  private resetInactivityTimer(): void {
    this.clearInactivityTimers();

    const timeout = SESSION_CONFIG.INACTIVITY_TIMEOUT_MS;
    const warningBefore = SESSION_CONFIG.WARNING_BEFORE_MS;

    // Fire warning before actual logout
    if (this.onWarning) {
      this.warningTimer = setTimeout(() => {
        this.onWarning?.(warningBefore);
      }, timeout - warningBefore);
    }

    // Fire logout after full timeout
    this.inactivityTimer = setTimeout(() => {
      this.onLogout?.("inactivity");
    }, timeout);
  }

  private clearInactivityTimers(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
  }

  // ─── Token refresh scheduling ─────────────────────────────
  scheduleTokenRefresh(onRefreshNeeded: () => void): void {
    if (this.refreshTimer) clearTimeout(this.refreshTimer);

    const token = tokenManager.getToken();
    if (!token) return;

    const timeToExpiry = tokenManager.getTimeToExpiry(token);
    const refreshIn = timeToExpiry - SESSION_CONFIG.REFRESH_THRESHOLD_MS;

    if (refreshIn <= 0) {
      // Token is already near expiry — refresh immediately
      onRefreshNeeded();
      return;
    }

    this.refreshTimer = setTimeout(() => {
      onRefreshNeeded();
    }, refreshIn);
  }

  // ─── Cross-tab sync ───────────────────────────────────────
  private setupCrossTabSync(): void {
    this.crossTabCleanup = crossTabSignal.onLogoutSignal(() => {
      this.onLogout?.("cross_tab");
    });
  }

  // ─── Broadcast logout to other tabs ───────────────────────
  broadcastLogout(): void {
    crossTabSignal.broadcastLogout();
  }

  // ─── Clear all timers ─────────────────────────────────────
  private clearAllTimers(): void {
    this.clearInactivityTimers();
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  // ─── Remember Me ──────────────────────────────────────────
  setRememberMe(value: boolean): void {
    if (typeof window === "undefined") return;
    try {
      if (value) {
        localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, "true");
      } else {
        localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
      }
    } catch {}
  }

  isRememberMeEnabled(): boolean {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(STORAGE_KEYS.REMEMBER_ME) === "true";
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const sessionManager = new SessionManager();
