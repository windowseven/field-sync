"use client";

// ============================================================
// FieldSync – AuthErrorBoundary
// Global listener for forced-logout events from httpClient
// (e.g., when refresh token fails mid-session)
// Mount this once in your root layout, inside <AuthProvider>
// ============================================================

import { useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";

export function AuthErrorBoundary({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();

  useEffect(() => {
    // httpClient fires this when a 401 refresh cycle fails
    const handleForceLogout = (e: Event) => {
      const reason = (e as CustomEvent<{ reason: string }>).detail?.reason ?? "session_expired";
      logout(reason);
    };

    window.addEventListener("fs:force-logout", handleForceLogout);
    return () => window.removeEventListener("fs:force-logout", handleForceLogout);
  }, [logout]);

  return <>{children}</>;
}

