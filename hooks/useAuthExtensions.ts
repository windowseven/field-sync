"use client";

// ============================================================
// FieldSync – useAuth Extensions (COMPLETE REPLACEMENT)
// FILE: hooks/useAuthExtensions.ts
//
// Specialised hooks built on top of AuthContext + authApi:
//   - useLogin          (rate-limiting, lockout countdown)
//   - useLogout         (optional confirmation)
//   - useRegister       (NEW – registration flow)
//   - useVerifyOtp      (NEW – OTP verification)
//   - useResendOtp      (NEW – resend with attempt tracking)
//   - useForgotPassword (NEW – password reset request)
//   - useResetPassword  (NEW – set new password)
//   - useCurrentUser    (typed user access)
//   - useTokenExpiry    (live expiry tracking)
//   - useActivityTracker (activity heartbeat)
//   - useAuthRedirect   (reason from URL param)
// ============================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { tokenManager, activityTracker } from "@/lib/auth/tokenManager";
import { authApi, AuthApiError } from "@/lib/auth/authApi";
import type {
  RegisterPayload,
  VerifyOtpPayload,
  ResendOtpPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
} from "@/lib/auth/authApi";
import type { LoginCredentials as AuthLoginCredentials } from "@/types/auth.types";
import { SESSION_CONFIG } from "@/types/auth.types";

// ─────────────────────────────────────────────────────────────
// Re-export types so pages can import from one place
// ─────────────────────────────────────────────────────────────
export type {
  RegisterPayload,
  VerifyOtpPayload,
  ResendOtpPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
};

// ─────────────────────────────────────────────────────────────
// useLogin — with rate-limiting + countdown lockout
// ─────────────────────────────────────────────────────────────
interface UseLoginReturn {
  login: (credentials: AuthLoginCredentials) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  attemptsRemaining: number;
  isLockedOut: boolean;
  lockoutSecondsRemaining: number;
}

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export function useLogin(): UseLoginReturn {
  const { login, isLoading, error, clearError } = useAuth();
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  // Lockout countdown
  useEffect(() => {
    if (!lockedUntil) return;
    const interval = setInterval(() => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockedUntil(null);
        setAttempts(0);
        setLockoutRemaining(0);
      } else {
        setLockoutRemaining(remaining);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  const handleLogin = useCallback(
    async (credentials: AuthLoginCredentials) => {
      if (lockedUntil && Date.now() < lockedUntil) return;
      try {
        await login(credentials);
        setAttempts(0);
        setLockedUntil(null);
        setLockoutRemaining(0);
      } catch {
        setAttempts((current) => {
          const nextAttempts = current + 1;
          if (nextAttempts >= MAX_ATTEMPTS) {
            const nextLockedUntil = Date.now() + LOCKOUT_DURATION_MS;
            setLockedUntil(nextLockedUntil);
            setLockoutRemaining(Math.ceil(LOCKOUT_DURATION_MS / 1000));
          }
          return nextAttempts;
        });
      }
    },
    [login, lockedUntil]
  );

  return {
    login: handleLogin,
    isLoading,
    error,
    clearError,
    attemptsRemaining: Math.max(0, MAX_ATTEMPTS - attempts),
    isLockedOut: !!lockedUntil && Date.now() < lockedUntil,
    lockoutSecondsRemaining: lockoutRemaining,
  };
}

// ─────────────────────────────────────────────────────────────
// useLogout — optional confirmation dialog support
// ─────────────────────────────────────────────────────────────
interface UseLogoutReturn {
  logout: () => void;
  confirmLogout: () => void;
  cancelLogout: () => void;
  isPendingConfirmation: boolean;
}

export function useLogout(requireConfirmation = false): UseLogoutReturn {
  const { logout } = useAuth();
  const [isPending, setIsPending] = useState(false);

  const handleLogout = useCallback(() => {
    if (requireConfirmation) {
      setIsPending(true);
    } else {
      logout("manual");
    }
  }, [logout, requireConfirmation]);

  const confirmLogout = useCallback(() => {
    setIsPending(false);
    logout("manual");
  }, [logout]);

  const cancelLogout = useCallback(() => setIsPending(false), []);

  return {
    logout: handleLogout,
    confirmLogout,
    cancelLogout,
    isPendingConfirmation: isPending,
  };
}

// ─────────────────────────────────────────────────────────────
// useRegister — create new account, routes to OTP on success
// ─────────────────────────────────────────────────────────────
interface UseRegisterReturn {
  register: (payload: RegisterPayload) => Promise<{ success: boolean } | null>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useRegister(): UseRegisterReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = useCallback(
    async (payload: RegisterPayload): Promise<{ success: boolean } | null> => {
      setIsLoading(true);
      setError(null);

      try {
        await authApi.register(payload);
        return { success: true };
      } catch (err) {
        const msg =
          err instanceof AuthApiError
            ? err.message
            : "Registration failed. Please try again.";
        setError(msg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    register,
    isLoading,
    error,
    clearError: () => setError(null),
  };
}

// ─────────────────────────────────────────────────────────────
// useVerifyOtp — verify the 6-digit code
// ─────────────────────────────────────────────────────────────
interface VerifyResult {
  success: boolean;
  resetToken?: string; // only for password_reset context
}

interface UseVerifyOtpReturn {
  verify: (payload: VerifyOtpPayload) => Promise<VerifyResult | null>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useVerifyOtp(): UseVerifyOtpReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verify = useCallback(
    async (payload: VerifyOtpPayload): Promise<VerifyResult | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await authApi.verifyOtp(payload);
        return { success: true, resetToken: res.resetToken };
      } catch (err) {
        const msg =
          err instanceof AuthApiError
            ? err.message
            : "Verification failed. Please check the code and try again.";
        setError(msg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    verify,
    isLoading,
    error,
    clearError: () => setError(null),
  };
}

// ─────────────────────────────────────────────────────────────
// useResendOtp — resend code (backend rate-limits; we track UI state)
// ─────────────────────────────────────────────────────────────
interface UseResendOtpReturn {
  resend: (payload: ResendOtpPayload) => Promise<boolean>;
  isResending: boolean;
  resendError: string | null;
}

export function useResendOtp(): UseResendOtpReturn {
  const [isResending, setIsResending] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  const resend = useCallback(async (payload: ResendOtpPayload): Promise<boolean> => {
    setIsResending(true);
    setResendError(null);

    try {
      await authApi.resendOtp(payload);
      return true;
    } catch (err) {
      const msg =
        err instanceof AuthApiError
          ? err.message
          : "Could not resend code. Please try again.";
      setResendError(msg);
      return false;
    } finally {
      setIsResending(false);
    }
  }, []);

  return { resend, isResending, resendError };
}

// ─────────────────────────────────────────────────────────────
// useForgotPassword — request password reset OTP
// ─────────────────────────────────────────────────────────────
interface UseForgotPasswordReturn {
  requestReset: (payload: ForgotPasswordPayload) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useForgotPassword(): UseForgotPasswordReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestReset = useCallback(
    async (payload: ForgotPasswordPayload): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        await authApi.forgotPassword(payload);
        // Always treat as success (no email enumeration to the UI)
        return true;
      } catch (err) {
        // Only expose a generic error — never "email not found"
        const msg =
          err instanceof AuthApiError && err.status !== 404
            ? err.message
            : "An error occurred. Please try again later.";
        setError(msg);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    requestReset,
    isLoading,
    error,
    clearError: () => setError(null),
  };
}

// ─────────────────────────────────────────────────────────────
// useResetPassword — set new password with OTP/token
// ─────────────────────────────────────────────────────────────
interface UseResetPasswordReturn {
  reset: (payload: ResetPasswordPayload) => Promise<{ success: boolean } | null>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useResetPassword(): UseResetPasswordReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(
    async (payload: ResetPasswordPayload): Promise<{ success: boolean } | null> => {
      setIsLoading(true);
      setError(null);

      try {
        await authApi.resetPassword(payload);
        return { success: true };
      } catch (err) {
        const msg =
          err instanceof AuthApiError
            ? err.message
            : "Password reset failed. Please request a new code.";
        setError(msg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    reset,
    isLoading,
    error,
    clearError: () => setError(null),
  };
}

// ─────────────────────────────────────────────────────────────
// useCurrentUser — typed user access
// ─────────────────────────────────────────────────────────────
export function useCurrentUser() {
  const { user, isAuthenticated, isLoading } = useAuth();
  return { user, isAuthenticated, isLoading };
}

// ─────────────────────────────────────────────────────────────
// useTokenExpiry — live expiry tracking
// ─────────────────────────────────────────────────────────────
export function useTokenExpiry() {
  const { token, sessionExpiry } = useAuth();
  const [msRemaining, setMsRemaining] = useState<number>(0);

  useEffect(() => {
    if (!token) {
      setMsRemaining(0);
      return;
    }
    const update = () => {
      const remaining = tokenManager.getTimeToExpiry(token);
      setMsRemaining(remaining);
    };
    update();
    const interval = setInterval(update, 5000);
    return () => clearInterval(interval);
  }, [token]);

  const isNearExpiry = msRemaining < SESSION_CONFIG.REFRESH_THRESHOLD_MS && msRemaining > 0;
  const isExpired = msRemaining === 0 && !!token;

  return { msRemaining, isNearExpiry, isExpired, sessionExpiry };
}

// ─────────────────────────────────────────────────────────────
// useActivityTracker — updates last-activity timestamp
// Mount once in a high-level authenticated layout
// ─────────────────────────────────────────────────────────────
export function useActivityTracker(enabled = true) {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!enabled || !isAuthenticated) return;
    const update = () => activityTracker.updateLastActivity();
    SESSION_CONFIG.ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, update, { passive: true });
    });
    return () => {
      SESSION_CONFIG.ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, update);
      });
    };
  }, [enabled, isAuthenticated]);
}

// ─────────────────────────────────────────────────────────────
// useAuthRedirect — extract + display redirect reason from URL
// ─────────────────────────────────────────────────────────────
const REDIRECT_MESSAGES: Record<string, string> = {
  unauthenticated: "Please log in to continue.",
  token_expired: "Your session has expired. Please log in again.",
  inactivity: "You were logged out due to inactivity.",
  no_refresh_token: "Your session is invalid. Please log in again.",
  manual: "",
  cross_tab: "You were logged out from another tab.",
  session_expired: "Your session has expired. Please log in again.",
  verified: "Account verified successfully. Please sign in.",
  password_reset: "Password reset successfully. Please sign in with your new password.",
};

export function useAuthRedirect(): string | null {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const reason = params.get("reason");
    if (reason && REDIRECT_MESSAGES[reason] !== undefined) {
      setMessage(REDIRECT_MESSAGES[reason] || null);
    }
  }, []);

  return message;
}
