/**
 * Session authentication.
 *
 * Passwords: PBKDF2-SHA256, 210k iterations, 16-byte per-user salt, stored as
 *   pbkdf2$<iterations>$<salt_b64>$<hash_b64>
 * Comparison is constant time.
 *
 * Sessions: an opaque 32-byte id lives in KV with a sliding TTL. The cookie
 * carries `<id>.<hmac>` so a forged or truncated cookie is rejected before it
 * ever touches KV. Nothing about the user is stored in the cookie itself.
 */
import type { Context } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import type { Session } from "@/shared/types";
import type { AppBindings, Env } from "../types";

const ITERATIONS = 210_000;
const KEY_BITS = 256;
export const COOKIE_NAME = "bl_sess";
const SESSION_TTL = 60 * 60 * 24 * 7; // 7 days
const SLIDING_REFRESH_AFTER = 60 * 60 * 24; // extend once per day of activity

// ------------------------------------------------------------------ encoding

const enc = new TextEncoder();

function b64(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let out = "";
  for (const byte of view) out += String.fromCharCode(byte);
  return btoa(out);
}

function unb64(value: string): Uint8Array {
  const raw = atob(value);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function b64url(bytes: Uint8Array): string {
  return b64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Length-independent, branch-free comparison. */
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  const len = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return diff === 0;
}

// ------------------------------------------------------------------ passwords

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    key,
    KEY_BITS,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt, ITERATIONS);
  return `pbkdf2$${ITERATIONS}$${b64(salt)}$${b64(hash)}`;
}

export async function verifyPassword(record: string, password: string): Promise<boolean> {
  const parts = record.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;

  const iterations = Number(parts[1]);
  if (!Number.isFinite(iterations) || iterations < 10_000) return false;

  try {
    const salt = unb64(parts[2]);
    const expected = unb64(parts[3]);
    const actual = await derive(password, salt, iterations);
    return timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}

// ------------------------------------------------------------------ signing

async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return b64url(new Uint8Array(sig)).slice(0, 32);
}

/** Non-reversible identifier for rate-limit buckets and inquiry logs. */
export async function hashIdentifier(secret: string, value: string): Promise<string> {
  return hmac(secret, `id:${value}`);
}

// ------------------------------------------------------------------ sessions

interface StoredSession extends Session {
  createdAt: number;
  touchedAt: number;
}

export async function createSession(env: Env, user: Session): Promise<string> {
  const id = b64url(crypto.getRandomValues(new Uint8Array(32)));
  const now = Math.floor(Date.now() / 1000);
  const stored: StoredSession = { ...user, createdAt: now, touchedAt: now };

  await env.SESSIONS.put(`sess:${id}`, JSON.stringify(stored), { expirationTtl: SESSION_TTL });
  return `${id}.${await hmac(env.SESSION_SECRET, id)}`;
}

async function readToken(env: Env, token: string): Promise<{ id: string; session: StoredSession } | null> {
  const dot = token.lastIndexOf(".");
  if (dot < 1) return null;

  const id = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = await hmac(env.SESSION_SECRET, id);
  if (!timingSafeEqual(enc.encode(sig), enc.encode(expected))) return null;

  const raw = await env.SESSIONS.get(`sess:${id}`);
  if (!raw) return null;

  try {
    return { id, session: JSON.parse(raw) as StoredSession };
  } catch {
    return null;
  }
}

export function setSessionCookie(c: Context<AppBindings>, token: string): void {
  const secure = c.env.ENVIRONMENT !== "development" && new URL(c.req.url).protocol === "https:";
  setCookie(c, COOKIE_NAME, token, {
    httpOnly: true,
    secure,
    sameSite: "Lax",
    path: "/",
    maxAge: SESSION_TTL,
  });
}

export async function clearSession(c: Context<AppBindings>): Promise<void> {
  const token = getCookie(c, COOKIE_NAME);
  if (token) {
    const found = await readToken(c.env, token);
    if (found) await c.env.SESSIONS.delete(`sess:${found.id}`);
  }
  deleteCookie(c, COOKIE_NAME, { path: "/" });
}

export async function resolveSession(c: Context<AppBindings>): Promise<Session | null> {
  const token = getCookie(c, COOKIE_NAME);
  if (!token) return null;

  const found = await readToken(c.env, token);
  if (!found) return null;

  const now = Math.floor(Date.now() / 1000);
  if (now - found.session.touchedAt > SLIDING_REFRESH_AFTER) {
    found.session.touchedAt = now;
    c.executionCtx.waitUntil(
      c.env.SESSIONS.put(`sess:${found.id}`, JSON.stringify(found.session), {
        expirationTtl: SESSION_TTL,
      }),
    );
  }

  return {
    userId: found.session.userId,
    email: found.session.email,
    displayName: found.session.displayName,
  };
}

/**
 * Gate for everything under /api/admin. The route being unguessable is not the
 * security model; this is.
 */
export async function requireSession(
  c: Context<AppBindings>,
  next: () => Promise<void>,
): Promise<Response | void> {
  const session = await resolveSession(c);
  if (!session) return c.json({ error: "unauthorized" }, 401);
  c.set("session", session);
  await next();
}
