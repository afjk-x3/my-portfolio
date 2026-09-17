import { cn } from "@/lib/utils";
import type { BaybayinEntry } from "@/types";

export interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  /** Decorative baybayin shown after the eyebrow. Pass an entry from `data/baybayin.ts`. */
  script?: BaybayinEntry;
  className?: string;
}

export function SectionHeading({ eyebrow, title, script, className }: SectionHeadingProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <span className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.25em] text-accent">
        <span aria-hidden className="h-px w-8 bg-accent" />
        {eyebrow}
        {script ? (
          <span aria-hidden className="font-baybayin text-sm tracking-normal text-muted">
            {script.text}
          </span>
        ) : null}
      </span>
      <h2 className="text-balance text-4xl font-semibold tracking-tight text-fg sm:text-5xl">
        {title}
      </h2>
    </div>
  );
}
