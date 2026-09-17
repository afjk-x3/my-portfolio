# Portfolio Implementation Plan

> **For the builder (OpenCode):** Execute tasks strictly in order. Each task is
> self-contained — read only that task, do exactly what it says, run its
> **Verify** block, then commit. Do not skip ahead, do not batch phases, and do
> not "improve" adjacent files that the task does not list.

> **Status:** Phases 1–15 are complete and committed. **Start at Phase 16**
> (interactive sword-slash dividers). The design is in
> `docs/superpowers/specs/2026-09-16-portfolio-v2-design.md` (§4e); read it only
> if a task does not answer a question. Step-by-step history of earlier phases
> was removed from this file; read Phases 1–10 with `git show 633c7fb:tasks.md`,
> Phases 11–12 with `git show f9256c3:tasks.md`, Phase 13 with
> `git show 76da151:tasks.md`, and Phases 14–15 with `git show bfb7a61:tasks.md`
> only if a task explicitly tells you to.

**Goal:** A single-page, dark, motion-driven developer portfolio on Next.js 16 App Router with a command palette, deployed to Vercel.

**Architecture:** `app/page.tsx` composes the home page from section components in `components/sections/`. Every section that renders data is an async Server Component that awaits a function from `lib/queries.ts`. Those functions return local typed arrays today, but they already return `Promise`s, so the Supabase swap only changes the data layer and no UI code. Client-side interactivity (smooth scroll, scroll-linked animation, cursor effects, the preloader, the mobile nav) is isolated in leaf `"use client"` components.

**Tech Stack:** Next.js 16.3.5 (App Router, Turbopack), React 19.2.8, TypeScript 5 (strict), Tailwind CSS v4, `motion` v13 (the current package name for Framer Motion, imported from `motion/react`), `lenis` v1.3, `lucide-react` v1, shadcn/ui conventions (`cn()` + `cva` + `components/ui/`). No three.js, no WebGL.

---

## Global Constraints

These apply to every task.

- **Node.js 24.19.0, npm 11.17.0.** Verified working versions for this repo.
- **No `src/` directory.** Everything lives at the repository root: `app/`, `components/`, `data/`, `hooks/`, `lib/`, `types/`, `public/`.
- **Import alias is `@/*` → repository root.** Import as `@/components/ui/button`, `@/types`, `@/lib/utils`. Never use deep relative paths like `../../..`.
- **Next.js 16 conventions are mandatory.** Before writing framework code, consult `node_modules/next/dist/docs/` as `AGENTS.md` requires. `params`, `searchParams`, `cookies()`, and `headers()` are async-only. Route component props use the generated globals `PageProps<"/route">` / `LayoutProps<"/route">` rather than hand-written prop types. These globals are generated into `.next/types`; if `npx tsc --noEmit` reports `Cannot find name 'PageProps'`, run `npx next typegen` once and re-run it.
- **`next/image` `quality` is restricted in Next 16.** The default allowed set is `[75]` only. Never pass a `quality` prop unless you also add `images.qualities` to `next.config.ts`.
- **`next/image` `priority` is deprecated in Next 16.** Use `preload` for the single above-the-fold LCP image (the hero portrait) and nothing else.
- **Dark theme only.** No light mode, no theme toggle, no `dark:` variants. Use the tokens in [Design system](#design-system).
- **Accent is electric neon lime (`#ccff00`).** Use it for badges, borders, the live dot, strike lines, and hover glows. When it is a background fill, the text on it is always `text-accent-ink`. Hover glows use `shadow-[0_0_32px_-6px_var(--color-accent)]`. Filipino/Arnis motifs never add a new colour.
- **SVG colours come from Tailwind classes, not `var()` attributes.** Write `className="stroke-accent"` / `fill-accent`, not `stroke="var(--color-accent)"`.
- **`lucide-react` v1 has no brand icons.** There is no `Github` export. GitHub links use `CodeXml`.
- **No `scroll-behavior: smooth` in CSS.** Lenis drives scrolling. Anchor navigation on the home page goes through the Lenis instance (`lenis.scrollTo(href, { offset: -96 })` in `components/layout/site-header.tsx`).
- **Respect `prefers-reduced-motion`.** Every scroll-linked or entrance animation must degrade to a static layout. Lenis is disabled entirely under reduced motion, and a global rule in `app/globals.css` shortens every CSS animation and transition to near zero.
- **Baybayin is decorative.** Every baybayin string comes from `data/baybayin.ts`, is rendered with `font-baybayin`, is `aria-hidden`, and sits next to English. Never type baybayin characters anywhere else, and never flip `reviewed` to `true`.
- **Accessibility floor.** Every `<Image>` has meaningful `alt` (or `alt=""` when purely decorative). Every icon-only link or button has an `aria-label`. Every section has an `id` that matches its nav anchor.
- **Commit after every task** using Conventional Commits and the exact message the task gives. Stage only the files the task lists; the working tree may contain unrelated uncommitted files (such as `.claude/`) that must not be committed.

### Verification commands

Every task's **Verify** block uses some combination of these. They must all pass before you commit.

```bash
npx tsc --noEmit    # type check
npm run lint        # ESLint flat config
npm run build       # production build (Turbopack)
npm run dev         # visual check at http://localhost:3000
```

There is no test runner and none should be added. Verification is type check + lint + build + the explicit visual checks each task lists.

The preloader plays on every full page load (about 2.6 s); wait for the wipe before testing.

---

## Current file structure

Files marked **[16]** are created or changed by Phase 16.

```
app/
  layout.tsx                 # fonts, metadata, <Backdrop>, <SmoothScrollProvider>, <CommandPalette>
  page.tsx                   # <Preloader>, <SiteHeader>, sections separated by <StrikeLine>, <SiteFooter>
  globals.css                # theme tokens, utilities (bg-weave), animations, Lenis base, preloader gate
  not-found.tsx              # "DNF // Did not finish" 404
components/
  command-palette/
    command-palette.tsx      # Ctrl+K / ⌘K palette: navigate, actions, secrets (client)
  layout/
    backdrop.tsx             # page-wide fixed grid + noise layers (server)
    site-header.tsx          # glass nav: name wordmark, section links, palette button, socials (client)
    site-footer.tsx          # footer with weave texture and strike line (server)
  sections/
    hero.tsx                 # <InkRevealSection>: backdrop reveal, visual stage, corner copy + status
    hero-visual.tsx          # watermark + glow + portrait, parallax (client)
    hero-watermark.tsx       # SVG outline word + ink-revealed neon fill (client)
    hero-backdrop-reveal.tsx # ink-revealed weave + strike slashes across the hero (client)
    headgear-reveal.tsx      # ink-revealed headgear photo over the face (client)
    ink-reveal.tsx           # InkRevealSection, InkMask (torn-edge filter), paintInkMask, useInkMaskLayer (client)
    hero-status.tsx          # AvailabilityStatus + LocalClock (client)
    projects-showcase.tsx    # server: awaits getProjects() (id="projects")
    projects-stack.tsx       # sticky scroll stack (client)
    project-card.tsx         # one card in the stack, tilt + spotlight (client)
    bento-grid.tsx           # server: awaits getSkillCategories() (id="stack")
    tech-stack-card.tsx      # one skill group card (server)
    discipline-card.tsx      # Arnis photo card, hover/focus cross-fade, full-stance crop (client, id="discipline")
    contact.tsx              # contact CTA (server, id="contact")
  providers/
    smooth-scroll-provider.tsx  # Lenis root (client)
  ui/
    button.tsx               # cva + Radix Slot, neon variants, strike wipe on hover
    badge.tsx                # tech-stack pill
    section-heading.tsx      # eyebrow + optional baybayin script + title
    strike-line.tsx          # interactive divider: auto cut, STRIKE button, scars, combo, finisher [16] (client)
    strike-mark.tsx          # one crescent sword slash or stab: effect + scar layers [16] (client)
    strike-button.tsx        # round beat button, beat ring, PERFECT/MISS feedback, mute toggle [16] (client)
    strike-finisher.tsx      # full-screen X slash + ANYO COMPLETE [16] (client)
    preloader.tsx            # intro on every full load: monogram + baybayin name + counter, opens at top (client)
data/
  site.ts                    # siteConfig (identity, wordmark, watermark, availability, time zone) + socialLinks
  navigation.ts              # nav anchors
  projects.ts                # Project[]
  skills.ts                  # SkillCategory[] + discipline photos
  baybayin.ts                # every baybayin string, with review flags
  strike-angles.ts           # the 12 Arnis strikes, with confirmation flags
hooks/
  use-ink-trail.ts           # shared ink trail: move-only, speed-sized drops, strike event
  use-command-palette.ts     # palette open state + modifier key label
  use-local-time.ts          # ticking clock via useSyncExternalStore
  use-strike-rhythm.ts       # 100 BPM beat, PERFECT/GOOD/MISS grading, combo, best combo [16]
  use-media-query.ts         # matchMedia via useSyncExternalStore
  use-pointer-tilt.ts        # mouse-tracked 3D tilt + spotlight motion values
lib/
  utils.ts                   # cn()
  queries.ts                 # async data access seam (Supabase swap point)
  strike-audio.ts            # Web Audio clip loading, playback, mute state [16]
types/
  index.ts                   # shared domain types — extend, do not rewrite
public/
  resume.pdf                 # placeholder
  images/hero/               # hero-portrait.png (2048×1365), headgear.webp (logo removed), headgear-ghost.webp
  images/about/              # arnis-stance.jpg, arnis-action.jpg
  audio/strikes/             # slash/stab/finisher/miss .wav + CREDITS.md (CC0) [16]
```

---

## Design system

All tokens live in `app/globals.css`. Use the Tailwind classes; never hard-code the hex values.

| Token | Value | Tailwind classes | Use |
| --- | --- | --- | --- |
| `--color-bg` | `#09090b` | `bg-bg`, `from-bg` | Page background |
| `--color-surface` | `#0f0f12` | `bg-surface` | Cards |
| `--color-elevated` | `#17171b` | `bg-elevated` | Default badges |
| `--color-line` | `#27272a` | `border-line` | Card borders, telemetry rules |
| `--color-line-strong` | `#3f3f46` | `border-line-strong`, `stroke-line-strong` | Outline buttons, watermark stroke |
| `--color-fg` | `#fafafa` | `text-fg` | Primary text |
| `--color-muted` | `#a1a1aa` | `text-muted` | Secondary text |
| `--color-accent` | `#ccff00` | `bg-accent`, `text-accent`, `border-accent/50`, `stroke-accent`, `fill-accent` | Neon: badges, borders, live dot, glows, strike lines |
| `--color-accent-soft` | `#e2fd52` | `hover:bg-accent-soft` | Hover state of accent fills |
| `--color-accent-ink` | `#09090b` | `text-accent-ink` | Text on accent fills |

| Font class | Face | Use |
| --- | --- | --- |
| `font-sans` | Geist | Body |
| `font-mono` | Geist Mono | Telemetry, labels, counters |
| `font-display` | Anton | Watermark, hero headline |
| `font-gothic` | UnifrakturCook | Preloader monogram only |
| `font-baybayin` | Noto Sans Tagalog | Baybayin from `data/baybayin.ts` only |

| Utility / class | Effect |
| --- | --- |
| `text-outline` | Transparent fill, 1px `line-strong` stroke — hollow display type |
| `text-outline-accent` | Same, with a 60% neon stroke |
| `bg-grid` | 80px faint grid, radially faded toward the viewport edges |
| `bg-noise` | Tiled SVG grain; set strength with `opacity-*` |
| `bg-weave` | Tiled woven diamond lattice in white; always on its own `aria-hidden` layer at `opacity-[0.03]`–`opacity-[0.05]` |
| `.glow` | 22% neon radial glow |
| `animate-pulse-dot` | Live status dot ring |
| `animate-beat-ring` | Strike button beat ring **[16]** |
| `animate-monogram-in`, `animate-monogram-breathe`, `animate-status-in` | Preloader entrance animations |

**Stacking order:** strike dividers `z-10`, header `z-50`, strike finisher `z-80`, preloader overlay `z-90`, command palette overlay `z-95` and dialog `z-96`, page-wide film grain `z-100`.

---

## How the key pieces work

Read this before changing any of these files.

- **Projects stack** (`projects-stack.tsx`, `project-card.tsx`): the section is `projects.length × 100vh` tall. Each card sits in a `sticky top-0 h-screen` wrapper, so cards pin and stack. A shared `useScroll` progress value scales each card down as the next arrives. Adding or removing projects needs no component edits.
- **Preloader** (`preloader.tsx`, gate styles in `globals.css`):
  - The overlay is always in the server HTML but CSS keeps it `display: none` unless `<html>` has `data-preloader-active`. An inline script, rendered first on the page, sets that attribute during parsing only when `sessionStorage` lacks `portfolio_preloaded` (from Task 15.1: on every full load, and it also sets `history.scrollRestoration = "manual"` so a reload opens at the top; a module flag stops client-side navigation from replaying it). That is why `<html>` has `suppressHydrationWarning`. Do not add a `flex` class to the overlay; `display` belongs to the gate.
  - React reads storage through `useSyncExternalStore` with `true` as the server snapshot.
  - `animate()` tweens a motion value 0→100 over `COUNT_DURATION` (1.6 s); holds `EXIT_HOLD` (0.2 s); exits with `y: "-100%"` over 0.8 s, or a fade under reduced motion. On exit completion the storage key is written and the scroll lock released.
  - Scroll lock is CSS `overflow: hidden` on `<html>` plus `lenis.stop()`.
- **Ink reveal** (Phase 11; `use-ink-trail.ts`, `ink-reveal.tsx`, and the three hero layers):
  - `InkRevealSection` renders the hero `<section>` and owns one **ink trail**: a single `requestAnimationFrame` loop, running only while the hero is on screen, that drops "ink" along the cursor's path **only while it moves**. Drop size and stretch grow with speed, and each drop shrinks away over 900 ms, so a still cursor shows nothing. A `portfolio:strike` window event plays a scripted diagonal sweep. Positions are in viewport pixels. Nothing in the loop causes a React render.
  - Each masked layer is an SVG containing an `<InkMask>` (a blur → noise-displacement tear → alpha-threshold filter over a mask of rotated ellipses). `useInkMaskLayer` registers the SVG with the trail; every frame `paintInkMask` converts the drops into that SVG's own coordinates with `getScreenCTM()` — which already includes parallax and entrance transforms — and resizes the filter region to fit only the live drops.
  - There is one masked SVG per coordinate space because the watermark and the portrait move at different parallax speeds: `HeroBackdropReveal` (whole hero: weave + strike slashes), `HeroWatermark` (outline word + neon fill, drawn from identical `<text>`), and `HeadgearReveal` (portrait pixels: headgear photo over the face).
  - Modes: a fine pointer drives the trail (`pointer`); touch screens get a drop that drifts over the face (`wander`), using the face position that `HeadgearReveal` reports through `setHome`; touch plus reduced motion shows one fixed headgear reveal (`static`) and nothing else.
  - If the portrait or headgear image changes, re-tune only `HEADGEAR` and `FACE` in `headgear-reveal.tsx`.
- **Strike dividers** (Phase 16; `strike-line.tsx` and the `strike-*` files): each divider owns its cuts (max 12 scars) and a `useStrikeRhythm` instance. The rhythm hook keeps timing in refs and only exposes display state (`combo`, `beat`, `chain`). Bright slash effects render unclipped and unmount after about 0.75 s; scars render in a clipped layer. Audio is one shared module: clips download on hover/focus of a button, the `AudioContext` is created on the first press, and mute/best/hint live in `localStorage` behind `try`/`catch`.
- **Command palette** (`command-palette.tsx`, `use-command-palette.ts`): rendered once in the root layout, inside the Lenis provider. Open state is a tiny external store, so any component can call `setCommandPaletteOpen(true)`. While open, Lenis is stopped; picked actions run through `run()`, which waits until the palette has closed and Lenis has restarted. The **Secrets** group only renders once 2+ characters are typed.

---

## Completed phases

1. Environment, dependencies, theme tokens, `cn()`, base UI components.
2. Types, data files, `lib/queries.ts` seam, placeholder `resume.pdf`.
3. Lenis provider, floating glass header, hero, page composition.
4. Scroll-pinned projects stack.
5. Bento grid: tech stack cards and the Arnis discipline card.
6. Contact section, footer, full-site verification. (The Task 6.2 visual walk was re-run by the architect on the Phase 10 production build at 375 / 768 / 1440px and all items passed.)
7. Signature visual upgrade: neon tokens, Anton display type, backdrop grid/noise, telemetry bar, layered hero, card tilt + spotlight.
8. 3D headgear reveal with three.js — **superseded by Phase 9, fully removed.**
9. Photo-based headgear reveal via SVG gooey mask; three.js dependencies removed.
10. Gothic monogram telemetry preloader (first visit per browser session).
11. Identity system: baybayin accents, strike line dividers, woven texture, button strike wipe, and the full-hero ink reveal (weave, strike slashes, neon watermark, headgear).
12. Project case studies at `/projects/[slug]` and the DNF 404 page. The case studies are removed again in Phase 14; the 404 page stays.
13. Hero refinement (move-only torn reveal, corner copy and telemetry, name wordmark) and the Ctrl+K command palette.
14. Case studies removed; strike line dividers turned into a slash cut.
15. Intro on every full load and reloads open at the top; projects pinned near the top; full-stance discipline card.

---

# Phase 16 — Interactive sword-slash dividers

The strike line dividers become a small rhythm game. Each divider still cuts its own strike automatically the first time it scrolls into view. A round **STRIKE** button at its right end then cuts the next Arnis strike on every press:

- **Slashes:** crescent sword slashes (white core, lime glow, afterimage trail) at the strike's angle, curving opposite ways for odd and even strikes; thrusts are stabs; horizontal strikes are tilted 12°. Every cut leaves a faint scar (up to 12 per divider).
- **Rhythm:** the first press starts a 100 BPM beat, shown by a ring pulsing out of the button. Presses within ±60 ms of a beat are **PERFECT**, within ±150 ms **GOOD**; both extend the combo. Off-beat presses show **MISS** and restart the beat. A full beat with no press ends the combo quietly.
- **Growth:** slashes grow with the combo (1×, 1.3×, 1.6×, 2×; PERFECT one step larger) and break out of the divider band. 12 on-beat strikes in a row play the finisher: a screen-wide X slash and **ANYO COMPLETE**.
- **Readout and records:** current strike, `COMBO ×n`, and `BEST ×n` (remembered per browser); a one-time "PRESS ON THE BEAT" hint.
- **Sound:** sword clips (slash, stab, finisher, miss) play from the first press on; a speaker button mutes them, remembered per browser.

The design is §4e of `docs/superpowers/specs/2026-09-16-portfolio-v2-design.md`.

Every code block below was type-checked and linted in a scratch copy at commit `bfb7a61`, then run in a production build (built with system fonts, because the network could not reach Google Fonts at the time; the fonts are unrelated to this phase) at 1919×955 with placeholder sounds: a press cut a crescent slash that spilled out of the band with a flash, and left crescent and dot scars; `PERFECT`, the beat ring, `COMBO ×2`, and `BEST` showed; timed clicks scored PERFECT, a press 300 ms off the beat scored MISS and reset the combo, and a beat with no press stopped the ring; 12 on-beat clicks played the full-width X finisher, announced "Anyo complete: 12 strikes on the beat." in the live region, and removed the overlay afterwards; each clip was fetched once per page load; muting one divider muted all four; the console stayed clean. Copy the blocks exactly.

**Rules for this phase:**

- No new dependencies. Audio uses the Web Audio API; state that must survive reloads (best combo, mute, hint) uses `localStorage` inside `try`/`catch`, and everything works when storage is blocked.
- `StrikeLine` keeps its props `{ angle, at, className }`, so `app/page.tsx` and `site-footer.tsx` do not change.
- Never re-create the STRIKE `<button>` element on a press (no changing `key`): keyboard focus must survive rapid Space / Enter presses.

### Task 16.1: Add the rhythm engine and the strike audio module

**Files:**
- Create: `hooks/use-strike-rhythm.ts`
- Create: `lib/strike-audio.ts`

**Interfaces produced:**
- From `@/hooks/use-strike-rhythm`: `BEAT_MS = 600`, `PERFECT_MS = 60`, `GOOD_MS = 150`, `FINISHER_COMBO = 12`; `type StrikeGrade = "start" | "perfect" | "good" | "miss"`; `interface StrikeResult { grade; combo; finisher }`; `useBestStrikeCombo(): number`; `takeFirstStrike(): boolean`; `useStrikeRhythm(): { combo, bestCombo, beat, chain, press }` where `press(): StrikeResult`, `beat` counts beats since the chain started, and `chain` is the chain's start time or `null` while stopped.
- From `@/lib/strike-audio`: `type StrikeSound = "slash" | "stab" | "finisher" | "miss"`; `setStrikeMuted(next: boolean)`; `useStrikeMuted(): boolean`; `preloadStrikeAudio()`; `unlockStrikeAudio()` (call inside a click or key press); `playStrikeSound(name, { volume?, rate? })`. Clips load from `/audio/strikes/{slash,stab,finisher,miss}.wav`; a missing clip is silently skipped.

- [ ] **Step 1: Create `hooks/use-strike-rhythm.ts`**

```ts
"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/** One beat at 100 BPM. */
export const BEAT_MS = 600;

/** A press this close to a beat is PERFECT. */
export const PERFECT_MS = 60;

/** A press this close to a beat is GOOD; anything further is a MISS. */
export const GOOD_MS = 150;

/** On-beat strikes in a row, counting the first press, that trigger the finisher. */
export const FINISHER_COMBO = 12;

/**
 * - `start`: the first press of a chain (or the first after a combo ended).
 * - `perfect` / `good`: an on-beat press that extended the combo.
 * - `miss`: an off-beat press; the combo restarts from this press.
 */
export type StrikeGrade = "start" | "perfect" | "good" | "miss";

export interface StrikeResult {
  grade: StrikeGrade;
  /** Combo after this press. 1 for `start` and `miss`. */
  combo: number;
  /** True when this press completed the combo; the rhythm has already reset. */
  finisher: boolean;
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
 * show the "press on the beat" hint once.
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

/** Latest time the on-beat press after beat `lastBeat` can still land. */
function deadlineFor(anchor: number, lastBeat: number) {
  return anchor + (lastBeat + 1) * BEAT_MS + GOOD_MS;
}

/**
 * Beat clock and combo for one strike divider. The first press starts a fixed
 * 100 BPM beat; each later press is graded against the nearest beat. `beat`
 * counts beats since the chain started and `chain` identifies the current
 * chain (null while the beat is stopped), so a view can restart its beat
 * animation on every beat and every new chain.
 */
export function useStrikeRhythm() {
  const [combo, setCombo] = useState(0);
  const [chain, setChain] = useState<number | null>(null);
  const [beat, setBeat] = useState(0);
  const anchorRef = useRef<number | null>(null);
  const lastBeatRef = useRef(0);
  const comboRef = useRef(0);
  const bestCombo = useBestStrikeCombo();

  const stop = useCallback(() => {
    anchorRef.current = null;
    comboRef.current = 0;
    setCombo(0);
    setChain(null);
    setBeat(0);
  }, []);

  // While a chain runs: advance `beat` on every beat, and end the combo quietly
  // once a beat's window closes without a press.
  useEffect(() => {
    if (chain === null) return;
    let timer = 0;
    function tick() {
      const anchor = anchorRef.current;
      if (anchor === null) return;
      const now = performance.now();
      if (now > deadlineFor(anchor, lastBeatRef.current)) {
        stop();
        return;
      }
      setBeat(Math.floor((now - anchor) / BEAT_MS));
      const nextBeat = anchor + (Math.floor((now - anchor) / BEAT_MS) + 1) * BEAT_MS;
      const closes = deadlineFor(anchor, lastBeatRef.current) + 1;
      timer = window.setTimeout(tick, Math.max(0, Math.min(nextBeat, closes) - now));
    }
    timer = window.setTimeout(tick, Math.max(0, chain + BEAT_MS - performance.now()));
    return () => window.clearTimeout(timer);
  }, [chain, stop]);

  const press = useCallback((): StrikeResult => {
    const now = performance.now();

    function begin(grade: "start" | "miss"): StrikeResult {
      anchorRef.current = now;
      lastBeatRef.current = 0;
      comboRef.current = 1;
      setCombo(1);
      setChain(now);
      setBeat(0);
      return { grade, combo: 1, finisher: false };
    }

    const anchor = anchorRef.current;
    if (anchor === null || now > deadlineFor(anchor, lastBeatRef.current)) return begin("start");

    const index = Math.round((now - anchor) / BEAT_MS);
    const offset = Math.abs(now - anchor - index * BEAT_MS);
    if (index !== lastBeatRef.current + 1 || offset > GOOD_MS) return begin("miss");

    lastBeatRef.current = index;
    const next = comboRef.current + 1;
    recordBest(next);
    const grade = offset <= PERFECT_MS ? "perfect" : "good";
    if (next >= FINISHER_COMBO) {
      stop();
      return { grade, combo: next, finisher: true };
    }
    comboRef.current = next;
    setCombo(next);
    return { grade, combo: next, finisher: false };
  }, [stop]);

  return { combo, bestCombo, beat, chain, press };
}
```

- [ ] **Step 2: Create `lib/strike-audio.ts`**

```ts
import { useSyncExternalStore } from "react";

/**
 * Sounds for the interactive strike dividers. The clips live in
 * `public/audio/strikes/`; their sources and licences are in `CREDITS.md`
 * there. A PERFECT press reuses the stab clip, pitched up, as a short ring.
 */
export type StrikeSound = "slash" | "stab" | "finisher" | "miss";

const SOURCES: Record<StrikeSound, string> = {
  slash: "/audio/strikes/slash.wav",
  stab: "/audio/strikes/stab.wav",
  finisher: "/audio/strikes/finisher.wav",
  miss: "/audio/strikes/miss.wav",
};

/** localStorage key holding "1" while strike sounds are muted. */
const MUTE_KEY = "portfolio_strike_muted";

let context: AudioContext | null = null;
/** Raw clip bytes, fetched ahead of the first press. */
const downloads = new Map<StrikeSound, Promise<ArrayBuffer | null>>();
/** Decoded clips, available once audio is unlocked. */
const decoded = new Map<StrikeSound, Promise<AudioBuffer | null>>();
const muteListeners = new Set<() => void>();

function readMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

let muted: boolean | null = null;

function getMuted() {
  if (muted === null) muted = readMuted();
  return muted;
}

export function setStrikeMuted(next: boolean) {
  muted = next;
  try {
    localStorage.setItem(MUTE_KEY, next ? "1" : "0");
  } catch {
    // Storage blocked: the choice lasts until reload.
  }
  muteListeners.forEach((listener) => listener());
}

/** Whether strike sounds are muted. `false` on the server and during hydration. */
export function useStrikeMuted(): boolean {
  return useSyncExternalStore(
    (listener) => {
      muteListeners.add(listener);
      return () => {
        muteListeners.delete(listener);
      };
    },
    getMuted,
    () => false,
  );
}

/**
 * Starts downloading the clips without touching audio, so the first press is
 * not silent. Call on hover or focus of a STRIKE button. Safe to call repeatedly.
 */
export function preloadStrikeAudio() {
  if (typeof window === "undefined") return;
  (Object.keys(SOURCES) as StrikeSound[]).forEach((name) => {
    if (downloads.has(name)) return;
    downloads.set(
      name,
      fetch(SOURCES[name])
        .then((response) => (response.ok ? response.arrayBuffer() : null))
        .catch(() => null),
    );
  });
}

/**
 * Creates the audio context and decodes the clips. Must be called from inside a
 * user gesture (a click or key press): browsers keep audio locked until then,
 * and creating the context earlier logs a warning. Safe to call on every press.
 * A clip that fails to download or decode stays silent.
 */
export function unlockStrikeAudio() {
  if (typeof window === "undefined" || !("AudioContext" in window)) return;
  preloadStrikeAudio();
  if (context) {
    if (context.state === "suspended") void context.resume();
    return;
  }
  const audio = new AudioContext();
  context = audio;
  (Object.keys(SOURCES) as StrikeSound[]).forEach((name) => {
    decoded.set(
      name,
      downloads
        .get(name)!
        .then((bytes) => (bytes ? audio.decodeAudioData(bytes.slice(0)) : null))
        .catch(() => null),
    );
  });
}

/**
 * Plays a clip if audio is unlocked and sound is not muted. `volume` is 0–1;
 * `rate` above 1 plays faster and higher-pitched. A clip still decoding when
 * requested plays as soon as it is ready, unless that takes over 250 ms.
 */
export function playStrikeSound(name: StrikeSound, { volume = 1, rate = 1 } = {}) {
  const audio = context;
  const pending = decoded.get(name);
  if (!audio || !pending || getMuted()) return;
  const requested = performance.now();
  void pending.then((buffer) => {
    if (!buffer || getMuted() || performance.now() - requested > 250) return;
    const source = audio.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = rate;
    const gain = audio.createGain();
    gain.gain.value = volume;
    source.connect(gain).connect(audio.destination);
    source.start();
  });
}
```

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Expected: all pass. Nothing on the page changes yet (both files are unused until Task 16.2).

- [ ] **Step 4: Commit**

```bash
git add hooks/use-strike-rhythm.ts lib/strike-audio.ts
git commit -m "feat(strike): add rhythm engine and strike audio module"
```

---

### Task 16.2: Build the interactive sword-slash dividers

**Files:**
- Create: `components/ui/strike-mark.tsx`
- Create: `components/ui/strike-button.tsx`
- Create: `components/ui/strike-finisher.tsx`
- Modify: `components/ui/strike-line.tsx` (full replacement)
- Modify: `app/globals.css` (one insertion)

**Interfaces consumed:** everything produced by Task 16.1; `getStrike` from `@/data/strike-angles`; `cn`; `motion`, `AnimatePresence`, `useAnimate`, `useReducedMotion` from `motion/react`; `Sword`, `Volume2`, `VolumeX` from `lucide-react`.
**Interfaces produced:**
- `StrikeMark` with props `{ cut: StrikeCut; layer: "effect" | "scar" }` and `interface StrikeCut { id; strike; at; scale; perfect; animate }`.
- `StrikeButton` with props `{ label, beat, chain, feedback, muted, onStrike, onToggleMute, onPrime? }` and `interface StrikeFeedback { id; grade }`.
- `StrikeFinisher` with props `{ onDone: () => void }` (renders into `document.body`).
- `StrikeLine` keeps `{ angle: number; at?: number; className?: string }`; `angle` may now be any strike 1–12.
- Tailwind class `animate-beat-ring`.

- [ ] **Step 1: Add the beat ring animation to `app/globals.css`**

In the `@theme` block, insert this directly above `  @keyframes status-in {`:

```css
  /* Strike divider beat: a ring expanding out of the STRIKE button once per beat. */
  --animate-beat-ring: beat-ring 0.6s cubic-bezier(0, 0, 0.2, 1) both;

  @keyframes beat-ring {
    from {
      transform: scale(1);
      opacity: 0.9;
    }
    to {
      transform: scale(2.2);
      opacity: 0;
    }
  }

```

- [ ] **Step 2: Create `components/ui/strike-mark.tsx`**

```tsx
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
```

- [ ] **Step 3: Create `components/ui/strike-button.tsx`**

```tsx
"use client";

import { useEffect } from "react";
import { AnimatePresence, motion, useAnimate, useReducedMotion } from "motion/react";
import { Sword, Volume2, VolumeX } from "lucide-react";

import { cn } from "@/lib/utils";

/** Latest press feedback. `id` changes on every press so repeats replay. */
export interface StrikeFeedback {
  id: number;
  grade: "start" | "perfect" | "good" | "miss";
}

export interface StrikeButtonProps {
  /** Accessible name, including the strike this press will cut. */
  label: string;
  /** Beats since the chain started; the ring replays on every change. */
  beat: number;
  /** Identifies the running chain, or null while the beat is stopped. */
  chain: number | null;
  feedback: StrikeFeedback | null;
  muted: boolean;
  onStrike: () => void;
  onToggleMute: () => void;
  /** Called on hover or focus, before a press: a chance to preload sounds. */
  onPrime?: () => void;
}

function token(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/**
 * Round STRIKE button with a beat ring, PERFECT / MISS feedback, and a mute
 * toggle. The ring expands on every beat while a chain runs; with reduced
 * motion it blinks instead. The button element is never re-created, so
 * keyboard focus survives rapid Space / Enter presses.
 */
export function StrikeButton({
  label,
  beat,
  chain,
  feedback,
  muted,
  onStrike,
  onToggleMute,
  onPrime,
}: StrikeButtonProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const [scope, animate] = useAnimate<HTMLButtonElement>();
  const grade = feedback?.grade;

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

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative">
        {chain !== null ? (
          <span
            key={`${chain}-${beat}`}
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-0 rounded-full border border-accent",
              reduceMotion ? (beat % 2 === 0 ? "opacity-80" : "opacity-20") : "animate-beat-ring",
            )}
          />
        ) : null}

        <button
          ref={scope}
          type="button"
          aria-label={label}
          onClick={onStrike}
          onPointerEnter={onPrime}
          onFocus={onPrime}
          className="relative flex size-10 items-center justify-center rounded-full border border-accent/60 bg-bg text-accent transition-[border-color] duration-150 hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:size-11"
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
```

- [ ] **Step 4: Create `components/ui/strike-finisher.tsx`**

```tsx
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
        Anyo
        <span className="block text-fg">complete</span>
      </motion.p>
    </motion.div>,
    document.body,
  );
}
```

- [ ] **Step 5: Replace `components/ui/strike-line.tsx`**

```tsx
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
 * grow with an on-beat combo, and end in a finisher after 12 in a row.
 */
export function StrikeLine({ angle, at = 0.5, className }: StrikeLineProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const muted = useStrikeMuted();
  const { combo, bestCombo, beat, chain, press } = useStrikeRhythm();

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
      setAnnouncement(`Anyo complete: ${FINISHER_COMBO} strikes on the beat.`);
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
            beat={beat}
            chain={chain}
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
                PRESS ON THE BEAT
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
```

- [ ] **Step 6: Verify**

```bash
npx tsc --noEmit
npm run lint
npm run build
npm run start
```

There are no sound files yet (Task 16.3), so everything below is silent. After the intro, at 1440px:

- [ ] Each divider (hero → projects, projects → stack, stack → contact, footer) shows the hairline, a label such as `ANGLE 01 // 135°` at the right, a round lime-outlined button with a sword icon, and a speaker icon.
- [ ] Scrolling a divider into view cuts one crescent slash automatically, leaving a thin crescent scar.
- [ ] Press the sword button once: a bright crescent slash (white core, lime glow) sweeps across the line with a flash where it crosses and a pulse running along the line; the label advances to the next strike; a ring pulses out of the button every 0.6 s; the very first time ever, "PRESS ON THE BEAT" appears for a few seconds.
- [ ] Press in time with the ring: `COMBO ×2`, `×3` … appear, well-timed presses flash the button lime with a "PERFECT" pop, and by `×7` and beyond the slashes are clearly bigger and spill over the content above and below.
- [ ] Thrust strikes (5, 6, 7, 10, 11) show a downward stab with a ring burst and leave a dot; strikes 3 and 4 still look like diagonal swings.
- [ ] Press clearly off the beat: "MISS", the button shakes, the combo disappears, and a normal-size slash is still cut.
- [ ] Stop pressing: within about a second the ring stops and the combo disappears. `BEST ×n` shows your best combo, and it is still there after a reload.
- [ ] Keep 12 presses in a row on the beat: a giant X of two slashes crosses the whole screen, the screen flashes, and "ANYO COMPLETE" appears, then everything fades and the combo resets. The page stays clickable throughout.
- [ ] Tab to a sword button and tap Space in rhythm: it works the same as clicking, and focus stays on the button.
- [ ] Pressing many times keeps at most 12 scars per divider; the oldest fade out.
- [ ] Reduced motion (DevTools → Rendering → prefers-reduced-motion: reduce, reload): presses add scars without the sweep, the ring blinks instead of expanding, the finisher shows only the text.
- [ ] At 375px: the label is hidden, the sword and speaker buttons fit at the right, and there is no horizontal scrollbar.
- [ ] Console is clean.

- [ ] **Step 7: Commit**

```bash
git add app/globals.css components/ui/strike-mark.tsx components/ui/strike-button.tsx components/ui/strike-finisher.tsx components/ui/strike-line.tsx
git commit -m "feat(strike): make strike dividers an interactive sword-slash rhythm game"
```

---

### Task 16.3: Add the sword sound clips

**Files:**
- Commit (added by the architect — do not edit): `public/audio/strikes/slash.wav`, `stab.wav`, `finisher.wav`, `miss.wav`, `CREDITS.md`

**Interfaces consumed:** the clip paths in `lib/strike-audio.ts` (Task 16.1).

The architect has already placed the four clips and `CREDITS.md` in `public/audio/strikes/` (uncommitted). They are derived from the CC0 pack "20 Sword Sound Effects (Attacks and Clashes)" by StarNinjas; `CREDITS.md` records the source and every edit. **If that folder is missing, skip this task, leave its boxes unchecked, and say so in your summary.**

- [ ] **Step 1: Check the files**

```bash
ls -la public/audio/strikes
```

Expected: `slash.wav` (≈16 KB), `stab.wav` (≈19 KB), `finisher.wav` (≈51 KB), `miss.wav` (≈20 KB), and `CREDITS.md`.

- [ ] **Step 2: Verify**

```bash
npm run build
npm run start
```

- [ ] Hover a sword button, then press it: a sword whoosh plays on that first press.
- [ ] Thrust strikes play a sharp stab/clash; PERFECT presses add a short high ring; MISS plays a dull thud; the finisher plays a heavier slash sound.
- [ ] The speaker button mutes all dividers at once and shows a crossed-out speaker; the choice survives a reload.
- [ ] No sound plays before the first press on the page.
- [ ] Console is clean.

- [ ] **Step 3: Commit**

```bash
git add public/audio/strikes
git commit -m "feat(strike): add CC0 sword sound clips"
```

---

### Task 16.4: Phase 16 verification pass

**Files:** none created; fix whatever this task surfaces.

- [ ] **Step 1: Clean production build**

```bash
npx tsc --noEmit
npm run lint
npm run build
npm run start
```

- [ ] **Step 2: Walk the production build**

- [ ] **Performance:** DevTools → Performance, CPU throttling 4×, record while pressing a sword button on the beat for 10 seconds. No long frames (red bars) from the slashes. If frames drop, report it rather than changing constants.
- [ ] **Hero untouched:** the ink reveal, palette, and preloader still behave as before.
- [ ] **Storage blocked** (DevTools → Application → Storage → "Clear site data", then block third-party/site data or use a private window with storage disabled): the dividers still work; only BEST, mute memory, and the hint are not remembered.
- [ ] **Widths** 375px, 768px, 1440px: no horizontal scrollbar; big slashes and the finisher never create one.
- [ ] **Keyboard only:** every sword and speaker button is reachable with Tab and shows a focus ring.
- [ ] **Console:** clean.

- [ ] **Step 3: Commit any fixes**

```bash
git add -A -- app components data hooks lib types
git commit -m "fix: address phase 16 verification findings"
```

If nothing needed fixing, skip the commit.

---
## Handoff checklist (owner-supplied content)

Only the repository owner can resolve these. Do not invent values.

1. `data/site.ts` — name, initials, wordmark, and GitHub URL are set; email and site URL are still placeholders (the palette's **Copy email** copies whatever is there). Also confirm `availability.isAvailable`, `timeZone` / `timeZoneLabel` (`Asia/Manila` / `GMT+8`), and the `watermark` word (sized for ~9 characters).
2. `data/projects.ts` — three example projects (Ledger, Driftline, FleetDesk) need replacing with real ones.
3. `public/resume.pdf` — minimal placeholder; replace with the real résumé.
4. `public/images/hero/headgear.webp` and `headgear-ghost.webp` — cut out from STIX's product photo as sold by Eljan Sports, with the logo painted over. The photo still belongs to STIX/the retailer. Replacing it with a photo of a borrowed headgear (front view, plain background, even light) removes the risk; re-tune `HEADGEAR` and `FACE` in `components/sections/headgear-reveal.tsx` afterwards.
5. `data/baybayin.ts` — **launch blocker.** Every entry is `reviewed: false`. Someone who reads baybayin must check each `text` (the surname Garaza, "Sipag at Disiplina", "Proyekto", "Kasanayan", "Ugnayan") before the site goes public.
6. `data/strike-angles.ts` — **launch blocker.** Every entry is `confirmed: false`. Check each number, target, and on-screen direction against the owner's sport Arnis anyo.
7. `components/ui/preloader.tsx` — `STATUS_LINES` are hard-coded (`GARAZA // DEV PORTFOLIO`, `SYS.INIT // OK`, `LATENCY // 12MS`); `12MS` is decorative.

**Next phases (planned in the spec, not yet written as tasks):** Phase 17, new home sections (About, Experience, Arnis, Now — the owner picks which); Phase 18, polish and reach (tech marquee, heading reveals, OG images, sitemap, robots, JSON-LD, Vercel Web Analytics, Lighthouse ≥ 90).
