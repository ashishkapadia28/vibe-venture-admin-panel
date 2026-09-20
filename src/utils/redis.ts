import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

/**
 * Upstash Redis (REST-based, no persistent TCP connection — safe for a
 * serverless/edge-friendly host like Render or Vercel functions).
 *
 * Every export here is deliberately fail-open: if the env vars aren't set,
 * or Upstash is unreachable, callers get `null`/skip-cache instead of a
 * thrown error. Redis is a *robustness* add-on for this app, not a hard
 * dependency — it should never be the thing that takes the site down.
 */

/** Shared key for the public (unauthenticated) GET /api/jobs response —
 *  read by src/app/api/jobs/route.ts, invalidated by every write in
 *  jobs/route.ts and jobs/[id]/route.ts so admin edits show up immediately
 *  instead of waiting out the cache TTL. */
export const PUBLIC_JOBS_CACHE_KEY = "cache:jobs:public";
export const PUBLIC_JOBS_CACHE_TTL_SECONDS = 60;

let redis: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redis !== undefined) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn("[redis] UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN not set — caching and rate limiting are disabled.");
    redis = null;
    return redis;
  }

  redis = new Redis({ url, token });
  return redis;
}

let applicationsLimiter: Ratelimit | null | undefined;

/** 5 applications per hour per identifier (IP). Returns null if Redis isn't configured. */
export function getApplicationsRateLimiter(): Ratelimit | null {
  if (applicationsLimiter !== undefined) return applicationsLimiter;

  const client = getRedis();
  if (!client) {
    applicationsLimiter = null;
    return applicationsLimiter;
  }

  applicationsLimiter = new Ratelimit({
    redis: client,
    limiter: Ratelimit.slidingWindow(5, "1 h"),
    analytics: true,
    prefix: "ratelimit:applications",
  });
  return applicationsLimiter;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getRedis();
  if (!client) return null;
  try {
    return await client.get<T>(key);
  } catch (err) {
    console.error(`[redis] cacheGet("${key}") failed, continuing without cache:`, err);
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const client = getRedis();
  if (!client) return;
  try {
    await client.set(key, value, { ex: ttlSeconds });
  } catch (err) {
    console.error(`[redis] cacheSet("${key}") failed:`, err);
  }
}

export async function cacheDel(key: string): Promise<void> {
  const client = getRedis();
  if (!client) return;
  try {
    await client.del(key);
  } catch (err) {
    console.error(`[redis] cacheDel("${key}") failed:`, err);
  }
}
