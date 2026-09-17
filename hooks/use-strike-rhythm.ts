"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/** Shortest gap between presses that can set or keep a tempo; faster is a double-click. */
export const MIN_GAP_MS = 300;

/** Longest gap that can set or keep a tempo; slower starts a new combo. */
export const MAX_GAP_MS = 1200;

/** A press within this fraction of the current tempo is PERFECT. */
export const PERFECT_RATIO = 0.08;

/** A press within this fraction of the current tempo is GOOD; anything else is a MISS. */
export const GOOD_RATIO = 0.25;

/** How far the tempo moves toward each new on-pace gap, so it follows gradual changes. */
const TEMPO_FOLLOW = 0.4;

/** Presses in a row, counting the first, that trigger the finisher. */
export const FINISHER_COMBO = 12;

/**
 * - `start`: the first press of a combo.
 * - `perfect` / `good`: a press that kept pace and extended the combo.
 * - `miss`: a press far too early; the combo restarts from this press.
 */
export type StrikeGrade = "start" | "perfect" | "good" | "miss";

export interface StrikeResult {
  grade: StrikeGrade;
  /** Combo after this press. 1 for `start` and `miss`. */
  combo: number;
  /** True when this press completed the combo; the rhythm has already reset. */
  finisher: boolean;
}

/** When the next press is due: `duration` ms after the press at `from`. */
export interface StrikeCue {
  /** Changes on every press, so a view can restart its countdown. */
  id: number;
  /** `performance.now()` of the press the countdown starts from. */
  from: number;
  duration: number;
}

const BEST_KEY = "portfolio_strike_best";
const HINT_KEY = "portfolio_strike_hint_seen";

let best: number | null = null;
const bestListeners = new Set<() => void>();

function getBest() {
  if (best === null) {
    try {
      best = Number(localStorage.getItem(BEST_KEY)) || 0;
    } catch {
      best = 0;
    }
  }
  return best;
}

function recordBest(combo: number) {
  if (combo <= getBest()) return;
  best = combo;
  try {
    localStorage.setItem(BEST_KEY, String(combo));
  } catch {
    // Storage blocked: the record lasts until reload.
  }
  bestListeners.forEach((listener) => listener());
}

/** Best combo ever reached in this browser. 0 on the server and during hydration. */
export function useBestStrikeCombo(): number {
  return useSyncExternalStore(
    (listener) => {
      bestListeners.add(listener);
      return () => {
        bestListeners.delete(listener);
      };
    },
    getBest,
    () => 0,
  );
}

/**
 * True the first time it is called in this browser, false afterwards. Used to
 * show the "keep the pace" hint once.
 */
export function takeFirstStrike(): boolean {
  try {
    if (localStorage.getItem(HINT_KEY)) return false;
    localStorage.setItem(HINT_KEY, "1");
    return true;
  } catch {
    return false;
  }
}

/**
 * Combo tracking for one strike divider, following the visitor's own rhythm.
 * The first press starts a combo; the gap to the second press sets the tempo;
 * every later press is graded by how close its gap is to that tempo, and the
 * tempo drifts toward each on-pace gap. The combo ends quietly when the next
 * press is overdue.
 */
export function useStrikeRhythm() {
  const [combo, setCombo] = useState(0);
  const [cue, setCue] = useState<StrikeCue | null>(null);
  const [deadline, setDeadline] = useState<number | null>(null);
  const lastRef = useRef<number | null>(null);
  const tempoRef = useRef<number | null>(null);
  const comboRef = useRef(0);
  const cueIdRef = useRef(0);
  const bestCombo = useBestStrikeCombo();

  const stop = useCallback(() => {
    lastRef.current = null;
    tempoRef.current = null;
    comboRef.current = 0;
    setCombo(0);
    setCue(null);
    setDeadline(null);
  }, []);

  // End the combo quietly once the next press is overdue.
  useEffect(() => {
    if (deadline === null) return;
    const timer = window.setTimeout(stop, Math.max(0, deadline - performance.now()));
    return () => window.clearTimeout(timer);
  }, [deadline, stop]);

  const press = useCallback((): StrikeResult => {
    const now = performance.now();
    const last = lastRef.current;
    const tempo = tempoRef.current;

    function keep(nextTempo: number | null) {
      lastRef.current = now;
      tempoRef.current = nextTempo;
      if (nextTempo === null) {
        setCue(null);
        setDeadline(now + MAX_GAP_MS);
        return;
      }
      cueIdRef.current += 1;
      setCue({ id: cueIdRef.current, from: now, duration: nextTempo });
      setDeadline(now + nextTempo * (1 + GOOD_RATIO));
    }

    function restart(grade: "start" | "miss"): StrikeResult {
      comboRef.current = 1;
      setCombo(1);
      keep(null);
      return { grade, combo: 1, finisher: false };
    }

    if (last === null) return restart("start");
    const gap = now - last;

    let grade: "perfect" | "good";
    let nextTempo: number;
    if (tempo === null) {
      // Second press: any comfortable gap sets the tempo.
      if (gap < MIN_GAP_MS) return restart("miss");
      if (gap > MAX_GAP_MS) return restart("start");
      grade = "good";
      nextTempo = gap;
    } else {
      const off = Math.abs(gap / tempo - 1);
      // Far too late means the combo had already lapsed: start over quietly.
      if (off > GOOD_RATIO) return restart(gap > tempo ? "start" : "miss");
      grade = off <= PERFECT_RATIO ? "perfect" : "good";
      nextTempo = Math.min(MAX_GAP_MS, Math.max(MIN_GAP_MS, tempo + (gap - tempo) * TEMPO_FOLLOW));
    }

    const next = comboRef.current + 1;
    recordBest(next);
    if (next >= FINISHER_COMBO) {
      stop();
      return { grade, combo: next, finisher: true };
    }
    comboRef.current = next;
    setCombo(next);
    keep(nextTempo);
    return { grade, combo: next, finisher: false };
  }, [stop]);

  return { combo, bestCombo, cue, press };
}
