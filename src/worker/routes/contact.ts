import { Hono } from "hono";
import { hashIdentifier } from "../lib/auth";
import { clientIp, consume } from "../lib/ratelimit";
import { contactInput, fieldErrors } from "../lib/schemas";
import type { AppBindings } from "../types";

const app = new Hono<AppBindings>();

app.post("/", async (c) => {
  const ipKey = await hashIdentifier(c.env.SESSION_SECRET, clientIp(c.req.raw));

  // 3 messages per hour. Generous for a human, useless for a spam bot.
  const gate = await consume(c.env, `contact:${ipKey}`, 3, 3600);
  if (!gate.ok) {
    c.header("retry-after", String(gate.retryAfter));
    return c.json({ error: "rate_limited", retryAfter: gate.retryAfter }, 429);
  }

  const parsed = contactInput.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) {
    return c.json({ error: "invalid", details: fieldErrors(parsed.error) }, 422);
  }

  // Honeypot filled: accept silently so the bot does not learn anything.
  if (parsed.data.website) return c.json({ ok: true });

  const { name, email, budget, message, locale } = parsed.data;

  await c.env.DB.prepare(
    `INSERT INTO inquiries (id, name, email, budget, message, locale, ip_hash)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`,
  )
    .bind(`inq_${crypto.randomUUID().slice(0, 12)}`, name, email, budget, message, locale, ipKey)
    .run();

  return c.json({ ok: true });
});

export default app;
