"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import { useInView, useReducedMotion } from "motion/react";

import type { RevealMode } from "@/components/three/headgear-reveal-scene";
import { useMediaQuery } from "@/hooks/use-media-query";

/*
 * three.js, React Three Fiber, and drei live only in this lazily imported
 * chunk, so they never block the portrait (the page's LCP image). `ssr: false`
 * is required: WebGL does not exist on the server.
 */
const HeadgearRevealScene = dynamic(
  () =>
    import("@/components/three/headgear-reveal-scene").then(
      (mod) => mod.HeadgearRevealScene,
    ),
  { ssr: false },
);

/**
 * Canvas layer that sits exactly on top of the hero portrait and reveals the
 * Arnis headgear over the face through a cursor-following blob. Must be placed
 * inside the same 3:2 box as the portrait image.
 */
export function HeadgearReveal() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isVisible = useInView(containerRef);
  const reduceMotion = useReducedMotion() ?? false;
  const finePointer = useMediaQuery("(pointer: fine)");

  const mode: RevealMode = finePointer ? "pointer" : reduceMotion ? "static" : "wander";

  return (
    <div ref={containerRef} aria-hidden className="pointer-events-none absolute inset-0">
      <HeadgearRevealScene active={isVisible} mode={mode} />
    </div>
  );
}
