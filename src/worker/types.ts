import type { Session } from "@/shared/types";

export interface Env {
  // bindings
  ASSETS: Fetcher;
  DB: D1Database;
  SESSIONS: KVNamespace;
  MEDIA: R2Bucket;

  // vars (wrangler.jsonc)
  SITE_URL: string;
  SITE_NAME: string;
  CONTACT_EMAIL: string;
  ENVIRONMENT: string;

  // secrets (wrangler secret put / .dev.vars)
  SESSION_SECRET: string;
}

export interface AppBindings {
  Bindings: Env;
  Variables: {
    session: Session;
  };
}

/** Raw D1 row shapes, kept next to the queries that produce them. */
export interface ProjectRow {
  id: string;
  slug: string;
  order_index: number;
  featured: number;
  year: string | null;
  kind: string | null;
  github_url: string | null;
  demo_url: string | null;
  video_url: string | null;
  technologies: string;
  images: string;
  accent: string | null;
  title: string;
  tagline: string | null;
  description: string;
  body: string | null;
}

export interface BotRow {
  id: string;
  slug: string;
  order_index: number;
  handle: string | null;
  telegram_url: string | null;
  source_url: string | null;
  users_label: string | null;
  technologies: string;
  images: string;
  name: string;
  description: string;
  problem: string | null;
  features: string;
}

export interface PostRow {
  id: string;
  slug: string;
  status: "draft" | "published";
  category: string | null;
  tags: string;
  cover_image: string | null;
  reading_hint: number | null;
  published_at: number | null;
  created_at: number;
  updated_at: number;
  title: string;
  excerpt: string | null;
  content: string;
  seo_title: string | null;
  seo_description: string | null;
  langs: string | null;
}
