import type { Bot, ImageRef, Lang, Post, PostSummary, Project } from "@/shared/types";
import { LANGS } from "@/shared/types";
import { renderMarkdown } from "./markdown";
import type { BotRow, PostRow, ProjectRow } from "../types";

function json<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed == null ? fallback : (parsed as T);
  } catch {
    return fallback;
  }
}

const images = (raw: string | null) => json<ImageRef[]>(raw, []).filter((i) => Boolean(i?.src));
const strings = (raw: string | null) => json<string[]>(raw, []).filter((s) => typeof s === "string");

export function toProject(row: ProjectRow, withBody = false): Project {
  return {
    id: row.id,
    slug: row.slug,
    featured: row.featured === 1,
    order: row.order_index,
    year: row.year,
    kind: row.kind,
    githubUrl: row.github_url,
    demoUrl: row.demo_url,
    videoUrl: row.video_url,
    technologies: strings(row.technologies),
    images: images(row.images),
    accent: row.accent ? Number(row.accent) : null,
    title: row.title,
    tagline: row.tagline,
    description: row.description,
    bodyHtml: withBody && row.body ? renderMarkdown(row.body).html : null,
  };
}

export function toBot(row: BotRow): Bot {
  return {
    id: row.id,
    slug: row.slug,
    order: row.order_index,
    handle: row.handle,
    telegramUrl: row.telegram_url,
    sourceUrl: row.source_url,
    usersLabel: row.users_label,
    technologies: strings(row.technologies),
    images: images(row.images),
    name: row.name,
    description: row.description,
    problem: row.problem,
    features: strings(row.features),
  };
}

function availableIn(raw: string | null): Lang[] {
  if (!raw) return [];
  const set = new Set(raw.split(",").map((s) => s.trim()));
  return LANGS.filter((l) => set.has(l));
}

export function toPostSummary(row: PostRow): PostSummary {
  return {
    id: row.id,
    slug: row.slug,
    status: row.status,
    category: row.category,
    tags: strings(row.tags),
    coverImage: row.cover_image,
    readingMinutes: row.reading_hint,
    publishedAt: row.published_at,
    title: row.title,
    excerpt: row.excerpt,
    availableIn: availableIn(row.langs),
  };
}

export function toPost(row: PostRow): Post {
  const { html, headings } = renderMarkdown(row.content);
  return {
    ...toPostSummary(row),
    contentHtml: html,
    headings,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
  };
}
