import { Outlet, useLocation, useParams } from "react-router";
import { BackdropLayer } from "../ui/BackdropLayer";
import { TopUtilityBar } from "../ui/TopUtilityBar";
import { useDictionary } from "../i18n/provider";

export function ShellLayout() {
  const { lang } = useParams();
  const location = useLocation();
  const { t } = useDictionary();
  const articleMode = /\/blog\/.+/.test(location.pathname);

  return (
    <div className={articleMode ? "article-mode" : "site-shell"}>
      {!articleMode && <BackdropLayer />}
      <a className="sr-only" href="#main-content">
        {t.nav.skipToContent}
      </a>
      <TopUtilityBar lang={lang === "fa" ? "fa" : "en"} articleMode={articleMode} />
      <main id="main-content">
        <Outlet />
      </main>
    </div>
  );
}
