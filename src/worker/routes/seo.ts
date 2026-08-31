/** robots.txt, sitemap.xml and per-language RSS, generated from D1. */
import { Hono } from "hono";
import type { Lang } from "@/shared/types";
import { isLang, LANGS } from "@/shared/types";
import { markdownToText } from "../lib/markdown";
import type { AppBindings } from "../types";

const app = new Hono<AppBindings>();

const esc = (v: string) =>
  v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

interface FeedRow {
  slug: string;
  published_at: number;
  updated_at: number;
  title: string;
  excerpt: string | null;
  content: string;
}

async function feed(db: D1Database, lang: Lang, limit: number): Promise<FeedRow[]> {
  const { results } = await db
    .prepare(
      `SELECT p.slug, p.published_at, p.updated_at,
              COALESCE(t.title, f.title)   AS title,
              COALESCE(t.excerpt, f.excerpt) AS excerpt,
              COALESCE(t.content, f.content, '') AS content
       FROM posts p
       LEFT JOIN post_translations t ON t.post_id = p.id AND t.lang = ?1
       LEFT JOIN post_translations f ON f.post_id = p.id AND f.lang = 'en'
       WHERE p.status = 'published' AND p.published_at IS NOT NULL
             AND p.published_at <= unixepoch()
       ORDER BY p.published_at DESC LIMIT ?2`,
    )
    .bind(lang, limit)
    .all<FeedRow>();
  return results;
}

app.get("/robots.txt", (c) => {
  const base = c.env.SITE_URL.replace(/\/$/, "");
  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /api/",
    "",
    `Sitemap: ${base}/sitemap.xml`,
    "",
  ].join("\n");

  return c.text(body, 200, {
    "content-type": "text/plain; charset=utf-8",
    "cache-control": "public, max-age=3600",
  });
});

app.get("/sitemap.xml", async (c) => {
  const base = c.env.SITE_URL.replace(/\/$/, "");
  const posts = await feed(c.env.DB, "en", 1000);

  const staticPaths = ["", "/blog"];
  const urls: string[] = [];

  for (const lang of LANGS) {
    for (const path of staticPaths) {
      urls.push(entry(base, `/${lang}${path}`, undefined, path === "" ? "1.0" : "0.8", lang));
    }
    for (const post of posts) {
      urls.push(
        entry(
          base,
          `/${lang}/blog/${post.slug}`,
          new Date(post.updated_at * 1000).toISOString(),
          "0.7",
          lang,
        ),
      );
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join("\n")}
</urlset>`;

  return c.body(xml, 200, {
    "content-type": "application/xml; charset=utf-8",
    "cache-control": "public, max-age=1800",
  });
});

function entry(base: string, path: string, lastmod: string | undefined, priority: string, lang: Lang) {
  const others = LANGS.filter((l) => l !== lang);
  const alts = others
    .map(
      (l) =>
        `    <xhtml:link rel="alternate" hreflang="${l}" href="${esc(base + path.replace(/^\/(en|fa)/, `/${l}`))}" />`,
    )
    .join("\n");

  return `  <url>
    <loc>${esc(base + path)}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ""}
    <priority>${priority}</priority>
${alts}
  </url>`;
}

app.get("/rss.xml", async (c) => {
  const raw = c.req.query("lang");
  const lang: Lang = isLang(raw) ? raw : "en";
  const base = c.env.SITE_URL.replace(/\/$/, "");
  const posts = await feed(c.env.DB, lang, 30);

  const items = posts
    .map((p) => {
      const link = `${base}/${lang}/blog/${p.slug}`;
      const summary = p.excerpt || markdownToText(p.content, 400);
      return `    <item>
      <title>${esc(p.title)}</title>
      <link>${esc(link)}</link>
      <guid isPermaLink="true">${esc(link)}</guid>
      <pubDate>${new Date(p.published_at * 1000).toUTCString()}</pubDate>
      <description>${esc(summary)}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(c.env.SITE_NAME)}</title>
    <link>${esc(`${base}/${lang}/blog`)}</link>
    <description>${lang === "fa" ? "نوشته‌ها درباره‌ی ساختن نرم‌افزار." : "Notes on building software."}</description>
    <language>${lang}</language>
    <atom:link href="${esc(`${base}/rss.xml?lang=${lang}`)}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return c.body(xml, 200, {
    "content-type": "application/rss+xml; charset=utf-8",
    "cache-control": "public, max-age=1800",
  });
});

export default app;
