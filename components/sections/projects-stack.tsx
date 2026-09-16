"use client";

import { useRef } from "react";
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
        <ProjectCard
          key={project.id}
          project={project}
          index={index}
          total={projects.length}
          progress={scrollYProgress}
        />
      ))}
    </div>
  );
}
