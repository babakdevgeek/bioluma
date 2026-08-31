/**
 * Every write is validated here before it reaches D1. Nothing trusts the client.
 */
import { z } from "zod";
import { LANGS } from "@/shared/types";

const slug = z
  .string()
  .min(1)
  .max(90)
  .regex(/^[a-z0-9\u0600-\u06FF]+(?:-[a-z0-9\u0600-\u06FF]+)*$/, "lowercase words separated by hyphens");

const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || /^(https?:\/\/|\/)/.test(v), "must be an http(s) or root-relative URL")
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .optional();

const translation = z.object({
  title: z.string().trim().min(1, "required").max(180),
  excerpt: z.string().trim().max(400).default(""),
  content: z.string().max(300_000).default(""),
  seoTitle: z.string().trim().max(70).default(""),
  seoDescription: z.string().trim().max(180).default(""),
});

/** A post must exist in at least one language, and empty ones are simply absent. */
export const postInput = z.object({
  slug,
  status: z.enum(["draft", "published"]).default("draft"),
  category: z.string().trim().max(60).nullable().default(null),
  tags: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  coverImage: optionalUrl,
  publishedAt: z.number().int().positive().nullable().default(null),
  translations: z
    .object({
      en: translation.partial().optional(),
      fa: translation.partial().optional(),
    })
    .refine(
      (t) => LANGS.some((l) => (t[l]?.title ?? "").trim().length > 0),
      "at least one language needs a title",
    ),
});

export const loginInput = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(8).max(400),
});

export const contactInput = z.object({
  name: z.string().trim().min(2, "who are you?").max(120),
  email: z.string().trim().toLowerCase().email("that address looks wrong").max(200),
  budget: z.string().trim().max(60).nullable().default(null),
  message: z.string().trim().min(10, "a little more detail").max(4000),
  locale: z.enum(LANGS).default("en"),
  // Honeypot: real humans never fill this, bots always do.
  website: z.string().max(0).optional(),
});

export const mediaPatch = z.object({
  alt: z.string().trim().max(300),
});

export const orderPatch = z.object({
  orderIndex: z.number().int().min(0).max(10_000).optional(),
  featured: z.boolean().optional(),
  status: z.enum(["published", "hidden"]).optional(),
});

export const feedQuery = z.object({
  page: z.coerce.number().int().min(1).max(500).default(1),
  perPage: z.coerce.number().int().min(1).max(50).default(12),
  tag: z.string().trim().max(40).optional(),
  category: z.string().trim().max(60).optional(),
  q: z.string().trim().max(120).optional(),
});

export type PostInput = z.infer<typeof postInput>;
export type ContactInput = z.infer<typeof contactInput>;

/** Flattens Zod issues into { field: [messages] } for inline form errors. */
export function fieldErrors(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    (out[key] ??= []).push(issue.message);
  }
  return out;
}
