// ============================================================
// FieldSync – HTTP Client
// Secure fetch wrapper with:
//   - Auto token attachment
//   - CSRF header injection
//   - 401 → auto refresh → retry
//   - 403 → redirect to /unauthorized
//   - No sensitive data in error messages (production)
//   - HTTPS enforcement
// ============================================================

import { tokenManager } from "@/lib/auth/tokenManager";
import { csrfManager } from "@/lib/security/csrf";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

// Security: Enforce HTTPS in production
if (
  typeof window !== "undefined" &&
  process.env.NODE_ENV === "production" &&
  window.location.protocol !== "https:" &&
  !["localhost", "127.0.0.1"].includes(window.location.hostname)
) {
  console.error("[Security] HTTP is not allowed. Redirecting to HTTPS.");
  window.location.href = window.location.href.replace("http:", "https:");
}

// ─── Refresh lock (prevents multiple concurrent refresh calls) ─
let isRefreshing = false;
let pendingRequests: Array<(token: string) => void> = [];

function onTokenRefreshed(newToken: string) {
  pendingRequests.forEach((resolve) => resolve(newToken));
  pendingRequests = [];
}

async function doRefresh(): Promise<string | null> {
  const refreshToken = tokenManager.getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const rememberMe =
      typeof window !== "undefined"
        ? localStorage.getItem("fs_remember_me") === "true"
        : false;

    tokenManager.setToken(data.token, rememberMe);
    tokenManager.setExpiry(Date.now() + data.expiresIn * 1000);
    return data.token;
  } catch {
    return null;
  }
}

// ─── Core request function ───────────────────────────────────
interface RequestOptions extends RequestInit {
  skipAuth?: boolean;       // Don't attach token (e.g. login endpoint)
  skipCsrf?: boolean;       // Don't attach CSRF header
  _isRetry?: boolean;       // Internal flag to prevent infinite retry
}

export async function apiRequest<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const {
    skipAuth = false,
    skipCsrf = false,
    _isRetry = false,
    ...fetchOptions
  } = options;

  const headers = new Headers(fetchOptions.headers);

  // Always set content-type for JSON bodies
  if (!headers.has("Content-Type") && fetchOptions.body) {
    headers.set("Content-Type", "application/json");
  }

  // ─── Attach Authorization token ───────────────────────────
  if (!skipAuth) {
    const token = tokenManager.getToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  // ─── Attach CSRF token ────────────────────────────────────
  if (!skipCsrf) {
    const csrf = csrfManager.getToken();
    if (csrf) {
      headers.set("X-CSRF-Token", csrf);
    }
  }

  // ─── Make request ─────────────────────────────────────────
  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...fetchOptions,
      headers,
      credentials: "include",
    });
  } catch (error) {
    // Network-level error (no response received at all)
    const errorMsg = error instanceof TypeError && error.message === 'Failed to fetch'
      ? 'Cannot connect to server. Please ensure backend is running on port 5000.'
      : error instanceof Error ? error.message : 'Network request failed';
    
    console.error('[HTTP] Network error:', errorMsg, 'URL:', url);
    throw new ApiError(0, "NETWORK_ERROR", errorMsg);
  }

  // ─── 401: Token expired — attempt refresh ─────────────────
  if (response.status === 401 && !_isRetry && !skipAuth) {
    if (!isRefreshing) {
      isRefreshing = true;

      const newToken = await doRefresh();

      isRefreshing = false;

      if (newToken) {
        onTokenRefreshed(newToken);

        // Retry original request with new token
        return apiRequest<T>(path, {
          ...options,
          _isRetry: true,
          headers: { ...Object.fromEntries(headers), Authorization: `Bearer ${newToken}` },
        });
      } else {
        // Refresh failed — trigger logout
        pendingRequests = [];
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("fs:force-logout", { detail: { reason: "token_expired" } }));
        }
        throw new ApiError(401, "UNAUTHORIZED", "Session expired. Please log in again.");
      }
    } else {
      // Another request already refreshing — queue this one
      return new Promise((resolve, reject) => {
        pendingRequests.push((token) => {
          apiRequest<T>(path, {
            ...options,
            _isRetry: true,
            headers: { ...Object.fromEntries(headers), Authorization: `Bearer ${token}` },
          })
            .then(resolve)
            .catch(reject);
        });
      });
    }
  }

  // ─── 403: Forbidden ───────────────────────────────────────
  if (response.status === 403) {
    if (typeof window !== "undefined") {
      window.location.href = "/unauthorized";
    }
    throw new ApiError(403, "FORBIDDEN", "You don't have permission to perform this action.");
  }

  // ─── Other errors ─────────────────────────────────────────
  if (!response.ok) {
    let errorMessage = "An unexpected error occurred. Please try again.";

    // In development, surface more detail. In production, keep messages generic.
    if (process.env.NODE_ENV === "development") {
      try {
        const errBody = await response.json();
        errorMessage = errBody.message ?? errorMessage;
      } catch {
        // Response wasn't JSON - may be network issue
        const text = await response.text();
        if (text) {
          errorMessage = text;
        } else {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
      }
    }

    throw new ApiError(response.status, "REQUEST_FAILED", errorMessage);
  }

  // ─── Parse response ───────────────────────────────────────
  const contentType = response.headers.get("Content-Type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json() as Promise<T>;
  }

  return response.text() as unknown as T;
}

// ─── API Error class ─────────────────────────────────────────
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ─── Convenience methods ─────────────────────────────────────
export const http = {
  get: <T>(path: string, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: "GET" }),

  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiRequest<T>(path, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(path: string, options?: RequestOptions) =>
    apiRequest<T>(path, { ...options, method: "DELETE" }),
};
