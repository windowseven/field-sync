// ============================================================
// FieldSync – Auth API Service
// Centralised fetch wrappers for all auth endpoints
// FILE: lib/auth/authApi.ts
// ============================================================

// ─── Shapes ──────────────────────────────────────────────────

export interface RegisterPayload {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role?: "field_agent" | "supervisor";
}

export interface RegisterResponse {
  message: string;
  email: string;            // echoed back (possibly masked) for OTP page
  userId: string;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
  context?: "registration" | "password_reset";  // tells backend which OTP bucket
}

export interface VerifyOtpResponse {
  message: string;
  resetToken?: string;      // returned only for password_reset context
}

export interface ResendOtpPayload {
  email: string;
  context?: "registration" | "password_reset";
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  password: string;
}

export interface ResetPasswordResponse {
  message: string;
}

// ─── Generic error ────────────────────────────────────────────

export class AuthApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = "AuthApiError";
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new AuthApiError(
      res.status,
      json?.message ?? "An unexpected error occurred. Please try again.",
      json?.code
    );
  }

  return json as T;
}

// ─── Endpoints ────────────────────────────────────────────────

export const authApi = {
  /**
   * POST /api/auth/register
   * Creates a new inactive account and triggers OTP email/SMS.
   */
  async register(payload: RegisterPayload): Promise<RegisterResponse> {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleResponse<RegisterResponse>(res);
  },

  /**
   * POST /api/auth/verify-otp
   * Verifies the 6-digit OTP sent to email/phone.
   * For registration: activates account.
   * For password_reset: returns a short-lived resetToken.
   */
  async verifyOtp(payload: VerifyOtpPayload): Promise<VerifyOtpResponse> {
    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleResponse<VerifyOtpResponse>(res);
  },

  /**
   * POST /api/auth/resend-otp
   * Sends a fresh OTP (rate-limited by backend).
   */
  async resendOtp(payload: ResendOtpPayload): Promise<{ message: string }> {
    const res = await fetch("/api/auth/resend-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleResponse<{ message: string }>(res);
  },

  /**
   * POST /api/auth/forgot-password
   * Triggers OTP/reset-link email for the given address.
   * Always returns success message (no email enumeration).
   */
  async forgotPassword(
    payload: ForgotPasswordPayload
  ): Promise<ForgotPasswordResponse> {
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleResponse<ForgotPasswordResponse>(res);
  },

  /**
   * POST /api/auth/reset-password
   * Sets a new password using the OTP + email pair.
   */
  async resetPassword(
    payload: ResetPasswordPayload
  ): Promise<ResetPasswordResponse> {
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleResponse<ResetPasswordResponse>(res);
  },
};
