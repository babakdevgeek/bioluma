import { useEffect, useMemo, useState } from "react";
import type { Bot, Lang, PostSummary, Project, Stage } from "@/shared/types";
import { api } from "../lib/api";
import { useDictionary } from "../i18n/provider";
import { useCanRenderScene } from "../lib/motion";
import { useSectionTracking } from "../hooks/useSectionTracking";
import { useJourneyStore } from "../stores/journey";
import { AboutSection } from "../sections/AboutSection";
import { BlogSection } from "../sections/BlogSection";
import { BotsSection } from "../sections/BotsSection";
import { ContactSection } from "../sections/ContactSection";
import { ProjectsSection } from "../sections/ProjectsSection";
import { DepthNav } from "../ui/DepthNav";
import { SceneLayer } from "../ui/SceneLayer";

const sectionIds: Record<Stage, string> = {
  surface: "about",
  drift: "projects",
  relay: "bots",
  archive: "blog-home",
  ascent: "contact",
};

export function HomePage() {
  const { lang, t } = useDictionary();
  const canRenderScene = useCanRenderScene();
  const setSceneEnabled = useJourneyStore((s) => s.setSceneEnabled);
  const [data, setData] = useState<{ projects: Project[]; bots: Bot[]; posts: PostSummary[] } | null>(null);
  const [error, setError] = useState(false);

  useSectionTracking(sectionIds);

  useEffect(() => {
    setSceneEnabled(canRenderScene);
  }, [canRenderScene, setSceneEnabled]);

  useEffect(() => {
    let cancelled = false;
    api
      .home(lang)
      .then((next) => {
        if (!cancelled) setData(next);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [lang]);

  const fallback = useMemo(
    () => ({ projects: [] as Project[], bots: [] as Bot[], posts: [] as PostSummary[] }),
    [],
  );
  const content = data ?? fallback;

  return (
    <div className="page-grid">
      <DepthNav ids={sectionIds} lang={lang as Lang} />
      <div className="content-column">
        {canRenderScene && <SceneLayer />}
        <AboutSection id={sectionIds.surface} lang={lang as Lang} />
        {error ? (
          <section className="section">
            <div className="section-inner">
              <p>{t.states.failed}</p>
            </div>
          </section>
        ) : (
          <>
            <ProjectsSection id={sectionIds.drift} items={content.projects} />
            <BotsSection id={sectionIds.relay} items={content.bots} />
            <BlogSection id={sectionIds.archive} items={content.posts} lang={lang as Lang} />
          </>
        )}
        <ContactSection id={sectionIds.ascent} lang={lang as Lang} />
      </div>
    </div>
  );
}
