"use client";

// ============================================================
// FieldSync – Register Page
// FILE: app/(auth)/register/page.tsx
//
// Features:
//   - Full name, email, phone (optional), password, confirm password
//   - Role selection (Field Worker / Supervisor)
//   - Real-time validation — red → green field feedback
//   - Password strength meter (4 levels)
//   - Show/hide password toggles
//   - Terms & Conditions required checkbox
//   - Loading + disabled states
//   - Redirects to /verify-otp on success
// ============================================================

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  User,
  Mail,
  Lock,
  UserCog,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  validateName,
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  checkPasswordStrength,
} from "@/lib/security/validation";
import { useRegister } from "@/hooks/useAuthExtensions";

// ─── Password strength bar ─────────────────────────────────────
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
      {/* 4 bar segments */}
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

// ─── Field wrapper with success ring ──────────────────────────
function fieldClass(value: string, error?: string) {
  if (!value) return "h-10 text-sm pl-9";
  if (error) return "h-10 text-sm pl-9 border-destructive/70 focus-visible:ring-destructive/30";
  return "h-10 text-sm pl-9 border-primary/40 focus-visible:ring-primary/20";
}

// ─── Page ──────────────────────────────────────────────────────
export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, isLoading, error } = useRegister();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"field_agent" | "supervisor">("field_agent");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [success, setSuccess] = useState(false);

  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  // Per-field errors (only shown after touching)
  const nameError = touched.name ? validateName(name) : null;
  const emailError = touched.email ? validateEmail(email) : null;
  const passwordError = touched.password ? validatePassword(password) : null;
  const confirmError = touched.confirmPassword
    ? validatePasswordMatch(password, confirmPassword)
    : null;

  const isFormValid =
    !validateName(name) &&
    !validateEmail(email) &&
    !validatePassword(password) &&
    !validatePasswordMatch(password, confirmPassword) &&
    acceptedTerms;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Touch all fields
    setTouched({ name: true, email: true, password: true, confirmPassword: true });

    if (!acceptedTerms) {
      setTermsError(true);
      return;
    }
    setTermsError(false);

    if (!isFormValid) return;

    const result = await registerUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role,
    });

    if (result?.success) {
      setSuccess(true);
      // Small delay so the user sees the success state
      setTimeout(() => {
        router.push(
          `/verify-otp?email=${encodeURIComponent(email.trim().toLowerCase())}&context=registration`
        );
      }, 600);
    }
  };

  return (
    <div className="p-7 sm:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <UserCog className="w-4 h-4 text-primary" />
          </div>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Create your account
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Join FieldSync — your team lead will assign your project.
        </p>
      </div>

      {/* API error */}
      {error && (
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
            Account created! Redirecting to verification…
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Full Name */}
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-xs font-medium text-foreground/80">
            Full name <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <Input
              id="name"
              ref={nameRef}
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, name: true }))}
              placeholder="Jane Doe"
              className={fieldClass(name, nameError ?? undefined)}
              disabled={isLoading || success}
            />
          </div>
          {nameError && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              {nameError}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-xs font-medium text-foreground/80">
            Email address <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              placeholder="jane@fieldsync.com"
              className={fieldClass(email, emailError ?? undefined)}
              disabled={isLoading || success}
            />
          </div>
          {emailError && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              {emailError}
            </p>
          )}
        </div>

        {/* Role */}
        <div className="space-y-1.5">
          <Label htmlFor="role" className="text-xs font-medium text-foreground/80">
            I am joining as <span className="text-destructive">*</span>
          </Label>
          <Select
            value={role}
            onValueChange={(v) => setRole(v as typeof role)}
            disabled={isLoading || success}
          >
            <SelectTrigger id="role" className="h-10 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="field_worker" className="text-sm">
                Field Worker — I work on-site
              </SelectItem>
              <SelectItem value="supervisor" className="text-sm">
                Supervisor — I manage projects
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-xs font-medium text-foreground/80">
            Password <span className="text-destructive">*</span>
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
              className={cn(fieldClass(password, passwordError ?? undefined), "pr-10")}
              disabled={isLoading || success}
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

          {/* Password requirements checklist */}
          {password && (
            <div className="bg-muted/40 rounded-lg px-3 py-2.5 space-y-1.5 mt-1">
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
                  <span className={cn("text-xs", met ? "text-green-600 dark:text-green-400" : "text-muted-foreground")}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          )}

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
            Confirm password <span className="text-destructive">*</span>
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
              placeholder="Re-enter your password"
              className={cn(
                fieldClass(confirmPassword, confirmError ?? undefined),
                "pr-10",
                confirmPassword && !confirmError
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

        {/* Terms */}
        <div className="pt-1 space-y-1">
          <div className="flex items-start gap-2.5">
            <Checkbox
              id="terms"
              checked={acceptedTerms}
              onCheckedChange={(v) => {
                setAcceptedTerms(v === true);
                if (v) setTermsError(false);
              }}
              disabled={isLoading || success}
              className={cn(
                "mt-0.5 h-3.5 w-3.5",
                termsError && "border-destructive"
              )}
            />
            <Label
              htmlFor="terms"
              className="text-xs text-muted-foreground cursor-pointer select-none leading-relaxed"
            >
              I agree to the{" "}
              <Link
                href="/terms"
                className="text-primary hover:text-primary/80 underline-offset-2 hover:underline"
                target="_blank"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="text-primary hover:text-primary/80 underline-offset-2 hover:underline"
                target="_blank"
              >
                Privacy Policy
              </Link>
            </Label>
          </div>
          {termsError && (
            <p className="text-xs text-destructive flex items-center gap-1 pl-6">
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              You must accept the terms to continue.
            </p>
          )}
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
              Creating account…
            </>
          ) : success ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              Account created!
            </>
          ) : (
            <>
              Create account
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </Button>
      </form>

      {/* Footer */}
      <div className="mt-6 pt-5 border-t border-border/60">
        <p className="text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-primary hover:text-primary/80 font-medium transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

