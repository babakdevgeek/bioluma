import { Link, useLocation } from "react-router";
import type { Lang } from "@/shared/types";
import { useDictionary } from "../i18n/provider";
import { useJourneyStore } from "../stores/journey";

function swap(pathname: string, next: Lang): string {
  return pathname.replace(/^\/(en|fa)\b/, `/${next}`) || `/${next}`;
}

export function TopUtilityBar({ lang, articleMode }: { lang: Lang; articleMode: boolean }) {
  const location = useLocation();
  const { t } = useDictionary();
  const soundOn = useJourneyStore((s) => s.soundOn);
  const setSoundOn = useJourneyStore((s) => s.setSoundOn);
  const sceneEnabled = useJourneyStore((s) => s.sceneEnabled);

  return (
    <div className="overlay-topbar">
      <div className="utility-bar" role="navigation" aria-label="utility">
        {!articleMode && (
          <>
            <Link className="utility-chip" aria-current={location.pathname === `/${lang}` ? "true" : undefined} to={`/${lang}`}>
              {t.nav.home}
            </Link>
            <Link
              className="utility-chip"
              aria-current={location.pathname.startsWith(`/${lang}/blog`) ? "true" : undefined}
              to={`/${lang}/blog`}
            >
              {t.nav.blog}
            </Link>
          </>
        )}

        <Link className="utility-chip" to={swap(location.pathname, lang === "en" ? "fa" : "en")}>
          {t.meta.otherLang}
        </Link>

        {!articleMode && sceneEnabled && (
          <button
            type="button"
            className="utility-chip"
            aria-pressed={soundOn}
            onClick={() => setSoundOn(!soundOn)}
          >
            {soundOn ? t.nav.soundOn : t.nav.soundOff}
          </button>
        )}

        {!sceneEnabled && !articleMode && <span className="utility-chip">{t.nav.reducedMode}</span>}
      </div>
    </div>
  );
}
