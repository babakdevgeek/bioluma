import { useEffect } from "react";
import type { Stage } from "@/shared/types";
import { useJourneyStore } from "../stores/journey";

/**
 * Tracks whichever section occupies the strongest part of the viewport and feeds
 * that into the nav rail + Three scene.
 */
export function useSectionTracking(ids: Record<Stage, string>) {
  useEffect(() => {
    const targets = Object.entries(ids)
      .map(([stage, id]) => ({ stage: stage as Stage, node: document.getElementById(id) }))
      .filter((item): item is { stage: Stage; node: HTMLElement } => Boolean(item.node));

    if (!targets.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const top = [...entries]
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!top) return;
        const hit = targets.find((t) => t.node === top.target);
        if (hit) useJourneyStore.getState().setStage(hit.stage);
      },
      { rootMargin: "-25% 0px -30% 0px", threshold: [0.2, 0.45, 0.7] },
    );

    for (const t of targets) observer.observe(t.node);

    const onScroll = () => {
      const height = document.documentElement.scrollHeight - window.innerHeight;
      useJourneyStore.getState().setProgress(height <= 0 ? 0 : window.scrollY / height);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [ids]);
}
