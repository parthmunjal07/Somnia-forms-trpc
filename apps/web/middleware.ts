import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Presence-check only — does NOT cryptographically verify JWT.
// Full verification happens on the API server for each tRPC call.
export function middleware(request: NextRequest) {
  const hasAccessToken = request.cookies.has("access_token");
  const hasRefreshToken = request.cookies.has("refresh_token");

  const isAuthenticated = hasAccessToken || hasRefreshToken;

  if (!isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Only protect dashboard routes; leave public routes untouched
  matcher: ["/dashboard/:path*"],
};
