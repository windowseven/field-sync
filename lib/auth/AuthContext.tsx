"use client";

// ============================================================
// FieldSync – AuthContext
// Global authentication & authorization state provider
// ============================================================

const isDev = process.env.NODE_ENV === "development";
function devLog(...args: unknown[]) { if (isDev) console.log(...args); }
function devWarn(...args: unknown[]) { if (isDev) console.warn(...args); }

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from "react";
import { useRouter } from "next/navigation";
import type {
  AuthAction,
  AuthState,
  AuthUser,
  LoginCredentials,
  UserRole,
  Permission,
} from "@/types/auth.types";
import { ROLE_DASHBOARDS, STORAGE_KEYS } from "@/types/auth.types";
import { tokenManager, activityTracker } from "./tokenManager";
import { sessionManager } from "./sessionManager";
import { hasPermission, hasAnyPermission, hasAllPermissions } from "./permissions";
import { fieldSyncSocket } from "./socketManager";

// ─── Initial State ────────────────────────────────────────────
const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
  isRefreshing: false,
  error: null,
  sessionExpiry: null,
};

// ─── Reducer ──────────────────────────────────────────────────
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "AUTH_LOADING":
      return { ...state, isLoading: true, error: null };

    case "AUTH_SUCCESS":
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
        sessionExpiry: action.payload.sessionExpiry,
        isAuthenticated: true,
        isLoading: false,
        isRefreshing: false,
        error: null,
      };

    case "AUTH_FAILURE":
      return {
        ...state,
        isLoading: false,
        isRefreshing: false,
        error: action.payload,
      };

    case "AUTH_LOGOUT":
      return {
        ...initialState,
        isLoading: false, // Override initialState's true
        isAuthenticated: false,
      };

    case "TOKEN_REFRESHING":
      return { ...state, isRefreshing: true };

    case "TOKEN_REFRESHED":
      return {
        ...state,
        token: action.payload.token,
        sessionExpiry: action.payload.sessionExpiry,
        isRefreshing: false,
        isLoading: false,
      };

    case "CLEAR_ERROR":
      return { ...state, error: null };

    case "UPDATE_USER":
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };

    default:
      return state;
  }
}

// ─── Context Shape ────────────────────────────────────────────
interface AuthContextValue extends AuthState {
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: (reason?: string) => void;
  refreshSession: () => Promise<void>;
  clearError: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;

  // Permission helpers
  can: (permission: Permission) => boolean;
  canAny: (permissions: Permission[]) => boolean;
  canAll: (permissions: Permission[]) => boolean;
  isRole: (role: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const router = useRouter();

  // ─── Logout ─────────────────────────────────────────────────
  const logout = useCallback(
    (reason = "manual") => {
      devLog("[Auth] Logout triggered, reason:", reason);
      sessionManager.stop();
      sessionManager.broadcastLogout();
      tokenManager.clearAll();

      dispatch({ type: "AUTH_LOGOUT" });
      router.push(`/login?reason=${reason}`);
    },
    [router]
  );

  // ─── Refresh session token ───────────────────────────────────
  const refreshSession = useCallback(async () => {
    const refreshToken = tokenManager.getRefreshToken();
    if (!refreshToken) {
      devWarn("[Auth] No refresh token available for refresh");
      return; // Don't logout, just return
    }

    console.log("[Auth] Attempting token refresh...");
    dispatch({ type: "TOKEN_REFRESHING" });

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await fetch(`${baseUrl}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) {
        devWarn("[Auth] Refresh endpoint returned error:", res.status);
        return; // Don't logout, just return
      }

      const data = await res.json();
      if (!data.token) {
        devWarn("[Auth] Refresh response missing token");
        return;
      }

      const newExpiry = Date.now() + data.expiresIn * 1000;

      tokenManager.setToken(data.token, sessionManager.isRememberMeEnabled());
      tokenManager.setExpiry(newExpiry);

      devLog("[Auth] Token refreshed successfully");
      dispatch({
        type: "TOKEN_REFRESHED",
        payload: { token: data.token, sessionExpiry: newExpiry },
      });

      sessionManager.scheduleTokenRefresh(refreshSession);
    } catch (err) {
      devWarn("[Auth] Refresh failed (non-critical):", err);
      // Don't logout - just let the user continue with their current token
      // They will be redirected to login when the token actually expires
    }
  }, [logout]);

  // ─── Login ──────────────────────────────────────────────────
  const login = useCallback(
    async (credentials: LoginCredentials) => {
      devLog("[Auth] Login started for:", credentials.email);
      dispatch({ type: "AUTH_LOADING" });

      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "";
        devLog("[Auth] Fetching from:", `${baseUrl}/auth/login`);
        const res = await fetch(`${baseUrl}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => null);
          throw new Error(
            errorData?.message ||
              errorData?.data?.message ||
              "Invalid credentials. Please try again."
          );
        }

        const response = await res.json();
        devLog("[Auth] Login response received");
        
        if (response.status !== 'success' || !response.data?.user?.role) {
          throw new Error(response.data?.message || "Invalid credentials. Please try again.");
        }
        
        const { token, refreshToken, expiresIn, user } = response.data;
        const expiryMs = Date.now() + expiresIn * 1000;

        tokenManager.setToken(token, credentials.rememberMe);
        tokenManager.setRefreshToken(refreshToken);
        tokenManager.setExpiry(expiryMs);
        sessionManager.setRememberMe(credentials.rememberMe ?? false);

        try {
          const storage = credentials.rememberMe ? localStorage : sessionStorage;
          storage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
        } catch {}

        activityTracker.updateLastActivity();

        dispatch({
          type: "AUTH_SUCCESS",
          payload: {
            user,
            token,
            refreshToken,
            sessionExpiry: expiryMs,
          },
        });

        const dashboard = ROLE_DASHBOARDS[user.role as UserRole] ?? "/";
        devLog("[Auth] Redirecting to:", dashboard, "for role:", user.role);
        router.push(dashboard);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Authentication failed";
        dispatch({
          type: "AUTH_FAILURE",
          payload: message,
        });
        throw err instanceof Error ? err : new Error(message);
      }
    },
    [router]
  );

  // ─── Hydrate from storage on mount ───────────────────────────
  useEffect(() => {
    const hydrate = async () => {
      devLog("[Auth] Starting hydration...");
      try {
        const token = tokenManager.getToken();
        const refreshToken = tokenManager.getRefreshToken();
        const expiry = tokenManager.getExpiry();

        if (!token) {
          devLog("[Auth] No token found during hydration");
          dispatch({ type: "AUTH_LOGOUT" });
          return;
        }

        if (tokenManager.isTokenExpired(token)) {
          devLog("[Auth] Token expired, checking refresh token...");
          if (refreshToken) {
            await refreshSession();
          } else {
            devWarn("[Auth] Token expired and no refresh token found");
            tokenManager.clearAll();
            dispatch({ type: "AUTH_LOGOUT" });
          }
          return;
        }

        let user: AuthUser | null = null;
        try {
          const stored =
            localStorage.getItem(STORAGE_KEYS.USER) ??
            sessionStorage.getItem(STORAGE_KEYS.USER);
          if (stored) user = JSON.parse(stored);
        } catch {}

        if (!user) {
          devWarn("[Auth] Token exists but user data is missing");
          tokenManager.clearAll();
          dispatch({ type: "AUTH_LOGOUT" });
          return;
        }

        devLog("[Auth] Hydration successful for user:", user.email);
        dispatch({
          type: "AUTH_SUCCESS",
          payload: {
            user,
            token,
            refreshToken: refreshToken ?? "",
            sessionExpiry: expiry ?? Date.now() + 3600 * 1000,
          },
        });
      } catch (err) {
        devWarn("[Auth] Hydration error:", err);
        tokenManager.clearAll();
        dispatch({ type: "AUTH_LOGOUT" });
      }
    };

    hydrate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Start session monitoring after auth ─────────────────────
  useEffect(() => {
    if (!state.isAuthenticated) {
      sessionManager.stop();
      return;
    }

    sessionManager.start({
      onLogout: (reason) => logout(reason),
      onWarning: (msRemaining) => {
        // Optional: fire a toast/modal warning
        // You can dispatch a custom event here that InactivityWatcher listens to
        window.dispatchEvent(
          new CustomEvent("fs:session-warning", { detail: { msRemaining } })
        );
      },
      onRefreshNeeded: refreshSession,
    });

    return () => sessionManager.stop();
  }, [state.isAuthenticated, logout, refreshSession]);

  // Real-time socket connection (notifications/location/etc)
  useEffect(() => {
    if (!state.isAuthenticated) {
      fieldSyncSocket.close();
      return;
    }

    fieldSyncSocket.connect({
      path: "/ws",
      onAuthError: () => logout("socket_auth"),
    });

    return () => fieldSyncSocket.close();
  }, [state.isAuthenticated, logout]);

  // ─── Permission helpers ───────────────────────────────────────
  const can = useCallback(
    (permission: Permission): boolean => {
      if (!state.user) return false;
      return hasPermission(state.user.role, permission);
    },
    [state.user]
  );

  const canAny = useCallback(
    (permissions: Permission[]): boolean => {
      if (!state.user) return false;
      return hasAnyPermission(state.user.role, permissions);
    },
    [state.user]
  );

  const canAll = useCallback(
    (permissions: Permission[]): boolean => {
      if (!state.user) return false;
      return hasAllPermissions(state.user.role, permissions);
    },
    [state.user]
  );

  const isRole = useCallback(
    (role: UserRole | UserRole[]): boolean => {
      if (!state.user) return false;
      const roles = Array.isArray(role) ? role : [role];
      return roles.includes(state.user.role);
    },
    [state.user]
  );

  const clearError = useCallback(() => dispatch({ type: "CLEAR_ERROR" }), []);
  const updateUser = useCallback(
    (updates: Partial<AuthUser>) => dispatch({ type: "UPDATE_USER", payload: updates }),
    []
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      login,
      logout,
      refreshSession,
      clearError,
      updateUser,
      can,
      canAny,
      canAll,
      isRole,
    }),
    [state, login, logout, refreshSession, clearError, updateUser, can, canAny, canAll, isRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within <AuthProvider>");
  }
  return ctx;
}

export { AuthContext };
