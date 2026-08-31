-- BIOLUMA content schema (Cloudflare D1 / SQLite)
--
-- Design rule: nothing user-visible is hardcoded in a component. Every project,
-- bot and post is a row here, and each one carries one translation row per
-- language so Persian is a first-class record rather than a mirrored string.

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------- auth

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,           -- pbkdf2$<iterations>$<salt_b64>$<hash_b64>
  display_name  TEXT,
  last_login_at INTEGER,
  created_at    INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Failed login bookkeeping, so lockout survives a KV eviction.
CREATE TABLE IF NOT EXISTS login_attempts (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  identifier TEXT NOT NULL,             -- hashed ip or email
  ok         INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_login_attempts ON login_attempts (identifier, created_at DESC);

-- ---------------------------------------------------------------- projects

CREATE TABLE IF NOT EXISTS projects (
  id           TEXT PRIMARY KEY,
  slug         TEXT NOT NULL UNIQUE,
  order_index  INTEGER NOT NULL DEFAULT 100,
  featured     INTEGER NOT NULL DEFAULT 0,
  status       TEXT NOT NULL DEFAULT 'published',   -- published | hidden
  year         TEXT,
  kind         TEXT,                                -- 'tool' | 'app' | 'contract' | 'experiment'
  github_url   TEXT,
  demo_url     TEXT,
  video_url    TEXT,
  technologies TEXT NOT NULL DEFAULT '[]',          -- json array of strings
  images       TEXT NOT NULL DEFAULT '[]',          -- json array of { src, alt }
  accent       TEXT,                                -- optional per-project accent hue
  created_at   INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at   INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_projects_order ON projects (status, order_index);

CREATE TABLE IF NOT EXISTS project_translations (
  project_id  TEXT NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
  lang        TEXT NOT NULL CHECK (lang IN ('en', 'fa')),
  title       TEXT NOT NULL,
  tagline     TEXT,
  description TEXT NOT NULL,
  body        TEXT,                                 -- markdown, optional deep dive
  PRIMARY KEY (project_id, lang)
);

-- ---------------------------------------------------------------- bots

CREATE TABLE IF NOT EXISTS bots (
  id           TEXT PRIMARY KEY,
  slug         TEXT NOT NULL UNIQUE,
  order_index  INTEGER NOT NULL DEFAULT 100,
  status       TEXT NOT NULL DEFAULT 'published',
  handle       TEXT,                                -- @something
  telegram_url TEXT,
  source_url   TEXT,
  users_label  TEXT,                                -- e.g. "~400 chats", free text
  technologies TEXT NOT NULL DEFAULT '[]',
  images       TEXT NOT NULL DEFAULT '[]',
  created_at   INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at   INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_bots_order ON bots (status, order_index);

CREATE TABLE IF NOT EXISTS bot_translations (
  bot_id      TEXT NOT NULL REFERENCES bots (id) ON DELETE CASCADE,
  lang        TEXT NOT NULL CHECK (lang IN ('en', 'fa')),
  name        TEXT NOT NULL,
  description TEXT NOT NULL,
  problem     TEXT,                                 -- the problem it solves
  features    TEXT NOT NULL DEFAULT '[]',           -- json array of strings
  PRIMARY KEY (bot_id, lang)
);

-- ---------------------------------------------------------------- blog

CREATE TABLE IF NOT EXISTS posts (
  id           TEXT PRIMARY KEY,
  slug         TEXT NOT NULL UNIQUE,
  status       TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  category     TEXT,
  tags         TEXT NOT NULL DEFAULT '[]',          -- json array of strings
  cover_image  TEXT,
  reading_hint INTEGER,                             -- minutes, computed on save
  published_at INTEGER,
  created_at   INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at   INTEGER NOT NULL DEFAULT (unixepoch()),
  author_id    TEXT REFERENCES users (id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_posts_feed ON posts (status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts (category);

CREATE TABLE IF NOT EXISTS post_translations (
  post_id         TEXT NOT NULL REFERENCES posts (id) ON DELETE CASCADE,
  lang            TEXT NOT NULL CHECK (lang IN ('en', 'fa')),
  title           TEXT NOT NULL,
  excerpt         TEXT,
  content         TEXT NOT NULL DEFAULT '',         -- markdown
  seo_title       TEXT,
  seo_description TEXT,
  PRIMARY KEY (post_id, lang)
);

-- ---------------------------------------------------------------- media

CREATE TABLE IF NOT EXISTS media (
  id           TEXT PRIMARY KEY,
  r2_key       TEXT NOT NULL UNIQUE,
  filename     TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size         INTEGER NOT NULL,
  width        INTEGER,
  height       INTEGER,
  alt          TEXT,
  created_at   INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_media_recent ON media (created_at DESC);

-- ---------------------------------------------------------------- inbox

CREATE TABLE IF NOT EXISTS inquiries (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  budget     TEXT,
  message    TEXT NOT NULL,
  locale     TEXT NOT NULL DEFAULT 'en',
  ip_hash    TEXT,
  read_at    INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS idx_inquiries_recent ON inquiries (created_at DESC);
