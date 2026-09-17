"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, CodeXml } from "lucide-react";
import {
  motion,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "motion/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePointerTilt } from "@/hooks/use-pointer-tilt";
import { PROJECT_CATEGORY_LABELS, type Project } from "@/types";

export interface ProjectCardProps {
  project: Project;
  index: number;
  total: number;
  /** Scroll progress of the whole stack, 0 at the top and 1 at the bottom. */
  progress: MotionValue<number>;
}

export function ProjectCard({ project, index, total, progress }: ProjectCardProps) {
  const reduceMotion = useReducedMotion() ?? false;

  // Each card shrinks slightly once the next card begins covering it, so the
  // stack reads as a physical deck rather than a flat overlay.
  const targetScale = 1 - (total - index) * 0.04;
  const scale = useTransform(progress, [index / total, 1], [1, targetScale]);

  const { handlers, tiltStyle, spotlight } = usePointerTilt({ disabled: reduceMotion });

  return (
    <div className="sticky top-0 flex h-screen items-center justify-center px-6">
      {/*
       * Scroll layer: stack scale and offset. It is also the pointer
       * measurement box, which is why it must never rotate.
       */}
      <motion.div
        {...handlers}
        style={{
          scale: reduceMotion ? 1 : scale,
          top: `${index * 1.5}rem`,
        }}
        className="relative w-full max-w-4xl"
      >
        {/* Tilt layer. */}
        <motion.article
          style={tiltStyle}
          className="group relative overflow-hidden rounded-card border border-line bg-surface p-8 transition-[border-color,box-shadow] duration-300 hover:border-accent/50 hover:shadow-[0_0_60px_-24px_var(--color-accent)] sm:p-12"
        >
          <motion.div
            aria-hidden
            style={{ background: spotlight }}
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />

          <div className="relative flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Badge variant="accent">{PROJECT_CATEGORY_LABELS[project.category]}</Badge>
              <span className="font-mono text-xs text-muted">{project.year}</span>
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
                {project.caseStudy ? (
                  <Link
                    href={`/projects/${project.slug}`}
                    className="transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                  >
                    {project.title}
                  </Link>
                ) : (
                  project.title
                )}
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
              {project.caseStudy ? (
                <Button asChild size="sm">
                  <Link href={`/projects/${project.slug}`}>
                    Read case study
                    <ArrowRight aria-hidden />
                  </Link>
                </Button>
              ) : null}
              {project.liveUrl ? (
                <Button asChild size="sm" variant={project.caseStudy ? "outline" : "primary"}>
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
          </div>
        </motion.article>
      </motion.div>
    </div>
  );
}
