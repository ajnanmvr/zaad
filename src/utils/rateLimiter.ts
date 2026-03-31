import { redis } from "@/db/redis";

export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number; retryAfter: number }> {
  try {
    const redisKey = `rate-limit:${key}`;
    const windowSec = Math.max(1, Math.ceil(windowMs / 1000));

    const count = await redis.incr(redisKey);
    if (count === 1) {
      await redis.expire(redisKey, windowSec);
    }

    const ttl = await redis.ttl(redisKey);
    const retryAfter = ttl > 0 ? ttl : windowSec;

    if (count > limit) {
      return {
        allowed: false,
        remaining: 0,
        retryAfter,
      };
    }

    return {
      allowed: true,
      remaining: Math.max(0, limit - count),
      retryAfter,
    };
  } catch {
    // Fail-open if Redis is temporarily unavailable.
    return {
      allowed: true,
      remaining: limit - 1,
      retryAfter: Math.max(1, Math.ceil(windowMs / 1000)),
    };
  }
}

export function getRequestRateLimitKey(
  request: Request,
  scope: string
): string {
  const ip =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown-ip";

  return `${scope}:${ip}`;
}
