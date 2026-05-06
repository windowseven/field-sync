// ============================================================
// FieldSync – RBAC Permissions
// Defines what each role CAN and CANNOT do
// ============================================================

import type { UserRole, Permission, RoutePermission } from "@/types/auth.types";
import { ROLES } from "@/types/auth.types";

// ─── Role → Permission Map ───────────────────────────────────
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    // Full system access
    "system:read",
    "system:manage",
    "users:read",
    "users:manage",
    "users:delete",
    "roles:manage",
    "maintenance:read",
    "maintenance:manage",
    "audit:read",
    "projects:read",
    "projects:manage",
    "projects:delete",
    "teams:read",
    "teams:manage",
    "zones:read",
    "zones:manage",
    "forms:read",
    "forms:manage",
    "forms:delete",
    "tasks:read",
    "tasks:assign",
    "tasks:manage",
    "team:read",
    "team:manage",
    "tasks:complete",
    "forms:submit",
    "map:read",
  ],

  supervisor: [
    "projects:read",
    "projects:manage",
    "teams:read",
    "teams:manage",
    "zones:read",
    "zones:manage",
    "forms:read",
    "forms:manage",
    "tasks:read",
    "tasks:assign",
    "tasks:manage",
    "team:read",
    "team:manage",
    "map:read",
    "audit:read",
  ],

  team_leader: [
    "tasks:read",
    "tasks:assign",
    "tasks:manage",
    "team:read",
    "team:manage",
    "forms:read",
    "forms:submit",
    "map:read",
    "zones:read",
  ],

  field_agent: [
    "tasks:read",
    "tasks:complete",
    "forms:read",
    "forms:submit",
    "map:read",
  ],
};

// ─── Route Access Control ────────────────────────────────────
// Maps URL prefixes → allowed roles + fallback redirect
export const PROTECTED_ROUTES: RoutePermission[] = [
  {
    path: "/dashboard",
    allowedRoles: [ROLES.ADMIN],
    redirectTo: "/unauthorized",
  },
  {
    path: "/supervisor",
    allowedRoles: [ROLES.SUPERVISOR, ROLES.ADMIN],
    redirectTo: "/unauthorized",
  },
  {
    path: "/teamleader",
    allowedRoles: [ROLES.TEAM_LEADER, ROLES.SUPERVISOR, ROLES.ADMIN],
    redirectTo: "/unauthorized",
  },
  {
    path: "/user",
    allowedRoles: [ROLES.FIELD_WORKER, ROLES.TEAM_LEADER, ROLES.SUPERVISOR, ROLES.ADMIN],
    redirectTo: "/unauthorized",
  },
];

// ─── Auth-only routes (logged-in users should not access) ────
export const GUEST_ONLY_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-otp",
];

// ─── Public routes (accessible by anyone) ───────────────────
export const PUBLIC_ROUTES = ["/", "/unauthorized", "/404"];

// ─── Permission check utility ────────────────────────────────
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] ?? [];
  return permissions.includes(permission);
}

// Check if role has ALL of the given permissions
export function hasAllPermissions(
  role: UserRole,
  permissions: Permission[]
): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

// Check if role has ANY of the given permissions
export function hasAnyPermission(
  role: UserRole,
  permissions: Permission[]
): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

// ─── Route access check ──────────────────────────────────────
export function canAccessRoute(pathname: string, role: UserRole | null): boolean {
  if (!role) return false;

  const rule = PROTECTED_ROUTES.find((r) => pathname.startsWith(r.path));
  if (!rule) return true; // not protected

  return rule.allowedRoles.includes(role);
}

// Get redirect target for unauthorized route access
export function getRouteRedirect(
  pathname: string,
  role: UserRole | null
): string | null {
  if (!role) return "/login";

  const rule = PROTECTED_ROUTES.find((r) => pathname.startsWith(r.path));
  if (!rule) return null;
  if (rule.allowedRoles.includes(role)) return null;

  return rule.redirectTo ?? "/unauthorized";
}

// ─── Role display config ─────────────────────────────────────
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "System Administrator",
  supervisor: "Supervisor",
  team_leader: "Team Leader",
  field_agent: "Field Worker",
};

export const ROLE_COLORS: Record<UserRole, string> = {
  admin: "bg-red-100 text-red-800 border-red-200",
  supervisor: "bg-blue-100 text-blue-800 border-blue-200",
  team_leader: "bg-purple-100 text-purple-800 border-purple-200",
  field_agent: "bg-green-100 text-green-800 border-green-200",
};

// ─── Feature-level permissions (granular UI control) ─────────
// Use these in PermissionGuard / usePermission for specific action buttons
export const FEATURE_PERMISSIONS = {
  // User management
  CAN_CREATE_USER: "users:manage" as Permission,
  CAN_DELETE_USER: "users:delete" as Permission,
  CAN_MANAGE_ROLES: "roles:manage" as Permission,

  // Projects
  CAN_CREATE_PROJECT: "projects:manage" as Permission,
  CAN_DELETE_PROJECT: "projects:delete" as Permission,

  // Teams
  CAN_CREATE_TEAM: "teams:manage" as Permission,
  CAN_ASSIGN_TASKS: "tasks:assign" as Permission,
  CAN_DELETE_TASK: "tasks:manage" as Permission,

  // Forms
  CAN_CREATE_FORM: "forms:manage" as Permission,
  CAN_DELETE_FORM: "forms:delete" as Permission,
  CAN_SUBMIT_FORM: "forms:submit" as Permission,

  // System
  CAN_VIEW_AUDIT_LOG: "audit:read" as Permission,
  CAN_ACCESS_MAINTENANCE: "maintenance:read" as Permission,
} as const;
