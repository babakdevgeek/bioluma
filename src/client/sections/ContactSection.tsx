import { useState } from "react";
import type { Lang } from "@/shared/types";
import { api } from "../lib/api";
import { useDictionary } from "../i18n/provider";
import { Reveal } from "../ui/Reveal";

export function ContactSection({ id, lang }: { id: string; lang: Lang }) {
  const { t } = useDictionary();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setSending(true);
    setError(null);
    try {
      await api.contact({
        name: String(formData.get("name") ?? ""),
        email: String(formData.get("email") ?? ""),
        budget: String(formData.get("budget") ?? ""),
        message: String(formData.get("message") ?? ""),
        locale: lang,
        website: "",
      });
      setSent(true);
    } catch {
      setError(t.states.failed);
    } finally {
      setSending(false);
    }
  }

  return (
    <section id={id} className="section" aria-labelledby="contact-title">
      <div className="section-inner split">
        <Reveal>
          <div className="stack-lg">
            <div className="stack">
              <span className="section-kicker">{t.contact.kicker}</span>
              <h2 id="contact-title">{t.contact.title}</h2>
              <p className="lede">{t.contact.copy}</p>
            </div>
            <div className="cluster">
              <a className="tag" href="mailto:aghababaky@gmail.com">{t.contact.email}</a>
              <a className="tag" href="https://github.com/babakdevgeek" target="_blank" rel="noreferrer">{t.contact.github}</a>
              <a className="tag" href="https://t.me/babakdevgeek" target="_blank" rel="noreferrer">{t.contact.telegram}</a>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="panel stack" style={{ padding: "1.25rem" }}>
            <h3>{t.contact.formTitle}</h3>
            <form
              className="stack"
              onSubmit={async (event) => {
                event.preventDefault();
                await onSubmit(new FormData(event.currentTarget));
              }}
            >
              <label className="stack" style={{ gap: "0.45rem" }}>
                <span>{t.contact.name}</span>
                <input className="field" name="name" required />
              </label>
              <label className="stack" style={{ gap: "0.45rem" }}>
                <span>Email</span>
                <input className="field" type="email" name="email" required />
              </label>
              <label className="stack" style={{ gap: "0.45rem" }}>
                <span>{t.contact.budget}</span>
                <input className="field" name="budget" placeholder={t.contact.interestingProject} />
              </label>
              <label className="stack" style={{ gap: "0.45rem" }}>
                <span>{t.contact.message}</span>
                <textarea className="textarea" name="message" required />
              </label>
              <input className="visually-hidden" name="website" tabIndex={-1} autoComplete="off" />
              <div className="button-row">
                <button className="button" disabled={sending || sent} type="submit">
                  {sent ? t.contact.sent : sending ? t.states.loading : t.contact.send}
                </button>
                {error && <span className="error-note">{error}</span>}
              </div>
            </form>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
