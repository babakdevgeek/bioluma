/**
 * Fixed-window rate limiting on KV. Not exact under heavy concurrency, which is
 * fine: the goal is to make credential stuffing and form spam expensive, not to
 * meter a paid API.
 */
import type { Env } from "../types";

export interface RateResult {
  ok: boolean;
  remaining: number;
  retryAfter: number;
}

export async function consume(
  env: Env,
  bucket: string,
  limit: number,
  windowSeconds: number,
): Promise<RateResult> {
  const window = Math.floor(Date.now() / 1000 / windowSeconds);
  const key = `rl:${bucket}:${window}`;

  const current = Number((await env.SESSIONS.get(key)) ?? 0);
  const next = current + 1;

  if (next > limit) {
    const elapsed = Math.floor(Date.now() / 1000) % windowSeconds;
    return { ok: false, remaining: 0, retryAfter: windowSeconds - elapsed };
  }

  await env.SESSIONS.put(key, String(next), { expirationTtl: windowSeconds + 60 });
  return { ok: true, remaining: limit - next, retryAfter: 0 };
}

export function clientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}
