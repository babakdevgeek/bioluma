import { Link } from "react-router";
import type { Lang, PostSummary } from "@/shared/types";
import { formatDate } from "../lib/format";
import { useDictionary } from "../i18n/provider";
import { Reveal } from "../ui/Reveal";

export function BlogSection({ id, items, lang }: { id: string; items: PostSummary[]; lang: Lang }) {
  const { t } = useDictionary();

  return (
    <section id={id} className="section" aria-labelledby="blog-title">
      <div className="section-inner stack-lg">
        <Reveal>
          <div className="stack">
            <span className="section-kicker">{t.blog.kicker}</span>
            <h2 id="blog-title">{t.blog.title}</h2>
            <p className="lede">{t.blog.copy}</p>
            <div>
              <Link className="button" to={`/${lang}/blog`}>{t.blog.browse}</Link>
            </div>
          </div>
        </Reveal>

        <div className="grid-catalogue">
          {items.map((post, index) => (
            <Reveal key={post.id} delay={Math.min(index * 0.05, 0.15)}>
              <article className="panel stack" style={{ padding: "1.15rem" }}>
                <span className="tiny">{formatDate(post.publishedAt, lang)}</span>
                <h3>{post.title}</h3>
                {post.excerpt && <p className="muted">{post.excerpt}</p>}
                <div className="cluster">
                  {post.tags.slice(0, 4).map((tag) => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
                <div>
                  <Link className="button-ghost" to={`/${lang}/blog/${post.slug}`}>
                    {t.blog.read}
                  </Link>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
