// ============================================================
// FieldSync – XSS Sanitization
// Prevents Cross-Site Scripting attacks in user-generated content
// Uses DOMPurify where available, falls back to manual escaping
// ============================================================

// DOMPurify is a peer dependency — install it:
// npm install dompurify
// npm install --save-dev @types/dompurify

let DOMPurify: (typeof import("dompurify").default) | null = null;

// Lazy-load DOMPurify (client-side only)
async function loadDOMPurify() {
  if (typeof window === "undefined") return null;
  if (DOMPurify) return DOMPurify;

  try {
    const mod = await import("dompurify");
    DOMPurify = mod.default;
    return DOMPurify;
  } catch {
    console.warn("[Security] DOMPurify not available. Using fallback sanitizer.");
    return null;
  }
}

// ─── Strict config for DOMPurify ─────────────────────────────
const PURIFY_CONFIG = {
  ALLOWED_TAGS: ["b", "i", "em", "strong", "span", "br", "p"],
  ALLOWED_ATTR: [],  // No attributes allowed
  FORBID_ATTR: ["style", "class", "id", "onerror", "onload"],
  FORBID_TAGS: ["script", "object", "embed", "iframe", "form", "input"],
} as const;

// ─── HTML Entity Escaping (synchronous fallback) ──────────────
function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

// ─── Sanitize HTML string (async — preferred) ─────────────────
export async function sanitizeHtml(dirty: string): Promise<string> {
  if (typeof window === "undefined") {
    return escapeHtml(dirty);
  }

  const purify = await loadDOMPurify();
  if (!purify) return escapeHtml(dirty);

  // @ts-ignore — DOMPurify types can vary by version
  return purify.sanitize(dirty, PURIFY_CONFIG);
}

// ─── Synchronous sanitize (for direct React render use) ───────
// Use ONLY for text content — not for dangerouslySetInnerHTML
export function sanitizeText(input: string): string {
  if (!input || typeof input !== "string") return "";
  return escapeHtml(input.trim());
}

// ─── Strip all HTML tags ──────────────────────────────────────
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

// ─── Sanitize URLs (prevent javascript: hrefs) ────────────────
export function sanitizeUrl(url: string): string {
  if (!url) return "#";

  const trimmed = url.trim().toLowerCase();

  // Block dangerous protocols
  const dangerousProtocols = [
    "javascript:",
    "data:",
    "vbscript:",
    "file:",
    "blob:",
  ];

  if (dangerousProtocols.some((proto) => trimmed.startsWith(proto))) {
    console.warn("[Security] Blocked dangerous URL:", url);
    return "#";
  }

  return url;
}

// ─── Sanitize object keys and values ─────────────────────────
// Useful before storing user-provided data
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      result[key] = sanitizeText(value);
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      result[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }

  return result as T;
}

// ─── React safe render helper ─────────────────────────────────
// Instead of: <div dangerouslySetInnerHTML={{ __html: userContent }} />
// Use: <div>{safeText(userContent)}</div>
// For HTML content that genuinely needs rendering, use sanitizeHtml() async
export function safeText(input: unknown): string {
  if (typeof input !== "string") return String(input ?? "");
  return sanitizeText(input);
}

// ─── Log security events (dev only) ──────────────────────────
export function logSecurityEvent(event: string, detail?: unknown): void {
  if (process.env.NODE_ENV === "development") {
    console.warn(`[Security Event] ${event}`, detail ?? "");
  }
  // In production: send to monitoring service
  // analytics.track("security_event", { event, ...detail });
}
