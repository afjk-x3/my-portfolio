"use client";

import { useEffect, useId, useRef } from "react";
import { useInView, useReducedMotion } from "motion/react";

import { useMediaQuery } from "@/hooks/use-media-query";

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

/** Circles in the cursor trail. Blob 0 leads; the rest follow, each smaller. */
const BLOBS = 8;

/**
 * Radius of the lead blob in portrait pixels. The gooey filter's threshold
 * eats roughly the outer 40% of each circle, so this is larger than it looks.
 */
const BLOB_RADIUS = 300;

type RevealMode = "pointer" | "wander" | "static";

function damp(current: number, target: number, lambda: number, dt: number) {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

/**
 * Reveals a photo of an Arnis headgear over the face in the hero portrait,
 * inside a gooey blob that follows the cursor — the face is fully covered
 * wherever the blob is. A faint line-art ghost of the headgear is always
 * visible as a hint. Must be placed inside the same 3:2 box as the portrait.
 */
export function HeadgearReveal() {
  const svgRef = useRef<SVGSVGElement>(null);
  const isVisible = useInView(svgRef);
  const reduceMotion = useReducedMotion() ?? false;
  const finePointer = useMediaQuery("(pointer: fine)");
  const mode: RevealMode = finePointer ? "pointer" : reduceMotion ? "static" : "wander";

  // useId output can contain characters that break `url(#…)` references.
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const gooId = `headgear-goo-${id}`;
  const maskId = `headgear-mask-${id}`;

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || !isVisible) return;

    const circles = Array.from(svg.querySelectorAll<SVGCircleElement>("[data-blob]"));
    type Point = { x: number; y: number };
    const trail: Point[] = circles.map(() => ({ x: FACE.x, y: FACE.y }));
    const pointer: Point & { inside: boolean } = { x: FACE.x, y: FACE.y, inside: false };

    function draw(strength: number) {
      circles.forEach((circle, i) => {
        circle.setAttribute("cx", trail[i].x.toFixed(1));
        circle.setAttribute("cy", trail[i].y.toFixed(1));
        const radius = BLOB_RADIUS * (1 - (i / BLOBS) * 0.6) * strength;
        circle.setAttribute("r", radius.toFixed(1));
      });
    }

    // Touch + reduced motion: one fixed reveal over the face, no animation.
    if (mode === "static") {
      draw(1);
      return;
    }

    // Map viewport coordinates into portrait pixels. getScreenCTM accounts for
    // the parallax and entrance transforms on the portrait's ancestors.
    function onMove(event: PointerEvent) {
      const matrix = svg?.getScreenCTM();
      if (!matrix) return;
      const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(
        matrix.inverse(),
      );
      pointer.x = point.x;
      pointer.y = point.y;
      pointer.inside =
        point.x >= 0 && point.y >= 0 && point.x <= PORTRAIT.width && point.y <= PORTRAIT.height;
    }
    function onLeave() {
      pointer.inside = false;
    }

    let strength = mode === "pointer" ? 0 : 1;
    let last = performance.now();
    const start = last;
    let frame = requestAnimationFrame(function tick(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      let targetX: number = FACE.x;
      let targetY: number = FACE.y;
      let targetStrength = 1;
      if (mode === "pointer") {
        targetX = pointer.x;
        targetY = pointer.y;
        targetStrength = pointer.inside ? 1 : 0;
      } else {
        const t = (now - start) / 1000;
        targetX = FACE.x + Math.sin(t * 0.6) * 140;
        targetY = FACE.y + Math.sin(t * 0.9) * 120;
      }

      strength = damp(strength, targetStrength, 6, dt);

      // The lead blob chases the target; each follower chases the one ahead,
      // slightly slower, so fast movement stretches the reveal into a tail.
      trail[0].x = damp(trail[0].x, targetX, 16, dt);
      trail[0].y = damp(trail[0].y, targetY, 16, dt);
      for (let i = 1; i < trail.length; i++) {
        trail[i].x = damp(trail[i].x, trail[i - 1].x, 14 - i, dt);
        trail[i].y = damp(trail[i].y, trail[i - 1].y, 14 - i, dt);
      }

      draw(strength < 0.002 ? 0 : strength);
      frame = requestAnimationFrame(tick);
    });

    if (mode === "pointer") {
      window.addEventListener("pointermove", onMove, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeave);
    }

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [isVisible, mode]);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${PORTRAIT.width} ${PORTRAIT.height}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
      className="pointer-events-none absolute inset-0 size-full"
    >
      <defs>
        {/*
         * Gooey metaball filter: blur the circles together, then crank alpha
         * contrast so the soft union snaps back to a crisp edge. Limited to the
         * headgear's box so the blur only ever processes that area.
         */}
        <filter
          id={gooId}
          filterUnits="userSpaceOnUse"
          x={HEADGEAR.x}
          y={HEADGEAR.y}
          width={HEADGEAR.width}
          height={HEADGEAR.height}
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur stdDeviation="24" />
          <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -10" />
        </filter>
        <mask
          id={maskId}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width={PORTRAIT.width}
          height={PORTRAIT.height}
        >
          <g filter={`url(#${gooId})`}>
            {Array.from({ length: BLOBS }, (_, i) => (
              <circle key={i} data-blob="" cx={FACE.x} cy={FACE.y} r="0" fill="#fff" />
            ))}
          </g>
        </mask>
      </defs>

      {/* Always-visible hint, like the wireframe dome on landonorris.com. */}
      <image href="/images/hero/headgear-ghost.webp" {...HEADGEAR} opacity="0.22" />
      <image href="/images/hero/headgear.webp" {...HEADGEAR} mask={`url(#${maskId})`} />
    </svg>
  );
}
