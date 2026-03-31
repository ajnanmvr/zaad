import { NextRequest, NextResponse } from "next/server";

const CSRF_COOKIE = "csrf-token";
const CSRF_HEADER = "x-csrf-token";

function withCsrfCookie(request: NextRequest, response: NextResponse) {
  const existing = request.cookies.get(CSRF_COOKIE)?.value;
  if (existing) {
    return response;
  }

  response.cookies.set(CSRF_COOKIE, crypto.randomUUID(), {
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return response;
}

export function middleware(request: NextRequest) {

  const path = request.nextUrl.pathname;
  const isPublicPath = path === "/login";

  if (path.startsWith("/api")) {
    const method = request.method.toUpperCase();
    const isMutation = !["GET", "HEAD", "OPTIONS"].includes(method);

    if (isMutation) {
      const csrfCookie = request.cookies.get(CSRF_COOKIE)?.value || "";
      const csrfHeader =
        request.headers.get(CSRF_HEADER) ||
        request.headers.get("x-xsrf-token") ||
        "";

      if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
        return NextResponse.json({ error: "CSRF validation failed" }, { status: 403 });
      }
    }

    return withCsrfCookie(request, NextResponse.next());
  }

  const token = request.cookies.get("auth")?.value || "";

  if (isPublicPath && token) {
    return withCsrfCookie(request, NextResponse.redirect(new URL("/", request.nextUrl)));
  }

  if (!isPublicPath && !token) {
    return withCsrfCookie(request, NextResponse.redirect(new URL("/login", request.nextUrl)));
  }

  return withCsrfCookie(request, NextResponse.next());
}
export const config = {
  matcher: [
    "/api/:path*",
    "/accounts/:path*",
    "/company/:path*",
    "/documents/:path*",
    "/employee/:path*",
    "/individual/:path*",
    "/settings/:path*",
    "/users/:path*",
    "/login",
    "/",
  ],
};
