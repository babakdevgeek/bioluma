/**
 * BIOLUMA Worker entry point.
 *
 * Runs first on every request (`run_worker_first` in wrangler.jsonc), so:
 *   - the API is handled here,
 *   - static assets are passed through to the assets binding,
 *   - and document requests get a shell with real per-route <head> metadata.
 *
 * This is a Worker, not Pages. One deploy unit, one request path.
 */
import { Hono } from "hono";
import type { Lang } from "@/shared/types";
import { isLang } from "@/shared/types";
import { requireSession } from "./lib/auth";
import { markdownToText } from "./lib/markdown";
import { renderShell, type HeadData } from "./lib/head";
import adminRoutes from "./routes/admin";
import authRoutes from "./routes/auth";
import contactRoutes from "./routes/contact";
import contentRoutes from "./routes/content";
import mediaRoutes from "./routes/media";
import seoRoutes from "./routes/seo";
import type { AppBindings } from "./types";

const app = new Hono<AppBindings>();

// ---------------------------------------------------------------- hardening

app.use("*", async (c, next) => {
  await next();

  const isDev = c.env.ENVIRONMENT === "development";
  const headers = c.res.headers;

  headers.set("x-content-type-options", "nosniff");
  headers.set("referrer-policy", "strict-origin-when-cross-origin");
  headers.set("x-frame-options", "DENY");
  headers.set("permissions-policy", "camera=(), microphone=(), geolocation=(), payment=()");
  headers.set("cross-origin-opener-policy", "same-origin");

  if (!isDev && headers.get("content-type")?.includes("text/html")) {
    headers.set("strict-transport-security", "max-age=31536000; includeSubDomains");
    headers.set(
      "content-security-policy",
      [
        "default-src 'self'",
        "script-src 'self'",
        // Motion and r3f write inline styles; fonts come from Google.
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: blob:",
        "connect-src 'self'",
        "media-src 'self' blob:",
        "worker-src 'self' blob:",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "object-src 'none'",
        "upgrade-insecure-requests",
      ].join("; "),
    );
  }
});

// Mutating requests must originate from this site. Cheap, effective CSRF guard
// on top of the SameSite cookie.
app.use("/api/*", async (c, next) => {
  const method = c.req.method;
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return next();

  const origin = c.req.header("origin");
  if (origin) {
    const here = new URL(c.req.url).host;
    if (new URL(origin).host !== here) return c.json({ error: "cross_origin_denied" }, 403);
  }
  return next();
});

// ---------------------------------------------------------------- api

app.route("/api/content", contentRoutes);
app.route("/api/auth", authRoutes);
app.route("/api/contact", contactRoutes);

app.use("/api/admin/*", requireSession);
app.route("/api/admin", adminRoutes);

app.route("/media", mediaRoutes);
app.route("/", seoRoutes);

app.all("/api/*", (c) => c.json({ error: "not_found" }, 404));

// ---------------------------------------------------------------- documents

/** Static file requests never need the router; hand them straight to assets. */
const ASSET_PATTERN = /\.(js|mjs|css|map|svg|png|jpe?g|webp|avif|gif|ico|woff2?|ttf|json|webmanifest|txt|glb|hdr|ktx2|mp3|wasm)$/i;

function negotiate(request: Request): Lang {
  const header = request.headers.get("accept-language") ?? "";
  // Persian speakers should not have to find the switcher.
  return /(^|,)\s*fa\b/i.test(header) ? "fa" : "en";
}

interface RouteMeta {
  head: HeadData;
  status: number;
}

async function describe(c: {
  env: AppBindings["Bindings"];
  req: { url: string };
}): Promise<RouteMeta> {
  const url = new URL(c.req.url);
  const segments = url.pathname.split("/").filter(Boolean);
  const lang: Lang = isLang(segments[0]) ? (segments[0] as Lang) : "en";
  const rest = segments.slice(isLang(segments[0]) ? 1 : 0);
  const fa = lang === "fa";

  const person = fa ? "بابک بیات" : "Babak Bayat";

  // /admin is a real page but must never be indexed or unfurled.
  if (rest[0] === "admin" || segments[0] === "admin") {
    return {
      head: {
        title: "Studio",
        description: "Private.",
        lang,
        path: url.pathname,
        noindex: true,
      },
      status: 200,
    };
  }

  if (rest[0] === "blog" && rest[1]) {
    const row = await c.env.DB.prepare(
      `SELECT p.cover_image, p.published_at, p.tags,
              COALESCE(t.title, f.title) AS title,
              COALESCE(t.seo_title, f.seo_title) AS seo_title,
              COALESCE(t.seo_description, f.seo_description) AS seo_description,
              COALESCE(t.excerpt, f.excerpt) AS excerpt,
              COALESCE(t.content, f.content, '') AS content,
              (SELECT group_concat(lang) FROM post_translations x
                WHERE x.post_id = p.id AND length(trim(x.title)) > 0) AS langs
       FROM posts p
       LEFT JOIN post_translations t ON t.post_id = p.id AND t.lang = ?1
       LEFT JOIN post_translations f ON f.post_id = p.id AND f.lang = 'en'
       WHERE p.slug = ?2 AND p.status = 'published' AND p.published_at <= unixepoch()`,
    )
      .bind(lang, rest[1])
      .first<{
        cover_image: string | null;
        published_at: number | null;
        tags: string;
        title: string;
        seo_title: string | null;
        seo_description: string | null;
        excerpt: string | null;
        content: string;
        langs: string | null;
      }>();

    if (!row) {
      return {
        head: {
          title: fa ? "پیدا نشد" : "Not found",
          description: fa ? "این نوشته وجود ندارد." : "That post does not exist.",
          lang,
          path: url.pathname,
          noindex: true,
        },
        status: 404,
      };
    }

    return {
      head: {
        title: `${row.seo_title || row.title} \u00b7 ${person}`,
        description: row.seo_description || row.excerpt || markdownToText(row.content, 170),
        lang,
        path: url.pathname,
        image: row.cover_image,
        type: "article",
        publishedTime: row.published_at,
        tags: JSON.parse(row.tags || "[]") as string[],
        alternates: (row.langs ?? "en").split(",").filter(isLang),
      },
      status: 200,
    };
  }

  if (rest[0] === "blog") {
    return {
      head: {
        title: fa ? `نوشته‌ها \u00b7 ${person}` : `Writing \u00b7 ${person}`,
        description: fa
          ? "یادداشت‌هایی درباره‌ی ساختن نرم‌افزار: ابزارهای وب، بات‌های تلگرام، و چیزهایی که شکستند."
          : "Notes on building software: web tools, Telegram bots, and the things that broke along the way.",
        lang,
        path: url.pathname,
      },
      status: 200,
    };
  }

  const known = rest.length === 0;
  return {
    head: {
      title: fa
        ? `${person} \u00b7 برنامه‌نویس`
        : `${person} \u00b7 Software Developer`,
      description: fa
        ? "برنامه‌نویس. ابزار وب، بات تلگرام، و چیزهایی که شاید لازم نبودند می‌سازم. این سایت یک فرورفتن است، نه یک نمونه‌کار."
        : "Software developer. I build web tools, Telegram bots, and things that probably didn't need to exist. This site is a descent, not a portfolio.",
      lang,
      path: url.pathname,
      noindex: !known,
    },
    status: known ? 200 : 404,
  };
}

app.get("*", async (c) => {
  const url = new URL(c.req.url);

  // Static assets: straight through, untouched.
  if (ASSET_PATTERN.test(url.pathname) || url.pathname.startsWith("/assets/")) {
    return c.env.ASSETS.fetch(c.req.raw);
  }

  // Bare root negotiates a language rather than guessing English.
  if (url.pathname === "/") {
    return c.redirect(`/${negotiate(c.req.raw)}`, 302);
  }

  // /blog without a language prefix still works.
  const first = url.pathname.split("/").filter(Boolean)[0];
  if (first && !isLang(first) && first !== "admin") {
    return c.redirect(`/${negotiate(c.req.raw)}${url.pathname}${url.search}`, 302);
  }

  const { head, status } = await describe(c);
  return renderShell(c.env, c.req.raw, head, status);
});

app.onError((error, c) => {
  console.error("worker error", error);
  if (new URL(c.req.url).pathname.startsWith("/api/")) {
    return c.json({ error: "internal_error" }, 500);
  }
  return c.text("Something broke down here. Try again.", 500);
});

export default app;
