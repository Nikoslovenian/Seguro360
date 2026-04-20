import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types/api";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key);
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  limit: number;          // max requests
  windowSeconds: number;  // time window
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: config.limit - 1, resetAt: now + windowMs };
  }

  entry.count++;
  if (entry.count > config.limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  return { allowed: true, remaining: config.limit - entry.count, resetAt: entry.resetAt };
}

export function rateLimitResponse(resetAt: number): NextResponse {
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
  return NextResponse.json<ApiResponse>(
    { success: false, error: "Demasiadas solicitudes. Intenta nuevamente en unos momentos." },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfter) },
    },
  );
}

// Preset configurations
export const RATE_LIMITS = {
  chat: { limit: 20, windowSeconds: 60 },
  simulate: { limit: 10, windowSeconds: 60 },
  auth: { limit: 5, windowSeconds: 60 },
  general: { limit: 100, windowSeconds: 60 },
} as const;
