/**
 * Everything here sits behind requireSession (mounted in index.ts).
 * Drafts, uploads and the inbox are unreachable without a valid session cookie.
 */
import { Hono } from "hono";
import type { Lang, MediaItem, PostDraft } from "@/shared/types";
import { LANGS } from "@/shared/types";
import { readingMinutes, excerptFrom } from "@/shared/slug";
import { renderMarkdown } from "../lib/markdown";
import { fieldErrors, mediaPatch, orderPatch, postInput } from "../lib/schemas";
import type { AppBindings } from "../types";

const app = new Hono<AppBindings>();

// Admin responses are per-user and often unpublished. Never cache them anywhere.
app.use("*", async (c, next) => {
  await next();
  c.header("cache-control", "no-store, private");
});

const newId = (prefix: string) => `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 14)}`;

// ---------------------------------------------------------------- session

app.get("/me", (c) => c.json({ user: c.get("session") }));

// ---------------------------------------------------------------- overview

app.get("/overview", async (c) => {
  const [counts, recent, unread] = await c.env.DB.batch([
    c.env.DB.prepare(
      `SELECT
         (SELECT COUNT(*) FROM posts WHERE status = 'published') AS published,
         (SELECT COUNT(*) FROM posts WHERE status = 'draft')     AS drafts,
         (SELECT COUNT(*) FROM projects)                          AS projects,
         (SELECT COUNT(*) FROM bots)                              AS bots,
         (SELECT COUNT(*) FROM media)                             AS media,
         (SELECT COUNT(*) FROM inquiries WHERE read_at IS NULL)   AS unread`,
    ),
    c.env.DB.prepare(
      `SELECT p.id, p.slug, p.status, p.updated_at,
              COALESCE(en.title, fa.title) AS title,
              (SELECT group_concat(lang) FROM post_translations x
                WHERE x.post_id = p.id AND length(trim(x.title)) > 0) AS langs
       FROM posts p
       LEFT JOIN post_translations en ON en.post_id = p.id AND en.lang = 'en'
       LEFT JOIN post_translations fa ON fa.post_id = p.id AND fa.lang = 'fa'
       ORDER BY p.updated_at DESC LIMIT 6`,
    ),
    c.env.DB.prepare(
      `SELECT id, name, email, message, created_at FROM inquiries
       WHERE read_at IS NULL ORDER BY created_at DESC LIMIT 5`,
    ),
  ]);

  return c.json({
    counts: (counts.results as Record<string, number>[])[0] ?? {},
    recentPosts: recent.results,
    unreadInquiries: unread.results,
  });
});

// ---------------------------------------------------------------- posts

interface AdminPostRow {
  id: string;
  slug: string;
  status: "draft" | "published";
  category: string | null;
  tags: string;
  cover_image: string | null;
  published_at: number | null;
  created_at: number;
  updated_at: number;
  reading_hint: number | null;
  title_en: string | null;
  title_fa: string | null;
  langs: string | null;
}

app.get("/posts", async (c) => {
  const status = c.req.query("status");
  const q = (c.req.query("q") ?? "").trim().toLowerCase();

  const where: string[] = [];
  const binds: unknown[] = [];
  if (status === "draft" || status === "published") {
    where.push(`p.status = ?${binds.length + 1}`);
    binds.push(status);
  }
  if (q) {
    where.push(
      `(lower(p.slug) LIKE ?${binds.length + 1} OR EXISTS (SELECT 1 FROM post_translations t WHERE t.post_id = p.id AND lower(t.title) LIKE ?${binds.length + 1}))`,
    );
    binds.push(`%${q}%`);
  }

  const { results } = await c.env.DB.prepare(
    `SELECT p.id, p.slug, p.status, p.category, p.tags, p.cover_image, p.published_at,
            p.created_at, p.updated_at, p.reading_hint,
            en.title AS title_en, fa.title AS title_fa,
            (SELECT group_concat(lang) FROM post_translations x
              WHERE x.post_id = p.id AND length(trim(x.title)) > 0) AS langs
     FROM posts p
     LEFT JOIN post_translations en ON en.post_id = p.id AND en.lang = 'en'
     LEFT JOIN post_translations fa ON fa.post_id = p.id AND fa.lang = 'fa'
     ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
     ORDER BY COALESCE(p.published_at, p.updated_at) DESC LIMIT 200`,
  )
    .bind(...binds)
    .all<AdminPostRow>();

  return c.json({
    items: results.map((r) => ({
      id: r.id,
      slug: r.slug,
      status: r.status,
      category: r.category,
      tags: JSON.parse(r.tags || "[]") as string[],
      coverImage: r.cover_image,
      publishedAt: r.published_at,
      updatedAt: r.updated_at,
      readingMinutes: r.reading_hint,
      title: r.title_en || r.title_fa || r.slug,
      availableIn: (r.langs ?? "").split(",").filter((l): l is Lang => l === "en" || l === "fa"),
    })),
  });
});

app.get("/posts/:id", async (c) => {
  const id = c.req.param("id");

  const post = await c.env.DB.prepare(
    `SELECT id, slug, status, category, tags, cover_image, published_at, created_at, updated_at
     FROM posts WHERE id = ?1`,
  )
    .bind(id)
    .first<{
      id: string;
      slug: string;
      status: "draft" | "published";
      category: string | null;
      tags: string;
      cover_image: string | null;
      published_at: number | null;
      created_at: number;
      updated_at: number;
    }>();

  if (!post) return c.json({ error: "not_found" }, 404);

  const { results } = await c.env.DB.prepare(
    `SELECT lang, title, excerpt, content, seo_title, seo_description
     FROM post_translations WHERE post_id = ?1`,
  )
    .bind(id)
    .all<{
      lang: Lang;
      title: string;
      excerpt: string | null;
      content: string;
      seo_title: string | null;
      seo_description: string | null;
    }>();

  const empty = { title: "", excerpt: "", content: "", seoTitle: "", seoDescription: "" };
  const translations = { en: { ...empty }, fa: { ...empty } } as PostDraft["translations"];

  for (const row of results) {
    translations[row.lang] = {
      title: row.title ?? "",
      excerpt: row.excerpt ?? "",
      content: row.content ?? "",
      seoTitle: row.seo_title ?? "",
      seoDescription: row.seo_description ?? "",
    };
  }

  const draft: PostDraft = {
    id: post.id,
    slug: post.slug,
    status: post.status,
    category: post.category,
    tags: JSON.parse(post.tags || "[]") as string[],
    coverImage: post.cover_image,
    publishedAt: post.published_at,
    createdAt: post.created_at,
    updatedAt: post.updated_at,
    translations,
  };

  return c.json(draft);
});

async function writePost(
  db: D1Database,
  id: string,
  input: ReturnType<typeof postInput.parse>,
  authorId: string,
  isNew: boolean,
) {
  // Publishing without an explicit date means "now".
  const publishedAt =
    input.status === "published" ? (input.publishedAt ?? Math.floor(Date.now() / 1000)) : input.publishedAt;

  // Reading time is computed from whichever language has the longer body.
  const longest = Math.max(
    ...LANGS.map((l) => (input.translations[l]?.content ?? "").length),
  );
  const source =
    LANGS.find((l) => (input.translations[l]?.content ?? "").length === longest) ?? "en";
  const minutes = readingMinutes(input.translations[source]?.content ?? "");

  const statements: D1PreparedStatement[] = [];

  if (isNew) {
    statements.push(
      db
        .prepare(
          `INSERT INTO posts (id, slug, status, category, tags, cover_image, reading_hint, published_at, author_id)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`,
        )
        .bind(
          id,
          input.slug,
          input.status,
          input.category,
          JSON.stringify(input.tags),
          input.coverImage ?? null,
          minutes,
          publishedAt,
          authorId,
        ),
    );
  } else {
    statements.push(
      db
        .prepare(
          `UPDATE posts SET slug = ?2, status = ?3, category = ?4, tags = ?5, cover_image = ?6,
                            reading_hint = ?7, published_at = ?8, updated_at = unixepoch()
           WHERE id = ?1`,
        )
        .bind(
          id,
          input.slug,
          input.status,
          input.category,
          JSON.stringify(input.tags),
          input.coverImage ?? null,
          minutes,
          publishedAt,
        ),
    );
  }

  for (const lang of LANGS) {
    const t = input.translations[lang];
    const title = (t?.title ?? "").trim();

    // An empty language is removed, not stored blank. That is what lets the
    // public site honestly say "only available in English".
    if (!title) {
      statements.push(
        db.prepare(`DELETE FROM post_translations WHERE post_id = ?1 AND lang = ?2`).bind(id, lang),
      );
      continue;
    }

    const content = t?.content ?? "";
    statements.push(
      db
        .prepare(
          `INSERT INTO post_translations (post_id, lang, title, excerpt, content, seo_title, seo_description)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
           ON CONFLICT (post_id, lang) DO UPDATE SET
             title = excluded.title, excerpt = excluded.excerpt, content = excluded.content,
             seo_title = excluded.seo_title, seo_description = excluded.seo_description`,
        )
        .bind(
          id,
          lang,
          title,
          (t?.excerpt ?? "").trim() || excerptFrom(content),
          content,
          (t?.seoTitle ?? "").trim() || null,
          (t?.seoDescription ?? "").trim() || null,
        ),
    );
  }

  await db.batch(statements);
}

app.post("/posts", async (c) => {
  const parsed = postInput.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: "invalid", details: fieldErrors(parsed.error) }, 422);

  const clash = await c.env.DB.prepare(`SELECT id FROM posts WHERE slug = ?1`)
    .bind(parsed.data.slug)
    .first();
  if (clash) return c.json({ error: "invalid", details: { slug: ["already taken"] } }, 409);

  const id = newId("post");
  await writePost(c.env.DB, id, parsed.data, c.get("session").userId, true);
  return c.json({ id }, 201);
});

app.put("/posts/:id", async (c) => {
  const id = c.req.param("id");
  const parsed = postInput.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: "invalid", details: fieldErrors(parsed.error) }, 422);

  const existing = await c.env.DB.prepare(`SELECT id FROM posts WHERE id = ?1`).bind(id).first();
  if (!existing) return c.json({ error: "not_found" }, 404);

  const clash = await c.env.DB.prepare(`SELECT id FROM posts WHERE slug = ?1 AND id != ?2`)
    .bind(parsed.data.slug, id)
    .first();
  if (clash) return c.json({ error: "invalid", details: { slug: ["already taken"] } }, 409);

  await writePost(c.env.DB, id, parsed.data, c.get("session").userId, false);
  return c.json({ id });
});

app.delete("/posts/:id", async (c) => {
  // Translations cascade via the foreign key.
  const result = await c.env.DB.prepare(`DELETE FROM posts WHERE id = ?1`)
    .bind(c.req.param("id"))
    .run();
  if (!result.meta.changes) return c.json({ error: "not_found" }, 404);
  return c.json({ ok: true });
});

/** Live preview: markdown in, the exact HTML the public site would render out. */
app.post("/preview", async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as { markdown?: unknown };
  const markdown = typeof body.markdown === "string" ? body.markdown.slice(0, 300_000) : "";
  const { html, headings } = renderMarkdown(markdown);
  return c.json({ html, headings, readingMinutes: readingMinutes(markdown) });
});

// ---------------------------------------------------------------- media

const MAX_UPLOAD = 5 * 1024 * 1024;

/**
 * Extension checks are trivially bypassed, so the first bytes decide the type.
 * SVG is deliberately not accepted: it is a script container.
 */
function sniff(bytes: Uint8Array): { type: string; ext: string } | null {
  const is = (...sig: number[]) => sig.every((b, i) => bytes[i] === b);

  if (is(0x89, 0x50, 0x4e, 0x47)) return { type: "image/png", ext: "png" };
  if (is(0xff, 0xd8, 0xff)) return { type: "image/jpeg", ext: "jpg" };
  if (is(0x47, 0x49, 0x46, 0x38)) return { type: "image/gif", ext: "gif" };

  const tag = String.fromCharCode(...bytes.slice(0, 4));
  const brand = String.fromCharCode(...bytes.slice(8, 12));
  if (tag === "RIFF" && brand === "WEBP") return { type: "image/webp", ext: "webp" };

  const ftyp = String.fromCharCode(...bytes.slice(4, 8));
  if (ftyp === "ftyp" && String.fromCharCode(...bytes.slice(8, 12)).startsWith("avif")) {
    return { type: "image/avif", ext: "avif" };
  }
  return null;
}

function mediaUrl(key: string): string {
  return `/media/${key}`;
}

app.get("/media", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT id, r2_key, filename, content_type, size, width, height, alt, created_at
     FROM media ORDER BY created_at DESC LIMIT 200`,
  ).all<{
    id: string;
    r2_key: string;
    filename: string;
    content_type: string;
    size: number;
    width: number | null;
    height: number | null;
    alt: string | null;
    created_at: number;
  }>();

  const items: MediaItem[] = results.map((r) => ({
    id: r.id,
    url: mediaUrl(r.r2_key),
    filename: r.filename,
    contentType: r.content_type,
    size: r.size,
    width: r.width,
    height: r.height,
    alt: r.alt,
    createdAt: r.created_at,
  }));

  return c.json({ items });
});

app.post("/media", async (c) => {
  const form = await c.req.formData().catch(() => null);
  const file = form?.get("file");

  if (!(file instanceof File)) return c.json({ error: "no_file" }, 400);
  if (file.size === 0) return c.json({ error: "empty_file" }, 400);
  if (file.size > MAX_UPLOAD) return c.json({ error: "too_large", maxBytes: MAX_UPLOAD }, 413);

  const buffer = await file.arrayBuffer();
  const kind = sniff(new Uint8Array(buffer.slice(0, 16)));
  if (!kind) return c.json({ error: "unsupported_type" }, 415);

  // Content-addressed key: same image uploaded twice occupies one object, and
  // the immutable cache header on /media is always truthful.
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  const hex = [...new Uint8Array(digest)]
    .slice(0, 12)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const key = `${hex.slice(0, 4)}/${hex.slice(4)}.${kind.ext}`;

  await c.env.MEDIA.put(key, buffer, {
    httpMetadata: {
      contentType: kind.type,
      cacheControl: "public, max-age=31536000, immutable",
    },
  });

  const alt = String(form?.get("alt") ?? "").slice(0, 300);
  const safeName = file.name.replace(/[^\w.\- ]/g, "").slice(0, 120) || `image.${kind.ext}`;
  const id = newId("med");

  await c.env.DB.prepare(
    `INSERT INTO media (id, r2_key, filename, content_type, size, alt)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6)
     ON CONFLICT (r2_key) DO UPDATE SET alt = COALESCE(NULLIF(excluded.alt, ''), media.alt)`,
  )
    .bind(id, key, safeName, kind.type, file.size, alt)
    .run();

  const stored = await c.env.DB.prepare(`SELECT id, alt FROM media WHERE r2_key = ?1`)
    .bind(key)
    .first<{ id: string; alt: string | null }>();

  return c.json(
    {
      id: stored?.id ?? id,
      url: mediaUrl(key),
      filename: safeName,
      contentType: kind.type,
      size: file.size,
      width: null,
      height: null,
      alt: stored?.alt ?? alt,
      createdAt: Math.floor(Date.now() / 1000),
    } satisfies MediaItem,
    201,
  );
});

app.patch("/media/:id", async (c) => {
  const parsed = mediaPatch.safeParse(await c.req.json().catch(() => ({})));
  if (!parsed.success) return c.json({ error: "invalid", details: fieldErrors(parsed.error) }, 422);

  await c.env.DB.prepare(`UPDATE media SET alt = ?2 WHERE id = ?1`)
    .bind(c.req.param("id"), parsed.data.alt)
    .run();
  return c.json({ ok: true });
});

app.delete("/media/:id", async (c) => {
  const row = await c.env.DB.prepare(`SELECT r2_key FROM media WHERE id = ?1`)
    .bind(c.req.param("id"))
    .first<{ r2_key: string }>();

  if (!row) return c.json({ error: "not_found" }, 404);

  await c.env.MEDIA.delete(row.r2_key);
  await c.env.DB.prepare(`DELETE FROM media WHERE id = ?1`).bind(c.req.param("id")).run();
  return c.json({ ok: true });
});

// ---------------------------------------------------------------- inbox

app.get("/inquiries", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT id, name, email, budget, message, locale, read_at, created_at
     FROM inquiries ORDER BY created_at DESC LIMIT 100`,
  ).all();
  return c.json({ items: results });
});

app.patch("/inquiries/:id", async (c) => {
  await c.env.DB.prepare(`UPDATE inquiries SET read_at = unixepoch() WHERE id = ?1`)
    .bind(c.req.param("id"))
    .run();
  return c.json({ ok: true });
});

// ---------------------------------------------------------------- catalogue

/**
 * Projects and bots are seeded by SQL, but ordering and visibility are the two
 * things worth changing often, so they get a UI.
 */
for (const table of ["projects", "bots"] as const) {
  app.get(`/${table}`, async (c) => {
    const nameCol = table === "projects" ? "title" : "name";
    const joinTable = table === "projects" ? "project_translations" : "bot_translations";
    const fk = table === "projects" ? "project_id" : "bot_id";

    const { results } = await c.env.DB.prepare(
      `SELECT x.id, x.slug, x.order_index, x.status,
              ${table === "projects" ? "x.featured," : ""}
              t.${nameCol} AS label
       FROM ${table} x
       LEFT JOIN ${joinTable} t ON t.${fk} = x.id AND t.lang = 'en'
       ORDER BY x.order_index ASC`,
    ).all();
    return c.json({ items: results });
  });

  app.patch(`/${table}/:id`, async (c) => {
    const parsed = orderPatch.safeParse(await c.req.json().catch(() => ({})));
    if (!parsed.success) return c.json({ error: "invalid", details: fieldErrors(parsed.error) }, 422);

    const sets: string[] = [];
    const binds: unknown[] = [c.req.param("id")];

    if (parsed.data.orderIndex !== undefined) {
      sets.push(`order_index = ?${binds.length + 1}`);
      binds.push(parsed.data.orderIndex);
    }
    if (parsed.data.status !== undefined) {
      sets.push(`status = ?${binds.length + 1}`);
      binds.push(parsed.data.status);
    }
    if (parsed.data.featured !== undefined && table === "projects") {
      sets.push(`featured = ?${binds.length + 1}`);
      binds.push(parsed.data.featured ? 1 : 0);
    }
    if (!sets.length) return c.json({ ok: true });

    await c.env.DB.prepare(
      `UPDATE ${table} SET ${sets.join(", ")}, updated_at = unixepoch() WHERE id = ?1`,
    )
      .bind(...binds)
      .run();
    return c.json({ ok: true });
  });
}

export default app;
