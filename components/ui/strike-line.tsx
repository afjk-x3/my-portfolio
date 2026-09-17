"use client";

import { useId } from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";

import { getStrike } from "@/data/strike-angles";
import { cn } from "@/lib/utils";

/** Full length of the blade in px. Longer than the band, so both ends run off it. */
const BLADE_LENGTH = 480;

/** Thickness of the blade where the stick enters, in px. It tapers to a point. */
const BLADE_WIDTH = 7;

/** Seconds the blade takes to cut from entry to tip. */
const CUT_DURATION = 0.22;

/** Seconds until the blade crosses the hairline: the middle of the cut. */
const IMPACT_AT = CUT_DURATION / 2;

const cut: Variants = {
  hidden: { pathLength: 0 },
  strike: { pathLength: 1, transition: { duration: CUT_DURATION, ease: [0.2, 0.8, 0.2, 1] } },
  rest: { pathLength: 1 },
};

/** The blade cools from full neon to a faint scar that stays. */
const scar: Variants = {
  hidden: { opacity: 1 },
  strike: { opacity: 0.25, transition: { delay: 0.55, duration: 0.6 } },
  rest: { opacity: 0.25 },
};

/** Blurred motion streak that flares while the blade cuts. */
const streak: Variants = {
  hidden: { opacity: 0 },
  strike: { opacity: [0, 0.8, 0], transition: { duration: 0.35, times: [0, 0.4, 1] } },
  rest: { opacity: 0 },
};

/** Flash where the blade meets the hairline. */
const flash: Variants = {
  hidden: { scale: 0, opacity: 0 },
  strike: {
    scale: [0, 1.6],
    opacity: [1, 0],
    transition: { delay: IMPACT_AT, duration: 0.4, ease: "easeOut" },
  },
  rest: { scale: 0, opacity: 0 },
};

/** Brightness pulse running outward along the hairline from the impact. */
const pulse: Variants = {
  hidden: { scaleX: 0, opacity: 0 },
  strike: {
    scaleX: [0, 1],
    opacity: [1, 0],
    transition: { delay: IMPACT_AT, duration: 0.7, ease: "easeOut" },
  },
  rest: { scaleX: 1, opacity: 0 },
};

const label: Variants = {
  hidden: { opacity: 0, y: 4 },
  strike: { opacity: 1, y: 0, transition: { delay: 0.5, duration: 0.4 } },
  rest: { opacity: 1, y: 0 },
};

export interface StrikeLineProps {
  /**
   * Strike number from `data/strike-angles.ts`. Only diagonal and overhead
   * strikes (1, 2, 8, 9, 12) are allowed; thrusts and horizontal strikes throw.
   */
  angle: number;
  /** Where the blade crosses the line, from 0 (left) to 1 (right). Keep within 0.15–0.85. */
  at?: number;
  className?: string;
}

/**
 * Section divider cut by a real Arnis strike. The first time it scrolls into
 * view, a tapered neon blade slashes across the hairline at the strike's angle
 * with a motion streak, flashes on impact, sends a pulse along the line, and
 * cools to a faint scar beside a telemetry label. With reduced motion it
 * renders straight away as the scar.
 */
export function StrikeLine({ angle, at = 0.5, className }: StrikeLineProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const maskId = `strike-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const strike = getStrike(angle);
  if (strike.degrees === null) {
    throw new Error(`Strike ${angle} is a thrust and has no line to draw`);
  }
  if (strike.degrees % 180 === 0) {
    throw new Error(`Strike ${angle} is horizontal and reads as a plain line`);
  }

  const half = BLADE_LENGTH / 2;
  // Drawn along the x axis, then rotated to the strike's direction of travel:
  // wide where the stick enters (-half), sharp where it exits (+half).
  const blade = `${-half},${-BLADE_WIDTH / 2} ${half},0 ${-half},${BLADE_WIDTH / 2}`;
  const streakShape = `${-half},${-BLADE_WIDTH * 1.5} ${half},0 ${-half},${BLADE_WIDTH * 1.5}`;
  const text = `ANGLE ${String(strike.number).padStart(2, "0")} // ${strike.degrees}°`;
  const percent = `${at * 100}%`;

  return (
    <div aria-hidden className={cn("mx-auto w-full max-w-6xl px-6", className)}>
      <motion.div
        initial={reduceMotion ? "rest" : "hidden"}
        whileInView={reduceMotion ? "rest" : "strike"}
        viewport={{ once: true, margin: "0px 0px -20% 0px" }}
        className="relative h-24 overflow-hidden sm:h-32"
      >
        <span className="absolute inset-x-0 top-1/2 h-px bg-line" />
        <motion.span
          variants={pulse}
          style={{ width: percent }}
          className="absolute top-1/2 left-0 h-px origin-right bg-linear-to-l from-accent to-transparent"
        />
        <motion.span
          variants={pulse}
          style={{ left: percent }}
          className="absolute top-1/2 right-0 h-px origin-left bg-linear-to-r from-accent to-transparent"
        />

        <svg className="absolute inset-0 size-full overflow-visible">
          {/* A nested <svg> puts the origin on the hairline at `at`. */}
          <svg x={percent} y="50%" overflow="visible">
            <g transform={`rotate(${strike.degrees})`}>
              <defs>
                <mask
                  id={maskId}
                  maskUnits="userSpaceOnUse"
                  x={-half - 20}
                  y={-40}
                  width={BLADE_LENGTH + 40}
                  height={80}
                >
                  {/* Drawing this line from entry to tip is what cuts the blade in. */}
                  <motion.path
                    d={`M ${-half} 0 L ${half} 0`}
                    stroke="#fff"
                    strokeWidth={60}
                    fill="none"
                    variants={cut}
                  />
                </mask>
              </defs>
              <motion.polygon
                points={streakShape}
                mask={`url(#${maskId})`}
                style={{ filter: "blur(6px)" }}
                className="fill-accent"
                variants={streak}
              />
              <motion.polygon
                points={blade}
                mask={`url(#${maskId})`}
                className="fill-accent"
                variants={scar}
              />
            </g>
            <motion.circle r={22} className="fill-accent" variants={flash} />
          </svg>
        </svg>

        <motion.span
          variants={label}
          style={at > 0.6 ? { right: `calc(${(1 - at) * 100}% + 32px)` } : { left: `calc(${percent} + 32px)` }}
          className="absolute top-1/2 -translate-y-[calc(100%+12px)] font-mono text-[0.65rem] tracking-[0.25em] whitespace-nowrap text-muted"
        >
          {text}
        </motion.span>
      </motion.div>
    </div>
  );
}
