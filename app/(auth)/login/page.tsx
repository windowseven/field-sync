"use client";

// ============================================================
// FieldSync – Login Page (Polished)
// FILE: app/(auth)/login/page.tsx
// ============================================================

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  AlertCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import { useLogin, useAuthRedirect } from "@/hooks/useAuthExtensions";
import { validateLoginForm } from "@/lib/security/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

const MAX_ATTEMPTS_DISPLAY = 3;

export default function LoginPage() {
  const {
    login,
    isLoading,
    error,
    clearError,
    attemptsRemaining,
    isLockedOut,
    lockoutSecondsRemaining,
  } = useLogin();

  const redirectMessage = useAuthRedirect();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [touched, setTouched] = useState({ email: false, password: false });

  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  useEffect(() => {
    if (error) clearError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, password]);

  useEffect(() => {
    const errors = validateLoginForm(email, password);
    const visible: typeof formErrors = {};
    if (touched.email && errors.email) visible.email = errors.email;
    if (touched.password && errors.password) visible.password = errors.password;
    setFormErrors(visible);
  }, [email, password, touched]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[Login] handleSubmit called, isLockedOut:", isLockedOut);
    if (isLockedOut) return;
    setTouched({ email: true, password: true });
    const errors = validateLoginForm(email, password);
    if (errors.email || errors.password) {
      console.log("[Login] Form validation errors:", errors);
      setFormErrors(errors);
      return;
    }
    console.log("[Login] Calling login with email:", email.trim());
    await login({ email: email.trim(), password, rememberMe });
  };

  const attemptWarning =
    !isLockedOut &&
    attemptsRemaining < MAX_ATTEMPTS_DISPLAY &&
    attemptsRemaining > 0;

  return (
    <div className="p-7 sm:p-8">
      {/* Header */}
      <div className="mb-7">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <ShieldCheck className="w-4.5 h-4.5 text-primary" />
          </div>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Sign in to your FieldSync account
        </p>
      </div>

      {/* Alerts */}
      <div className="space-y-3 mb-5">
        {redirectMessage && (
          <Alert className="border-amber-200/60 bg-amber-50/60 dark:bg-amber-950/20 dark:border-amber-800/40 py-3">
            <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-amber-700 dark:text-amber-400 text-xs ml-1">
              {redirectMessage}
            </AlertDescription>
          </Alert>
        )}

        {isLockedOut && (
          <Alert variant="destructive" className="py-3">
            <AlertCircle className="h-3.5 w-3.5" />
            <AlertDescription className="text-xs ml-1">
              Too many failed attempts. Wait{" "}
              <span className="font-semibold tabular-nums">
                {lockoutSecondsRemaining}s
              </span>{" "}
              before trying again.
            </AlertDescription>
          </Alert>
        )}

        {error && !isLockedOut && (
          <Alert variant="destructive" className="py-3">
            <AlertCircle className="h-3.5 w-3.5" />
            <AlertDescription className="text-xs ml-1">{error}</AlertDescription>
          </Alert>
        )}

        {attemptWarning && (
          <Alert className="border-orange-200/60 bg-orange-50/60 dark:bg-orange-950/20 dark:border-orange-800/40 py-3">
            <AlertCircle className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
            <AlertDescription className="text-orange-700 dark:text-orange-400 text-xs ml-1">
              {attemptsRemaining} attempt{attemptsRemaining === 1 ? "" : "s"}{" "}
              remaining before temporary lockout.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-medium text-foreground/80">
            Email address
          </Label>
          <Input
            id="email"
            ref={emailRef}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            placeholder="you@fieldsync.com"
            className={cn(
              "h-10 text-sm transition-colors",
              formErrors.email
                ? "border-destructive/70 focus-visible:ring-destructive/30"
                : email && !formErrors.email
                ? "border-primary/40 focus-visible:ring-primary/20"
                : ""
            )}
            disabled={isLoading || isLockedOut}
            aria-invalid={!!formErrors.email}
          />
          {formErrors.email && (
            <p className="text-xs text-destructive flex items-center gap-1 mt-1">
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              {formErrors.email}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs font-medium text-foreground/80">
              Password
            </Label>
            <Link
              href="/forgot-password"
              className="text-xs text-primary hover:text-primary/80 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              placeholder="Enter your password"
              className={cn(
                "h-10 text-sm pr-10 transition-colors",
                formErrors.password
                  ? "border-destructive/70 focus-visible:ring-destructive/30"
                  : ""
              )}
              disabled={isLoading || isLockedOut}
              aria-invalid={!!formErrors.password}
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
          {formErrors.password && (
            <p className="text-xs text-destructive flex items-center gap-1 mt-1">
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              {formErrors.password}
            </p>
          )}
        </div>

        {/* Remember me */}
        <div className="flex items-center gap-2.5">
          <Checkbox
            id="rememberMe"
            checked={rememberMe}
            onCheckedChange={(v) => setRememberMe(v === true)}
            disabled={isLoading}
            className="h-3.5 w-3.5"
          />
          <Label
            htmlFor="rememberMe"
            className="text-xs text-muted-foreground cursor-pointer select-none"
          >
            Keep me signed in for 30 days
          </Label>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full h-10 text-sm font-medium gap-2 mt-1"
          disabled={isLoading || isLockedOut}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Signing in…
            </>
          ) : isLockedOut ? (
            <>
              <Clock className="w-3.5 h-3.5" />
              Locked ({lockoutSecondsRemaining}s)
            </>
          ) : (
            <>
              Sign In
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </Button>
      </form>

      {/* Footer */}
      <div className="mt-6 pt-5 border-t border-border/60">
        <p className="text-center text-xs text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="text-primary hover:text-primary/80 font-medium transition-colors"
          >
            Request access
          </Link>
        </p>
      </div>
    </div>
  );
}

