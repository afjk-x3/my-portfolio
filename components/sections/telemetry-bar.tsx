"use client";

import { siteConfig } from "@/data/site";
import { useLocalTime } from "@/hooks/use-local-time";
import { cn } from "@/lib/utils";

export function TelemetryBar({ className }: { className?: string }) {
  const time = useLocalTime(siteConfig.timeZone);
  const { availability } = siteConfig;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 border-y border-line py-3 font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-muted",
        className,
      )}
    >
      <p className="flex items-center gap-3">
        <span aria-hidden className="relative flex size-2">
          {availability.isAvailable ? (
            <span className="absolute inset-0 animate-pulse-dot rounded-full bg-accent" />
          ) : null}
          <span
            className={cn(
              "relative size-2 rounded-full",
              availability.isAvailable
                ? "bg-accent shadow-[0_0_10px_var(--color-accent)]"
                : "bg-muted",
            )}
          />
        </span>
        <span className={availability.isAvailable ? "text-fg" : undefined}>
          {availability.label}
        </span>
      </p>

      <p className="hidden md:block">{siteConfig.role}</p>

      <p className="flex items-center gap-2 tabular-nums">
        <span className="hidden sm:inline">Local</span>
        <span className="text-fg">{time ?? "--:--:--"}</span>
        <span className="text-accent">{siteConfig.timeZoneLabel}</span>
      </p>
    </div>
  );
}
