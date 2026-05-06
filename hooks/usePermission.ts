"use client";

// ============================================================
// FieldSync – usePermission Hook
// Fine-grained permission checks for UI elements
//
// Usage:
//   const canDelete = usePermission("users:delete");
//   const { canAssign, canDelete } = usePermissions(["tasks:assign", "tasks:manage"]);
// ============================================================

import { useMemo } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import type { Permission, UserRole } from "@/types/auth.types";
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  ROLE_PERMISSIONS,
} from "@/lib/auth/permissions";

// ─── Single permission check ──────────────────────────────────
export function usePermission(permission: Permission): boolean {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user) return false;
    return hasPermission(user.role, permission);
  }, [user, permission]);
}

// ─── Multiple permission checks ───────────────────────────────
// Returns an object with a boolean per permission key
export function usePermissions<T extends Permission>(
  permissions: T[]
): Record<T, boolean> {
  const { user } = useAuth();

  return useMemo(() => {
    if (!user) {
      return Object.fromEntries(permissions.map((p) => [p, false])) as Record<T, boolean>;
    }

    return Object.fromEntries(
      permissions.map((p) => [p, hasPermission(user.role, p)])
    ) as Record<T, boolean>;
  }, [user, permissions]);
}

// ─── Check all or any ────────────────────────────────────────
export function useHasAllPermissions(permissions: Permission[]): boolean {
  const { user } = useAuth();
  return useMemo(() => {
    if (!user) return false;
    return hasAllPermissions(user.role, permissions);
  }, [user, permissions]);
}

export function useHasAnyPermission(permissions: Permission[]): boolean {
  const { user } = useAuth();
  return useMemo(() => {
    if (!user) return false;
    return hasAnyPermission(user.role, permissions);
  }, [user, permissions]);
}

// ─── Get all permissions for current user ────────────────────
export function useAllPermissions(): Permission[] {
  const { user } = useAuth();
  return useMemo(() => {
    if (!user) return [];
    return ROLE_PERMISSIONS[user.role] ?? [];
  }, [user]);
}

// ─── Check if current user has a specific role ───────────────
export function useIsRole(role: UserRole | UserRole[]): boolean {
  const { user } = useAuth();
  return useMemo(() => {
    if (!user) return false;
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(user.role);
  }, [user, role]);
}
