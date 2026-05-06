// ============================================================
// FieldSync – Input Validation
// Client-side form validation with security focus
// Works alongside server-side validation (NEVER replace it)
// ============================================================

// ─── Email ───────────────────────────────────────────────────
export function validateEmail(email: string): string | null {
  if (!email.trim()) return "Email is required.";

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return "Please enter a valid email address.";

  if (email.length > 254) return "Email address is too long.";

  return null;
}

// ─── Password ────────────────────────────────────────────────
export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;   // 0=very weak, 4=strong
  label: string;
  color: string;                // Tailwind color class
  suggestions: string[];
}

export function validatePassword(password: string): string | null {
  if (!password) return "Password is required.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (password.length > 128) return "Password is too long.";
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter.";
  if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter.";
  if (!/\d/.test(password)) return "Password must contain at least one number.";

  return null;
}

export function checkPasswordStrength(password: string): PasswordStrength {
  const suggestions: string[] = [];
  let score = 0;

  if (password.length >= 8) score++;
  else suggestions.push("Use at least 8 characters");

  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  else suggestions.push("Mix uppercase and lowercase letters");

  if (/\d/.test(password)) score++;
  else suggestions.push("Add numbers");

  if (/[^A-Za-z0-9]/.test(password)) score++;
  else suggestions.push("Add special characters (!@#$%)");

  const labels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
  const colors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-blue-500",
    "bg-green-500",
  ];

  return {
    score: score as 0 | 1 | 2 | 3 | 4,
    label: labels[score],
    color: colors[score],
    suggestions,
  };
}

// ─── OTP ─────────────────────────────────────────────────────
export function validateOtp(otp: string): string | null {
  if (!otp.trim()) return "OTP is required.";
  if (!/^\d{6}$/.test(otp)) return "OTP must be exactly 6 digits.";
  return null;
}

// ─── Name ────────────────────────────────────────────────────
export function validateName(name: string): string | null {
  if (!name.trim()) return "Name is required.";
  if (name.trim().length < 2) return "Name must be at least 2 characters.";
  if (name.length > 100) return "Name is too long.";
  // Prevent basic injection attempts in name fields
  if (/<[^>]*>/.test(name)) return "Name contains invalid characters.";
  return null;
}

// ─── Confirm password ────────────────────────────────────────
export function validatePasswordMatch(password: string, confirm: string): string | null {
  if (!confirm) return "Please confirm your password.";
  if (password !== confirm) return "Passwords do not match.";
  return null;
}

// ─── Generic required field ──────────────────────────────────
export function validateRequired(value: string, fieldName = "This field"): string | null {
  if (!value.trim()) return `${fieldName} is required.`;
  return null;
}

// ─── Validate login form ──────────────────────────────────────
export interface LoginFormErrors {
  email?: string;
  password?: string;
}

export function validateLoginForm(
  email: string,
  password: string
): LoginFormErrors {
  const errors: LoginFormErrors = {};

  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;

  if (!password) errors.password = "Password is required.";

  return errors;
}

// ─── Validate register form ───────────────────────────────────
export interface RegisterFormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export function validateRegisterForm(
  name: string,
  email: string,
  password: string,
  confirmPassword: string
): RegisterFormErrors {
  const errors: RegisterFormErrors = {};

  const nameError = validateName(name);
  if (nameError) errors.name = nameError;

  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;

  const passwordError = validatePassword(password);
  if (passwordError) errors.password = passwordError;

  const matchError = validatePasswordMatch(password, confirmPassword);
  if (matchError) errors.confirmPassword = matchError;

  return errors;
}

// ─── Debounce helper (for real-time validation) ──────────────
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  ms: number
): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}
