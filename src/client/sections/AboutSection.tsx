import type { Lang } from "@/shared/types";
import { Reveal } from "../ui/Reveal";
import { useDictionary } from "../i18n/provider";

export function AboutSection({ id, lang }: { id: string; lang: Lang }) {
  const { t } = useDictionary();

  return (
    <section id={id} className="section" aria-labelledby="about-title">
      <div className="section-inner split">
        <Reveal>
          <div className="stack-lg">
            <div className="stack">
              <span className="section-kicker">0 m, {t.home.depths.surface}</span>
              <h1 id="about-title">{t.home.title}</h1>
              <p className="lede">{t.home.intro}</p>
              <p className="muted">{t.home.intro2}</p>
            </div>

            <div className="button-row">
              <a className="button" href="#projects">{t.home.ctaExplore}</a>
              <a className="button-ghost" href={`/${lang}/blog`}>{t.home.ctaBlog}</a>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="panel stack" style={{ padding: "1.35rem" }}>
            <div className="media-frame">
              <span className="tiny">pressure companion online</span>
            </div>
            <div className="stack">
              <p>{t.home.whatIDo}</p>
              <div className="cluster" aria-label={t.home.profileLabel}>
                <a className="tag" href="https://github.com/babakdevgeek" target="_blank" rel="noreferrer">
                  <span className="signal" aria-hidden="true" /> GitHub
                </a>
                <a className="tag" href="mailto:aghababaky@gmail.com">
                  <span className="signal" aria-hidden="true" /> Email
                </a>
                <a className="tag" href="https://t.me/babakdevgeek" target="_blank" rel="noreferrer">
                  <span className="signal" aria-hidden="true" /> Telegram
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
