import type { Bot, MediaItem, Paged, Post, PostDraft, PostSummary, Project } from "@/shared/types";

async function request<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
    ...init,
  });

  if (!res.ok) {
    const payload = (await res.json().catch(() => null)) as { error?: string; details?: unknown } | null;
    const err = new Error(payload?.error || `Request failed: ${res.status}`) as Error & {
      status?: number;
      details?: unknown;
    };
    err.status = res.status;
    err.details = payload?.details;
    throw err;
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  home(lang: string) {
    return request<{ projects: Project[]; bots: Bot[]; posts: PostSummary[] }>(`/api/content/home?lang=${lang}`);
  },
  projects(lang: string) {
    return request<{ items: Project[] }>(`/api/content/projects?lang=${lang}`);
  },
  project(lang: string, slug: string) {
    return request<Project>(`/api/content/projects/${slug}?lang=${lang}`);
  },
  bots(lang: string) {
    return request<{ items: Bot[] }>(`/api/content/bots?lang=${lang}`);
  },
  posts(lang: string, params: URLSearchParams) {
    return request<Paged<PostSummary>>(`/api/content/posts?lang=${lang}&${params.toString()}`);
  },
  post(lang: string, slug: string) {
    return request<{ post: Post; prev: PostSummary | null; next: PostSummary | null }>(
      `/api/content/posts/${slug}?lang=${lang}`,
    );
  },
  taxonomy() {
    return request<{ tags: { value: string; total: number }[]; categories: { value: string; total: number }[] }>(
      "/api/content/taxonomy",
    );
  },
  session() {
    return request<{ user: { userId: string; email: string; displayName: string | null } | null }>(
      "/api/auth/session",
    );
  },
  login(email: string, password: string) {
    return request<{ user: { userId: string; email: string; displayName: string | null } }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },
  logout() {
    return request<{ ok: true }>("/api/auth/logout", { method: "POST", body: JSON.stringify({}) });
  },
  adminOverview() {
    return request<{
      counts: Record<string, number>;
      recentPosts: unknown[];
      unreadInquiries: unknown[];
    }>("/api/admin/overview");
  },
  adminPosts(query = "") {
    return request<{ items: Array<Record<string, unknown>> }>(`/api/admin/posts${query}`);
  },
  adminPost(id: string) {
    return request<PostDraft>(`/api/admin/posts/${id}`);
  },
  savePost(id: string | null, payload: unknown) {
    return request<{ id: string }>(id ? `/api/admin/posts/${id}` : "/api/admin/posts", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(payload),
    });
  },
  deletePost(id: string) {
    return request<{ ok: true }>(`/api/admin/posts/${id}`, { method: "DELETE" });
  },
  preview(markdown: string) {
    return request<{ html: string; headings: { id: string; text: string; level: number }[]; readingMinutes: number }>(
      "/api/admin/preview",
      { method: "POST", body: JSON.stringify({ markdown }) },
    );
  },
  media() {
    return request<{ items: MediaItem[] }>("/api/admin/media");
  },
  uploadMedia(file: File, alt = "") {
    const form = new FormData();
    form.set("file", file);
    form.set("alt", alt);
    return fetch("/api/admin/media", { method: "POST", body: form, credentials: "include" }).then((r) => {
      if (!r.ok) throw new Error(`upload failed: ${r.status}`);
      return r.json() as Promise<MediaItem>;
    });
  },
  patchMedia(id: string, alt: string) {
    return request<{ ok: true }>(`/api/admin/media/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ alt }),
    });
  },
  deleteMedia(id: string) {
    return request<{ ok: true }>(`/api/admin/media/${id}`, { method: "DELETE" });
  },
  inquiries() {
    return request<{ items: Array<Record<string, unknown>> }>("/api/admin/inquiries");
  },
  markInquiryRead(id: string) {
    return request<{ ok: true }>(`/api/admin/inquiries/${id}`, { method: "PATCH", body: JSON.stringify({}) });
  },
  catalog(kind: "projects" | "bots") {
    return request<{ items: Array<Record<string, unknown>> }>(`/api/admin/${kind}`);
  },
  patchCatalog(kind: "projects" | "bots", id: string, payload: unknown) {
    return request<{ ok: true }>(`/api/admin/${kind}/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
  contact(payload: unknown) {
    return request<{ ok: true }>("/api/contact", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};
