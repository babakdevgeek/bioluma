/**
 * Public read API. Drafts are filtered in SQL, not in the client, so an
 * unpublished post is genuinely unreachable.
 */
import { Hono } from "hono";
import type { Lang } from "@/shared/types";
import { isLang } from "@/shared/types";
import { normalizePersian } from "@/shared/slug";
import { toBot, toPost, toPostSummary, toProject } from "../lib/mappers";
import { feedQuery } from "../lib/schemas";
import type { AppBindings, BotRow, PostRow, ProjectRow } from "../types";

const app = new Hono<AppBindings>();

function lang(c: { req: { query: (k: string) => string | undefined } }): Lang {
  const raw = c.req.query("lang");
  return isLang(raw) ? raw : "en";
}

const cache = (seconds: number) =>
  `public, max-age=30, s-maxage=${seconds}, stale-while-revalidate=86400`;

/**
 * COALESCE against the English row: a project with no Persian translation shows
 * its English text rather than vanishing from the section.
 */
const PROJECT_SQL = `
  SELECT p.id, p.slug, p.order_index, p.featured, p.year, p.kind,
         p.github_url, p.demo_url, p.video_url, p.technologies, p.images, p.accent,
         COALESCE(t.title, f.title)             AS title,
         COALESCE(t.tagline, f.tagline)         AS tagline,
         COALESCE(t.description, f.description) AS description,
         COALESCE(t.body, f.body)               AS body
  FROM projects p
  LEFT JOIN project_translations t ON t.project_id = p.id AND t.lang = ?1
  LEFT JOIN project_translations f ON f.project_id = p.id AND f.lang = 'en'
  WHERE p.status = 'published'`;

const BOT_SQL = `
  SELECT b.id, b.slug, b.order_index, b.handle, b.telegram_url, b.source_url,
         b.users_label, b.technologies, b.images,
         COALESCE(t.name, f.name)               AS name,
         COALESCE(t.description, f.description)  AS description,
         COALESCE(t.problem, f.problem)          AS problem,
         COALESCE(t.features, f.features)        AS features
  FROM bots b
  LEFT JOIN bot_translations t ON t.bot_id = b.id AND t.lang = ?1
  LEFT JOIN bot_translations f ON f.bot_id = b.id AND f.lang = 'en'
  WHERE b.status = 'published'`;

/**
 * `langs` is the set of translations that really exist, so the UI can say
 * "this one is only in English" instead of rendering an empty article.
 */
const POST_SQL = `
  SELECT p.id, p.slug, p.status, p.category, p.tags, p.cover_image, p.reading_hint,
         p.published_at, p.created_at, p.updated_at,
         COALESCE(t.title, f.title)                     AS title,
         COALESCE(t.excerpt, f.excerpt)                  AS excerpt,
         COALESCE(t.content, f.content, '')              AS content,
         COALESCE(t.seo_title, f.seo_title)              AS seo_title,
         COALESCE(t.seo_description, f.seo_description)  AS seo_description,
         (SELECT group_concat(lang) FROM post_translations x
           WHERE x.post_id = p.id AND length(trim(x.title)) > 0) AS langs
  FROM posts p
  LEFT JOIN post_translations t ON t.post_id = p.id AND t.lang = ?1
  LEFT JOIN post_translations f ON f.post_id = p.id AND f.lang = 'en'
  WHERE p.status = 'published' AND p.published_at IS NOT NULL AND p.published_at <= unixepoch()`;

// ---------------------------------------------------------------- projects

app.get("/projects", async (c) => {
  const { results } = await c.env.DB.prepare(`${PROJECT_SQL} ORDER BY p.featured DESC, p.order_index ASC`)
    .bind(lang(c))
    .all<ProjectRow>();

  c.header("cache-control", cache(300));
  return c.json({ items: results.map((r) => toProject(r)) });
});

app.get("/projects/:slug", async (c) => {
  const row = await c.env.DB.prepare(`${PROJECT_SQL} AND p.slug = ?2`)
    .bind(lang(c), c.req.param("slug"))
    .first<ProjectRow>();

  if (!row) return c.json({ error: "not_found" }, 404);
  c.header("cache-control", cache(300));
  return c.json(toProject(row, true));
});

// ---------------------------------------------------------------- bots

app.get("/bots", async (c) => {
  const { results } = await c.env.DB.prepare(`${BOT_SQL} ORDER BY b.order_index ASC`)
    .bind(lang(c))
    .all<BotRow>();

  c.header("cache-control", cache(300));
  return c.json({ items: results.map(toBot) });
});

// ---------------------------------------------------------------- posts

app.get("/posts", async (c) => {
  const parsed = feedQuery.safeParse(c.req.query());
  if (!parsed.success) return c.json({ error: "bad_request" }, 400);
  const { page, perPage, tag, category, q } = parsed.data;

  const where: string[] = [];
  const binds: unknown[] = [lang(c)];
  let n = 2;

  if (tag) {
    // tags are a JSON array; EXISTS over json_each keeps it an exact match
    where.push(`EXISTS (SELECT 1 FROM json_each(p.tags) je WHERE je.value = ?${n++})`);
    binds.push(tag);
  }
  if (category) {
    where.push(`p.category = ?${n++}`);
    binds.push(category);
  }
  if (q) {
    const needle = `%${normalizePersian(q.toLowerCase())}%`;
    where.push(
      `(lower(COALESCE(t.title, f.title)) LIKE ?${n} OR lower(COALESCE(t.excerpt, f.excerpt, '')) LIKE ?${n} OR lower(COALESCE(t.content, f.content, '')) LIKE ?${n})`,
    );
    binds.push(needle);
    n++;
  }

  const filter = where.length ? ` AND ${where.join(" AND ")}` : "";
  const offset = (page - 1) * perPage;

  const [rows, count] = await c.env.DB.batch<PostRow | { total: number }>([
    c.env.DB.prepare(
      `${POST_SQL}${filter} ORDER BY p.published_at DESC LIMIT ?${n} OFFSET ?${n + 1}`,
    ).bind(...binds, perPage, offset),
    c.env.DB.prepare(
      `SELECT COUNT(*) AS total FROM (${POST_SQL}${filter})`,
    ).bind(...binds),
  ]);

  c.header("cache-control", cache(120));
  return c.json({
    items: (rows.results as PostRow[]).map(toPostSummary),
    total: (count.results as { total: number }[])[0]?.total ?? 0,
    page,
    perPage,
  });
});

app.get("/posts/:slug", async (c) => {
  const row = await c.env.DB.prepare(`${POST_SQL} AND p.slug = ?2`)
    .bind(lang(c), c.req.param("slug"))
    .first<PostRow>();

  if (!row) return c.json({ error: "not_found" }, 404);

  const current = lang(c);
  const [prev, next] = await Promise.all([
    c.env.DB.prepare(
      `${POST_SQL} AND p.published_at < ?2 ORDER BY p.published_at DESC LIMIT 1`,
    ).bind(current, row.published_at).first<PostRow>(),
    c.env.DB.prepare(
      `${POST_SQL} AND p.published_at > ?2 ORDER BY p.published_at ASC LIMIT 1`,
    ).bind(current, row.published_at).first<PostRow>(),
  ]);

  c.header("cache-control", cache(300));
  return c.json({
    post: toPost(row),
    prev: prev ? toPostSummary(prev) : null,
    next: next ? toPostSummary(next) : null,
  });
});

// ---------------------------------------------------------------- taxonomy

app.get("/taxonomy", async (c) => {
  const [tags, categories] = await c.env.DB.batch<{ value: string; total: number }>([
    c.env.DB.prepare(
      `SELECT je.value AS value, COUNT(*) AS total
       FROM posts p, json_each(p.tags) je
       WHERE p.status = 'published'
       GROUP BY je.value ORDER BY total DESC, value ASC LIMIT 40`,
    ),
    c.env.DB.prepare(
      `SELECT category AS value, COUNT(*) AS total
       FROM posts WHERE status = 'published' AND category IS NOT NULL
       GROUP BY category ORDER BY total DESC LIMIT 20`,
    ),
  ]);

  c.header("cache-control", cache(600));
  return c.json({ tags: tags.results, categories: categories.results });
});

// ---------------------------------------------------------------- home

/**
 * One request for the whole descent. Five sections used to mean five round
 * trips on a cold cache; this collapses them into a single D1 batch.
 */
app.get("/home", async (c) => {
  const l = lang(c);

  const [projects, bots, posts] = await c.env.DB.batch([
    c.env.DB.prepare(`${PROJECT_SQL} ORDER BY p.featured DESC, p.order_index ASC LIMIT 8`).bind(l),
    c.env.DB.prepare(`${BOT_SQL} ORDER BY b.order_index ASC LIMIT 6`).bind(l),
    c.env.DB.prepare(`${POST_SQL} ORDER BY p.published_at DESC LIMIT 3`).bind(l),
  ]);

  c.header("cache-control", cache(180));
  return c.json({
    projects: (projects.results as ProjectRow[]).map((r) => toProject(r)),
    bots: (bots.results as BotRow[]).map(toBot),
    posts: (posts.results as PostRow[]).map(toPostSummary),
  });
});

export default app;
export { POST_SQL, PROJECT_SQL };
