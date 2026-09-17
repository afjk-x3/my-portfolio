"use client";

import { useEffect, useLayoutEffect, useState, useSyncExternalStore } from "react";
import { useLenis } from "lenis/react";
import {
  AnimatePresence,
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";

import { baybayin } from "@/data/baybayin";

/** Present in sessionStorage once the preloader has played in this tab. */
export const STORAGE_KEY = "portfolio_preloaded";

/**
 * Set on `<html>` while the preloader owns the screen. `app/globals.css` reads
 * it to show the overlay and to lock native scrolling.
 */
const ACTIVE_ATTRIBUTE = "data-preloader-active";

/** Seconds the counter takes to run from 00 to 100. */
const COUNT_DURATION = 1.6;

/** Seconds the overlay holds at 100% before it wipes away. */
const EXIT_HOLD = 0.2;

const EASE_OUT_QUINT = [0.22, 1, 0.36, 1] as const;
const EASE_IN_OUT_QUART = [0.76, 0, 0.24, 1] as const;

const STATUS_LINES = [
  { label: "GARAZA", value: "DEV PORTFOLIO", accent: false },
  { label: "SYS.INIT", value: "OK", accent: true },
  { label: "LATENCY", value: "12MS", accent: false },
] as const;

/*
 * Runs synchronously while the browser parses the HTML: before first paint,
 * and before React has loaded. On a first visit it flags `<html>`, which makes
 * the server-rendered overlay visible and locks scrolling. On later visits it
 * does nothing, so the overlay stays `display: none` and never flashes. If
 * sessionStorage is blocked, the preloader is skipped rather than replayed on
 * every load.
 */
const GATE_SCRIPT = `try{if(!sessionStorage.getItem("${STORAGE_KEY}"))document.documentElement.setAttribute("${ACTIVE_ATTRIBUTE}","")}catch(e){}`;

function readShouldPlay() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === null;
  } catch {
    return false;
  }
}

// sessionStorage has no change event within the same tab, so there is nothing
// to subscribe to. The store is only read once, after hydration.
const subscribe = () => () => {};

/**
 * An inline script that executes during HTML parsing only. On the client it
 * renders as `text/plain`, which stops React warning about `<script>` tags;
 * `suppressHydrationWarning` absorbs the `type` difference.
 */
function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/**
 * First-visit intro: the Gothic monogram, a telemetry counter from 00 to 100,
 * then an upward wipe that uncovers the hero. Plays once per browser session.
 */
export function Preloader() {
  // The server always renders the overlay (CSS keeps it hidden unless the gate
  // script flagged a first visit). After hydration this switches to the real
  // sessionStorage value, so React never reads storage during SSR or hydration.
  const shouldPlay = useSyncExternalStore(subscribe, readShouldPlay, () => true);
  const [counted, setCounted] = useState(false);
  const [exited, setExited] = useState(false);

  const reduceMotion = useReducedMotion();
  const lenis = useLenis();

  const visible = shouldPlay && !counted;
  // The lock outlasts `visible`: it is released only after the wipe finishes.
  const locked = shouldPlay && !exited;

  const progress = useMotionValue(0);
  const percent = useTransform(progress, (value) =>
    Math.round(value).toString().padStart(2, "0"),
  );
  const barScale = useTransform(progress, [0, 100], [0, 1]);

  // Keep the `<html>` flag in step with React. In production the gate script
  // has already set it and this is a no-op. In development, Strict Mode's
  // remount strips attributes React does not manage from `<html>`, so this puts
  // it back before paint. Storage is re-read so that a returning visitor, whose
  // `shouldPlay` is still the server value during the hydration commit, never
  // sees the overlay flash.
  useLayoutEffect(() => {
    if (!locked || !readShouldPlay()) return;
    const root = document.documentElement;
    root.setAttribute(ACTIVE_ATTRIBUTE, "");
    return () => root.removeAttribute(ACTIVE_ATTRIBUTE);
  }, [locked]);

  // Lenis drives scrolling programmatically, so `overflow: hidden` alone does
  // not stop wheel scrolling. With reduced motion there is no Lenis instance
  // and the CSS lock is enough.
  useEffect(() => {
    if (!lenis || !locked) return;
    lenis.stop();
    return () => lenis.start();
  }, [lenis, locked]);

  useEffect(() => {
    if (!visible) return;
    const controls = animate(progress, 100, {
      duration: COUNT_DURATION,
      ease: EASE_OUT_QUINT,
      onComplete: () => setCounted(true),
    });
    return () => controls.stop();
  }, [visible, progress]);

  const handleExitComplete = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Storage blocked: the gate script skips the preloader in that case too.
    }
    setExited(true);
  };

  return (
    <>
      <InlineScript html={GATE_SCRIPT} />
      <AnimatePresence onExitComplete={handleExitComplete}>
        {visible && (
          <motion.div
            key="preloader"
            // `display` is owned by the `[data-preloader]` rules in globals.css,
            // so there is deliberately no `flex` class here.
            data-preloader
            role="status"
            exit={
              reduceMotion
                ? { opacity: 0, transition: { duration: 0.4, delay: EXIT_HOLD } }
                : {
                    y: "-100%",
                    transition: { duration: 0.8, delay: EXIT_HOLD, ease: EASE_IN_OUT_QUART },
                  }
            }
            className="fixed inset-0 z-90 flex-col items-center justify-center overflow-hidden bg-bg select-none"
          >
            <span className="sr-only">Loading portfolio</span>

            {/*
             * Atmosphere. The grid is repeated here because the page-wide grid
             * sits behind this opaque overlay. The film grain is not: the
             * page-wide noise layer is at z-100, already above this overlay.
             */}
            <div aria-hidden className="bg-grid pointer-events-none absolute inset-0" />
            <div
              aria-hidden
              className="glow pointer-events-none absolute top-1/2 left-1/2 size-[26rem] -translate-x-1/2 -translate-y-1/2"
            />

            <div aria-hidden className="relative flex flex-col items-center">
              {/*
               * `𝕲` (U+1D572) is a math symbol that no bundled font covers, so
               * each OS would substitute its own glyph. A plain "G" in
               * UnifrakturCook renders the same blackletter capital everywhere.
               */}
              <span className="animate-monogram-in block">
                <span className="animate-monogram-breathe block font-gothic text-8xl leading-none text-fg drop-shadow-[0_0_25px_rgba(204,255,0,0.35)] md:text-[10rem]">
                  G
                </span>
              </span>

              <span className="animate-status-in mt-4 font-baybayin text-2xl text-accent/80 md:text-3xl">
                {baybayin.name.text}
              </span>

              <div className="mt-8 flex items-baseline font-mono tabular-nums">
                <motion.span className="text-5xl font-medium tracking-tight text-fg md:text-6xl">
                  {percent}
                </motion.span>
                <span className="ml-1 text-xl text-accent md:text-2xl">%</span>
              </div>

              <div className="mt-4 h-px w-56 overflow-hidden bg-line">
                <motion.div style={{ scaleX: barScale }} className="h-full origin-left bg-accent" />
              </div>

              <ul className="mt-8 flex flex-col items-center gap-2 font-mono text-[0.65rem] uppercase tracking-[0.3em] text-muted md:text-xs">
                {STATUS_LINES.map((line, index) => (
                  <li
                    key={line.label}
                    className="animate-status-in"
                    style={{ animationDelay: `${0.3 + index * 0.18}s` }}
                  >
                    {line.label} <span className="text-line-strong">{"//"}</span>{" "}
                    <span className={line.accent ? "text-accent" : "text-fg"}>{line.value}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Neon leading edge, visible as the overlay wipes upward. */}
            <div aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-accent" />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
