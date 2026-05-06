"use client";

// ============================================================
// FieldSync – Reset Password Page
// FILE: app/(auth)/reset-password/page.tsx
//
// Features:
//   - Reads email + resetToken from URL params (set by verify-otp)
//   - New password + confirm with strength meter
//   - Show/hide toggles
//   - Real-time match validation
//   - Success → redirect to /login?reason=password_reset
// ============================================================

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import {
  validatePassword,
  validatePasswordMatch,
  checkPasswordStrength,
} from "@/lib/security/validation";
import { useResetPassword } from "@/hooks/useAuthExtensions";

// ─── Strength bar (same as register) ─────────────────────────
function StrengthBar({ password }: { password: string }) {
  if (!password) return null;
  const { score, label, suggestions } = checkPasswordStrength(password);

  const colors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-blue-500",
    "bg-green-500",
  ];
  const textColors = [
    "text-red-500",
    "text-orange-500",
    "text-yellow-500",
    "text-blue-500",
    "text-green-500",
  ];

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-all duration-300",
              i < score ? colors[score] : "bg-border"
            )}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className={cn("text-xs font-medium", textColors[score])}>
          {label}
        </span>
        {suggestions[0] && (
          <span className="text-xs text-muted-foreground truncate max-w-[180px]">
            {suggestions[0]}
          </span>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useSearchParams();

  const email = params.get("email") ?? "";
  const token = params.get("token") ?? "";

  const { reset, isLoading, error } = useResetPassword();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);
  const [touched, setTouched] = useState({
    password: false,
    confirmPassword: false,
  });

  const passwordError = touched.password ? validatePassword(password) : null;
  const confirmError = touched.confirmPassword
    ? validatePasswordMatch(password, confirmPassword)
    : null;

  // Guard: if no email in URL, the user landed here directly
  const missingParams = !email;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ password: true, confirmPassword: true });

    if (validatePassword(password) || validatePasswordMatch(password, confirmPassword)) {
      return;
    }

    const result = await reset({ email, otp: token, password });

    if (result?.success) {
      setSuccess(true);
      setTimeout(() => {
        router.push("/login?reason=password_reset");
      }, 1500);
    }
  };

  // ─── Guard: missing params ────────────────────────────────────
  if (missingParams) {
    return (
      <div className="p-7 sm:p-8">
        <div className="flex flex-col items-center text-center space-y-4 py-6">
          <div className="w-12 h-12 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">
              Invalid reset link
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              This link is missing required information. Please request a new
              password reset.
            </p>
          </div>
          <Link
            href="/forgot-password"
            className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Request new reset
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-7 sm:p-8">
      {/* Header */}
      <div className="mb-7">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-primary" />
          </div>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Set new password
        </h1>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
          Choose a strong password for your account.
        </p>
      </div>

      {/* API error */}
      {error && !success && (
        <Alert variant="destructive" className="mb-5 py-3">
          <AlertCircle className="h-3.5 w-3.5" />
          <AlertDescription className="text-xs ml-1">{error}</AlertDescription>
        </Alert>
      )}

      {/* Success */}
      {success && (
        <Alert className="mb-5 py-3 border-green-200/60 bg-green-50/60 dark:bg-green-950/20 dark:border-green-800/40">
          <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-xs ml-1 text-green-700 dark:text-green-400">
            Password updated! Redirecting to sign in…
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* New password */}
        <div className="space-y-1.5">
          <Label
            htmlFor="password"
            className="text-xs font-medium text-foreground/80"
          >
            New password <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              placeholder="Min. 8 characters"
              className={cn(
                "h-10 text-sm pl-9 pr-10 transition-colors",
                passwordError
                  ? "border-destructive/70 focus-visible:ring-destructive/30"
                  : password && !passwordError
                  ? "border-primary/40 focus-visible:ring-primary/20"
                  : ""
              )}
              disabled={isLoading || success}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="w-3.5 h-3.5" />
              ) : (
                <Eye className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Strength bar */}
          <StrengthBar password={password} />

          {passwordError && touched.password && (
            <p className="text-xs text-destructive flex items-center gap-1 mt-1">
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              {passwordError}
            </p>
          )}
        </div>

        {/* Confirm password */}
        <div className="space-y-1.5">
          <Label
            htmlFor="confirmPassword"
            className="text-xs font-medium text-foreground/80"
          >
            Confirm new password <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <Input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onBlur={() =>
                setTouched((t) => ({ ...t, confirmPassword: true }))
              }
              placeholder="Re-enter new password"
              className={cn(
                "h-10 text-sm pl-9 pr-10 transition-colors",
                confirmError
                  ? "border-destructive/70 focus-visible:ring-destructive/30"
                  : confirmPassword && !confirmError
                  ? "border-primary/40 focus-visible:ring-primary/20"
                  : ""
              )}
              disabled={isLoading || success}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showConfirm ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              {showConfirm ? (
                <EyeOff className="w-3.5 h-3.5" />
              ) : (
                <Eye className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          {confirmError && (
            <p className="text-xs text-destructive flex items-center gap-1 mt-1">
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              {confirmError}
            </p>
          )}
          {confirmPassword && !confirmError && (
            <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 mt-1">
              <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
              Passwords match
            </p>
          )}
        </div>

        {/* Password requirements reminder */}
        <div className="bg-muted/40 rounded-lg px-3 py-2.5 space-y-1">
          <p className="text-xs font-medium text-foreground/70">Requirements:</p>
          {[
            { label: "At least 8 characters", met: password.length >= 8 },
            { label: "At least 1 capital letter (A–Z)", met: /[A-Z]/.test(password) },
            { label: "At least 1 small letter (a–z)", met: /[a-z]/.test(password) },
            { label: "At least 1 digit (0–9)", met: /[0-9]/.test(password) },
            { label: "At least 1 symbol", met: /[^A-Za-z0-9]/.test(password) },
          ].map(({ label, met }) => (
            <div key={label} className="flex items-center gap-2">
              {met ? (
                <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
              ) : (
                <div className="w-3 h-3 rounded-full border border-muted-foreground/40 flex-shrink-0" />
              )}
              <span
                className={cn(
                  "text-xs",
                  met
                    ? "text-green-600 dark:text-green-400"
                    : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full h-10 text-sm font-medium gap-2 mt-1"
          disabled={isLoading || success}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Updating password…
            </>
          ) : success ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              Password updated!
            </>
          ) : (
            <>
              Set new password
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </Button>
      </form>

      {/* Footer */}
      <div className="mt-6 pt-5 border-t border-border/60">
        <Link
          href="/login"
          className="text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to sign in
        </Link>
      </div>
    </div>
  );
}

