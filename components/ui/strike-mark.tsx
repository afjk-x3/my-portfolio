"use client";

import { useId, useState } from "react";
import { motion } from "motion/react";

import { getStrike } from "@/data/strike-angles";

/** One cut on a strike divider. */
export interface StrikeCut {
  id: number;
  /** Strike number, 1–12. */
  strike: number;
  /** Where it lands along the line, 0 (left) to 1 (right). */
  at: number;
  /** Size multiplier from the combo: 1, 1.3, 1.6, 2, or 2.3 for a PERFECT at max. */
  scale: number;
  perfect: boolean;
  /** False with reduced motion: the scar appears without the swing. */
  animate: boolean;
}

/** Half the chord of a size-1 crescent, in px. */
const ARC_HALF = 130;
/** How far a size-1 crescent bows out from its chord, in px. */
const ARC_DEPTH = 34;
/** Thickness of a size-1 crescent at its middle, in px. */
const ARC_THICKNESS = 12;

/** Seconds the swing takes to sweep from one tip to the other. */
const SWEEP = 0.2;
/** Seconds the bright slash lingers before it is removed, leaving the scar. */
const EFFECT_LIFE = 0.75;

/** Horizontal strikes are tilted this far so they still read as a swing. */
const HORIZONTAL_TILT = 12;

/**
 * Direction of travel and bow for a strike. Odd strikes bow one way and even
 * strikes the other, so forehand and backhand swings curve oppositely.
 */
function swingFor(strike: number) {
  const { degrees } = getStrike(strike);
  if (degrees === null) return null;
  let rotation = degrees;
  if (degrees === 0) rotation = HORIZONTAL_TILT;
  if (degrees === 180) rotation = 180 - HORIZONTAL_TILT;
  return { rotation, bow: strike % 2 === 1 ? -1 : 1 };
}

/**
 * Crescent between two quadratic curves sharing their tips. It is thickest at
 * the middle and sharp at both ends; `bow` flips which side it curves toward.
 */
function crescent(half: number, depth: number, thickness: number, bow: number) {
  const outer = -2 * depth * bow;
  const inner = -2 * (depth - thickness) * bow;
  return `M ${-half} 0 Q 0 ${outer} ${half} 0 Q 0 ${inner} ${-half} 0 Z`;
}

/**
 * Renders one strike: a crescent sword slash, or a stab for a thrust. The
 * bright effect is drawn on the unclipped layer and removed after
 * `EFFECT_LIFE`; the faint scar is drawn on the clipped band layer and stays.
 */
export function StrikeMark({ cut, layer }: { cut: StrikeCut; layer: "effect" | "scar" }) {
  const swing = swingFor(cut.strike);
  const maskId = `slash-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [effectDone, setEffectDone] = useState(!cut.animate);

  const s = cut.scale;
  const half = ARC_HALF * s;
  const depth = ARC_DEPTH * s;
  const thickness = ARC_THICKNESS * s;
  const box = half * 2 + 120;
  const position = { left: `${cut.at * 100}%`, top: "50%" };
  // Shift the crescent so the middle of its bow crosses the hairline.
  const lift = swing ? depth * 0.6 * swing.bow : 0;

  if (layer === "scar") {
    return (
      <motion.svg
        initial={cut.animate ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.6 } }}
        transition={{ delay: cut.animate ? SWEEP : 0, duration: 0.5 }}
        width={box}
        height={box}
        viewBox={`${-box / 2} ${-box / 2} ${box} ${box}`}
        style={position}
        className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 overflow-visible"
      >
        {swing ? (
          <g transform={`rotate(${swing.rotation}) translate(0 ${lift})`}>
            <path d={crescent(half, depth, thickness * 0.3, swing.bow)} className="fill-accent" opacity={0.28} />
          </g>
        ) : (
          <circle r={3 + s} className="fill-accent" opacity={0.45} />
        )}
      </motion.svg>
    );
  }

  if (effectDone) return null;

  return (
    <motion.svg
      width={box}
      height={box}
      viewBox={`${-box / 2} ${-box / 2} ${box} ${box}`}
      style={position}
      className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 overflow-visible"
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ delay: SWEEP + 0.15, duration: EFFECT_LIFE - SWEEP - 0.15 }}
      onAnimationComplete={() => setEffectDone(true)}
    >
      {swing ? (
        <g transform={`rotate(${swing.rotation}) translate(0 ${lift})`}>
          <defs>
            <mask id={maskId} maskUnits="userSpaceOnUse" x={-box} y={-box} width={box * 2} height={box * 2}>
              {/* Drawing this stroke tip to tip is the sword sweeping through. */}
              <motion.path
                d={`M ${-half} 0 Q 0 ${-2 * (depth - thickness / 2) * swing.bow} ${half} 0`}
                stroke="#fff"
                strokeWidth={thickness * 4 + 20}
                strokeLinecap="round"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: SWEEP, ease: [0.2, 0.8, 0.2, 1] }}
              />
            </mask>
          </defs>
          {/* Afterimage: a fainter crescent trailing a few degrees behind. */}
          <g transform={`rotate(${-8 * swing.bow})`} mask={`url(#${maskId})`}>
            <path d={crescent(half, depth, thickness, swing.bow)} className="fill-accent" opacity={0.25} />
          </g>
          <g mask={`url(#${maskId})`}>
            <path
              d={crescent(half * 1.04, depth * 1.08, thickness * 1.8, swing.bow)}
              className="fill-accent"
              style={{ filter: `blur(${cut.perfect ? 10 : 6}px)` }}
              opacity={0.9}
            />
            <path d={crescent(half, depth, thickness, swing.bow)} className="fill-accent" />
            <path d={crescent(half * 0.94, depth * 0.94, thickness * 0.45, swing.bow)} fill="#fff" />
          </g>
        </g>
      ) : (
        <g>
          {/* Stab: a narrow spike driving down into the line. */}
          <motion.g
            initial={{ y: -90 * s, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.12, ease: "easeIn" }}
          >
            <path
              d={`M ${-5 * s} ${-110 * s} L ${5 * s} ${-110 * s} L 0 0 Z`}
              className="fill-accent"
              style={{ filter: "blur(4px)" }}
            />
            <path d={`M ${-2 * s} ${-100 * s} L ${2 * s} ${-100 * s} L 0 0 Z`} fill="#fff" />
          </motion.g>
          <motion.circle
            r={26 * s}
            fill="none"
            strokeWidth={3}
            className="stroke-accent"
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 1.8, opacity: 0 }}
            transition={{ delay: 0.1, duration: 0.45, ease: "easeOut" }}
          />
        </g>
      )}
      {/* Impact flash where the strike meets the hairline. */}
      <motion.circle
        r={(cut.perfect ? 30 : 20) * s}
        fill={cut.perfect ? "#fff" : undefined}
        className={cut.perfect ? undefined : "fill-accent"}
        initial={{ scale: 0, opacity: 0.9 }}
        animate={{ scale: 1.5, opacity: 0 }}
        transition={{ delay: SWEEP / 2, duration: 0.35, ease: "easeOut" }}
      />
    </motion.svg>
  );
}
