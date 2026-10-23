"use client";

import { useEffect, useRef, useState } from "react";

import { ProjectRow } from "@/components/sections/project-row";
import { PROJECT_GROUPS, type Project } from "@/types";

interface OpenRow {
  slug: string | null;
  animate: boolean;
}

/**
 * The projects as race standings, one list per group (Work, Academic), each
 * numbered from P1. Every row starts closed; one row is open at a time across
 * all groups, and a `/#<slug>` link opens that row.
 */
export function ProjectsStandings({ projects }: { projects: Project[] }) {
  const [open, setOpen] = useState<OpenRow>({ slug: null, animate: true });
  // Row to scroll to once a deep-link open has rendered.
  const scrollTarget = useRef<string | null>(null);

  // Opens the row named by the URL hash, without animation. The browser has
  // already jumped to the hash, but an open row closing above the target
  // shifts it, so the effect below scrolls again once the layout is in place.
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
    <div className="flex flex-col gap-12">
      {PROJECT_GROUPS.map((group) => {
        const entries = projects.filter((project) => group.categories.includes(project.category));
        if (entries.length === 0) return null;

        return (
          <div key={group.id} className="flex flex-col gap-4">
            <h3 className="flex items-baseline gap-3 px-2 font-mono text-xs uppercase tracking-[0.25em] text-muted">
              <span className="text-fg">{group.label}</span>
              <span>{String(entries.length).padStart(2, "0")}</span>
            </h3>
            <ol className="border-b border-line">
              {entries.map((project, index) => (
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
          </div>
        );
      })}
    </div>
  );
}
