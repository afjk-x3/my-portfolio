import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { PROJECT_CATEGORY_LABELS, type Project } from "@/types";

/** End of a case study: the next case study, and a way back to the list. */
export function NextLap({ next }: { next: Project | null }) {
  return (
    <nav aria-label="Case studies" className="px-6 pb-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        {next ? (
          <Link
            href={`/projects/${next.slug}`}
            className="group relative flex flex-col gap-4 overflow-hidden rounded-card border border-line bg-surface p-8 transition-[border-color,box-shadow] duration-300 hover:border-accent/50 hover:shadow-[0_0_60px_-24px_var(--color-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:p-12"
          >
            <span className="font-mono text-xs tracking-[0.25em] text-accent">NEXT LAP</span>
            <span className="flex items-center justify-between gap-6">
              <span className="font-display text-5xl uppercase leading-none text-fg sm:text-7xl">
                {next.title}
              </span>
              <ArrowRight
                aria-hidden
                className="size-10 shrink-0 text-accent transition-transform duration-300 group-hover:translate-x-2"
              />
            </span>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
              {PROJECT_CATEGORY_LABELS[next.category]} · {next.year}
            </span>
          </Link>
        ) : null}

        <Link
          href="/#projects"
          className="flex w-fit items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-muted transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          <ArrowLeft aria-hidden className="size-4" />
          Back to projects
        </Link>
      </div>
    </nav>
  );
}
