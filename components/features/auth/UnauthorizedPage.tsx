"use client";

// ============================================================
// FieldSync – Unauthorized Page (403)
// Shown when a user tries to access a route they're not allowed
// ============================================================

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { ROLE_DASHBOARDS } from "@/types/auth.types";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import { Button } from "@/components/ui/button";
import { ShieldOff, ArrowLeft, Home } from "lucide-react";

export default function UnauthorizedPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  const handleGoHome = () => {
    if (user) {
      router.push(ROLE_DASHBOARDS[user.role]);
    } else {
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md text-center space-y-8">

        {/* Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
              <ShieldOff className="w-12 h-12 text-red-500" strokeWidth={1.5} />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
          </div>
        </div>

        {/* Text */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900">
            <span className="text-xs font-mono font-semibold text-red-600 dark:text-red-400">
              403 FORBIDDEN
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Access Denied
          </h1>

          <p className="text-muted-foreground leading-relaxed">
            You don't have permission to access this page.
            {user && (
              <>
                {" "}
                Your current role is{" "}
                <span className="font-medium text-foreground">
                  {ROLE_LABELS[user.role]}
                </span>
                .
              </>
            )}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" onClick={() => router.back()} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>

          <Button onClick={handleGoHome} className="gap-2">
            <Home className="w-4 h-4" />
            {user ? "Go to Dashboard" : "Log In"}
          </Button>
        </div>

        {/* Help text */}
        {isAuthenticated && (
          <p className="text-xs text-muted-foreground">
            If you believe this is a mistake, contact your system administrator.
          </p>
        )}
      </div>
    </div>
  );
}

