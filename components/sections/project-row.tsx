"use client";

import { ArrowUpRight, ChevronDown, CodeXml } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PROJECT_CATEGORY_LABELS, type Project } from "@/types";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

export interface ProjectRowProps {
  project: Project;
  /** 1-based place in the standings, shown as `P1`, `P2`, … */
  position: number;
  open: boolean;
  /** False for opens driven by a deep link, which must not shift the page while it scrolls. */
  animate: boolean;
  onToggle: () => void;
}

/** One project in the standings: a header button and the details it opens in place. */
export function ProjectRow({ project, position, open, animate, onToggle }: ProjectRowProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const { slug } = project;
  const category = PROJECT_CATEGORY_LABELS[project.category];
  const hasLinks = Boolean(project.liveUrl || project.repoUrl);

  const region = {
    id: `${slug}-details`,
    role: "region",
    "aria-labelledby": `${slug}-header`,
  } as const;

  const details = (
    <div className="flex flex-col gap-5 pr-2 pb-8 pl-[4.5rem]">
      <p className="text-lg text-fg/80">{project.summary}</p>
      <p className="max-w-2xl text-base leading-relaxed text-muted">{project.description}</p>

      <ul className="flex flex-wrap gap-2">
        {project.techStack.map((tech) => (
          <li key={tech}>
            <Badge>{tech}</Badge>
          </li>
        ))}
      </ul>

      {hasLinks ? (
        <div className="flex flex-wrap gap-3">
          {project.liveUrl ? (
            <Button asChild size="sm">
              <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                Live Demo
                <ArrowUpRight aria-hidden />
              </a>
            </Button>
          ) : null}
          {project.repoUrl ? (
            <Button asChild variant="outline" size="sm">
              <a href={project.repoUrl} target="_blank" rel="noopener noreferrer">
                <CodeXml aria-hidden />
                Repository
              </a>
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );

  return (
    <li id={slug} className={cn("border-t border-line transition-colors", open && "bg-surface")}>
      <h4>
        <button
          type="button"
          id={`${slug}-header`}
          aria-expanded={open}
          aria-controls={`${slug}-details`}
          onClick={onToggle}
          className="group grid min-h-11 w-full grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-x-4 px-2 py-5 text-left transition-colors hover:bg-surface/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:grid-cols-[3rem_minmax(0,1fr)_10rem_4rem_1.5rem]"
        >
          <span
            className={cn(
              "font-mono text-sm transition-colors group-hover:text-accent",
              open ? "text-accent" : "text-muted",
            )}
          >
            P{position}
          </span>
          <span className="flex min-w-0 flex-col gap-1">
            <span className="font-display text-2xl uppercase tracking-wide text-fg sm:text-3xl">
              {project.title}
            </span>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted md:hidden">
              {category} · {project.year}
            </span>
          </span>
          <span className="hidden font-mono text-xs uppercase tracking-[0.2em] text-muted md:block">
            {category}
          </span>
          <span className="hidden font-mono text-xs uppercase tracking-[0.2em] text-muted md:block">
            {project.year}
          </span>
          <ChevronDown
            aria-hidden
            className={cn("size-5 text-muted transition-transform duration-300", open && "rotate-180 text-accent")}
          />
        </button>
      </h4>

      {/*
       * Deep-link opens skip the animation entirely, so every row's final
       * height is in place in the same render and the scroll that follows
       * lands exactly on the row.
       */}
      {animate ? (
        <AnimatePresence initial={false}>
          {open ? (
            <motion.div
              {...region}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.35, ease: EASE_OUT_EXPO }}
              className="overflow-hidden"
            >
              {details}
            </motion.div>
          ) : null}
        </AnimatePresence>
      ) : open ? (
        <div {...region}>{details}</div>
      ) : null}
    </li>
  );
}
