import type { Lang } from "@/shared/types";

export function formatDate(ts: number | null | undefined, lang: Lang): string {
  if (!ts) return "";
  const locale = lang === "fa" ? "fa-IR" : "en-US";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(ts * 1000));
}

export function formatDepth(meters: number, lang: Lang): string {
  if (lang === "fa") return `${new Intl.NumberFormat("fa-IR").format(meters)} متر`;
  return `${meters} m`;
}

export function sizeLabel(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
