"use client";

import { useEffect, useRef, useState } from "react";

import { ProjectRow } from "@/components/sections/project-row";
import type { Project } from "@/types";

interface OpenRow {
  slug: string | null;
  animate: boolean;
}

/**
 * The projects as race standings: one row each, in `order`. One row is open at
 * a time, P1 to start with, and a `/#<slug>` link opens that row.
 */
export function ProjectsStandings({ projects }: { projects: Project[] }) {
  const [open, setOpen] = useState<OpenRow>({ slug: projects[0]?.slug ?? null, animate: true });
  // Row to scroll to once a deep-link open has rendered.
  const scrollTarget = useRef<string | null>(null);

  // Opens the row named by the URL hash, without animation. The browser has
  // already jumped to the hash, but the row closing above the target shifts
  // it, so the effect below scrolls again once the new layout is in place.
  useEffect(() => {
    function openFromHash() {
      const slug = decodeURIComponent(window.location.hash.slice(1));
      if (!projects.some((project) => project.slug === slug)) return;
      scrollTarget.current = slug;
      setOpen({ slug, animate: false });
    }
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, [projects]);

  useEffect(() => {
    const slug = scrollTarget.current;
    if (!slug) return;
    scrollTarget.current = null;
    document.getElementById(slug)?.scrollIntoView();
  }, [open]);

  return (
    <ol className="border-b border-line">
      {projects.map((project, index) => (
        <ProjectRow
          key={project.id}
          project={project}
          position={index + 1}
          open={open.slug === project.slug}
          animate={open.animate}
          onToggle={() =>
            setOpen((current) => ({
              slug: current.slug === project.slug ? null : project.slug,
              animate: true,
            }))
          }
        />
      ))}
    </ol>
  );
}
