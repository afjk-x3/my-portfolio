"use client";

import { useRef } from "react";

import { InkMask, useInkMaskLayer, useSvgId } from "@/components/sections/ink-reveal";
import { getStrike } from "@/data/strike-angles";

/**
 * Bold strike slashes crossing the whole hero. Each is anchored at a point
 * given in percent of the hero and runs far past both edges, so only
 * fragments ever show through the ink trail.
 */
const SLASHES = [
  { strike: 1, x: "22%", y: "38%", width: 18 },
  { strike: 2, x: "80%", y: "30%", width: 12 },
  { strike: 12, x: "63%", y: "50%", width: 8 },
  { strike: 3, x: "50%", y: "82%", width: 14 },
] as const;

/** Half the length of each slash, in px: longer than any screen diagonal. */
const SLASH_REACH = 3000;

/**
 * The hidden layer behind the hero portrait: a woven diamond texture and neon
 * strike slashes, visible only inside the cursor's ink trail.
 */
export function HeroBackdropReveal() {
  const svgRef = useRef<SVGSVGElement>(null);
  const id = useSvgId("hero-backdrop");
  useInkMaskLayer(svgRef);

  return (
    <svg ref={svgRef} aria-hidden className="pointer-events-none absolute inset-0 size-full">
      <defs>
        {/* Same diamond lattice as the `bg-weave` utility. */}
        <pattern id={`${id}-weave`} width="32" height="32" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="#fff" strokeWidth="1">
            <path d="M16 0 32 16 16 32 0 16Z" />
            <path d="M16 9 23 16 16 23 9 16Z" />
          </g>
          <path fill="#fff" d="M16 14.5 17.5 16 16 17.5 14.5 16Z" />
        </pattern>
        <InkMask id={id} x="0" y="0" width="100%" height="100%" />
      </defs>

      <g mask={`url(#${id}-mask)`}>
        <rect width="100%" height="100%" fill={`url(#${id}-weave)`} opacity="0.08" />
        {SLASHES.map((slash) => (
          // A nested <svg> moves the origin to a percentage position, which a
          // `transform` cannot do; the line then rotates around that origin.
          <svg key={slash.strike} x={slash.x} y={slash.y} overflow="visible">
            <line
              x1={-SLASH_REACH}
              y1="0"
              x2={SLASH_REACH}
              y2="0"
              transform={`rotate(${getStrike(slash.strike).degrees ?? 0})`}
              strokeWidth={slash.width}
              className="stroke-accent"
            />
          </svg>
        ))}
      </g>
    </svg>
  );
}
