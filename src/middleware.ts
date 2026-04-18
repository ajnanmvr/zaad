import { NextRequest, NextResponse } from "next/server";

const CSRF_COOKIE = "csrf-token";
const CSRF_HEADER = "x-csrf-token";

function getJwtExpiry(token: string) {
  if (!token) {
    return null;
  }

  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) {
      return null;
    }

    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const payload = JSON.parse(atob(padded)) as { exp?: number };

    return payload?.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

function isExpiredToken(token: string) {
  const expiryMs = getJwtExpiry(token);
  if (!expiryMs) {
    return true;
  }

  return expiryMs <= Date.now();
}

function clearAuthCookies(response: NextResponse) {
  const isProduction = process.env.NODE_ENV === "production";

  response.cookies.set("auth", "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });

  response.cookies.set("refresh", "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });

  return response;
}

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

  const accessToken = request.cookies.get("auth")?.value || "";
  const refreshToken = request.cookies.get("refresh")?.value || "";
  const hasValidAccess = Boolean(accessToken) && !isExpiredToken(accessToken);
  const hasValidRefresh = Boolean(refreshToken) && !isExpiredToken(refreshToken);

  const shouldForceLogout =
    (Boolean(accessToken) && !hasValidAccess) &&
    (!refreshToken || !hasValidRefresh);

  if (shouldForceLogout) {
    const response = isPublicPath
      ? NextResponse.next()
      : NextResponse.redirect(new URL("/login", request.nextUrl));
    return withCsrfCookie(request, clearAuthCookies(response));
  }

  if (isPublicPath && (hasValidAccess || hasValidRefresh)) {
    return withCsrfCookie(request, NextResponse.redirect(new URL("/", request.nextUrl)));
  }

  if (!isPublicPath && !hasValidAccess && !hasValidRefresh) {
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
