"use client";

// ============================================================
// FieldSync – Verify OTP Page
// FILE: app/(auth)/verify-otp/page.tsx
//
// Features:
//   - 6-digit OTP using input-otp (native package in project)
//   - Auto-submit when all 6 digits entered
//   - Countdown timer (60s) before resend unlocks
//   - Max 3 resend attempts
//   - Masked email/phone display ("j***@gmail.com")
//   - Context-aware: registration vs password_reset
//   - Redirects correctly per context
// ============================================================

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Mail,
  RefreshCw,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useVerifyOtp, useResendOtp } from "@/hooks/useAuthExtensions";

// ─── Mask email for display ────────────────────────────────────
function maskEmail(email: string): string {
  if (!email) return "";
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${"*".repeat(Math.max(3, local.length - 2))}@${domain}`;
}

const OTP_COUNTDOWN_SECONDS = 60;
const MAX_RESEND_ATTEMPTS = 3;

export default function VerifyOtpPage() {
  const router = useRouter();
  const params = useSearchParams();

  const email = params.get("email") ?? "";
  const context = (params.get("context") ?? "registration") as
    | "registration"
    | "password_reset";

  const { verify, isLoading, error } = useVerifyOtp();
  const { resend, isResending, resendError } = useResendOtp();

  const [otp, setOtp] = useState("");
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(OTP_COUNTDOWN_SECONDS);
  const [resendCount, setResendCount] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // Auto-submit when complete
  useEffect(() => {
    if (otp.length === 6 && !isLoading && !success) {
      handleVerify(otp);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  const handleVerify = useCallback(
    async (code: string) => {
      if (!email || code.length !== 6) return;

      const result = await verify({ email, otp: code, context });

      if (result?.success) {
        setSuccess(true);
        setTimeout(() => {
          if (context === "registration") {
            router.push("/login?reason=verified");
          } else {
            // Pass resetToken (if any) + email for reset-password page
            const token = result.resetToken ?? "";
            router.push(
              `/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`
            );
          }
        }, 800);
      }
    },
    [email, context, verify, router]
  );

  const handleResend = async () => {
    if (countdown > 0 || resendCount >= MAX_RESEND_ATTEMPTS) return;

    const ok = await resend({ email, context });
    if (ok) {
      setResendCount((c) => c + 1);
      setCountdown(OTP_COUNTDOWN_SECONDS);
      setOtp("");
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 3000);
    }
  };

  const maskedEmail = maskEmail(email);
  const canResend = countdown === 0 && resendCount < MAX_RESEND_ATTEMPTS;
  const resendExhausted = resendCount >= MAX_RESEND_ATTEMPTS;

  return (
    <div className="p-7 sm:p-8">
      {/* Header */}
      <div className="mb-7">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Mail className="w-4 h-4 text-primary" />
          </div>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Check your inbox
        </h1>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
          {maskedEmail ? (
            <>
              We sent a 6-digit code to{" "}
              <span className="font-medium text-foreground">{maskedEmail}</span>.
              Enter it below to continue.
            </>
          ) : (
            "Enter the 6-digit code we sent to your email or phone."
          )}
        </p>
      </div>

      {/* Alerts */}
      <div className="space-y-3 mb-6">
        {error && !success && (
          <Alert variant="destructive" className="py-3">
            <AlertCircle className="h-3.5 w-3.5" />
            <AlertDescription className="text-xs ml-1">{error}</AlertDescription>
          </Alert>
        )}

        {resendError && (
          <Alert variant="destructive" className="py-3">
            <AlertCircle className="h-3.5 w-3.5" />
            <AlertDescription className="text-xs ml-1">{resendError}</AlertDescription>
          </Alert>
        )}

        {resendSuccess && (
          <Alert className="py-3 border-green-200/60 bg-green-50/60 dark:bg-green-950/20 dark:border-green-800/40">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-xs ml-1 text-green-700 dark:text-green-400">
              New code sent! Check your inbox.
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="py-3 border-green-200/60 bg-green-50/60 dark:bg-green-950/20 dark:border-green-800/40">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-xs ml-1 text-green-700 dark:text-green-400">
              {context === "registration"
                ? "Account verified! Redirecting to login…"
                : "OTP verified! Redirecting to reset…"}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* OTP input */}
      <div className="flex flex-col items-center space-y-6">
        <InputOTP
          maxLength={6}
          value={otp}
          onChange={setOtp}
          disabled={isLoading || success}
          className="gap-2"
        >
          <InputOTPGroup>
            <InputOTPSlot
              index={0}
              className="h-12 w-11 text-base font-semibold rounded-lg border-border focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30 transition-all"
            />
            <InputOTPSlot
              index={1}
              className="h-12 w-11 text-base font-semibold rounded-lg border-border focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30 transition-all"
            />
            <InputOTPSlot
              index={2}
              className="h-12 w-11 text-base font-semibold rounded-lg border-border focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30 transition-all"
            />
          </InputOTPGroup>
          <InputOTPSeparator className="text-muted-foreground/40" />
          <InputOTPGroup>
            <InputOTPSlot
              index={3}
              className="h-12 w-11 text-base font-semibold rounded-lg border-border focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30 transition-all"
            />
            <InputOTPSlot
              index={4}
              className="h-12 w-11 text-base font-semibold rounded-lg border-border focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30 transition-all"
            />
            <InputOTPSlot
              index={5}
              className="h-12 w-11 text-base font-semibold rounded-lg border-border focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/30 transition-all"
            />
          </InputOTPGroup>
        </InputOTP>

        {/* Loading indicator when auto-submitting */}
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Verifying…
          </div>
        )}

        {/* Manual verify button (fallback) */}
        {otp.length === 6 && !isLoading && !success && (
          <Button
            onClick={() => handleVerify(otp)}
            className="w-full h-10 text-sm font-medium"
            disabled={isLoading}
          >
            <ShieldCheck className="w-3.5 h-3.5 mr-2" />
            Verify code
          </Button>
        )}

        {/* Resend section */}
        <div className="text-center space-y-2 w-full">
          {resendExhausted ? (
            <p className="text-xs text-muted-foreground">
              Maximum resend attempts reached.{" "}
              <Link href="/forgot-password" className="text-primary hover:underline">
                Try a different email
              </Link>
            </p>
          ) : countdown > 0 ? (
            <p className="text-xs text-muted-foreground">
              Resend code in{" "}
              <span className="font-semibold tabular-nums text-foreground">
                {countdown}s
              </span>
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={!canResend || isResending}
              className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1.5 mx-auto transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
              {isResending ? "Sending…" : "Resend code"}
              {resendCount > 0 && (
                <span className="text-muted-foreground font-normal">
                  ({MAX_RESEND_ATTEMPTS - resendCount} left)
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-5 border-t border-border/60 flex items-center justify-between">
        <Link
          href={context === "registration" ? "/register" : "/forgot-password"}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          Go back
        </Link>
        <p className="text-xs text-muted-foreground">
          Wrong email?{" "}
          <Link href="/register" className="text-primary hover:text-primary/80">
            Start over
          </Link>
        </p>
      </div>
    </div>
  );
}

