import User from "@/models/users";
import UserSession from "@/models/userSessions";
import getUserFromCookie from "@/helpers/getUserFromCookie";
import { logUserActivity } from "@/helpers/userActivityLogger";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID, createHash } from "crypto";
import { TUser } from "@/types/types";
import { ServiceError } from "./serviceError";
import { getPermissionsForRole } from "./roleService";

type TAuthPayload = {
  id: string;
  username: string;
  role: string;
  tokenType: "access";
};

type TRefreshPayload = {
  id: string;
  username: string;
  role: string;
  tokenType: "refresh";
  sid: string;
  fid: string;
};

type TTokenPair = {
  accessToken: string;
  refreshToken: string;
};

type TSessionView = {
  id: string;
  userAgent: string;
  ipAddress: string;
  createdAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
  isCurrent: boolean;
};

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL = "30d";
const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new ServiceError("Missing JWT secret", 500);
  }

  return secret;
}

function createAccessToken(payload: TAuthPayload) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: ACCESS_TOKEN_TTL });
}

function createRefreshToken(payload: TRefreshPayload) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: REFRESH_TOKEN_TTL });
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function getExpiryDateFromToken(token: string): Date {
  const decoded = jwt.decode(token) as { exp?: number } | null;
  if (!decoded?.exp) {
    throw new ServiceError("Invalid token expiry", 500);
  }

  return new Date(decoded.exp * 1000);
}

function getRequestMeta(request?: NextRequest) {
  if (!request) {
    return { ipAddress: "", userAgent: "" };
  }

  const ipAddress =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "";
  const userAgent = request.headers.get("user-agent") || "";

  return { ipAddress, userAgent };
}

function setAuthCookies(
  response: NextResponse,
  tokens: TTokenPair,
  _role: string
) {
  const isProduction = process.env.NODE_ENV === "production";

  response.cookies.set("auth", tokens.accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
  });

  response.cookies.set("refresh", tokens.refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
  });
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
}

async function createSessionAndTokens(
  user: {
    _id: string;
    username: string;
    role: string;
  },
  request?: NextRequest,
  familyId?: string
): Promise<TTokenPair> {
  const tokenFamilyId = familyId || randomUUID();
  const session = new UserSession({
    user: user._id,
    tokenHash: "",
    familyId: tokenFamilyId,
    userAgent: "",
    ipAddress: "",
    expiresAt: new Date(),
  });

  const refreshToken = createRefreshToken({
    id: user._id.toString(),
    username: user.username,
    role: user.role,
    tokenType: "refresh",
    sid: session._id.toString(),
    fid: tokenFamilyId,
  });

  const accessToken = createAccessToken({
    id: user._id.toString(),
    username: user.username,
    role: user.role,
    tokenType: "access",
  });

  const { ipAddress, userAgent } = getRequestMeta(request);
  session.tokenHash = hashToken(refreshToken);
  session.expiresAt = getExpiryDateFromToken(refreshToken);
  session.ipAddress = ipAddress;
  session.userAgent = userAgent;
  await session.save();

  return { accessToken, refreshToken };
}

async function revokeRefreshSession(refreshToken?: string) {
  if (!refreshToken) {
    return null;
  }

  try {
    const payload = jwt.verify(refreshToken, getJwtSecret()) as TRefreshPayload;
    if (payload.tokenType !== "refresh") {
      return null;
    }

    await UserSession.findByIdAndUpdate(payload.sid, {
      revokedAt: new Date(),
    });

    return payload;
  } catch {
    // ignore invalid/expired token on logout paths
    return null;
  }
}

function decodeRefreshPayloadFromRequest(request: NextRequest): TRefreshPayload | null {
  const refreshToken = request.cookies.get("refresh")?.value;
  if (!refreshToken) {
    return null;
  }

  try {
    const payload = jwt.verify(refreshToken, getJwtSecret()) as TRefreshPayload;
    if (payload.tokenType !== "refresh") {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function revokeAllSessionsForUser(userId: string) {
  await UserSession.updateMany(
    { user: userId, revokedAt: null },
    { revokedAt: new Date() }
  );
}

export async function listCurrentUserSessions(
  request: NextRequest
): Promise<TSessionView[]> {
  const userId = await getUserFromCookie(request);
  const currentRefresh = decodeRefreshPayloadFromRequest(request);

  const sessions = await UserSession.find({ user: userId })
    .sort({ createdAt: -1 })
    .select("_id userAgent ipAddress createdAt expiresAt revokedAt");

  return sessions.map((session: any) => ({
    id: session._id.toString(),
    userAgent: session.userAgent || "",
    ipAddress: session.ipAddress || "",
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
    revokedAt: session.revokedAt || null,
    isCurrent: currentRefresh?.sid === session._id.toString(),
  }));
}

export async function revokeCurrentUserSessionById(
  request: NextRequest,
  sessionId: string
): Promise<{ isCurrentSession: boolean }> {
  const userId = await getUserFromCookie(request);
  const currentRefresh = decodeRefreshPayloadFromRequest(request);

  const session = await UserSession.findOne({ _id: sessionId, user: userId });
  if (!session) {
    throw new ServiceError("Session not found", 404);
  }

  await UserSession.findByIdAndUpdate(sessionId, { revokedAt: new Date() });

  await logUserActivity({
    targetUserId: userId,
    performedById: userId,
    action: "session_revoke",
    details: { sessionId },
    request,
  });

  return {
    isCurrentSession: currentRefresh?.sid === sessionId,
  };
}

function buildUnauthorizedResponse(message: string, status: number = 401) {
  const response = NextResponse.json({ error: message }, { status });
  clearAuthCookies(response);
  return response;
}

export function buildLoginResponse(
  tokens: TTokenPair,
  role: string
) {
  const response = NextResponse.json({
    message: "Login successfull",
    success: true,
  });

  setAuthCookies(response, tokens, role);
  return response;
}

export async function rotateRefreshToken(request: NextRequest) {
  const currentRefreshToken = request.cookies.get("refresh")?.value;
  if (!currentRefreshToken) {
    throw new ServiceError("Refresh token missing", 401);
  }

  let payload: TRefreshPayload;
  try {
    payload = jwt.verify(currentRefreshToken, getJwtSecret()) as TRefreshPayload;
  } catch {
    throw new ServiceError("Invalid refresh token", 401);
  }

  if (payload.tokenType !== "refresh" || !payload.sid || !payload.fid) {
    throw new ServiceError("Invalid refresh token payload", 401);
  }

  const session = await UserSession.findById(payload.sid);
  if (!session) {
    throw new ServiceError("Session not found", 401);
  }

  if (session.tokenHash !== hashToken(currentRefreshToken)) {
    await UserSession.updateMany(
      { user: session.user, familyId: session.familyId, revokedAt: null },
      { revokedAt: new Date() }
    );

    await logUserActivity({
      targetUserId: payload.id,
      performedById: payload.id,
      action: "auth_denied",
      details: { reason: "refresh_reuse_detected" },
      request,
    });

    throw new ServiceError("Refresh token reuse detected", 401);
  }

  if (session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
    throw new ServiceError("Session expired", 401);
  }

  const user = await User.findOne({ _id: payload.id, published: true }).select(
    "username role"
  );
  if (!user) {
    throw new ServiceError("User not found", 401);
  }

  const tokens = await createSessionAndTokens(
    {
      _id: user._id.toString(),
      username: user.username,
      role: user.role,
    },
    request,
    session.familyId
  );

  const nextSessionHash = hashToken(tokens.refreshToken);
  const nextSession = await UserSession.findOne({ tokenHash: nextSessionHash });

  await UserSession.findByIdAndUpdate(session._id, {
    revokedAt: new Date(),
    replacedBySessionId: nextSession?._id || null,
  });

  await logUserActivity({
    targetUserId: user._id.toString(),
    performedById: user._id.toString(),
    action: "token_refresh",
    details: { previousSessionId: session._id.toString() },
    request,
  });

  return {
    tokens,
    role: user.role as string,
  };
}

export async function loginUser(
  username?: string,
  password?: string,
  request?: NextRequest
) {
  if (!username || !password) {
    throw new ServiceError("Username and password are required", 400);
  }

  const existingUser = await User.findOne({ username, published: true });
  if (!existingUser) {
    throw new ServiceError("user isn't available", 400);
  }

  if (existingUser.lockUntil && existingUser.lockUntil.getTime() > Date.now()) {
    await logUserActivity({
      targetUserId: existingUser._id.toString(),
      performedById: existingUser._id.toString(),
      action: "auth_denied",
      details: { reason: "account_locked" },
      request,
    });

    throw new ServiceError("Account temporarily locked. Try again later", 423);
  }

  const validPassword = await bcryptjs.compare(password, existingUser.password);
  if (!validPassword) {
    const nextFailedCount = (existingUser.failedLoginCount || 0) + 1;
    const shouldLock = nextFailedCount >= MAX_FAILED_LOGIN_ATTEMPTS;

    await User.findByIdAndUpdate(existingUser._id, {
      failedLoginCount: shouldLock ? 0 : nextFailedCount,
      lockUntil: shouldLock ? new Date(Date.now() + LOCK_DURATION_MS) : null,
    });

    await logUserActivity({
      targetUserId: existingUser._id.toString(),
      performedById: existingUser._id.toString(),
      action: "auth_denied",
      details: { reason: shouldLock ? "invalid_password_lockout" : "invalid_password" },
      request,
    });

    throw new ServiceError("Invalid Password", 400);
  }

  await User.findByIdAndUpdate(existingUser._id, {
    failedLoginCount: 0,
    lockUntil: null,
  });

  const tokens = await createSessionAndTokens(
    {
      _id: existingUser._id.toString(),
      username: existingUser.username,
      role: existingUser.role,
    },
    request
  );

  await logUserActivity({
    targetUserId: existingUser._id.toString(),
    performedById: existingUser._id.toString(),
    action: "login",
    request,
  });

  return {
    tokens,
    role: existingUser.role,
  };
}

export async function getCurrentUserFromRequest(request: NextRequest) {
  const userId = await getUserFromCookie(request);
  const user = await User.findOne({ _id: userId, published: true }).select(
    "username fullname role"
  );

  if (!user) {
    throw new ServiceError("No user found", 404);
  }

  const permissions = await getPermissionsForRole(user.role);

  return {
    _id: user._id,
    username: user.username,
    fullname: user.fullname,
    role: user.role,
    permissions,
  };
}

export async function signupUser(payload: TUser) {
  const { username, password, role, fullname } = payload;

  if (!username || !password) {
    throw new ServiceError("Username and password are required", 400);
  }

  const existingUserName: TUser | null = await User.findOne({ username });
  if (existingUserName) {
    throw new ServiceError("username isn't available", 400);
  }

  const salt = await bcryptjs.genSalt(10);
  const hashedPassword = await bcryptjs.hash(password, salt);

  const newUser = new User({
    username,
    password: hashedPassword,
    role,
    fullname,
    failedLoginCount: 0,
    lockUntil: null,
  });

  return newUser.save();
}

export async function createLogoutResponse(request?: NextRequest) {
  const refreshToken = request?.cookies.get("refresh")?.value;
  const payload = await revokeRefreshSession(refreshToken);

  if (payload && request) {
    await logUserActivity({
      targetUserId: payload.id,
      performedById: payload.id,
      action: "logout",
      request,
    });
  }

  const response = new NextResponse(
    JSON.stringify({
      message: "Logout Successful",
      success: true,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );

  clearAuthCookies(response);

  return response;
}

export async function createLogoutAllResponse(request: NextRequest) {
  const userId = await getUserFromCookie(request);
  await revokeAllSessionsForUser(userId);

  await logUserActivity({
    targetUserId: userId,
    performedById: userId,
    action: "logout_all",
    request,
  });

  const response = new NextResponse(
    JSON.stringify({
      message: "Logged out from all sessions",
      success: true,
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );

  clearAuthCookies(response);
  return response;
}

export function createRefreshDeniedResponse(message: string, status = 401) {
  return buildUnauthorizedResponse(message, status);
}

export async function changeAuthenticatedUserPassword(
  userId: string,
  currentPassword?: string,
  newPassword?: string,
  request?: NextRequest
) {
  if (!currentPassword || !newPassword) {
    throw new ServiceError("Current password and new password are required", 400);
  }

  if (newPassword.length < 6) {
    throw new ServiceError("New password must be at least 6 characters long", 400);
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ServiceError("User not found", 404);
  }

  const isCurrentPasswordValid = await bcryptjs.compare(
    currentPassword,
    user.password
  );

  if (!isCurrentPasswordValid) {
    throw new ServiceError("Current password is incorrect", 400);
  }

  const isSamePassword = await bcryptjs.compare(newPassword, user.password);
  if (isSamePassword) {
    throw new ServiceError(
      "New password must be different from current password",
      400
    );
  }

  const salt = await bcryptjs.genSalt(10);
  const hashedNewPassword = await bcryptjs.hash(newPassword, salt);

  await User.findByIdAndUpdate(userId, {
    password: hashedNewPassword,
    passwordChangedAt: new Date(),
  });

  await revokeAllSessionsForUser(userId);

  await logUserActivity({
    targetUserId: userId,
    performedById: userId,
    action: "password_change",
    details: { reason: "Self password change" },
    request,
  });
}
