import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import type { Post, PostSummary } from "@/shared/types";
import { api } from "../lib/api";
import { formatDate } from "../lib/format";
import { useDictionary } from "../i18n/provider";

export function PostPage() {
  const { slug = "" } = useParams();
  const { lang, t } = useDictionary();
  const [post, setPost] = useState<Post | null>(null);
  const [prev, setPrev] = useState<PostSummary | null>(null);
  const [next, setNext] = useState<PostSummary | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let dead = false;
    api
      .post(lang, slug)
      .then((res) => {
        if (dead) return;
        setPost(res.post);
        setPrev(res.prev);
        setNext(res.next);
      })
      .catch(() => {
        if (!dead) setError(true);
      });
    return () => {
      dead = true;
    };
  }, [lang, slug]);

  if (error) return <div className="listing-page"><div className="listing-shell"><p>{t.states.notFound}</p></div></div>;
  if (!post) return <div className="listing-page"><div className="listing-shell"><p>{t.states.loading}</p></div></div>;

  return (
    <div className="article-shell">
      <aside className="article-rail">
        <Link className="button-ghost" to={`/${lang}/blog`}>
          {t.blog.back}
        </Link>
        {post.headings.length > 0 && (
          <div className="article-card stack">
            <span className="tiny">contents</span>
            <nav className="toc">
              {post.headings.map((heading) => (
                <a key={heading.id} href={`#${heading.id}`} style={{ paddingInlineStart: `${(heading.level - 2) * 0.75}rem` }}>
                  {heading.text}
                </a>
              ))}
            </nav>
          </div>
        )}
      </aside>

      <article className="article">
        <header className="article-header">
          <div className="article-meta">
            <span>{formatDate(post.publishedAt, lang)}</span>
            {post.readingMinutes && <span>{post.readingMinutes} {t.blog.minutes}</span>}
            {post.availableIn.length === 1 && <span>{t.blog.readingOnlyIn} {post.availableIn[0].toUpperCase()}</span>}
          </div>
          <h1>{post.title}</h1>
          {post.excerpt && <p className="lede">{post.excerpt}</p>}
          <div className="cluster">
            {post.tags.map((tag) => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        </header>

        <div className="article-body" dangerouslySetInnerHTML={{ __html: post.contentHtml }} />

        <nav className="button-row" aria-label="post navigation">
          {prev && <Link className="button-ghost" to={`/${lang}/blog/${prev.slug}`}>{t.blog.prev}</Link>}
          {next && <Link className="button" to={`/${lang}/blog/${next.slug}`}>{t.blog.next}</Link>}
        </nav>
      </article>
    </div>
  );
}
