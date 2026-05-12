import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const GUEST_ONLY = ["/", "/landing", "/login", "/register", "/forgot-password", "/reset-password", "/verify-otp"];

const PUBLIC_ROUTES = ["/", "/landing", "/unauthorized", "/api/auth/login", "/api/auth/refresh", "/api/auth/csrf", "/api/auth/register", "/api/auth/verify-otp", "/api/auth/resend-otp", "/api/auth/forgot-password", "/api/auth/reset-password"];

const ROLE_ROUTES: Record<string, string[]> = {
  admin: ["/dashboard", "/supervisor", "/teamleader", "/user"],
  supervisor: ["/supervisor"],
  team_leader: ["/teamleader"],
  field_agent: ["/user"],
};

const ROLE_HOME: Record<string, string> = {
  admin: "/dashboard",
  supervisor: "/supervisor",
  team_leader: "/teamleader",
  field_agent: "/user",
};

function decodeJwtEdge(token: string): { role?: string; exp?: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    let payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (payload.length % 4) payload += "=";
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes — always allow
  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  // API routes — let backend handle auth; proxy only enforces for pages
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const token = request.cookies.get("fs_access_token")?.value;

  if (GUEST_ONLY.some((r) => pathname.startsWith(r))) {
    if (token) {
      const payload = decodeJwtEdge(token);
      if (payload?.role && payload.exp && payload.exp > Math.floor(Date.now() / 1000) + 30) {
        return NextResponse.redirect(new URL(ROLE_HOME[payload.role] ?? "/", request.url));
      }
    }
    return NextResponse.next();
  }

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("reason", "unauthenticated");
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const payload = decodeJwtEdge(token);
  if (!payload || !payload.exp || payload.exp < Math.floor(Date.now() / 1000) + 30) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("reason", "token_expired");
    loginUrl.searchParams.set("callbackUrl", pathname);
    const res = NextResponse.redirect(loginUrl);
    res.cookies.delete("fs_access_token");
    return res;
  }

  const role = payload.role;
  if (!role || !ROLE_ROUTES[role]) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  if (!ROLE_ROUTES[role].some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|images|fonts|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)"],
};
