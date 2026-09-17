"use client";

import {
  createContext,
  use,
  useEffect,
  useId,
  useRef,
  type ComponentProps,
  type RefObject,
} from "react";

import { INK_POOL, useInkTrail, type InkPoint, type InkTrail } from "@/hooks/use-ink-trail";

/** Blur radius of the gooey filter, in screen px. */
const INK_BLUR = 12;

const InkTrailContext = createContext<InkTrail | null>(null);

/**
 * A `<section>` that owns the shared ink trail. Every `useInkMaskLayer` inside
 * it reveals against the same cursor trail.
 */
export function InkRevealSection({ children, ...props }: ComponentProps<"section">) {
  const ref = useRef<HTMLElement>(null);
  const trail = useInkTrail(ref);

  return (
    <section ref={ref} {...props}>
      <InkTrailContext value={trail}>{children}</InkTrailContext>
    </section>
  );
}

/** The trail from the nearest `InkRevealSection`. */
export function useInkReveal(): InkTrail {
  const trail = use(InkTrailContext);
  if (!trail) throw new Error("useInkReveal must be used inside <InkRevealSection>");
  return trail;
}

/** A `useId`-based id that is safe inside `url(#…)` references. */
export function useSvgId(prefix: string) {
  return `${prefix}-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

export interface InkMaskProps {
  /** Base id from `useSvgId`. The mask is referenced as `url(#<id>-mask)`. */
  id: string;
  /** Mask region, in the SVG's user units. Must cover everything it masks. */
  x: number | string;
  y: number | string;
  width: number | string;
  height: number | string;
}

/**
 * Filter and mask definitions for one masked layer. Place inside `<defs>`,
 * then set `mask="url(#<id>-mask)"` on whatever the trail should reveal.
 *
 * The gooey filter blurs the drops together, then sharpens the alpha back to a
 * crisp edge, so they merge into one liquid shape. Its region starts empty and
 * `paintInkMask` resizes it every frame to fit only the live drops.
 */
export function InkMask({ id, x, y, width, height }: InkMaskProps) {
  return (
    <>
      <filter
        id={`${id}-goo`}
        data-ink-filter=""
        filterUnits="userSpaceOnUse"
        x="0"
        y="0"
        width="0"
        height="0"
        colorInterpolationFilters="sRGB"
      >
        <feGaussianBlur data-ink-blur="" stdDeviation={INK_BLUR} />
        <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -10" />
      </filter>
      <mask id={`${id}-mask`} maskUnits="userSpaceOnUse" x={x} y={y} width={width} height={height}>
        <g filter={`url(#${id}-goo)`}>
          {Array.from({ length: INK_POOL }, (_, i) => (
            <circle key={i} data-ink-drop="" r="0" fill="#fff" />
          ))}
        </g>
      </mask>
    </>
  );
}

/**
 * Converts the trail from viewport pixels into this SVG's user units and writes
 * it into the `InkMask` circles. `getScreenCTM` already includes every CSS
 * transform on the SVG's ancestors (parallax, entrance scale), so the reveal
 * stays aligned while those animate.
 */
export function paintInkMask(svg: SVGSVGElement, points: readonly InkPoint[]) {
  const circles = svg.querySelectorAll<SVGCircleElement>("[data-ink-drop]");
  const filter = svg.querySelector<SVGFilterElement>("[data-ink-filter]");
  const blur = svg.querySelector<SVGFEGaussianBlurElement>("[data-ink-blur]");
  const matrix = svg.getScreenCTM();
  if (!filter || !blur || !matrix) return;

  const toLocal = matrix.inverse();
  const scale = Math.hypot(matrix.a, matrix.b) || 1;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  circles.forEach((circle, i) => {
    const point = points[i];
    if (!point) {
      circle.setAttribute("r", "0");
      return;
    }
    const local = new DOMPoint(point.x, point.y).matrixTransform(toLocal);
    const radius = point.radius / scale;
    circle.setAttribute("cx", local.x.toFixed(1));
    circle.setAttribute("cy", local.y.toFixed(1));
    circle.setAttribute("r", radius.toFixed(1));
    minX = Math.min(minX, local.x - radius);
    minY = Math.min(minY, local.y - radius);
    maxX = Math.max(maxX, local.x + radius);
    maxY = Math.max(maxY, local.y + radius);
  });

  const std = INK_BLUR / scale;
  blur.setAttribute("stdDeviation", std.toFixed(2));

  if (points.length === 0) {
    // A zero-size filter region renders nothing, so the mask reveals nothing.
    filter.setAttribute("width", "0");
    filter.setAttribute("height", "0");
    return;
  }
  const margin = std * 3;
  filter.setAttribute("x", (minX - margin).toFixed(1));
  filter.setAttribute("y", (minY - margin).toFixed(1));
  filter.setAttribute("width", (maxX - minX + margin * 2).toFixed(1));
  filter.setAttribute("height", (maxY - minY + margin * 2).toFixed(1));
}

/**
 * Paints the shared trail into the `InkMask` inside `svgRef` every frame.
 * Does nothing in `static` mode; a layer that needs a fixed reveal there draws
 * it itself.
 */
export function useInkMaskLayer(svgRef: RefObject<SVGSVGElement | null>) {
  const trail = useInkReveal();

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || trail.mode === "static") return;
    return trail.addLayer((points) => paintInkMask(svg, points));
  }, [svgRef, trail]);

  return trail;
}
