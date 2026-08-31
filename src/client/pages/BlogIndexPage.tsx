import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import type { PostSummary } from "@/shared/types";
import { api } from "../lib/api";
import { formatDate } from "../lib/format";
import { useDictionary } from "../i18n/provider";

export function BlogIndexPage() {
  const { lang, t } = useDictionary();
  const [items, setItems] = useState<PostSummary[]>([]);
  const [tags, setTags] = useState<Array<{ value: string; total: number }>>([]);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let dead = false;
    setLoading(true);

    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("perPage", "24");
    if (search.trim()) params.set("q", search.trim());
    if (activeTag) params.set("tag", activeTag);

    Promise.all([api.posts(lang, params), api.taxonomy()])
      .then(([posts, taxonomy]) => {
        if (dead) return;
        setItems(posts.items);
        setTags(taxonomy.tags);
      })
      .finally(() => {
        if (!dead) setLoading(false);
      });

    return () => {
      dead = true;
    };
  }, [lang, search, activeTag]);

  const header = useMemo(
    () => (
      <header className="stack-lg">
        <div className="stack">
          <span className="section-kicker">{t.blog.kicker}</span>
          <h1>{t.blog.title}</h1>
          <p className="lede">{t.blog.copy}</p>
        </div>
        <div className="panel stack" style={{ padding: "1rem" }}>
          <label className="stack" style={{ gap: "0.45rem" }}>
            <span className="tiny">{t.blog.searchLabel}</span>
            <input
              className="field"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.blog.searchPlaceholder}
            />
          </label>
          <div className="cluster" aria-label={t.blog.tags}>
            <button className="tag" type="button" onClick={() => setActiveTag(null)}>
              all
            </button>
            {tags.slice(0, 14).map((tag) => (
              <button
                key={tag.value}
                className="tag"
                type="button"
                aria-pressed={activeTag === tag.value}
                onClick={() => setActiveTag(activeTag === tag.value ? null : tag.value)}
              >
                {tag.value} <span className="muted">{tag.total}</span>
              </button>
            ))}
          </div>
        </div>
      </header>
    ),
    [activeTag, search, t.blog.copy, t.blog.kicker, t.blog.searchLabel, t.blog.searchPlaceholder, t.blog.tags, t.blog.title, tags],
  );

  return (
    <div className="listing-page">
      <div className="listing-shell">
        {header}
        {loading ? (
          <p>{t.states.loading}</p>
        ) : items.length ? (
          <div className="grid-catalogue">
            {items.map((post) => (
              <article key={post.id} className="panel stack" style={{ padding: "1rem" }}>
                <span className="tiny">{formatDate(post.publishedAt, lang)}</span>
                <h3>{post.title}</h3>
                {post.excerpt && <p className="muted">{post.excerpt}</p>}
                <div className="cluster">
                  {post.tags.map((tag) => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
                <div>
                  <Link className="button-ghost" to={`/${lang}/blog/${post.slug}`}>
                    {t.blog.read}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p>{t.blog.noPosts}</p>
        )}
      </div>
    </div>
  );
}
