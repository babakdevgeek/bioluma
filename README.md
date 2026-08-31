# BIOLUMA

The personal site of **Babak Bayat**, built as a descent instead of a portfolio.

You don't scroll through cards. You sink. The visitor starts at the surface in daylight, drops through four depth layers (work, bots, writing), and surfaces again at the contact section. A single translucent organism travels with you the whole way and reacts to what you do. Three times during the descent a discharge event tears through the water, blows the creature apart into particles, and the particles reassemble as the next layer.

Not a template. Not a hero section with a gradient.

```
   0 m   SURFACE    who I am
 240 m   THE DRIFT  projects, suspended as artifacts
 900 m   THE RELAY  telegram bots, wired as a signal reef
2400 m   THE ARCHIVE writing, settled in sediment
   ^     ASCENT     contact, breaking back into light
```

---

## Design notes

**Concept.** Bioluminescence in a lightless place. The palette is a blue-black void lit by three living colours: acid chartreuse (life), magenta (electricity), amber (surface light). Nothing glows constantly. Light is an event.

**The reading inversion.** The whole site is dark, cold and animated. Open a single article and the world flips to warm paper, animation stops, and it becomes a quiet reading room. Descending is theatre; reading is not.

**Type.** Bricolage Grotesque for display (variable, slightly wrong on purpose), Instrument Sans for interface, JetBrains Mono for instrument readouts and code. Vazirmatn for Persian, sized and tracked for Persian rather than inheriting Latin metrics.

**Navigation is a depth gauge**, not a nav bar. It shows where you are in metres, and every stop is a direct link. You can always jump. You are never trapped inside an animation.

---

## Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Runtime | **Cloudflare Workers** (not Pages) | Single deploy unit, API and pages in one request path |
| Server | Hono | Tiny router, first-class Workers support |
| UI | React 19 + TypeScript | |
| 3D | Three.js + React Three Fiber + drei | Declarative scene graph tied to journey state |
| Motion | Motion (DOM) + custom scroll driver | |
| Styling | Tailwind CSS v4 (`@theme` tokens) | Logical properties give real RTL for free |
| State | Zustand | r3f-friendly, avoids re-render storms |
| Content DB | Cloudflare **D1** | Posts, projects, bots, translations |
| Assets | Cloudflare **R2** | Uploaded images, served through the Worker with immutable cache |
| Sessions / rate limit | Cloudflare **KV** | Opaque session tokens, IP counters |
| Auth | Own session layer: PBKDF2-SHA256 + HttpOnly cookies | No third-party dependency, no secrets in the client |

No audio files, no 3D model downloads. The creature is generated from a subdivided icosahedron with a custom vertex shader, and every sound is synthesised at runtime with Web Audio. First paint stays cheap.

---

## Architecture

```
request
  |
  v
Worker (src/worker)  <-- runs first on every request
  |-- /api/content/*   public read API           -> D1
  |-- /api/auth/*      login, logout, session    -> D1 + KV
  |-- /api/admin/*     authenticated CRUD        -> D1 + R2
  |-- /api/contact     inquiry form, rate limited-> D1 + KV
  |-- /media/:key      image delivery           -> R2
  |-- /sitemap.xml /robots.txt /rss.xml          -> D1
  \-- everything else  SPA shell + injected per-route SEO head
```

Content is **never hardcoded into components**. Every project, bot and post is a row in D1 with a per-language translation row. Add content through the admin dashboard or `db/seed.sql`; the frontend does not change.

### Directory map

```
src/
  worker/            Hono app: routes, auth, markdown, SEO shell
  client/
    three/           scene, creature shaders, particles, discharge
    sections/        the five depth layers
    pages/           home, blog index, article, 404
    admin/           private dashboard (lazy chunk)
    i18n/            en.ts / fa.ts dictionaries + direction handling
  shared/            types and helpers used by both sides
db/                  schema.sql, seed.sql
scripts/             password hashing helper
```

---

## Getting it running

```bash
npm install
```

### 1. Create the Cloudflare resources

```bash
npx wrangler d1 create bioluma-db
npx wrangler kv namespace create SESSIONS
npx wrangler r2 bucket create bioluma-media
```

Paste the returned ids into `wrangler.jsonc` (they are placeholders right now).

### 2. Load schema and seed

```bash
# local
npx wrangler d1 execute bioluma-db --local --file=./db/schema.sql
npx wrangler d1 execute bioluma-db --local --file=./db/seed.sql

# remote
npx wrangler d1 execute bioluma-db --remote --file=./db/schema.sql
npx wrangler d1 execute bioluma-db --remote --file=./db/seed.sql
```

### 3. Create your admin account

Never commit a password. Generate the hash locally:

```bash
node scripts/hash-password.mjs "your-long-passphrase"
```

It prints a ready `INSERT` statement. Run it:

```bash
npx wrangler d1 execute bioluma-db --remote --command "<paste the INSERT>"
```

### 4. Secrets

```bash
npx wrangler secret put SESSION_SECRET     # any long random string
```

For local dev copy `.dev.vars.example` to `.dev.vars`.

### 5. Develop

```bash
npm run dev      # http://localhost:5173
```

Vite serves the client with HMR and runs the real Worker in workerd, so the API you develop against is the API you deploy.

### 6. Deploy

```bash
npm run deploy
```

This builds the client, then `wrangler deploy` publishes the Worker with the static assets attached. Workers, not Pages.

---

## The admin dashboard

`/admin` is a lazy-loaded chunk that ships no data of its own. Everything is fetched from `/api/admin/*`, which returns `401` without a valid session. Hiding the route is not the security model; the server is.

- session cookie is `HttpOnly`, `Secure`, `SameSite=Lax`, path-scoped, 7 day sliding TTL held in KV
- passwords are PBKDF2-SHA256, 210,000 iterations, per-user 16-byte salt, verified in constant time
- login is rate limited per IP (5 attempts / 15 min) and per account
- every write validates with Zod before it reaches D1
- uploads are extension- and magic-byte-checked, size-capped, and stored in R2 under a random key so a filename can never traverse
- markdown is rendered server-side with raw HTML dropped, so a post can never inject script

What it does: overview, post list with status filters, a long-form editor with live preview, slug generation, cover images, tags, categories, publish date, SEO title/description, and **separate English and Persian bodies** for the same post. Drafts are invisible to the public API.

---

## Internationalisation

English and Persian are peers, not a translation layer.

- routes are language-prefixed: `/en/...` and `/fa/...`; `/` negotiates from `Accept-Language`
- `dir` is set on `<html>`, and all layout uses logical properties, so RTL is structural rather than mirrored with hacks
- Persian gets Vazirmatn with its own size and line-height compensation, not Latin metrics
- dates format per locale, including Persian calendar-appropriate output
- a post can exist in one language only, and the UI says so instead of showing an empty page
- 3D camera and scroll direction stay natural in RTL; only the interface mirrors

---

## Performance and access

The scene is expensive by nature, so it is negotiated rather than assumed:

- a device tier is measured on boot (cores, memory, pointer type, viewport) and drives DPR ceiling, particle counts, bloom, and shader subdivision
- the canvas mounts lazily after first paint, and rendering pauses when the tab is hidden or the canvas is offscreen
- `prefers-reduced-motion` skips the 3D layer entirely and serves a static composed backdrop
- if WebGL is missing or fails, the same DOM content renders unchanged. Nothing important lives inside the canvas
- three, r3f and the admin bundle are separate chunks; an article page never downloads the scene
- R2 images are served `immutable` with long max-age; API reads are cached at the edge with short TTLs

Every section is semantic HTML with real headings, focus states, alt text and keyboard paths. The art is a layer on top of a site that works without it.

---

## Adding content without touching the frontend

```sql
-- a project
INSERT INTO projects (id, slug, order_index, featured, github_url, demo_url, technologies, images)
VALUES ('prj_new', 'new-thing', 60, 1, 'https://github.com/...', NULL, '["TypeScript"]', '[]');

INSERT INTO project_translations (project_id, lang, title, description)
VALUES ('prj_new', 'en', 'New Thing', 'What it does.'),
       ('prj_new', 'fa', 'چیز جدید', 'کاری که انجام می‌دهد.');
```

Bots follow the same shape. Posts go through the dashboard.

---

## License

MIT for the code. The visual concept, copy and content are mine.
