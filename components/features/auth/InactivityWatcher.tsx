"use client";

// ============================================================
// FieldSync – InactivityWatcher
// Shows a countdown modal before auto-logout
// Listens for fs:session-warning CustomEvent dispatched by SessionManager
// ============================================================

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { activityTracker } from "@/lib/auth/tokenManager";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export function InactivityWatcher() {
  const { isAuthenticated, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [countdown, setCountdown] = useState(120); // seconds

  // Listen for session warning event
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleWarning = (e: Event) => {
      const { msRemaining } = (e as CustomEvent<{ msRemaining: number }>).detail;
      const secondsRemaining = Math.ceil(msRemaining / 1000);
      setCountdown(secondsRemaining);
      setOpen(true);
    };

    window.addEventListener("fs:session-warning", handleWarning);
    return () => window.removeEventListener("fs:session-warning", handleWarning);
  }, [isAuthenticated]);

  // Countdown tick when modal is open
  useEffect(() => {
    if (!open) return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [open]);

  // Trigger logout when countdown reaches 0 (outside render)
  useEffect(() => {
    if (open && countdown === 0) {
      logout("inactivity");
    }
  }, [open, countdown, logout]);

  // "Stay logged in" — update activity and close modal
  const handleStayLoggedIn = useCallback(() => {
    activityTracker.updateLastActivity();
    setOpen(false);
    // Dispatch activity to reset session manager timer
    window.dispatchEvent(new MouseEvent("mousedown"));
  }, []);

  const handleLogout = useCallback(() => {
    setOpen(false);
    logout("inactivity");
  }, [logout]);

  if (!isAuthenticated) return null;

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100">
              <svg
                className="w-5 h-5 text-amber-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                />
              </svg>
            </div>
            <AlertDialogTitle>Session Expiring</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm text-muted-foreground">
            You've been inactive. Your session will expire in{" "}
            <span className="font-semibold text-foreground tabular-nums">
              {countdown}s
            </span>
            . Do you want to continue?
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Visual countdown bar */}
        <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 transition-all duration-1000 ease-linear"
            style={{ width: `${(countdown / 120) * 100}%` }}
          />
        </div>

        <AlertDialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Log Out
          </Button>
          <Button size="sm" onClick={handleStayLoggedIn}>
            Stay Logged In
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

