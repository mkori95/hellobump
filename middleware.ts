// middleware.ts — Edge Runtime
// Double-layer protection for authenticated routes:
//   1. Middleware (this file) — fast redirect at the edge
//   2. Server-side getServerSession in each page.tsx — fallback if edge cookie differs
//
// Also sets Cache-Control: no-store on every protected page response. Without
// this, the browser's back-forward cache (bfcache) can restore a fully
// rendered authenticated page after Log out + Back — no new request fires,
// so neither this middleware nor the page's own session check ever runs.
// no-store tells the browser not to keep that render around at all.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PROTECTED_PATHS = [
  "/home",
  "/setup",
  "/profile",
  "/appointments",
  "/checkin",
  "/checklists",
  "/activity",
  "/food",
  "/companion",
  "/discover",
  "/names",
];
const AUTH_PATHS = ["/login", "/signup"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName:
      req.headers.get("x-forwarded-proto") === "https"
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token",
  });

  const isAuthed = !!token;
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));

  if (AUTH_PATHS.includes(pathname) && isAuthed) {
    return NextResponse.redirect(new URL("/home", req.url));
  }

  if (isProtected && !isAuthed) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const res = NextResponse.next();
  if (isProtected) {
    res.headers.set("Cache-Control", "no-store, must-revalidate");
  }
  return res;
}

export const config = {
  matcher: [
    "/home",
    "/home/:path*",
    "/setup",
    "/setup/:path*",
    "/profile",
    "/profile/:path*",
    "/appointments",
    "/appointments/:path*",
    "/checkin",
    "/checkin/:path*",
    "/checklists",
    "/checklists/:path*",
    "/activity",
    "/activity/:path*",
    "/food",
    "/food/:path*",
    "/companion",
    "/companion/:path*",
    "/discover",
    "/discover/:path*",
    "/names",
    "/names/:path*",
    "/login",
    "/signup",
  ],
};
