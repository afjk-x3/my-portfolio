"use client";

import { motion, useReducedMotion } from "motion/react";

import { getStrike } from "@/data/strike-angles";
import { cn } from "@/lib/utils";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

/** Box the diagonal slash is drawn in, in px. */
const SLASH_BOX = 40;

export interface StrikeLineProps {
  /** Strike number from `data/strike-angles.ts`. Thrusts (no line) are invalid. */
  angle: number;
  className?: string;
}

/**
 * Section divider: two hairlines meeting at a short neon slash cut at a real
 * Arnis strike angle, with a telemetry label. Draws itself in the first time it
 * scrolls into view; with reduced motion it renders fully drawn.
 */
export function StrikeLine({ angle, className }: StrikeLineProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const strike = getStrike(angle);
  if (strike.degrees === null) {
    throw new Error(`Strike ${angle} is a thrust and has no line to draw`);
  }

  // Unit vector of the stick's path. Screen y grows downward, which matches the
  // clockwise degree convention in `data/strike-angles.ts`.
  const radians = (strike.degrees * Math.PI) / 180;
  const half = SLASH_BOX / 2 - 4;
  const dx = Math.cos(radians) * half;
  const dy = Math.sin(radians) * half;
  const center = SLASH_BOX / 2;
  const label = `ANGLE ${String(strike.number).padStart(2, "0")} // ${strike.degrees}°`;

  const drawn = { pathLength: 1, scaleX: 1, opacity: 1 };
  const hidden = reduceMotion ? drawn : { pathLength: 0, scaleX: 0, opacity: 0 };
  const viewport = { once: true, margin: "0px 0px -15% 0px" } as const;

  return (
    <div
      aria-hidden
      className={cn("mx-auto flex w-full max-w-6xl items-center gap-4 px-6", className)}
    >
      <motion.span
        initial={{ scaleX: hidden.scaleX }}
        whileInView={{ scaleX: 1 }}
        viewport={viewport}
        transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
        className="h-px flex-1 origin-right bg-line"
      />

      <svg
        width={SLASH_BOX}
        height={SLASH_BOX}
        viewBox={`0 0 ${SLASH_BOX} ${SLASH_BOX}`}
        className="shrink-0 overflow-visible"
      >
        {/* The stick travels from the start of the path to its end. */}
        <motion.path
          d={`M ${center - dx} ${center - dy} L ${center + dx} ${center + dy}`}
          className="stroke-accent"
          strokeWidth={2}
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: hidden.pathLength }}
          whileInView={{ pathLength: 1 }}
          viewport={viewport}
          transition={{ duration: 0.5, delay: 0.35, ease: EASE_OUT_EXPO }}
        />
      </svg>

      <motion.span
        initial={{ opacity: hidden.opacity }}
        whileInView={{ opacity: 1 }}
        viewport={viewport}
        transition={{ duration: 0.4, delay: 0.6 }}
        className="shrink-0 font-mono text-[0.65rem] tracking-[0.25em] text-muted"
      >
        {label}
      </motion.span>

      <motion.span
        initial={{ scaleX: hidden.scaleX }}
        whileInView={{ scaleX: 1 }}
        viewport={viewport}
        transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
        className="h-px flex-1 origin-left bg-line"
      />
    </div>
  );
}
