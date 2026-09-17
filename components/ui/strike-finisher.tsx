"use client";

import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "motion/react";

/** Crescent swept from the top-left corner to the bottom-right, in a 0–100 box. */
const SLASH_DOWN = "M -8 8 Q 46 34 108 92 Q 50 50 -8 8 Z";
/** The mirrored crescent, top-right to bottom-left. */
const SLASH_UP = "M 108 8 Q 54 34 -8 92 Q 50 50 108 8 Z";

function FinisherSlash({ d, sweep, delay }: { d: string; sweep: string; delay: number }) {
  return (
    <g>
      <defs>
        <mask id={`finisher-${delay}`} maskUnits="userSpaceOnUse" x="-20" y="-20" width="140" height="140">
          <motion.path
            d={sweep}
            stroke="#fff"
            strokeWidth={30}
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay, duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
          />
        </mask>
      </defs>
      <g mask={`url(#finisher-${delay})`}>
        <path d={d} className="fill-accent" style={{ filter: "blur(10px)" }} />
        <path d={d} className="fill-accent" />
        <path d={d} fill="#fff" transform="translate(0 1.2) scale(1 0.985)" opacity={0.9} />
      </g>
    </g>
  );
}

/**
 * The combo finisher: two giant crescent slashes cross the whole viewport in an
 * X, the screen flashes, and "ANYO COMPLETE" lands in the middle, then it all
 * fades. With reduced motion only the text appears. Never intercepts clicks.
 */
export function StrikeFinisher({ onDone }: { onDone: () => void }) {
  const reduceMotion = useReducedMotion() ?? false;

  return createPortal(
    <motion.div
      aria-hidden
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ delay: 1.3, duration: 0.4 }}
      onAnimationComplete={onDone}
      className="pointer-events-none fixed inset-0 z-80 flex items-center justify-center overflow-hidden"
    >
      {reduceMotion ? null : (
        <>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full">
            <FinisherSlash d={SLASH_DOWN} sweep="M -8 8 Q 48 42 108 92" delay={0} />
            <FinisherSlash d={SLASH_UP} sweep="M 108 8 Q 52 42 -8 92" delay={0.22} />
          </svg>
          <motion.div
            className="absolute inset-0 bg-fg"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.2, 0] }}
            transition={{ delay: 0.36, duration: 0.35 }}
          />
        </>
      )}
      <motion.p
        initial={{ opacity: 0, scale: reduceMotion ? 1 : 1.35 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: reduceMotion ? 0 : 0.42, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative text-center font-display text-[clamp(3rem,11vw,9rem)] leading-[0.85] text-accent uppercase drop-shadow-[0_0_30px_rgba(204,255,0,0.45)]"
      >
        <span className="block text-fg">Pugay</span>
        Po!
      </motion.p>
    </motion.div>,
    document.body,
  );
}
