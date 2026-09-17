"use client";

import Image from "next/image";

import { disciplinePhotos } from "@/data/skills";
import { cn } from "@/lib/utils";

const [stance, action] = disciplinePhotos;

export function DisciplineCard({ className }: { className?: string }) {
  return (
    <article
      id="discipline"
      tabIndex={0}
      className={cn(
        "group relative flex flex-col justify-end overflow-hidden rounded-card border border-line bg-surface p-6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        className,
      )}
    >
      <Image
        src={stance.src}
        alt={stance.alt}
        width={stance.width}
        height={stance.height}
        sizes="(min-width: 1024px) 50vw, 100vw"
        className="absolute inset-0 h-full w-full object-cover object-[center_80%] sm:object-[center_45%] lg:object-[center_80%] opacity-70 transition-opacity duration-500 group-hover:opacity-0 group-focus-visible:opacity-0"
      />
      <Image
        src={action.src}
        alt={action.alt}
        width={action.width}
        height={action.height}
        sizes="(min-width: 1024px) 50vw, 100vw"
        className="absolute inset-0 h-full w-full object-cover object-[center_80%] sm:object-[center_45%] lg:object-[center_80%] opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100"
      />

      <div
        aria-hidden
        className="absolute inset-0 bg-linear-to-t from-bg via-bg/70 via-20% to-transparent to-40%"
      />

      <div className="relative flex flex-col gap-2">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
          Athletics &amp; Discipline
        </span>
        <h3 className="text-2xl font-semibold tracking-tight text-fg">
          Competitive Arnis
        </h3>
        <p className="max-w-sm text-sm leading-relaxed text-muted">
          Training and competing in Arnis — the same repetition, timing, and
          composure under pressure that the work demands.
        </p>
      </div>
    </article>
  );
}
