import { STAGES, STAGE_DEPTH } from "@/shared/types";
import type { Lang, Stage } from "@/shared/types";
import { formatDepth } from "../lib/format";
import { useDictionary } from "../i18n/provider";
import { useJourneyStore } from "../stores/journey";

export function DepthNav({ ids, lang }: { ids: Record<Stage, string>; lang: Lang }) {
  const { t } = useDictionary();
  const stage = useJourneyStore((s) => s.stage);
  const progress = useJourneyStore((s) => s.progress);

  return (
    <aside className="nav-rail" aria-label="Section navigation">
      <div className="depth-gauge">
        <span className="depth-readout">{formatDepth(STAGE_DEPTH[stage], lang)}</span>
        <div className="depth-line" aria-hidden="true">
          <div className="depth-progress" style={{ ["--depth-progress" as string]: `${Math.min(1, Math.max(0, progress)) * 320}px` }} />
        </div>
        <div className="nav-dots">
          {STAGES.map((s) => (
            <a key={s} href={`#${ids[s]}`} className="nav-dot" aria-current={stage === s ? "true" : undefined} aria-label={t.nav[s]}>
              <span className="tiny">{t.nav[s].slice(0, 1)}</span>
            </a>
          ))}
        </div>
      </div>
    </aside>
  );
}
