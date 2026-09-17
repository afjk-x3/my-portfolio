"use client";

import { useRef } from "react";

import { InkMask, useInkMaskLayer, useSvgId } from "@/components/sections/ink-reveal";

const TEXT_CLASS = "font-display text-[clamp(4.5rem,21vw,22rem)]";

/**
 * The giant hero word, drawn twice from identical SVG text: a hollow outline
 * that is always visible, and a solid neon copy that shows only inside the ink
 * trail. Same text, same attributes, same SVG, so the two can never drift apart.
 */
export function HeroWatermark({ text }: { text: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const id = useSvgId("hero-watermark");
  useInkMaskLayer(svgRef);

  const word = text.toUpperCase();

  return (
    <svg
      ref={svgRef}
      aria-hidden
      // One line of the word at 0.8 line height. The word overflows both sides
      // on purpose; the hero section clips it.
      className="h-[clamp(3.6rem,16.8vw,17.6rem)] w-full overflow-visible select-none"
    >
      <defs>
        <InkMask id={id} x="-100%" y="-100%" width="300%" height="300%" />
      </defs>
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        fill="none"
        strokeWidth="1"
        className={`${TEXT_CLASS} stroke-line-strong`}
      >
        {word}
      </text>
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        mask={`url(#${id}-mask)`}
        className={`${TEXT_CLASS} fill-accent`}
      >
        {word}
      </text>
    </svg>
  );
}
