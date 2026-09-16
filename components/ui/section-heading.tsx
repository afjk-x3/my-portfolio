import { cn } from "@/lib/utils";

export interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  className?: string;
}

export function SectionHeading({ eyebrow, title, className }: SectionHeadingProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <span className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.25em] text-accent">
        <span aria-hidden className="h-px w-8 bg-accent" />
        {eyebrow}
      </span>
      <h2 className="text-balance text-4xl font-semibold tracking-tight text-fg sm:text-5xl">
        {title}
      </h2>
    </div>
  );
}
