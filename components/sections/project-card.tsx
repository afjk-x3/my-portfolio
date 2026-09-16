"use client";

import { ArrowUpRight, CodeXml } from "lucide-react";
import {
  motion,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "motion/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PROJECT_CATEGORY_LABELS, type Project } from "@/types";

export interface ProjectCardProps {
  project: Project;
  index: number;
  total: number;
  /** Scroll progress of the whole stack, 0 at the top and 1 at the bottom. */
  progress: MotionValue<number>;
}

export function ProjectCard({ project, index, total, progress }: ProjectCardProps) {
  const reduceMotion = useReducedMotion();

  // Each card shrinks slightly once the next card begins covering it, so the
  // stack reads as a physical deck rather than a flat overlay.
  const targetScale = 1 - (total - index) * 0.04;
  const scale = useTransform(progress, [index / total, 1], [1, targetScale]);

  return (
    <div className="sticky top-0 flex h-screen items-center justify-center px-6">
      <motion.article
        style={{
          scale: reduceMotion ? 1 : scale,
          top: `${index * 1.5}rem`,
        }}
        className="relative flex w-full max-w-4xl flex-col gap-6 rounded-card border border-line bg-surface p-8 sm:p-12"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Badge className="border-accent/40 text-accent">
            {PROJECT_CATEGORY_LABELS[project.category]}
          </Badge>
          <span className="font-mono text-xs text-muted">{project.year}</span>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
            {project.title}
          </h3>
          <p className="text-lg text-fg/80">{project.summary}</p>
          <p className="max-w-2xl text-sm leading-relaxed text-muted">
            {project.description}
          </p>
        </div>

        <ul className="flex flex-wrap gap-2">
          {project.techStack.map((tech) => (
            <li key={tech}>
              <Badge>{tech}</Badge>
            </li>
          ))}
        </ul>

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
      </motion.article>
    </div>
  );
}
