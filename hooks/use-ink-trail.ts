"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useInView, useReducedMotion } from "motion/react";

import { useMediaQuery } from "@/hooks/use-media-query";

/**
 * - `pointer`: a mouse or trackpad drives the reveal.
 * - `wander`: touch screens; the reveal drifts over the face on its own.
 * - `static`: touch plus reduced motion; one fixed reveal, no animation.
 */
export type RevealMode = "pointer" | "wander" | "static";

/** A live drop of the trail, in viewport (client) pixels. */
export interface InkPoint {
  x: number;
  y: number;
  radius: number;
}

/** Called once per animation frame with every live drop. */
export type InkLayer = (points: readonly InkPoint[]) => void;

/**
 * Where the reveal rests in `wander` mode, in viewport pixels, plus how far
 * it drifts from there (`span`, also in viewport pixels).
 */
export type InkHome = () => { x: number; y: number; span: number } | null;

export interface InkTrail {
  mode: RevealMode;
  /** Registers a layer to paint every frame. Returns the unregister function. */
  addLayer: (layer: InkLayer) => () => void;
  /** Sets (or clears, with `null`) the resting point used in `wander` mode. */
  setHome: (home: InkHome | null) => void;
}

/** Most drops alive at once, not counting the head that sits under the cursor. */
export const MAX_DROPS = 36;

/** Circles every masked layer must render: the drops plus the head. */
export const INK_POOL = MAX_DROPS + 1;

/** Milliseconds a drop takes to shrink from full size to nothing. */
const DROP_LIFE = 900;

/** Distance in px the head travels between two dropped drops. */
const DROP_SPACING = 16;

/**
 * Drop radius in px. The gooey filter's threshold eats roughly the outer 40%
 * of each circle, so this is larger than the visible blob.
 */
function baseRadius() {
  return Math.min(150, window.innerWidth * 0.22);
}

function damp(current: number, target: number, lambda: number, dt: number) {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

/**
 * The shared cursor trail behind the hero reveal. One `requestAnimationFrame`
 * loop, running only while `containerRef` is on screen, emits "ink drops" along
 * the pointer's path. Each drop shrinks away over `DROP_LIFE`, so fast movement
 * leaves a lingering trail. Registered layers receive every live drop each
 * frame and paint their own masks; nothing here triggers a React render.
 */
export function useInkTrail(containerRef: RefObject<HTMLElement | null>): InkTrail {
  const inView = useInView(containerRef);
  const reduceMotion = useReducedMotion() ?? false;
  const finePointer = useMediaQuery("(pointer: fine)");
  const mode: RevealMode = finePointer ? "pointer" : reduceMotion ? "static" : "wander";

  const layersRef = useRef(new Set<InkLayer>());
  const homeRef = useRef<InkHome | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !inView || mode === "static") return;

    const layers = layersRef.current;
    const drops: { x: number; y: number; born: number }[] = [];
    const pointer = { x: 0, y: 0, seen: false };
    const head = { x: 0, y: 0, placed: false, strength: 0 };
    let lastDrop: { x: number; y: number } | null = null;
    let painted = false;

    function onMove(event: PointerEvent) {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.seen = true;
    }
    function onLeave() {
      pointer.seen = false;
    }

    let last = performance.now();
    const start = last;
    let frame = requestAnimationFrame(function tick(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      // Where the head is heading, and whether it should be showing at all.
      let target: { x: number; y: number } | null = null;
      if (mode === "pointer") {
        // Re-checked every frame: scrolling moves the hero under a still cursor.
        const rect = container!.getBoundingClientRect();
        const inside =
          pointer.seen &&
          pointer.x >= rect.left &&
          pointer.x <= rect.right &&
          pointer.y >= rect.top &&
          pointer.y <= rect.bottom;
        if (inside) target = pointer;
      } else {
        const home = homeRef.current?.();
        if (home) {
          const t = (now - start) / 1000;
          target = {
            x: home.x + Math.sin(t * 0.6) * home.span,
            y: home.y + Math.sin(t * 0.9) * home.span * 0.85,
          };
        }
      }

      if (target && !head.placed) {
        head.x = target.x;
        head.y = target.y;
        head.placed = true;
      }
      head.strength = damp(head.strength, target ? 1 : 0, 6, dt);
      if (target) {
        head.x = damp(head.x, target.x, 18, dt);
        head.y = damp(head.y, target.y, 18, dt);
      }

      // Drop ink at even spacing along the head's path since the last drop.
      if (target) {
        if (!lastDrop) lastDrop = { x: head.x, y: head.y };
        const dx = head.x - lastDrop.x;
        const dy = head.y - lastDrop.y;
        const distance = Math.hypot(dx, dy);
        const steps = Math.floor(distance / DROP_SPACING);
        for (let i = 1; i <= steps; i++) {
          const f = (i * DROP_SPACING) / distance;
          drops.push({ x: lastDrop.x + dx * f, y: lastDrop.y + dy * f, born: now });
        }
        if (steps > 0) {
          const f = (steps * DROP_SPACING) / distance;
          lastDrop = { x: lastDrop.x + dx * f, y: lastDrop.y + dy * f };
        }
        if (drops.length > MAX_DROPS) drops.splice(0, drops.length - MAX_DROPS);
      } else {
        lastDrop = null;
      }
      while (drops.length > 0 && now - drops[0].born > DROP_LIFE) drops.shift();

      const radius = baseRadius();
      const points: InkPoint[] = drops.map((drop) => {
        const age = (now - drop.born) / DROP_LIFE;
        return { x: drop.x, y: drop.y, radius: radius * (1 - age * age) };
      });
      if (head.strength > 0.002) {
        points.push({ x: head.x, y: head.y, radius: radius * head.strength });
      }

      // Skip painting while idle: nothing was showing and nothing is now.
      if (points.length > 0 || painted) {
        layers.forEach((layer) => layer(points));
        painted = points.length > 0;
      }

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
      // Clear every mask so a paused reveal does not freeze mid-trail.
      layers.forEach((layer) => layer([]));
    };
  }, [containerRef, inView, mode]);

  return useMemo<InkTrail>(
    () => ({
      mode,
      addLayer: (layer) => {
        layersRef.current.add(layer);
        return () => {
          layersRef.current.delete(layer);
        };
      },
      setHome: (home) => {
        homeRef.current = home;
      },
    }),
    [mode],
  );
}
