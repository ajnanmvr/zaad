import { NextRequest, NextResponse } from "next/server";
export function middleware(request: NextRequest) {

  const path = request.nextUrl.pathname;
  const isPublicPath = path === "/login";
  const isPartnerPath = path.includes("transactions");

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
}
export const config = {
  matcher: [
    "/accounts/:path*",
    "/company/:path*",
    "/employee/:path*",
    "/login",
    "/",
  ],
};
