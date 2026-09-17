"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useInView, useReducedMotion } from "motion/react";

import { useMediaQuery } from "@/hooks/use-media-query";

/**
 * - `pointer`: a mouse or trackpad drives the reveal. Ink appears only while
 *   the pointer moves.
 * - `wander`: touch screens; the reveal drifts over the face on its own.
 * - `static`: touch plus reduced motion; one fixed reveal, no animation.
 */
export type RevealMode = "pointer" | "wander" | "static";

/** A live drop of the trail, in viewport (client) pixels. */
export interface InkPoint {
  x: number;
  y: number;
  /** Radius across the drop's short axis before stretching, in px. */
  radius: number;
  /** Direction of travel in radians; the drop is stretched along it. */
  angle: number;
  /** Long axis ÷ short axis. 1 is a circle. */
  stretch: number;
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

/** Window event that plays one diagonal strike across the hero. */
export const INK_STRIKE_EVENT = "portfolio:strike";

/** Most drops alive at once, not counting the `wander` head. */
export const MAX_DROPS = 36;

/** Shapes every masked layer must render: the drops plus the `wander` head. */
export const INK_POOL = MAX_DROPS + 1;

/** Milliseconds a drop takes to shrink from full size to nothing. */
const DROP_LIFE = 900;

/** Distance in px the pointer travels between two drops. */
const DROP_SPACING = 16;

/** Pointer speed in px/s at which drops reach full size and full stretch. */
const FULL_SPEED = 1800;

/** Size of a drop left by the slowest movement, as a fraction of full size. */
const MIN_SIZE = 0.3;

/** Stretch of a drop left at `FULL_SPEED` or faster. */
const MAX_STRETCH = 2.6;

/** Duration of the palette's "strike" sweep, in ms. */
const STRIKE_DURATION = 650;

/**
 * Full drop radius in px. The gooey filter's threshold eats roughly the outer
 * 40% of each drop, so this is larger than the visible blob.
 */
function baseRadius() {
  return Math.min(150, window.innerWidth * 0.22);
}

function damp(current: number, target: number, lambda: number, dt: number) {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

/**
 * The shared cursor trail behind the hero reveal. One `requestAnimationFrame`
 * loop, running only while `containerRef` is on screen, drops "ink" along the
 * pointer's path: nothing while the pointer is still, small round drops for
 * slow movement, large stretched drops for fast movement. Each drop shrinks
 * away over `DROP_LIFE`, so the reveal is gone within a second of stopping.
 * Registered layers receive every live drop each frame and paint their own
 * masks; nothing here triggers a React render.
 */
export function useInkTrail(containerRef: RefObject<HTMLElement | null>): InkTrail {
  const inView = useInView(containerRef);
  const reduceMotion = useReducedMotion() ?? false;
  const finePointer = useMediaQuery("(pointer: fine)");
  const mode: RevealMode = finePointer ? "pointer" : reduceMotion ? "static" : "wander";

  const layersRef = useRef(new Set<InkLayer>());
  const homeRef = useRef<InkHome | null>(null);
  // Time a strike was requested. Stored outside the loop, so a strike asked for
  // while the hero is still scrolling into view plays once the loop starts.
  const strikeRef = useRef<number | null>(null);

  useEffect(() => {
    function onStrike() {
      strikeRef.current = performance.now();
    }
    window.addEventListener(INK_STRIKE_EVENT, onStrike);
    return () => window.removeEventListener(INK_STRIKE_EVENT, onStrike);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !inView || mode === "static") return;

    const layers = layersRef.current;
    const drops: {
      x: number;
      y: number;
      born: number;
      size: number;
      angle: number;
      stretch: number;
    }[] = [];
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

    /** Drops ink every `DROP_SPACING` px from `lastDrop` to `(x, y)`. */
    function dropAlong(x: number, y: number, speed: number, now: number, fullSize: boolean) {
      if (!lastDrop) {
        lastDrop = { x, y };
        return;
      }
      const dx = x - lastDrop.x;
      const dy = y - lastDrop.y;
      const distance = Math.hypot(dx, dy);
      const steps = Math.floor(distance / DROP_SPACING);
      if (steps === 0) return;

      const pace = Math.min(1, speed / FULL_SPEED);
      const size = fullSize ? 1 : MIN_SIZE + (1 - MIN_SIZE) * pace;
      const stretch = 1 + (MAX_STRETCH - 1) * pace;
      const angle = Math.atan2(dy, dx);
      for (let i = 1; i <= steps; i++) {
        const f = (i * DROP_SPACING) / distance;
        drops.push({ x: lastDrop.x + dx * f, y: lastDrop.y + dy * f, born: now, size, angle, stretch });
      }
      const f = (steps * DROP_SPACING) / distance;
      lastDrop = { x: lastDrop.x + dx * f, y: lastDrop.y + dy * f };
      if (drops.length > MAX_DROPS) drops.splice(0, drops.length - MAX_DROPS);
    }

    let last = performance.now();
    const start = last;
    let frame = requestAnimationFrame(function tick(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      // A requested strike overrides the pointer for its duration: a fast
      // diagonal cut from lower left to upper right across the hero.
      const strikeAge = strikeRef.current === null ? Infinity : now - strikeRef.current;
      const striking = strikeAge < STRIKE_DURATION;
      if (!striking && strikeRef.current !== null && strikeAge !== Infinity) {
        strikeRef.current = null;
        lastDrop = null;
      }

      if (striking) {
        const rect = container!.getBoundingClientRect();
        const t = easeInOutCubic(strikeAge / STRIKE_DURATION);
        const x = rect.left + rect.width * (0.08 + 0.84 * t);
        const y = rect.top + rect.height * (0.78 - 0.56 * t);
        dropAlong(x, y, FULL_SPEED, now, true);
        head.placed = false;
      } else if (mode === "pointer") {
        // Re-checked every frame: scrolling moves the hero under a still cursor.
        const rect = container!.getBoundingClientRect();
        const inside =
          pointer.seen &&
          pointer.x >= rect.left &&
          pointer.x <= rect.right &&
          pointer.y >= rect.top &&
          pointer.y <= rect.bottom;

        if (inside) {
          if (!head.placed) {
            head.x = pointer.x;
            head.y = pointer.y;
            head.placed = true;
            lastDrop = { x: head.x, y: head.y };
          }
          const previousX = head.x;
          const previousY = head.y;
          head.x = damp(head.x, pointer.x, 18, dt);
          head.y = damp(head.y, pointer.y, 18, dt);
          const speed = dt > 0 ? Math.hypot(head.x - previousX, head.y - previousY) / dt : 0;
          dropAlong(head.x, head.y, speed, now, false);
        } else {
          head.placed = false;
          lastDrop = null;
        }
      } else {
        const home = homeRef.current?.();
        const target = home
          ? {
              x: home.x + Math.sin(((now - start) / 1000) * 0.6) * home.span,
              y: home.y + Math.sin(((now - start) / 1000) * 0.9) * home.span * 0.85,
            }
          : null;
        if (target && !head.placed) {
          head.x = target.x;
          head.y = target.y;
          head.placed = true;
        }
        head.strength = damp(head.strength, target ? 1 : 0, 6, dt);
        if (target) {
          head.x = damp(head.x, target.x, 18, dt);
          head.y = damp(head.y, target.y, 18, dt);
          dropAlong(head.x, head.y, 0, now, true);
        } else {
          lastDrop = null;
        }
      }

      while (drops.length > 0 && now - drops[0].born > DROP_LIFE) drops.shift();

      const radius = baseRadius();
      const points: InkPoint[] = drops.map((drop) => {
        const age = (now - drop.born) / DROP_LIFE;
        return {
          x: drop.x,
          y: drop.y,
          radius: radius * drop.size * (1 - age * age),
          angle: drop.angle,
          stretch: drop.stretch,
        };
      });
      // Touch has no pointer to follow, so the drifting head stays visible.
      if (mode === "wander" && head.strength > 0.002) {
        points.push({ x: head.x, y: head.y, radius: radius * head.strength, angle: 0, stretch: 1 });
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
