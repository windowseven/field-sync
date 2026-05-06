// ============================================================
// FieldSync – Auth Types
// Single source of truth for every auth-related shape
// ============================================================

// ─── Roles ──────────────────────────────────────────────────
export type UserRole = "admin" | "supervisor" | "team_leader" | "field_agent";

export const ROLES = {
  ADMIN: "admin" as UserRole,
  SUPERVISOR: "supervisor" as UserRole,
  TEAM_LEADER: "team_leader" as UserRole,
  FIELD_WORKER: "field_agent" as UserRole,
} as const;

// ─── Permissions ────────────────────────────────────────────
export type Permission =
  // System (Admin)
  | "system:read"
  | "system:manage"
  | "users:read"
  | "users:manage"
  | "users:delete"
  | "roles:manage"
  | "maintenance:read"
  | "maintenance:manage"
  | "audit:read"
  // Projects / Supervisors
  | "projects:read"
  | "projects:manage"
  | "projects:delete"
  | "teams:read"
  | "teams:manage"
  | "zones:read"
  | "zones:manage"
  | "forms:read"
  | "forms:manage"
  | "forms:delete"
  // Team Leader
  | "tasks:read"
  | "tasks:assign"
  | "tasks:manage"
  | "team:read"
  | "team:manage"
  // Field Worker
  | "tasks:complete"
  | "forms:submit"
  | "map:read";

// ─── User ────────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  avatar?: string;
  first_name?: string;
  lastName?: string;
  phone?: string;
  projectId?: string;    // Supervisor / Team Leader context
  teamId?: string;       // Team Leader / Field Worker context
  zoneId?: string;       // Field Worker context
  isVerified: boolean;
  lastLogin?: string;
  createdAt: string;
}

// ─── Token Payload (decoded JWT) ────────────────────────────
export interface TokenPayload {
  sub: string;           // user id
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
  jti?: string;          // token id (for revocation)
}

// ─── Auth State ──────────────────────────────────────────────
export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  sessionExpiry: number | null;  // Unix timestamp
}

// ─── Auth Actions ────────────────────────────────────────────
export type AuthAction =
  | { type: "AUTH_LOADING" }
  | { type: "AUTH_SUCCESS"; payload: { user: AuthUser; token: string; refreshToken: string; sessionExpiry: number } }
  | { type: "AUTH_FAILURE"; payload: string }
  | { type: "AUTH_LOGOUT" }
  | { type: "TOKEN_REFRESHED"; payload: { token: string; sessionExpiry: number } }
  | { type: "TOKEN_REFRESHING" }
  | { type: "CLEAR_ERROR" }
  | { type: "UPDATE_USER"; payload: Partial<AuthUser> };

// ─── Login Credentials ───────────────────────────────────────
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// ─── Auth API Responses ──────────────────────────────────────
export interface LoginResponse {
  user: AuthUser;
  token: string;
  refreshToken: string;
  expiresIn: number;     // seconds
}

export interface RefreshResponse {
  token: string;
  expiresIn: number;
}

// ─── Route Permission Map ────────────────────────────────────
export interface RoutePermission {
  path: string;
  allowedRoles: UserRole[];
  redirectTo?: string;
}

// ─── API Error shapes ────────────────────────────────────────
export interface ApiError {
  status: number;
  code: string;
  message: string;
}

// ─── Session Storage Keys ────────────────────────────────────
export const STORAGE_KEYS = {
  ACCESS_TOKEN: "fs_access_token",
  REFRESH_TOKEN: "fs_refresh_token",
  USER: "fs_user",
  SESSION_EXPIRY: "fs_session_expiry",
  REMEMBER_ME: "fs_remember_me",
  CSRF_TOKEN: "fs_csrf_token",
  LAST_ACTIVITY: "fs_last_activity",
  LOGOUT_SIGNAL: "fs_logout_signal",
} as const;

// ─── Dashboard routes per role ───────────────────────────────
export const ROLE_DASHBOARDS: Record<UserRole, string> = {
  admin: "/dashboard",
  supervisor: "/supervisor",
  team_leader: "/teamleader",
  field_agent: "/user",
};

// ─── Inactivity config ───────────────────────────────────────
export const SESSION_CONFIG = {
  INACTIVITY_TIMEOUT_MS: 15 * 60 * 1000,  // 15 minutes
  WARNING_BEFORE_MS: 2 * 60 * 1000,        // warn 2 min before
  REFRESH_THRESHOLD_MS: 5 * 60 * 1000,     // refresh 5 min before expiry
  ACTIVITY_EVENTS: ["mousedown", "keydown", "touchstart", "scroll"] as const,
} as const;
