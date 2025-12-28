import { NextRequest, NextResponse } from "next/server";
export function middleware(request: NextRequest) {

  const path = request.nextUrl.pathname;
  const isPublicPath = path === "/login";
  // Restrict specific partner-only areas if needed
  const isPartnerPath = path.startsWith("/accounts/transactions");

  const token = request.cookies.get("auth")?.value || "";
  const partner = request.cookies.get("partner")?.value || "";

  if (isPublicPath && token) {
    return NextResponse.redirect(new URL("/", request.nextUrl));
  }
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }
  if (isPartnerPath && !partner) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }
  // Continue normally when no redirects are applied
  return NextResponse.next();
}
export const config = {
  matcher: [
    "/accounts/:path*",
    "/company/:path*",
    "/employee/:path*",
    "/dashboard/:path*",
    "/settings/:path*",
    "/users/:path*",
    "/home/:path*",
    "/login",
    "/",
  ],
};
