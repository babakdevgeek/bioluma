import { useEffect, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router";
import { slugify } from "@/shared/slug";
import type { PostDraft } from "@/shared/types";
import { api } from "../lib/api";
import { formatDate, sizeLabel } from "../lib/format";

function useSession() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ userId: string; email: string; displayName: string | null } | null>(null);

  useEffect(() => {
    let dead = false;
    api
      .session()
      .then((res) => {
        if (!dead) setUser(res.user);
      })
      .finally(() => {
        if (!dead) setLoading(false);
      });
    return () => {
      dead = true;
    };
  }, []);

  return { loading, user, setUser };
}

function LoginPage({ onLogin }: { onLogin: (user: { userId: string; email: string; displayName: string | null }) => void }) {
  const [email, setEmail] = useState("aghababaky@gmail.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="listing-page">
      <div className="listing-shell" style={{ maxWidth: "34rem" }}>
        <div className="panel stack" style={{ padding: "1.25rem" }}>
          <span className="section-kicker">admin</span>
          <h1>Studio door</h1>
          <p className="muted">This is private. Good.</p>
          <form
            className="stack"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError(null);
              try {
                const res = await api.login(email, password);
                onLogin(res.user);
              } catch {
                setError("nope");
              } finally {
                setBusy(false);
              }
            }}
          >
            <input className="field" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
            <input className="field" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
            <div className="button-row">
              <button className="button" disabled={busy} type="submit">{busy ? "checking" : "enter"}</button>
              {error && <span className="error-note">{error}</span>}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function Shell({ user, onLogout }: { user: { email: string; displayName: string | null }; onLogout: () => void }) {
  return (
    <div className="listing-page">
      <div className="listing-shell">
        <header className="panel" style={{ padding: "1rem 1.1rem" }}>
          <div className="cluster" style={{ justifyContent: "space-between" }}>
            <div className="stack" style={{ gap: ".25rem" }}>
              <span className="section-kicker">studio</span>
              <h2 style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)" }}>bioluma control room</h2>
              <p className="muted">{user.displayName || user.email}</p>
            </div>
            <div className="button-row">
              <Link className="button-ghost" to="/admin">overview</Link>
              <Link className="button-ghost" to="/admin/posts">posts</Link>
              <Link className="button-ghost" to="/admin/media">media</Link>
              <Link className="button-ghost" to="/admin/inquiries">inbox</Link>
              <Link className="button-ghost" to="/admin/catalog">catalog</Link>
              <button className="button" onClick={onLogout} type="button">leave</button>
            </div>
          </div>
        </header>
        <Routes>
          <Route index element={<OverviewPage />} />
          <Route path="posts" element={<PostsPage />} />
          <Route path="posts/new" element={<PostEditorPage />} />
          <Route path="posts/:id" element={<PostEditorPage />} />
          <Route path="media" element={<MediaPage />} />
          <Route path="inquiries" element={<InquiriesPage />} />
          <Route path="catalog" element={<CatalogPage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </div>
    </div>
  );
}

function OverviewPage() {
  const [data, setData] = useState<null | { counts: Record<string, number>; recentPosts: Array<Record<string, unknown>>; unreadInquiries: Array<Record<string, unknown>> }>(null);

  useEffect(() => {
    api.adminOverview().then(setData);
  }, []);

  if (!data) return <p>loading</p>;

  return (
    <div className="stack-lg">
      <div className="grid-catalogue">
        {Object.entries(data.counts).map(([key, value]) => (
          <div key={key} className="panel stack" style={{ padding: "1rem" }}>
            <span className="section-kicker">{key}</span>
            <h3>{String(value)}</h3>
          </div>
        ))}
      </div>
      <div className="grid-catalogue">
        <div className="panel stack" style={{ padding: "1rem" }}>
          <span className="section-kicker">recent posts</span>
          {data.recentPosts.map((item, index) => (
            <div key={index} className="cluster" style={{ justifyContent: "space-between" }}>
              <span>{String(item.title ?? item.slug)}</span>
              <Link className="tag" to={`/admin/posts/${String(item.id)}`}>edit</Link>
            </div>
          ))}
        </div>
        <div className="panel stack" style={{ padding: "1rem" }}>
          <span className="section-kicker">unread inquiries</span>
          {data.unreadInquiries.map((item, index) => (
            <div key={index} className="stack" style={{ gap: ".25rem" }}>
              <strong>{String(item.name)}</strong>
              <p className="muted">{String(item.message).slice(0, 120)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PostsPage() {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  useEffect(() => {
    api.adminPosts().then((res) => setItems(res.items));
  }, []);

  return (
    <div className="stack-lg">
      <div className="button-row">
        <Link className="button" to="/admin/posts/new">new post</Link>
      </div>
      <div className="panel stack" style={{ padding: "1rem" }}>
        {items.map((item) => (
          <div key={String(item.id)} className="cluster" style={{ justifyContent: "space-between" }}>
            <div className="stack" style={{ gap: ".25rem" }}>
              <strong>{String(item.title)}</strong>
              <span className="muted">/{String(item.slug)} · {String(item.status)}</span>
            </div>
            <Link className="button-ghost" to={`/admin/posts/${String(item.id)}`}>edit</Link>
          </div>
        ))}
      </div>
    </div>
  );
}

const blank: PostDraft = {
  id: "",
  slug: "",
  status: "draft",
  category: "",
  tags: [],
  coverImage: "",
  publishedAt: null,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  translations: {
    en: { title: "", excerpt: "", content: "", seoTitle: "", seoDescription: "" },
    fa: { title: "", excerpt: "", content: "", seoTitle: "", seoDescription: "" },
  },
};

function PostEditorPage() {
  const params = useParams();
  const navigate = useNavigate();
  const isNew = params.id === undefined;
  const [draft, setDraft] = useState<PostDraft>(blank);
  const [preview, setPreview] = useState<{ html: string; readingMinutes: number } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isNew) return;
    api.adminPost(params.id as string).then(setDraft);
  }, [isNew, params.id]);

  useEffect(() => {
    const text = draft.translations.en.content || draft.translations.fa.content;
    const id = window.setTimeout(() => {
      api.preview(text).then((p) => setPreview({ html: p.html, readingMinutes: p.readingMinutes }));
    }, 280);
    return () => window.clearTimeout(id);
  }, [draft.translations.en.content, draft.translations.fa.content]);

  async function save() {
    setSaving(true);
    try {
      const payload = {
        slug: draft.slug,
        status: draft.status,
        category: draft.category || null,
        tags: draft.tags,
        coverImage: draft.coverImage || null,
        publishedAt: draft.publishedAt,
        translations: draft.translations,
      };
      const res = await api.savePost(isNew ? null : draft.id, payload);
      navigate(`/admin/posts/${res.id}`, { replace: true });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="split">
      <div className="stack-lg">
        <div className="panel stack" style={{ padding: "1rem" }}>
          <div className="cluster" style={{ justifyContent: "space-between" }}>
            <h3>{isNew ? "new post" : "edit post"}</h3>
            <div className="button-row">
              {!isNew && (
                <button
                  type="button"
                  className="button-ghost"
                  onClick={async () => {
                    if (!confirm("delete this post?")) return;
                    await api.deletePost(draft.id);
                    navigate("/admin/posts");
                  }}
                >
                  delete
                </button>
              )}
              <button className="button" type="button" disabled={saving} onClick={save}>{saving ? "saving" : "save"}</button>
            </div>
          </div>
          <div className="grid-catalogue">
            <label className="stack" style={{ gap: ".45rem" }}>
              <span>slug</span>
              <input className="field" value={draft.slug} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} />
            </label>
            <label className="stack" style={{ gap: ".45rem" }}>
              <span>status</span>
              <select className="select" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as "draft" | "published" })}>
                <option value="draft">draft</option>
                <option value="published">published</option>
              </select>
            </label>
            <label className="stack" style={{ gap: ".45rem" }}>
              <span>category</span>
              <input className="field" value={draft.category ?? ""} onChange={(e) => setDraft({ ...draft, category: e.target.value })} />
            </label>
            <label className="stack" style={{ gap: ".45rem" }}>
              <span>tags</span>
              <input className="field" value={draft.tags.join(", ")} onChange={(e) => setDraft({ ...draft, tags: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} />
            </label>
          </div>
        </div>

        {(["en", "fa"] as const).map((lang) => (
          <div key={lang} className="panel stack" style={{ padding: "1rem" }}>
            <div className="cluster" style={{ justifyContent: "space-between" }}>
              <h3>{lang.toUpperCase()}</h3>
              <button
                type="button"
                className="tag"
                onClick={() => {
                  const title = draft.translations[lang].title;
                  if (!title) return;
                  setDraft({ ...draft, slug: slugify(title) });
                }}
              >
                make slug from title
              </button>
            </div>
            <label className="stack" style={{ gap: ".45rem" }}>
              <span>title</span>
              <input
                className="field"
                dir={lang === "fa" ? "rtl" : "ltr"}
                value={draft.translations[lang].title}
                onChange={(e) => setDraft({
                  ...draft,
                  translations: { ...draft.translations, [lang]: { ...draft.translations[lang], title: e.target.value } },
                })}
              />
            </label>
            <label className="stack" style={{ gap: ".45rem" }}>
              <span>excerpt</span>
              <textarea
                className="textarea"
                dir={lang === "fa" ? "rtl" : "ltr"}
                value={draft.translations[lang].excerpt}
                onChange={(e) => setDraft({
                  ...draft,
                  translations: { ...draft.translations, [lang]: { ...draft.translations[lang], excerpt: e.target.value } },
                })}
              />
            </label>
            <label className="stack" style={{ gap: ".45rem" }}>
              <span>content</span>
              <textarea
                className="textarea"
                style={{ minHeight: "22rem" }}
                dir={lang === "fa" ? "rtl" : "ltr"}
                value={draft.translations[lang].content}
                onChange={(e) => setDraft({
                  ...draft,
                  translations: { ...draft.translations, [lang]: { ...draft.translations[lang], content: e.target.value } },
                })}
              />
            </label>
            <div className="grid-catalogue">
              <label className="stack" style={{ gap: ".45rem" }}>
                <span>seo title</span>
                <input className="field" value={draft.translations[lang].seoTitle} onChange={(e) => setDraft({ ...draft, translations: { ...draft.translations, [lang]: { ...draft.translations[lang], seoTitle: e.target.value } } })} />
              </label>
              <label className="stack" style={{ gap: ".45rem" }}>
                <span>seo description</span>
                <input className="field" value={draft.translations[lang].seoDescription} onChange={(e) => setDraft({ ...draft, translations: { ...draft.translations, [lang]: { ...draft.translations[lang], seoDescription: e.target.value } } })} />
              </label>
            </div>
          </div>
        ))}
      </div>

      <aside className="stack-lg">
        <div className="panel stack" style={{ padding: "1rem" }}>
          <h3>preview</h3>
          <p className="muted">{preview ? `${preview.readingMinutes} min read` : "..."}</p>
          <div className="article-mode article-card">
            <div className="article-body" dangerouslySetInnerHTML={{ __html: preview?.html || "<p>start writing</p>" }} />
          </div>
        </div>
      </aside>
    </div>
  );
}

function MediaPage() {
  const [items, setItems] = useState<Array<{ id: string; url: string; filename: string; size: number; alt: string | null; createdAt: number }>>([]);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const res = await api.media();
    setItems(res.items as Array<{ id: string; url: string; filename: string; size: number; alt: string | null; createdAt: number }>);
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="stack-lg">
      <div className="panel stack" style={{ padding: "1rem" }}>
        <label className="button" style={{ width: "fit-content" }}>
          <input
            className="visually-hidden"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setBusy(true);
              try {
                await api.uploadMedia(file);
                await refresh();
              } finally {
                setBusy(false);
                e.currentTarget.value = "";
              }
            }}
          />
          {busy ? "uploading" : "upload image"}
        </label>
      </div>
      <div className="grid-catalogue">
        {items.map((item) => (
          <div key={item.id} className="panel stack" style={{ padding: "1rem" }}>
            <img src={item.url} alt={item.alt ?? ""} style={{ borderRadius: "1rem", aspectRatio: "16 / 10", objectFit: "cover" }} />
            <strong>{item.filename}</strong>
            <p className="muted">{sizeLabel(item.size)} · {formatDate(item.createdAt, "en")}</p>
            <input
              className="field"
              defaultValue={item.alt ?? ""}
              onBlur={async (e) => {
                await api.patchMedia(item.id, e.target.value);
              }}
            />
            <div className="button-row">
              <button className="button-ghost" type="button" onClick={() => navigator.clipboard.writeText(item.url)}>copy url</button>
              <button className="button" type="button" onClick={async () => { await api.deleteMedia(item.id); await refresh(); }}>delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InquiriesPage() {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  useEffect(() => {
    api.inquiries().then((res) => setItems(res.items));
  }, []);

  return (
    <div className="panel stack" style={{ padding: "1rem" }}>
      {items.map((item) => (
        <article key={String(item.id)} className="stack" style={{ gap: ".55rem", paddingBlock: ".8rem", borderBottom: "1px solid color-mix(in oklab, var(--color-mist-1) 10%, transparent)" }}>
          <div className="cluster" style={{ justifyContent: "space-between" }}>
            <strong>{String(item.name)}</strong>
            <span className="muted">{String(item.email)}</span>
          </div>
          <p>{String(item.message)}</p>
          <div className="button-row">
            <button className="button-ghost" type="button" onClick={() => api.markInquiryRead(String(item.id))}>mark read</button>
          </div>
        </article>
      ))}
    </div>
  );
}

function CatalogPage() {
  const [projects, setProjects] = useState<Array<Record<string, unknown>>>([]);
  const [bots, setBots] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    Promise.all([api.catalog("projects"), api.catalog("bots")]).then(([p, b]) => {
      setProjects(p.items);
      setBots(b.items);
    });
  }, []);

  async function patch(kind: "projects" | "bots", id: string, payload: unknown) {
    await api.patchCatalog(kind, id, payload);
  }

  return (
    <div className="grid-catalogue">
      <div className="panel stack" style={{ padding: "1rem" }}>
        <h3>projects</h3>
        {projects.map((item) => (
          <div key={String(item.id)} className="cluster" style={{ justifyContent: "space-between" }}>
            <span>{String(item.label ?? item.slug)}</span>
            <div className="cluster">
              <input className="field" style={{ width: "5rem" }} defaultValue={String(item.order_index ?? "")}
                onBlur={(e) => patch("projects", String(item.id), { orderIndex: Number(e.target.value) || 0 })} />
              <button className="tag" type="button" onClick={() => patch("projects", String(item.id), { featured: !(item.featured === 1) })}>toggle featured</button>
            </div>
          </div>
        ))}
      </div>
      <div className="panel stack" style={{ padding: "1rem" }}>
        <h3>bots</h3>
        {bots.map((item) => (
          <div key={String(item.id)} className="cluster" style={{ justifyContent: "space-between" }}>
            <span>{String(item.label ?? item.slug)}</span>
            <input className="field" style={{ width: "5rem" }} defaultValue={String(item.order_index ?? "")}
              onBlur={(e) => patch("bots", String(item.id), { orderIndex: Number(e.target.value) || 0 })} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminApp() {
  const { loading, user, setUser } = useSession();
  const location = useLocation();

  if (loading) return <div className="listing-page"><div className="listing-shell"><p>loading</p></div></div>;
  if (!user) return <LoginPage onLogin={setUser} />;
  if (location.pathname === "/admin/login") return <Navigate to="/admin" replace />;

  return (
    <Shell
      user={user}
      onLogout={async () => {
        await api.logout();
        setUser(null);
      }}
    />
  );
}
