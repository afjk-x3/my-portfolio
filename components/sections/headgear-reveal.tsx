"use client";

import { useEffect, useRef } from "react";

import {
  InkMask,
  paintInkMask,
  useInkMaskLayer,
  useSvgId,
} from "@/components/sections/ink-reveal";

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

/** Middle of the face: where the reveal rests on touch devices. */
const FACE = { x: 1029, y: 520 } as const;

/** Radius of the fixed reveal in `static` mode, in portrait pixels. */
const STATIC_RADIUS = 300;

/** How far the `wander` reveal drifts from the face, in portrait pixels. */
const WANDER_SPAN = 140;

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
  const trail = useInkMaskLayer(svgRef);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    // Touch + reduced motion: one fixed reveal over the face, no animation.
    // Painted in viewport pixels so it goes through the same code path.
    if (trail.mode === "static") {
      const matrix = svg.getScreenCTM();
      if (!matrix) return;
      const face = new DOMPoint(FACE.x, FACE.y).matrixTransform(matrix);
      paintInkMask(svg, [{ x: face.x, y: face.y, radius: STATIC_RADIUS * matrix.a }]);
      return;
    }

    // Tell the trail where the face is, for the `wander` drift on touch.
    trail.setHome(() => {
      const matrix = svg.getScreenCTM();
      if (!matrix) return null;
      const face = new DOMPoint(FACE.x, FACE.y).matrixTransform(matrix);
      return { x: face.x, y: face.y, span: WANDER_SPAN * matrix.a };
    });
    return () => trail.setHome(null);
  }, [trail]);

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
