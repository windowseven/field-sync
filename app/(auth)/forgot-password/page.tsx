"use client";

// ============================================================
// FieldSync – Forgot Password Page
// FILE: app/(auth)/forgot-password/page.tsx
//
// Features:
//   - Email input with format validation
//   - Always shows "check your email" on submit (no enumeration)
//   - Loading state, disabled after success
//   - Routes to /verify-otp?context=password_reset
// ============================================================

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Mail,
  ArrowLeft,
  ArrowRight,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { validateEmail } from "@/lib/security/validation";
import { useForgotPassword } from "@/hooks/useAuthExtensions";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { requestReset, isLoading, error } = useForgotPassword();

  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);
  const emailError = touched ? validateEmail(email) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);

    const err = validateEmail(email);
    if (err) return;

    // We call the API — but regardless of whether the email exists, we show
    // "check your email" (prevents email enumeration).
    await requestReset({ email: email.trim().toLowerCase() });
    setSubmitted(true);

    // After a short pause redirect to OTP verification
    setTimeout(() => {
      router.push(
        `/verify-otp?email=${encodeURIComponent(email.trim().toLowerCase())}&context=password_reset`
      );
    }, 2500);
  };

  return (
    <div className="p-7 sm:p-8">
      {/* Header */}
      <div className="mb-7">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <KeyRound className="w-4 h-4 text-primary" />
          </div>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Reset your password
        </h1>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
          Enter your email address and we&apos;ll send you a verification code
          to reset your password.
        </p>
      </div>

      {/* API error */}
      {error && !submitted && (
        <Alert variant="destructive" className="mb-5 py-3">
          <AlertCircle className="h-3.5 w-3.5" />
          <AlertDescription className="text-xs ml-1">{error}</AlertDescription>
        </Alert>
      )}

      {/* Success state */}
      {submitted ? (
        <div className="space-y-5">
          <Alert className="py-4 border-green-200/60 bg-green-50/60 dark:bg-green-950/20 dark:border-green-800/40">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-sm ml-1 text-green-700 dark:text-green-400 leading-relaxed">
              If an account exists for{" "}
              <span className="font-semibold">{email}</span>, we&apos;ve sent a
              reset code. Check your inbox (and spam folder).
            </AlertDescription>
          </Alert>

          {/* Visual envelope icon */}
          <div className="flex flex-col items-center py-4 space-y-3">
            <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground text-center max-w-[220px]">
              Redirecting you to enter the verification code…
            </p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="w-3 h-3 animate-spin" />
              Taking you there in a moment
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full h-10 text-sm"
            onClick={() =>
              router.push(
                `/verify-otp?email=${encodeURIComponent(email)}&context=password_reset`
              )
            }
          >
            Enter code now
            <ArrowRight className="w-3.5 h-3.5 ml-2" />
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Email */}
          <div className="space-y-1.5">
            <Label
              htmlFor="email"
              className="text-xs font-medium text-foreground/80"
            >
              Email address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <Input
                id="email"
                ref={emailRef}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched(true)}
                placeholder="you@fieldsync.com"
                className={`h-10 text-sm pl-9 transition-colors ${
                  emailError
                    ? "border-destructive/70 focus-visible:ring-destructive/30"
                    : email && !emailError
                    ? "border-primary/40 focus-visible:ring-primary/20"
                    : ""
                }`}
                disabled={isLoading}
                autoFocus
              />
            </div>
            {emailError && (
              <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                {emailError}
              </p>
            )}
          </div>

          {/* Hint */}
          <p className="text-xs text-muted-foreground leading-relaxed bg-muted/40 rounded-lg px-3 py-2.5">
            We&apos;ll send a 6-digit code to this email. It expires in{" "}
            <strong>10 minutes</strong>.
          </p>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full h-10 text-sm font-medium gap-2 mt-1"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Sending code…
              </>
            ) : (
              <>
                Send reset code
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </Button>
        </form>
      )}

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

