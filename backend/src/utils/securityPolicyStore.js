/**
 * Security policy defaults and env-based configuration.
 *
 * Design:
 * - Passwords: minimum 8 chars with uppercase + number. No expiry or history (field workers rotate often).
 * - Sessions: access token expiry controlled by JWT_EXPIRES_IN env var (default 24h). Refresh tokens last 7 days.
 *   maxDevices=0 means unlimited — no device limit enforced.
 * - Rate limits: per-auth-endpoint limits (10 login attempts, 3 OTP attempts per 15min window).
 *   Global API limit is 200 requests per 15min window. Invite validation is separate (10 per 5min).
 * - Optional features: email verification, 2FA, geo-restriction all disabled by default.
 *   AllowedCountries: [] empty = no geo enforcement.
 */
function parseDurationToHours(value, fallbackHours) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return fallbackHours;
  }

  const match = value.trim().match(/^(\d+)([smhd])$/i);
  if (!match) {
    const numeric = Number(value);
    return Number.isFinite(numeric) && numeric > 0 ? numeric : fallbackHours;
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();

  if (unit === 's') return amount / 3600;
  if (unit === 'm') return amount / 60;
  if (unit === 'h') return amount;
  if (unit === 'd') return amount * 24;

  return fallbackHours;
}

export function getSecurityPolicies() {
  const accessTokenExpiryHours = parseDurationToHours(process.env.JWT_EXPIRES_IN || '24h', 24);

  return {
    password: {
      minLength: 8,
      requireUppercase: true,
      requireNumbers: true,
      requireSymbols: false,
      maxAgeDays: 0,
      historyCount: 0,
    },
    session: {
      accessTokenExpiryHours,
      refreshTokenExpiryDays: 7,
      maxDevices: 0,
      forceLogoutOnSuspicion: false,
      requireReauthOnSensitive: false,
    },
    rateLimits: {
      loginAttempts: 10,
      otpAttempts: 3,
      lockoutDurationMinutes: 15,
      globalApiLimit: 200,
      globalWindowMinutes: 15,
      inviteValidationLimit: 10,
      inviteValidationWindow: 5,
    },
    other: {
      emailVerificationRequired: false,
      twoFactorEnabled: false,
      geoRestrictionEnabled: false,
      allowedCountries: [],
    },
  };
}
