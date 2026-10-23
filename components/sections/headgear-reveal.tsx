"use client";

import { useRef } from "react";

import { InkMask, useInkMaskLayer, useSvgId } from "@/components/sections/ink-reveal";

/*
 * Every coordinate in this file is in hero-portrait.png pixels. The SVG uses
 * the portrait's own dimensions as its viewBox and sits exactly on top of the
 * portrait's 3:2 box, so these numbers stay aligned at every screen size.
 */
const PORTRAIT = { width: 2048, height: 1365 } as const;

/**
 * Where the headgear photo is drawn. Calibrated so the cage covers the face
 * and the shell sits just above the hood. Re-tune only if either image changes.
 */
const HEADGEAR = { x: 419, y: 90, width: 1166, height: 1260 } as const;

/**
 * Reveals a photo of an Arnis headgear over the face in the hero portrait,
 * inside the shared ink trail: the face is fully covered wherever the trail
 * is. A faint line-art ghost of the headgear is always visible as a hint. Must
 * be placed inside the same 3:2 box as the portrait, inside an
 * `InkRevealSection`.
 */
export function HeadgearReveal() {
  const svgRef = useRef<SVGSVGElement>(null);
  const id = useSvgId("headgear");
  useInkMaskLayer(svgRef);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${PORTRAIT.width} ${PORTRAIT.height}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
      className="pointer-events-none absolute inset-0 size-full"
    >
      <defs>
        <InkMask id={id} x={HEADGEAR.x} y={HEADGEAR.y} width={HEADGEAR.width} height={HEADGEAR.height} />
      </defs>

      {/* Always-visible hint, like the wireframe dome on landonorris.com. */}
      <image href="/images/hero/headgear-ghost.webp" {...HEADGEAR} opacity="0.22" />
      <image href="/images/hero/headgear.webp" {...HEADGEAR} mask={`url(#${id}-mask)`} />
    </svg>
  );
}
