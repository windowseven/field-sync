"use client";

// ============================================================
// FieldSync – ProtectedRoute
// Wraps any page/layout — checks auth + role before rendering
// Usage:
//   <ProtectedRoute requiredRoles={["admin"]} />
//   <ProtectedRoute requiredPermissions={["users:manage"]} />
// ============================================================

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import type { UserRole, Permission } from "@/types/auth.types";
import { ROLE_DASHBOARDS } from "@/types/auth.types";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;

  // Roles allowed to access this route (any match = allowed)
  requiredRoles?: UserRole[];

  // Permissions required (any match = allowed, unless requireAll=true)
  requiredPermissions?: Permission[];

  // If true, user must have ALL listed permissions (default: any)
  requireAll?: boolean;

  // Where to redirect if unauthorized (default: /unauthorized)
  redirectTo?: string;

  // Custom loading fallback
  loadingFallback?: React.ReactNode;
}

export function ProtectedRoute({
  children,
  requiredRoles,
  requiredPermissions,
  requireAll = false,
  redirectTo = "/unauthorized",
  loadingFallback,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, can, canAny, canAll } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    // Not logged in → go to login
    if (!isAuthenticated || !user) {
      router.replace("/login?reason=unauthenticated");
      return;
    }

    // Role check
    if (requiredRoles && requiredRoles.length > 0) {
      if (!requiredRoles.includes(user.role)) {
        router.replace(redirectTo);
        return;
      }
    }

    // Permission check
    if (requiredPermissions && requiredPermissions.length > 0) {
      const permitted = requireAll
        ? canAll(requiredPermissions)
        : canAny(requiredPermissions);

      if (!permitted) {
        router.replace(redirectTo);
        return;
      }
    }
  }, [
    isLoading,
    isAuthenticated,
    user,
    requiredRoles,
    requiredPermissions,
    requireAll,
    redirectTo,
    router,
    canAny,
    canAll,
  ]);

  // Loading state
  if (isLoading) {
    return loadingFallback ?? <AuthLoadingScreen />;
  }

  // Not authorized — render nothing (redirect in progress)
  if (!isAuthenticated || !user) return null;

  if (requiredRoles?.length && !requiredRoles.includes(user.role)) return null;

  if (requiredPermissions?.length) {
    const permitted = requireAll
      ? canAll(requiredPermissions)
      : canAny(requiredPermissions);
    if (!permitted) return null;
  }

  return <>{children}</>;
}

// ─── Guest Route — redirect logged-in users away ──────────────
// Use this on /auth/* pages so logged-in users go to their dashboard
interface GuestRouteProps {
  children: React.ReactNode;
  loadingFallback?: React.ReactNode;
}

export function GuestRoute({ children, loadingFallback }: GuestRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated && user) {
      const dashboard = ROLE_DASHBOARDS[user.role] ?? "/";
      router.replace(dashboard);
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading) return loadingFallback ?? <AuthLoadingScreen />;
  if (isAuthenticated) return null;

  return <>{children}</>;
}

// ─── Loading Screen ───────────────────────────────────────────
function AuthLoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-primary/20" />
          <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
        <p className="text-sm text-muted-foreground font-medium tracking-wide">
          Verifying access…
        </p>
      </div>
    </div>
  );
}

