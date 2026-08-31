import type { Project } from "@/shared/types";
import { useDictionary } from "../i18n/provider";
import { Reveal } from "../ui/Reveal";

function ProjectArtifact({ project }: { project: Project }) {
  return (
    <article className="panel stack" style={{ padding: "1rem" }}>
      <div className="media-frame">
        <span className="tiny">{project.kind ?? "artifact"}</span>
      </div>
      <div className="stack" style={{ gap: "0.85rem" }}>
        <div className="cluster">
          <h3 style={{ flex: 1 }}>{project.title}</h3>
          {project.featured && <span className="tag">featured</span>}
        </div>
        {project.tagline && <p className="muted">{project.tagline}</p>}
        <p>{project.description}</p>
        <div className="cluster">
          {project.technologies.slice(0, 5).map((tech) => (
            <span key={tech} className="tag">{tech}</span>
          ))}
        </div>
        <div className="button-row">
          {project.githubUrl && (
            <a className="button-ghost" href={project.githubUrl} target="_blank" rel="noreferrer">
              view code
            </a>
          )}
          {project.demoUrl && (
            <a className="button" href={project.demoUrl} target="_blank" rel="noreferrer">
              open demo
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

export function ProjectsSection({ id, items }: { id: string; items: Project[] }) {
  const { t } = useDictionary();

  return (
    <section id={id} className="section" aria-labelledby="projects-title">
      <div className="section-inner stack-lg">
        <Reveal>
          <div className="stack">
            <span className="section-kicker">{t.projects.kicker}</span>
            <h2 id="projects-title">{t.projects.title}</h2>
            <p className="lede">{t.projects.copy}</p>
          </div>
        </Reveal>

        <div className="grid-catalogue">
          {items.map((project, index) => (
            <Reveal key={project.id} delay={Math.min(index * 0.04, 0.18)}>
              <ProjectArtifact project={project} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
