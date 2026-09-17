"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useAnimate, useReducedMotion } from "motion/react";
import { Sword, Volume2, VolumeX } from "lucide-react";

import type { StrikeCue } from "@/hooks/use-strike-rhythm";
import { cn } from "@/lib/utils";

/** Latest press feedback. `id` changes on every press so repeats replay. */
export interface StrikeFeedback {
  id: number;
  grade: "start" | "perfect" | "good" | "miss";
}

export interface StrikeButtonProps {
  /** Accessible name, including the strike this press will cut. */
  label: string;
  /** When the next press is due, or null before a tempo exists. */
  cue: StrikeCue | null;
  feedback: StrikeFeedback | null;
  muted: boolean;
  onStrike: () => void;
  onToggleMute: () => void;
  /** Called on hover or focus, before a press: a chance to preload sounds. */
  onPrime?: () => void;
}

/** A click this soon after a pointer or key press is that same press. */
const CLICK_DEDUPE_MS = 500;

function token(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/**
 * Round STRIKE button with an approach ring, PERFECT / MISS feedback, and a
 * mute toggle. Presses count the moment the pointer or key goes down, not on
 * release, so timing is not delayed by the click. The approach ring shrinks
 * onto the button and touches it exactly when the next press is due; with
 * reduced motion the button's ring blinks at that moment instead. The button
 * element is never re-created, so keyboard focus survives rapid presses.
 */
export function StrikeButton({
  label,
  cue,
  feedback,
  muted,
  onStrike,
  onToggleMute,
  onPrime,
}: StrikeButtonProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const [scope, animate] = useAnimate<HTMLButtonElement>();
  const [dueCue, setDueCue] = useState<number | null>(null);
  const lastInput = useRef(-Infinity);
  const grade = feedback?.grade;

  function press() {
    lastInput.current = performance.now();
    onStrike();
  }

  // Press feedback: squash on every press, shake on MISS, lime flash on PERFECT.
  useEffect(() => {
    const button = scope.current;
    if (!feedback || !button || reduceMotion) return;
    if (feedback.grade === "miss") {
      animate(button, { x: [0, -5, 5, -3, 3, 0], scale: [0.9, 1] }, { duration: 0.3 });
      return;
    }
    animate(button, { scale: [0.86, 1] }, { duration: 0.2, ease: "easeOut" });
    if (feedback.grade === "perfect") {
      const accent = token("--color-accent");
      const ink = token("--color-accent-ink");
      const bg = token("--color-bg");
      animate(button, { backgroundColor: [accent, bg], color: [ink, accent] }, { duration: 0.45 });
    }
  }, [feedback, reduceMotion, animate, scope]);

  // Reduced motion: mark the moment the next press is due, for a static blink.
  useEffect(() => {
    if (!cue || !reduceMotion) return;
    const timer = window.setTimeout(
      () => setDueCue(cue.id),
      Math.max(0, cue.from + cue.duration - performance.now()),
    );
    return () => window.clearTimeout(timer);
  }, [cue, reduceMotion]);

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative">
        {cue && !reduceMotion ? (
          <span
            key={cue.id}
            aria-hidden
            style={{ animationDuration: `${cue.duration}ms` }}
            className="animate-approach-ring pointer-events-none absolute inset-0 rounded-full border-2 border-accent"
          />
        ) : null}
        {cue && reduceMotion && dueCue === cue.id ? (
          <span
            aria-hidden
            className="pointer-events-none absolute -inset-1 rounded-full border-2 border-accent"
          />
        ) : null}

        <button
          ref={scope}
          type="button"
          aria-label={label}
          onPointerDown={(event) => {
            if (event.button === 0) press();
          }}
          onKeyDown={(event) => {
            if (event.key !== " " && event.key !== "Enter") return;
            event.preventDefault();
            if (!event.repeat) press();
          }}
          onKeyUp={(event) => {
            // Stops Space from also firing a click on release.
            if (event.key === " ") event.preventDefault();
          }}
          onClick={() => {
            // Only activations with no pointer or key press before them, such
            // as a screen reader's, reach here as a new press.
            if (performance.now() - lastInput.current > CLICK_DEDUPE_MS) press();
          }}
          onPointerEnter={onPrime}
          onFocus={onPrime}
          className="relative flex size-10 touch-manipulation items-center justify-center rounded-full border border-accent/60 bg-bg text-accent transition-[border-color] duration-150 select-none hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:size-11"
        >
          <Sword aria-hidden className="size-4" />
        </button>

        <AnimatePresence>
          {feedback && (grade === "perfect" || grade === "miss") ? (
            <motion.span
              key={feedback.id}
              aria-hidden
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 0, y: reduceMotion ? 0 : -18 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className={cn(
                "pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 font-mono text-[0.6rem] tracking-[0.2em] whitespace-nowrap",
                grade === "perfect" ? "text-fg" : "text-muted",
              )}
            >
              {grade === "perfect" ? "PERFECT" : "MISS"}
            </motion.span>
          ) : null}
        </AnimatePresence>
      </div>

      <button
        type="button"
        aria-label={muted ? "Unmute strike sounds" : "Mute strike sounds"}
        aria-pressed={muted}
        onClick={onToggleMute}
        className="flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {muted ? <VolumeX aria-hidden className="size-4" /> : <Volume2 aria-hidden className="size-4" />}
      </button>
    </div>
  );
}
