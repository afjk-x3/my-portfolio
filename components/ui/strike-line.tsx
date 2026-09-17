"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { StrikeButton, type StrikeFeedback } from "@/components/ui/strike-button";
import { StrikeFinisher } from "@/components/ui/strike-finisher";
import { StrikeMark, type StrikeCut } from "@/components/ui/strike-mark";
import { getStrike } from "@/data/strike-angles";
import { FINISHER_COMBO, takeFirstStrike, useStrikeRhythm } from "@/hooks/use-strike-rhythm";
import {
  playStrikeSound,
  preloadStrikeAudio,
  setStrikeMuted,
  unlockStrikeAudio,
  useStrikeMuted,
} from "@/lib/strike-audio";
import { cn } from "@/lib/utils";

/** Scars kept per divider; the oldest fades out beyond this. */
const MAX_SCARS = 12;

/** Slash size by combo level (1–3, 4–6, 7–9, 10–12), plus one step for PERFECT. */
const SIZES = [1, 1.3, 1.6, 2, 2.3];

function sizeFor(combo: number, perfect: boolean) {
  const level = Math.min(3, Math.floor((combo - 1) / 3));
  return SIZES[level + (perfect ? 1 : 0)];
}

function labelFor(strike: number) {
  const { degrees } = getStrike(strike);
  const number = String(strike).padStart(2, "0");
  return `ANGLE ${number} // ${degrees === null ? "THRUST" : `${degrees}°`}`;
}

function nextAfter(strike: number) {
  return (strike % 12) + 1;
}

const pulse = {
  initial: { scaleX: 0, opacity: 1 },
  animate: { scaleX: 1, opacity: 0 },
  transition: { delay: 0.1, duration: 0.7, ease: "easeOut" },
} as const;

export interface StrikeLineProps {
  /** Strike number (1–12) of the automatic first cut. */
  angle: number;
  /** Where the first cut lands along the line, 0 (left) to 1 (right). */
  at?: number;
  className?: string;
}

/**
 * Interactive section divider. It cuts its own strike automatically the first
 * time it scrolls into view. Its STRIKE button then cuts the next Arnis strike
 * on every press: crescent sword slashes (stabs for thrusts) that leave scars,
 * grow with a combo kept at your own pace, and end in a finisher after 12 in a row.
 */
export function StrikeLine({ angle, at = 0.5, className }: StrikeLineProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const muted = useStrikeMuted();
  const { combo, bestCombo, cue, press } = useStrikeRhythm();

  const [cuts, setCuts] = useState<StrikeCut[]>([]);
  const [lastStrike, setLastStrike] = useState(angle);
  const [nextStrike, setNextStrike] = useState(nextAfter(angle));
  // Mirrors `nextStrike` for presses that land before React re-renders.
  const nextStrikeRef = useRef(nextAfter(angle));
  const [feedback, setFeedback] = useState<StrikeFeedback | null>(null);
  const [finisher, setFinisher] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [hint, setHint] = useState(false);
  const idRef = useRef(0);

  function addCut(strike: number, where: number, scale: number, perfect: boolean) {
    idRef.current += 1;
    const cut: StrikeCut = { id: idRef.current, strike, at: where, scale, perfect, animate: !reduceMotion };
    setCuts((list) => [...list, cut].slice(-MAX_SCARS));
    setLastStrike(strike);
    return cut.id;
  }

  function firstView() {
    if (idRef.current === 0) addCut(angle, at, 1, false);
  }

  function strike() {
    unlockStrikeAudio();
    const result = press();
    const current = nextStrikeRef.current;
    nextStrikeRef.current = nextAfter(current);
    const perfect = result.grade === "perfect";
    const id = addCut(current, 0.12 + Math.random() * 0.76, sizeFor(result.combo, perfect), perfect);
    setNextStrike(nextStrikeRef.current);
    setFeedback({ id, grade: result.grade });

    const thrust = getStrike(current).degrees === null;
    playStrikeSound(thrust ? "stab" : "slash", {
      volume: Math.min(1, 0.55 + result.combo * 0.04),
      rate: 1 + (result.combo - 1) * 0.02,
    });
    if (perfect) playStrikeSound("stab", { volume: 0.35, rate: 1.8 });
    if (result.grade === "miss") playStrikeSound("miss", { volume: 0.7 });
    if (result.finisher) {
      setFinisher(id);
      playStrikeSound("finisher");
      setAnnouncement(`Anyo complete: ${FINISHER_COMBO} strikes in a row.`);
    }
    if (takeFirstStrike()) {
      setHint(true);
      window.setTimeout(() => setHint(false), 3500);
    }
  }

  const latest = cuts.at(-1);

  return (
    <div className={cn("relative z-10 mx-auto w-full max-w-6xl px-6", className)}>
      <div className="flex h-24 items-center gap-4 sm:h-32">
        <motion.div
          onViewportEnter={firstView}
          viewport={{ once: true, margin: "0px 0px -20% 0px" }}
          aria-hidden
          className="relative h-full flex-1"
        >
          <span className="absolute inset-x-0 top-1/2 h-px bg-line" />

          {/* Scars stay inside the band. */}
          <div className="absolute inset-0 overflow-hidden">
            <AnimatePresence>
              {cuts.map((cut) => (
                <StrikeMark key={cut.id} cut={cut} layer="scar" />
              ))}
            </AnimatePresence>
          </div>

          {/* Bright slashes may spill over neighbouring content. */}
          <div className="pointer-events-none absolute inset-0">
            {cuts.map((cut) => (
              <StrikeMark key={cut.id} cut={cut} layer="effect" />
            ))}
            {latest?.animate ? (
              <div key={latest.id}>
                <motion.span
                  {...pulse}
                  style={{ width: `${latest.at * 100}%` }}
                  className="absolute top-1/2 left-0 h-px origin-right bg-linear-to-l from-accent to-transparent"
                />
                <motion.span
                  {...pulse}
                  style={{ left: `${latest.at * 100}%` }}
                  className="absolute top-1/2 right-0 h-px origin-left bg-linear-to-r from-accent to-transparent"
                />
              </div>
            ) : null}
          </div>
        </motion.div>

        <div className="relative flex shrink-0 items-center gap-3">
          <div className="hidden flex-col items-end gap-1 font-mono text-[0.65rem] tracking-[0.25em] text-muted sm:flex">
            <span>{labelFor(lastStrike)}</span>
            <span className={cn("text-accent", combo > 1 ? "opacity-100" : "opacity-0")}>
              COMBO ×{Math.max(combo, 1)}
            </span>
            {bestCombo > 1 ? <span>BEST ×{bestCombo}</span> : null}
          </div>

          <StrikeButton
            label={`Strike ${nextStrike}: ${getStrike(nextStrike).target}`}
            cue={cue}
            feedback={feedback}
            muted={muted}
            onStrike={strike}
            onToggleMute={() => setStrikeMuted(!muted)}
            onPrime={preloadStrikeAudio}
          />

          <AnimatePresence>
            {hint ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="pointer-events-none absolute top-full right-0 mt-1 font-mono text-[0.6rem] tracking-[0.25em] whitespace-nowrap text-accent"
              >
                KEEP YOUR PACE
              </motion.p>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
      {finisher !== null ? <StrikeFinisher key={finisher} onDone={() => setFinisher(null)} /> : null}
    </div>
  );
}
