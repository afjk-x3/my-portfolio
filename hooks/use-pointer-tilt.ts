import type { PointerEvent as ReactPointerEvent } from "react";
import {
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";

const MAX_TILT_DEG = 6;
const TILT_SPRING = { stiffness: 200, damping: 20, mass: 0.5 };

/**
 * Mouse-tracked 3D tilt plus a radial spotlight that follows the cursor.
 *
 * - Spread `handlers` onto an element that does NOT rotate. Measuring the
 *   rotating element itself feeds the tilt back into the pointer math and
 *   makes the card jitter.
 * - Apply `tiltStyle` to the child that should rotate.
 * - Use `spotlight` as the `background` of an overlay inside that child.
 *
 * Only mouse input is tracked, so touch scrolling never tilts anything.
 */
export function usePointerTilt({ disabled = false }: { disabled?: boolean } = {}) {
  // Pointer position within the element, 0–1 per axis; 0.5 is dead center.
  const pointerX = useMotionValue(0.5);
  const pointerY = useMotionValue(0.5);

  const rotateX = useSpring(
    useTransform(pointerY, [0, 1], [MAX_TILT_DEG, -MAX_TILT_DEG]),
    TILT_SPRING,
  );
  const rotateY = useSpring(
    useTransform(pointerX, [0, 1], [-MAX_TILT_DEG, MAX_TILT_DEG]),
    TILT_SPRING,
  );

  const spotX = useTransform(pointerX, (value) => `${value * 100}%`);
  const spotY = useTransform(pointerY, (value) => `${value * 100}%`);
  const spotlight = useMotionTemplate`radial-gradient(520px circle at ${spotX} ${spotY}, color-mix(in oklab, var(--color-accent) 14%, transparent), transparent 70%)`;

  function onPointerMove(event: ReactPointerEvent<HTMLElement>) {
    if (disabled || event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    pointerX.set((event.clientX - rect.left) / rect.width);
    pointerY.set((event.clientY - rect.top) / rect.height);
  }

  function onPointerLeave() {
    pointerX.set(0.5);
    pointerY.set(0.5);
  }

  return {
    handlers: { onPointerMove, onPointerLeave },
    // Always the same shape, even when disabled. `useReducedMotion()` is null
    // on the server and true on a reduced-motion client, so returning
    // `undefined` when disabled made server and client markup disagree and
    // caused a hydration mismatch. When disabled the pointer values never
    // move, so the rotation simply stays at 0.
    tiltStyle: { rotateX, rotateY, transformPerspective: 1000 },
    spotlight,
  };
}
