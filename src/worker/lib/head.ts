/**
 * Per-route <head> injection.
 *
 * The client is a SPA, but crawlers and link unfurlers get real metadata
 * because the Worker rewrites the head block of index.html on the way out.
 */
import type { Lang } from "@/shared/types";
import { dirOf } from "@/shared/types";
import { escapeHtml } from "./markdown";
import type { Env } from "../types";

export interface HeadData {
  title: string;
  description: string;
  lang: Lang;
  path: string;
  image?: string | null;
  type?: "website" | "article";
  publishedTime?: number | null;
  tags?: string[];
  noindex?: boolean;
  /** Language variants that exist for this exact document. */
  alternates?: Lang[];
}

const HEAD_OPEN = "<!--HEAD-->";
const HEAD_CLOSE = "<!--/HEAD-->";

function abs(env: Env, path: string): string {
  const base = env.SITE_URL.replace(/\/$/, "");
  return path.startsWith("http") ? path : `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

function buildHead(env: Env, data: HeadData): string {
  const title = escapeHtml(data.title);
  const description = escapeHtml(data.description);
  const canonical = abs(env, data.path);
  const image = abs(env, data.image || "/favicon.svg");
  const alternates = data.alternates ?? ["en", "fa"];

  const tags: string[] = [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    `<link rel="canonical" href="${canonical}" />`,
    data.noindex
      ? `<meta name="robots" content="noindex, nofollow" />`
      : `<meta name="robots" content="index, follow, max-image-preview:large" />`,

    `<meta property="og:type" content="${data.type ?? "website"}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:url" content="${canonical}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:site_name" content="${escapeHtml(env.SITE_NAME)}" />`,
    `<meta property="og:locale" content="${data.lang === "fa" ? "fa_IR" : "en_US"}" />`,

    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${image}" />`,
  ];

  for (const alt of alternates) {
    const path = data.path.replace(/^\/(en|fa)\b/, `/${alt}`);
    tags.push(`<link rel="alternate" hreflang="${alt}" href="${abs(env, path)}" />`);
  }
  tags.push(`<link rel="alternate" hreflang="x-default" href="${abs(env, "/en")}" />`);
  tags.push(`<link rel="alternate" type="application/rss+xml" title="${escapeHtml(env.SITE_NAME)}" href="${abs(env, `/rss.xml?lang=${data.lang}`)}" />`);

  if (data.type === "article") {
    if (data.publishedTime) {
      tags.push(
        `<meta property="article:published_time" content="${new Date(data.publishedTime * 1000).toISOString()}" />`,
      );
    }
    for (const tag of data.tags ?? []) {
      tags.push(`<meta property="article:tag" content="${escapeHtml(tag)}" />`);
    }
  }

  tags.push(`<script type="application/ld+json">${structuredData(env, data)}</script>`);
  return tags.join("\n    ");
}

function structuredData(env: Env, data: HeadData): string {
  const person = {
    "@type": "Person",
    name: env.SITE_NAME,
    url: env.SITE_URL,
    email: `mailto:${env.CONTACT_EMAIL}`,
    jobTitle: "Software Developer",
    sameAs: ["https://github.com/babakdevgeek"],
  };

  const graph =
    data.type === "article"
      ? {
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: data.title,
          description: data.description,
          inLanguage: data.lang,
          mainEntityOfPage: abs(env, data.path),
          image: data.image ? abs(env, data.image) : undefined,
          datePublished: data.publishedTime
            ? new Date(data.publishedTime * 1000).toISOString()
            : undefined,
          keywords: data.tags?.join(", ") || undefined,
          author: person,
        }
      : {
          "@context": "https://schema.org",
          "@type": "ProfilePage",
          inLanguage: data.lang,
          mainEntity: person,
        };

  // Escaped so a stray `</script>` in content cannot break out of the tag.
  return JSON.stringify(graph).replace(/</g, "\\u003c");
}

/**
 * Pulls index.html from the assets binding and rewrites lang, dir and head.
 * Keeping the shell in the asset pipeline means Vite still owns hashing and HMR.
 */
export async function renderShell(
  env: Env,
  request: Request,
  data: HeadData,
  status = 200,
): Promise<Response> {
  const shellUrl = new URL("/index.html", request.url);
  const asset = await env.ASSETS.fetch(new Request(shellUrl.toString(), { headers: request.headers }));

  if (!asset.ok) return asset;

  let html = await asset.text();

  const open = html.indexOf(HEAD_OPEN);
  const close = html.indexOf(HEAD_CLOSE);
  if (open !== -1 && close > open) {
    html = html.slice(0, open) + buildHead(env, data) + html.slice(close + HEAD_CLOSE.length);
  }

  html = html.replace(
    /<html[^>]*>/i,
    `<html lang="${data.lang}" dir="${dirOf(data.lang)}">`,
  );

  return new Response(html, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": data.type === "article" ? "public, max-age=0, s-maxage=300" : "public, max-age=0, s-maxage=60",
      vary: "Accept-Language",
    },
  });
}
