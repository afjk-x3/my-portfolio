import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CodeXml } from "lucide-react";

import { Button } from "@/components/ui/button";
import { baybayin } from "@/data/baybayin";
import { PROJECT_CATEGORY_LABELS, type CaseStudy, type Project } from "@/types";

function projectStatus(project: Project) {
  if (project.liveUrl) return "Live";
  if (project.repoUrl) return "Source only";
  return "Private";
}

export interface CaseStudyHeaderProps {
  project: Project;
  caseStudy: CaseStudy;
}

/** Title band of a case study: woven texture, Anton title, telemetry spec row. */
export function CaseStudyHeader({ project, caseStudy }: CaseStudyHeaderProps) {
  const specs = [
    { label: "Role", value: caseStudy.role },
    { label: "Year", value: `${project.year} · ${caseStudy.timeframe}` },
    { label: "Team", value: caseStudy.team },
    { label: "Stack", value: project.techStack.join(" / ") },
    { label: "Status", value: projectStatus(project) },
  ];

  return (
    <header className="relative overflow-hidden px-6 pt-32 pb-16 sm:pt-40">
      <div aria-hidden className="bg-weave pointer-events-none absolute inset-0 opacity-[0.05]" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-bg to-transparent"
      />

      <div className="relative mx-auto flex max-w-6xl flex-col gap-10">
        <Link
          href="/#projects"
          className="flex w-fit items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-muted transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          <ArrowLeft aria-hidden className="size-4" />
          Back to projects
        </Link>

        <div className="flex flex-col gap-5">
          <span className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.25em] text-accent">
            <span aria-hidden className="h-px w-8 bg-accent" />
            {PROJECT_CATEGORY_LABELS[project.category]}
            <span aria-hidden className="font-baybayin text-sm tracking-normal text-muted">
              {baybayin.projects.text}
            </span>
          </span>
          <h1 className="font-display text-6xl uppercase leading-[0.85] text-fg sm:text-8xl lg:text-9xl">
            {project.title}
          </h1>
          <p className="max-w-2xl text-lg text-fg/80 sm:text-xl">{project.summary}</p>
        </div>

        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-3 lg:grid-cols-5">
          {specs.map((spec) => (
            <div key={spec.label} className="flex flex-col gap-2 bg-surface p-4 last:col-span-2 sm:last:col-span-1">
              <dt className="font-mono text-[0.65rem] uppercase tracking-[0.25em] text-muted">
                {spec.label}
              </dt>
              <dd className="text-sm text-fg">{spec.value}</dd>
            </div>
          ))}
        </dl>

        {project.liveUrl || project.repoUrl ? (
          <div className="flex flex-wrap gap-3">
            {project.liveUrl ? (
              <Button asChild>
                <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                  Live Demo
                  <ArrowUpRight aria-hidden />
                </a>
              </Button>
            ) : null}
            {project.repoUrl ? (
              <Button asChild variant="outline">
                <a href={project.repoUrl} target="_blank" rel="noopener noreferrer">
                  <CodeXml aria-hidden />
                  Repository
                </a>
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </header>
  );
}
