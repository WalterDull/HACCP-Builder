import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Session-gating for the wizard/dashboard, plus a lightweight rate limit on
// the auth-related endpoints (login attempts and account creation).
//
// Note: this rate limiter uses an in-memory Map, so it only protects a
// single running instance. That's fine for a single Render web service
// (the default setup in DEPLOYMENT.md). If you scale to more than one
// instance, replace this with a shared store (e.g. Upstash Redis).

const WINDOW_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const hits = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  if (entry.count > MAX_ATTEMPTS) return true;
  return false;
}

function sweep() {
  const now = Date.now();
  for (const [key, entry] of hits) {
    if (now > entry.resetAt) hits.delete(key);
  }
}

const RATE_LIMITED_PATHS = ["/api/register", "/api/auth/callback/credentials"];
const PROTECTED_PREFIXES = ["/dashboard", "/plans"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (RATE_LIMITED_PATHS.some((p) => pathname.startsWith(p))) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
    const key = `${pathname}:${ip}`;
    if (Math.random() < 0.05) sweep();
    if (isRateLimited(key)) {
      return NextResponse.json(
        { error: "Too many attempts. Please wait a few minutes and try again." },
        { status: 429 }
      );
    }
  }

  if (PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/plans/:path*", "/api/register", "/api/auth/callback/credentials"],
};
