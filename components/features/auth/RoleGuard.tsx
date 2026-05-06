"use client";

// ============================================================
// FieldSync – RoleGuard & PermissionGuard
// Conditionally render UI based on role or permissions
//
// Usage:
//   <RoleGuard roles={["admin", "supervisor"]}>
//     <DeleteButton />
//   </RoleGuard>
//
//   <PermissionGuard permission="users:delete">
//     <DeleteUserButton />
//   </PermissionGuard>
//
//   <PermissionGuard permission="projects:delete" fallback={<DisabledButton />}>
//     <DeleteProjectButton />
//   </PermissionGuard>
// ============================================================

import React from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import type { UserRole, Permission } from "@/types/auth.types";

// ─── RoleGuard ────────────────────────────────────────────────
interface RoleGuardProps {
  roles: UserRole | UserRole[];
  children: React.ReactNode;
  // Optional: render something else when access is denied (e.g. disabled button)
  fallback?: React.ReactNode;
  // Optional: invert — show children when user does NOT have these roles
  invert?: boolean;
}

export function RoleGuard({ roles, children, fallback = null, invert = false }: RoleGuardProps) {
  const { user } = useAuth();

  if (!user) return <>{fallback}</>;

  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  const hasRole = allowedRoles.includes(user.role);
  const shouldRender = invert ? !hasRole : hasRole;

  return <>{shouldRender ? children : fallback}</>;
}

// ─── PermissionGuard ──────────────────────────────────────────
interface PermissionGuardProps {
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean; // default: false (any)
  children: React.ReactNode;
  fallback?: React.ReactNode;
  // If true, renders children as visually disabled instead of hiding
  disableInstead?: boolean;
}

export function PermissionGuard({
  permission,
  permissions,
  requireAll = false,
  children,
  fallback = null,
  disableInstead = false,
}: PermissionGuardProps) {
  const { user, can, canAny, canAll } = useAuth();

  if (!user) return <>{fallback}</>;

  // Collect all permissions to check
  const toCheck: Permission[] = [
    ...(permission ? [permission] : []),
    ...(permissions ?? []),
  ];

  if (toCheck.length === 0) return <>{children}</>;

  const permitted = requireAll
    ? canAll(toCheck)
    : toCheck.length === 1
    ? can(toCheck[0])
    : canAny(toCheck);

  if (!permitted) {
    if (disableInstead) {
      return (
        <div
          aria-disabled="true"
          className="pointer-events-none opacity-40 select-none"
          title="You don't have permission to perform this action"
        >
          {children}
        </div>
      );
    }

    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// ─── AdminOnly / SupervisorOnly convenience wrappers ──────────
export const AdminOnly = ({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) => (
  <RoleGuard roles="admin" fallback={fallback}>
    {children}
  </RoleGuard>
);

export const SupervisorAndAbove = ({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) => (
  <RoleGuard roles={["admin", "supervisor"]} fallback={fallback}>
    {children}
  </RoleGuard>
);

export const TeamLeaderAndAbove = ({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) => (
  <RoleGuard roles={["admin", "supervisor", "team_leader"]} fallback={fallback}>
    {children}
  </RoleGuard>
);

// ─── Feature-specific guards ──────────────────────────────────
export const CanDeleteProject = ({ children }: { children: React.ReactNode }) => (
  <PermissionGuard permission="projects:delete">{children}</PermissionGuard>
);

export const CanAssignTask = ({ children }: { children: React.ReactNode }) => (
  <PermissionGuard permission="tasks:assign">{children}</PermissionGuard>
);

export const CanManageUsers = ({ children }: { children: React.ReactNode }) => (
  <PermissionGuard permission="users:manage">{children}</PermissionGuard>
);

export const CanDeleteUser = ({ children }: { children: React.ReactNode }) => (
  <PermissionGuard permission="users:delete">{children}</PermissionGuard>
);

export const CanManageForms = ({ children }: { children: React.ReactNode }) => (
  <PermissionGuard permission="forms:manage">{children}</PermissionGuard>
);

export const CanViewAuditLog = ({ children }: { children: React.ReactNode }) => (
  <PermissionGuard permission="audit:read">{children}</PermissionGuard>
);

