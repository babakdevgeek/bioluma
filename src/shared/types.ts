/** Types shared by the Worker and the client. Single source of truth. */

export const LANGS = ["en", "fa"] as const;
export type Lang = (typeof LANGS)[number];

export const isLang = (v: unknown): v is Lang => LANGS.includes(v as Lang);
export const dirOf = (lang: Lang): "ltr" | "rtl" => (lang === "fa" ? "rtl" : "ltr");

export interface ImageRef {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
}

/** One of the five depth layers of the journey. */
export type Stage = "surface" | "drift" | "relay" | "archive" | "ascent";

export const STAGES: readonly Stage[] = ["surface", "drift", "relay", "archive", "ascent"];

/** Depth readout shown in the gauge. Ascent returns to the surface. */
export const STAGE_DEPTH: Record<Stage, number> = {
  surface: 0,
  drift: 240,
  relay: 900,
  archive: 2400,
  ascent: 0,
};

export interface Project {
  id: string;
  slug: string;
  featured: boolean;
  order: number;
  year: string | null;
  kind: string | null;
  githubUrl: string | null;
  demoUrl: string | null;
  videoUrl: string | null;
  technologies: string[];
  images: ImageRef[];
  accent: number | null;
  title: string;
  tagline: string | null;
  description: string;
  /** Rendered HTML, present only on the single-project response. */
  bodyHtml?: string | null;
}

export interface Bot {
  id: string;
  slug: string;
  order: number;
  handle: string | null;
  telegramUrl: string | null;
  sourceUrl: string | null;
  usersLabel: string | null;
  technologies: string[];
  images: ImageRef[];
  name: string;
  description: string;
  problem: string | null;
  features: string[];
}

export type PostStatus = "draft" | "published";

/** Feed shape: no body, cheap to list. */
export interface PostSummary {
  id: string;
  slug: string;
  status: PostStatus;
  category: string | null;
  tags: string[];
  coverImage: string | null;
  readingMinutes: number | null;
  publishedAt: number | null;
  title: string;
  excerpt: string | null;
  /** Languages this post actually exists in. */
  availableIn: Lang[];
}

export interface Post extends PostSummary {
  contentHtml: string;
  seoTitle: string | null;
  seoDescription: string | null;
  headings: { id: string; text: string; level: number }[];
}

/** Admin-only view: both translations, raw markdown, drafts included. */
export interface PostDraft {
  id: string;
  slug: string;
  status: PostStatus;
  category: string | null;
  tags: string[];
  coverImage: string | null;
  publishedAt: number | null;
  createdAt: number;
  updatedAt: number;
  translations: Record<
    Lang,
    {
      title: string;
      excerpt: string;
      content: string;
      seoTitle: string;
      seoDescription: string;
    }
  >;
}

export interface MediaItem {
  id: string;
  url: string;
  filename: string;
  contentType: string;
  size: number;
  width: number | null;
  height: number | null;
  alt: string | null;
  createdAt: number;
}

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  budget: string | null;
  message: string;
  locale: string;
  readAt: number | null;
  createdAt: number;
}

export interface Session {
  userId: string;
  email: string;
  displayName: string | null;
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
}

export interface ApiError {
  error: string;
  details?: Record<string, string[]>;
}
