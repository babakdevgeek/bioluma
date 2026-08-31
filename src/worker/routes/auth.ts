import { Hono } from "hono";
import {
  clearSession,
  createSession,
  hashIdentifier,
  resolveSession,
  setSessionCookie,
  verifyPassword,
} from "../lib/auth";
import { clientIp, consume } from "../lib/ratelimit";
import { fieldErrors, loginInput } from "../lib/schemas";
import type { AppBindings } from "../types";

const app = new Hono<AppBindings>();

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  display_name: string | null;
}

app.post("/login", async (c) => {
  const ip = clientIp(c.req.raw);
  const ipKey = await hashIdentifier(c.env.SESSION_SECRET, ip);

  // 5 attempts per 15 minutes per address.
  const gate = await consume(c.env, `login:${ipKey}`, 5, 900);
  if (!gate.ok) {
    c.header("retry-after", String(gate.retryAfter));
    return c.json({ error: "too_many_attempts", retryAfter: gate.retryAfter }, 429);
  }

  const parsed = loginInput.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) {
    return c.json({ error: "invalid_credentials", details: fieldErrors(parsed.error) }, 400);
  }

  const user = await c.env.DB.prepare(
    `SELECT id, email, password_hash, display_name FROM users WHERE email = ?1`,
  )
    .bind(parsed.data.email)
    .first<UserRow>();

  // Verify against a dummy record when the account is missing so the response
  // time does not reveal whether the email exists.
  const record =
    user?.password_hash ??
    "pbkdf2$210000$AAAAAAAAAAAAAAAAAAAAAA==$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
  const ok = await verifyPassword(record, parsed.data.password);

  c.executionCtx.waitUntil(
    c.env.DB.prepare(`INSERT INTO login_attempts (identifier, ok) VALUES (?1, ?2)`)
      .bind(ipKey, ok && user ? 1 : 0)
      .run(),
  );

  if (!ok || !user) return c.json({ error: "invalid_credentials" }, 401);

  const token = await createSession(c.env, {
    userId: user.id,
    email: user.email,
    displayName: user.display_name,
  });
  setSessionCookie(c, token);

  c.executionCtx.waitUntil(
    c.env.DB.prepare(`UPDATE users SET last_login_at = unixepoch() WHERE id = ?1`)
      .bind(user.id)
      .run(),
  );

  return c.json({
    user: { userId: user.id, email: user.email, displayName: user.display_name },
  });
});

app.post("/logout", async (c) => {
  await clearSession(c);
  return c.json({ ok: true });
});

app.get("/session", async (c) => {
  const session = await resolveSession(c);
  c.header("cache-control", "no-store");
  return session ? c.json({ user: session }) : c.json({ user: null }, 200);
});

export default app;
