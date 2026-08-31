/**
 * Markdown to HTML, server side.
 *
 * Raw HTML in post bodies is dropped rather than sanitised. An allowlist
 * sanitiser is a moving target; refusing to emit author HTML at all is a fixed
 * one, and markdown already covers everything a technical article needs.
 * URLs are scheme-checked so a `javascript:` link cannot survive.
 */
import { Marked } from "marked";
import type { Tokens } from "marked";

export interface Heading {
  id: string;
  text: string;
  level: number;
}

const SAFE_SCHEMES = /^(https?:|mailto:|tel:|\/|#|\.\/)/i;

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeUrl(href: string | null | undefined): string | null {
  if (!href) return null;
  const trimmed = href.trim();
  if (!SAFE_SCHEMES.test(trimmed)) return null;
  return escapeHtml(trimmed);
}

function headingId(text: string, taken: Set<string>): string {
  const base =
    text
      .toLowerCase()
      .replace(/<[^>]*>/g, "")
      .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "section";

  let id = base;
  let n = 2;
  while (taken.has(id)) id = `${base}-${n++}`;
  taken.add(id);
  return id;
}

export function renderMarkdown(markdown: string): { html: string; headings: Heading[] } {
  const headings: Heading[] = [];
  const taken = new Set<string>();

  const marked = new Marked({ gfm: true, breaks: false });

  marked.use({
    renderer: {
      // Authored HTML never reaches the page.
      html: () => "",

      heading(this: { parser: { parseInline: (t: unknown[]) => string } }, token: Tokens.Heading) {
        const inner = this.parser.parseInline(token.tokens);
        const plain = token.text.replace(/[*_`[\]]/g, "");
        const id = headingId(plain, taken);
        if (token.depth <= 3) headings.push({ id, text: plain, level: token.depth });
        return `<h${token.depth} id="${id}">${inner}</h${token.depth}>\n`;
      },

      code(token: Tokens.Code) {
        const lang = (token.lang ?? "").split(/\s+/)[0].replace(/[^a-zA-Z0-9+#-]/g, "");
        const cls = lang ? ` class="language-${lang}"` : "";
        const label = lang ? `<span class="code-lang">${escapeHtml(lang)}</span>` : "";
        return `<figure class="code-block">${label}<pre><code${cls}>${escapeHtml(token.text)}</code></pre></figure>\n`;
      },

      link(this: { parser: { parseInline: (t: unknown[]) => string } }, token: Tokens.Link) {
        const href = safeUrl(token.href);
        const inner = this.parser.parseInline(token.tokens);
        if (!href) return inner;
        const external = /^https?:/i.test(href);
        const attrs = external ? ' target="_blank" rel="noopener noreferrer nofollow"' : "";
        const title = token.title ? ` title="${escapeHtml(token.title)}"` : "";
        return `<a href="${href}"${title}${attrs}>${inner}</a>`;
      },

      image(token: Tokens.Image) {
        const src = safeUrl(token.href);
        if (!src) return "";
        const alt = escapeHtml(token.text ?? "");
        const caption = token.title
          ? `<figcaption>${escapeHtml(token.title)}</figcaption>`
          : "";
        return `<figure class="post-figure"><img src="${src}" alt="${alt}" loading="lazy" decoding="async" />${caption}</figure>`;
      },

      blockquote(this: { parser: { parse: (t: unknown[]) => string } }, token: Tokens.Blockquote) {
        return `<blockquote>${this.parser.parse(token.tokens)}</blockquote>\n`;
      },
    },
  });

  const html = marked.parse(markdown ?? "", { async: false }) as string;
  return { html, headings };
}

/** Plain text for meta descriptions and search indexing. */
export function markdownToText(markdown: string, max = 300): string {
  const flat = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_`>|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return flat.length <= max ? flat : `${flat.slice(0, flat.lastIndexOf(" ", max))}\u2026`;
}
