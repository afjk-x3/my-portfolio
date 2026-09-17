"use client";

import { siteConfig } from "@/data/site";
import { useLocalTime } from "@/hooks/use-local-time";
import { cn } from "@/lib/utils";

const TELEMETRY_TEXT = "font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-muted";

/** Pulsing availability dot and label, from `siteConfig.availability`. */
export function AvailabilityStatus({ className }: { className?: string }) {
  const { availability } = siteConfig;

  return (
    <p className={cn("flex items-center gap-3", TELEMETRY_TEXT, className)}>
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
  );
}

/** Ticking wall-clock time in the owner's time zone. */
export function LocalClock({ className }: { className?: string }) {
  const time = useLocalTime(siteConfig.timeZone);

  return (
    <p className={cn("flex items-center gap-2 tabular-nums", TELEMETRY_TEXT, className)}>
      <span>Local</span>
      <span className="text-fg">{time ?? "--:--:--"}</span>
      <span className="text-accent">{siteConfig.timeZoneLabel}</span>
    </p>
  );
}
