"use client";

import { Fragment, useRef } from "react";
import { useScroll } from "motion/react";

import { ProjectCard } from "@/components/sections/project-card";
import type { Project } from "@/types";

export function ProjectsStack({ projects }: { projects: Project[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  // "start start" → the container top hits the viewport top (progress 0).
  // "end end"     → the container bottom hits the viewport bottom (progress 1).
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  return (
    <div ref={containerRef} className="relative">
      {projects.map((project, index) => (
        <Fragment key={project.id}>
          {/*
           * Deep-link target for `/#<slug>`. The pinned card can't be the
           * target: browsers measure a pinned element where it is pinned, so
           * the link would land on a later card. This marker stays where the
           * card's slot begins. On the stack, the negative margin cancels the
           * header offset so the card lands pinned on top.
           */}
          <span id={project.slug} className="block md:-scroll-mt-24" />
          <ProjectCard
            project={project}
            index={index}
            total={projects.length}
            progress={scrollYProgress}
          />
        </Fragment>
      ))}
    </div>
  );
}
