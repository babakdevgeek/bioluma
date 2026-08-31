import type { Bot } from "@/shared/types";
import { useDictionary } from "../i18n/provider";
import { Reveal } from "../ui/Reveal";

function BotNode({ bot }: { bot: Bot }) {
  const { t } = useDictionary();
  return (
    <article className="panel stack" style={{ padding: "1.15rem" }}>
      <div className="cluster">
        <span className="signal" aria-hidden="true" />
        <h3>{bot.name}</h3>
      </div>
      <p>{bot.description}</p>
      {bot.problem && (
        <div className="stack" style={{ gap: "0.55rem" }}>
          <span className="tiny">{t.bots.problem}</span>
          <p className="muted">{bot.problem}</p>
        </div>
      )}
      <div className="stack" style={{ gap: "0.75rem" }}>
        <span className="tiny">{t.bots.features}</span>
        <div className="cluster">
          {bot.features.slice(0, 4).map((feature) => (
            <span key={feature} className="tag">{feature}</span>
          ))}
        </div>
      </div>
      <div className="button-row">
        {bot.telegramUrl && (
          <a className="button" href={bot.telegramUrl} target="_blank" rel="noreferrer">
            {t.bots.telegram}
          </a>
        )}
        {bot.sourceUrl && (
          <a className="button-ghost" href={bot.sourceUrl} target="_blank" rel="noreferrer">
            {t.bots.source}
          </a>
        )}
      </div>
    </article>
  );
}

export function BotsSection({ id, items }: { id: string; items: Bot[] }) {
  const { t } = useDictionary();
  return (
    <section id={id} className="section" aria-labelledby="bots-title">
      <div className="section-inner stack-lg">
        <Reveal>
          <div className="stack">
            <span className="section-kicker">{t.bots.kicker}</span>
            <h2 id="bots-title">{t.bots.title}</h2>
            <p className="lede">{t.bots.copy}</p>
          </div>
        </Reveal>
        <div className="grid-catalogue">
          {items.map((bot, index) => (
            <Reveal key={bot.id} delay={Math.min(index * 0.04, 0.18)}>
              <BotNode bot={bot} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
