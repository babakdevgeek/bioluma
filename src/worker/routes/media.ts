/**
 * R2 image delivery.
 *
 * Keys are opaque and generated server side, so a filename can never be used to
 * traverse or overwrite. Content type comes from what was verified at upload
 * time, never from the request.
 */
import { Hono } from "hono";
import type { AppBindings } from "../types";

const app = new Hono<AppBindings>();

const KEY_PATTERN = /^[a-z0-9]{4,12}\/[a-z0-9-]{6,64}\.(png|jpg|jpeg|webp|gif|avif)$/;

app.get("/:prefix/:name", async (c) => {
  const key = `${c.req.param("prefix")}/${c.req.param("name")}`;
  if (!KEY_PATTERN.test(key)) return c.text("not found", 404);

  const cached = await caches.default.match(c.req.raw);
  if (cached) return cached;

  const object = await c.env.MEDIA.get(key);
  if (!object) return c.text("not found", 404);

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  // Keys are content-addressed on upload, so this can never go stale.
  headers.set("cache-control", "public, max-age=31536000, immutable");
  headers.set("x-content-type-options", "nosniff");

  const response = new Response(object.body, { headers });
  c.executionCtx.waitUntil(caches.default.put(c.req.raw, response.clone()));
  return response;
});

export default app;
