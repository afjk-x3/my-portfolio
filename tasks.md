# Portfolio Implementation Plan

> **For the builder (OpenCode):** Execute tasks strictly in order. Each task is
> self-contained — read only that task, do exactly what it says, run its
> **Verify** block, then commit. Do not skip ahead, do not batch phases, and do
> not "improve" adjacent files that the task does not list.

> **Status:** Phases 1–12 are complete and committed. **Start at Phase 13**
> (hero refinement and command palette). The design is in
> `docs/superpowers/specs/2026-09-16-portfolio-v2-design.md` (§4b covers Phase
> 13); read it only if a task does not answer a question. Step-by-step history
> of earlier phases was removed from this file; read Phases 1–10 with
> `git show 633c7fb:tasks.md` and Phases 11–12 with `git show f9256c3:tasks.md`
> only if a task explicitly tells you to.

**Goal:** A single-page, dark, motion-driven developer portfolio on Next.js 16 App Router with per-project case study pages and a command palette, deployed to Vercel.

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

To replay the preloader while testing: `sessionStorage.removeItem("portfolio_preloaded")` and reload. To skip it: `sessionStorage.setItem("portfolio_preloaded", "1")` and reload.

---

## Current file structure

Files marked **[13]** are created or changed by Phase 13.

```
app/
  layout.tsx                 # fonts, metadata, <Backdrop>, <SmoothScrollProvider>, <CommandPalette> [13]
  page.tsx                   # <Preloader>, <SiteHeader>, sections separated by <StrikeLine>, <SiteFooter>
  globals.css                # theme tokens, utilities (bg-weave), animations (strike-wipe), Lenis base, preloader gate
  not-found.tsx              # "DNF // Did not finish" 404
  projects/[slug]/page.tsx   # case study page, statically generated
components/
  command-palette/
    command-palette.tsx      # Ctrl+K / ⌘K palette: navigate, case studies, actions, secrets [13] (client)
  case-study/
    case-study-header.tsx    # title band: weave, Anton title, spec row, links
    case-study-body.tsx      # numbered sections; empty ones are hidden
    next-lap.tsx             # next case study card + back link
  layout/
    backdrop.tsx             # page-wide fixed grid + noise layers (server)
    site-header.tsx          # glass nav: name wordmark [13], section links, palette button [13], socials (client)
    site-footer.tsx          # footer with weave texture and strike line (server)
  sections/
    hero.tsx                 # <InkRevealSection>: backdrop reveal, visual stage, corner copy + status [13]
    hero-visual.tsx          # watermark + glow + portrait, parallax (client)
    hero-watermark.tsx       # SVG outline word + ink-revealed neon fill (client)
    hero-backdrop-reveal.tsx # ink-revealed weave + strike slashes across the hero (client)
    headgear-reveal.tsx      # ink-revealed headgear photo over the face (client)
    ink-reveal.tsx           # InkRevealSection, InkMask (torn-edge filter [13]), paintInkMask, useInkMaskLayer (client)
    hero-status.tsx          # AvailabilityStatus + LocalClock [13] (client)
    projects-showcase.tsx    # server: awaits getProjects() (id="projects")
    projects-stack.tsx       # sticky scroll stack (client)
    project-card.tsx         # one card in the stack, tilt + spotlight, case study links (client)
    bento-grid.tsx           # server: awaits getSkillCategories() (id="stack")
    tech-stack-card.tsx      # one skill group card (server)
    discipline-card.tsx      # Arnis photo card, hover/focus cross-fade (client, id="discipline")
    contact.tsx              # contact CTA (server, id="contact")
  providers/
    smooth-scroll-provider.tsx  # Lenis root (client)
  ui/
    button.tsx               # cva + Radix Slot, neon variants, strike wipe on hover
    badge.tsx                # tech-stack pill
    section-heading.tsx      # eyebrow + optional baybayin script + title
    strike-line.tsx          # divider cut at an Arnis strike angle (client)
    preloader.tsx            # first-visit monogram + baybayin name + counter overlay (client)
data/
  site.ts                    # siteConfig (identity, wordmark [13], watermark, availability, time zone) + socialLinks
  navigation.ts              # nav anchors
  projects.ts                # Project[] with case studies
  skills.ts                  # SkillCategory[] + discipline photos
  baybayin.ts                # every baybayin string, with review flags
  strike-angles.ts           # the 12 Arnis strikes, with confirmation flags
hooks/
  use-ink-trail.ts           # shared ink trail: move-only, speed-sized drops, strike event [13]
  use-command-palette.ts     # palette open state + modifier key label [13]
  use-local-time.ts          # ticking clock via useSyncExternalStore
  use-media-query.ts         # matchMedia via useSyncExternalStore
  use-pointer-tilt.ts        # mouse-tracked 3D tilt + spotlight motion values
lib/
  utils.ts                   # cn()
  queries.ts                 # async data access seam (Supabase swap point)
types/
  index.ts                   # shared domain types — extend, do not rewrite
public/
  resume.pdf                 # placeholder
  images/hero/               # hero-portrait.png (2048×1365), headgear.webp (logo removed), headgear-ghost.webp
  images/about/              # arnis-stance.jpg, arnis-action.jpg
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
| `font-display` | Anton | Watermark, hero headline, case study titles |
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
| `animate-monogram-in`, `animate-monogram-breathe`, `animate-status-in` | Preloader entrance animations |
| `animate-strike-wipe` | Case study arrival wipe |

**Stacking order:** header `z-50`, preloader overlay and case study wipe `z-90`, command palette overlay `z-95` and dialog `z-96`, page-wide film grain `z-100`.

---

## How the key pieces work

Read this before changing any of these files.

- **Projects stack** (`projects-stack.tsx`, `project-card.tsx`): the section is `projects.length × 100vh` tall. Each card sits in a `sticky top-0 h-screen` wrapper, so cards pin and stack. A shared `useScroll` progress value scales each card down as the next arrives. Adding or removing projects needs no component edits.
- **Preloader** (`preloader.tsx`, gate styles in `globals.css`):
  - The overlay is always in the server HTML but CSS keeps it `display: none` unless `<html>` has `data-preloader-active`. An inline script, rendered first on the page, sets that attribute during parsing only when `sessionStorage` lacks `portfolio_preloaded`. That is why `<html>` has `suppressHydrationWarning`. Do not add a `flex` class to the overlay; `display` belongs to the gate.
  - React reads storage through `useSyncExternalStore` with `true` as the server snapshot.
  - `animate()` tweens a motion value 0→100 over `COUNT_DURATION` (1.6 s); holds `EXIT_HOLD` (0.2 s); exits with `y: "-100%"` over 0.8 s, or a fade under reduced motion. On exit completion the storage key is written and the scroll lock released.
  - Scroll lock is CSS `overflow: hidden` on `<html>` plus `lenis.stop()`.
- **Ink reveal** (Phase 11; `use-ink-trail.ts`, `ink-reveal.tsx`, and the three hero layers):
  - `InkRevealSection` renders the hero `<section>` and owns one **ink trail**: a single `requestAnimationFrame` loop, running only while the hero is on screen, that drops "ink" along the cursor's path **only while it moves**. Drop size and stretch grow with speed, and each drop shrinks away over 900 ms, so a still cursor shows nothing. A `portfolio:strike` window event plays a scripted diagonal sweep. Positions are in viewport pixels. Nothing in the loop causes a React render.
  - Each masked layer is an SVG containing an `<InkMask>` (a blur → noise-displacement tear → alpha-threshold filter over a mask of rotated ellipses). `useInkMaskLayer` registers the SVG with the trail; every frame `paintInkMask` converts the drops into that SVG's own coordinates with `getScreenCTM()` — which already includes parallax and entrance transforms — and resizes the filter region to fit only the live drops.
  - There is one masked SVG per coordinate space because the watermark and the portrait move at different parallax speeds: `HeroBackdropReveal` (whole hero: weave + strike slashes), `HeroWatermark` (outline word + neon fill, drawn from identical `<text>`), and `HeadgearReveal` (portrait pixels: headgear photo over the face).
  - Modes: a fine pointer drives the trail (`pointer`); touch screens get a drop that drifts over the face (`wander`), using the face position that `HeadgearReveal` reports through `setHome`; touch plus reduced motion shows one fixed headgear reveal (`static`) and nothing else.
  - If the portrait or headgear image changes, re-tune only `HEADGEAR` and `FACE` in `headgear-reveal.tsx`.
- **Command palette** (`command-palette.tsx`, `use-command-palette.ts`): rendered once in the root layout, inside the Lenis provider, with case study data passed from the server. Open state is a tiny external store, so any component can call `setCommandPaletteOpen(true)`. While open, Lenis is stopped; picked actions run through `run()`, which waits until the palette has closed and Lenis has restarted. The **Secrets** group only renders once 2+ characters are typed.
- **Case studies**: a project with `caseStudy: null` stays card-only. Projects with a case study get a statically generated page at `/projects/<slug>`; `dynamicParams = false` makes every other slug a 404. In `CaseStudyBody`, empty strings and empty arrays hide their section, and the remaining sections are numbered consecutively.

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
12. Project case studies at `/projects/[slug]`, the DNF 404 page, and case study links from cards and the header.

---

# Phase 13 — Hero refinement and command palette

This phase brings the hero closer to landonorris.com and adds a site-wide command palette:

- **Reveal:** ink appears only while the mouse moves. Slow movement leaves small patches, fast movement leaves large ones stretched along the direction of travel, and every edge tears into ragged sideways strips. Within about a second of the mouse stopping, the hero is clean again, even with the cursor still over the face.
- **Hero layout:** the portrait keeps its current size. The telemetry strip across the top is removed: availability moves above the name in the bottom-left, the local clock sits above the buttons in the bottom-right, and the headline and buttons are smaller.
- **Header:** the initials become a two-line wordmark (`JOHN PAUL / GARAZA`), and a search button with a `Ctrl K` / `⌘ K` hint opens the palette.
- **Command palette:** Ctrl+K / ⌘K anywhere. Jump to sections, search case studies by name or tech, download the résumé, copy the email, open GitHub, and two hidden commands that only appear once you type: **Replay intro** and **Strike** (a diagonal reveal sweep across the hero).

Every block below was type-checked, linted, and built with Turbopack in a scratch copy of this repository at commit `40a95ee`, with the owner's current `data/site.ts`, then checked in a production build at 1919×955: moving the mouse shows torn, stretched reveals and the hero is clean 1.5 s after stopping with the cursor still over the face; Ctrl+K opens the palette; typing `unity` leaves only Driftline; typing `strike` reveals the hidden Strike command, and running it from 1,000 px down the page scrolls to the top and plays the sweep (all 36 drops on all three layers, cleared about 1.4 s later); Lenis is running again after the palette closes. The phone-width layout and touch modes were not exercised there and are covered by Task 13.5. Copy the blocks exactly.

**Rules for this phase:**

- The only new dependencies are `cmdk` and `@radix-ui/react-dialog`, installed in Task 13.3. `cmdk` already uses Radix Dialog internally; it is added as a direct dependency because the palette imports it for an accessible dialog title.
- `data/site.ts` contains the owner's real name, links, and uncommitted edits. Task 13.4 inserts one field into it; never replace that file.
- Palette actions must go through `run()` in `command-palette.tsx`, which runs them only after the palette has closed. Running a Lenis scroll before that gets cancelled when Lenis restarts.

### Task 13.1: Show the reveal only while the mouse moves, with torn, stretched edges

**Files:**
- Modify: `hooks/use-ink-trail.ts` (full replacement)
- Modify: `components/sections/ink-reveal.tsx` (full replacement)
- Modify: `components/sections/headgear-reveal.tsx`

**Interfaces consumed:** `useMediaQuery`; `useInView`, `useReducedMotion` from `motion/react`.
**Interfaces produced:**
- `InkPoint` gains `angle: number` (radians, direction of travel) and `stretch: number` (long axis ÷ short axis, `1` is a circle). Every `InkPoint` literal must now include both.
- `INK_STRIKE_EVENT = "portfolio:strike"` from `@/hooks/use-ink-trail`. Dispatching `new Event(INK_STRIKE_EVENT)` on `window` plays one diagonal sweep across the hero (used by the palette in Task 13.3).
- `InkMask` now renders `<ellipse data-ink-drop>` shapes and a torn-edge filter; its props are unchanged.

- [ ] **Step 1: Replace `hooks/use-ink-trail.ts`**

```ts
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
```

- [ ] **Step 2: Replace `components/sections/ink-reveal.tsx`**

```tsx
"use client";

import {
  createContext,
  use,
  useEffect,
  useId,
  useRef,
  type ComponentProps,
  type RefObject,
} from "react";

import { INK_POOL, useInkTrail, type InkPoint, type InkTrail } from "@/hooks/use-ink-trail";

/** Blur radius of the gooey filter, in screen px. */
const INK_BLUR = 12;

/**
 * Torn edges. Noise with a long horizontal and short vertical wavelength slices
 * the blurred drops into horizontal strips, and each strip is shifted sideways
 * by up to half of `INK_TEAR` px before the edge is sharpened. Frequencies are
 * per screen px.
 */
const INK_NOISE_X = 0.0025;
const INK_NOISE_Y = 0.045;
const INK_TEAR = 180;

const InkTrailContext = createContext<InkTrail | null>(null);

/**
 * A `<section>` that owns the shared ink trail. Every `useInkMaskLayer` inside
 * it reveals against the same cursor trail.
 */
export function InkRevealSection({ children, ...props }: ComponentProps<"section">) {
  const ref = useRef<HTMLElement>(null);
  const trail = useInkTrail(ref);

  return (
    <section ref={ref} {...props}>
      <InkTrailContext value={trail}>{children}</InkTrailContext>
    </section>
  );
}

/** The trail from the nearest `InkRevealSection`. */
export function useInkReveal(): InkTrail {
  const trail = use(InkTrailContext);
  if (!trail) throw new Error("useInkReveal must be used inside <InkRevealSection>");
  return trail;
}

/** A `useId`-based id that is safe inside `url(#…)` references. */
export function useSvgId(prefix: string) {
  return `${prefix}-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

export interface InkMaskProps {
  /** Base id from `useSvgId`. The mask is referenced as `url(#<id>-mask)`. */
  id: string;
  /** Mask region, in the SVG's user units. Must cover everything it masks. */
  x: number | string;
  y: number | string;
  width: number | string;
  height: number | string;
}

/**
 * Filter and mask definitions for one masked layer. Place inside `<defs>`,
 * then set `mask="url(#<id>-mask)"` on whatever the trail should reveal.
 *
 * The filter blurs the drops together, tears the blurred shape into sideways
 * strips with a noise displacement, then sharpens the alpha back to a crisp
 * edge. Its region starts empty and `paintInkMask` resizes it every frame to
 * fit only the live drops.
 */
export function InkMask({ id, x, y, width, height }: InkMaskProps) {
  return (
    <>
      <filter
        id={`${id}-goo`}
        data-ink-filter=""
        filterUnits="userSpaceOnUse"
        x="0"
        y="0"
        width="0"
        height="0"
        colorInterpolationFilters="sRGB"
      >
        <feGaussianBlur in="SourceGraphic" data-ink-blur="" stdDeviation={INK_BLUR} result="blur" />
        <feTurbulence
          data-ink-noise=""
          type="fractalNoise"
          baseFrequency={`${INK_NOISE_X} ${INK_NOISE_Y}`}
          numOctaves="2"
          seed="7"
          result="noise"
        />
        {/* Pin the green channel to 0.5 so the tear only moves strips sideways. */}
        <feColorMatrix
          in="noise"
          values="1 0 0 0 0  0 0 0 0 0.5  0 0 1 0 0  0 0 0 0 1"
          result="sideways"
        />
        <feDisplacementMap
          in="blur"
          in2="sideways"
          data-ink-tear=""
          scale={INK_TEAR}
          xChannelSelector="R"
          yChannelSelector="G"
          result="torn"
        />
        <feColorMatrix in="torn" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -10" />
      </filter>
      <mask id={`${id}-mask`} maskUnits="userSpaceOnUse" x={x} y={y} width={width} height={height}>
        <g filter={`url(#${id}-goo)`}>
          {Array.from({ length: INK_POOL }, (_, i) => (
            <ellipse key={i} data-ink-drop="" rx="0" ry="0" fill="#fff" />
          ))}
        </g>
      </mask>
    </>
  );
}

/**
 * Converts the trail from viewport pixels into this SVG's user units and writes
 * it into the `InkMask` ellipses. `getScreenCTM` already includes every CSS
 * transform on the SVG's ancestors (parallax, entrance scale), so the reveal
 * stays aligned while those animate.
 */
export function paintInkMask(svg: SVGSVGElement, points: readonly InkPoint[]) {
  const shapes = svg.querySelectorAll<SVGEllipseElement>("[data-ink-drop]");
  const filter = svg.querySelector<SVGFilterElement>("[data-ink-filter]");
  const blur = svg.querySelector<SVGFEGaussianBlurElement>("[data-ink-blur]");
  const noise = svg.querySelector<SVGFETurbulenceElement>("[data-ink-noise]");
  const tear = svg.querySelector<SVGFEDisplacementMapElement>("[data-ink-tear]");
  const matrix = svg.getScreenCTM();
  if (!filter || !blur || !noise || !tear || !matrix) return;

  const toLocal = matrix.inverse();
  const scale = Math.hypot(matrix.a, matrix.b) || 1;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  shapes.forEach((shape, i) => {
    const point = points[i];
    if (!point) {
      shape.setAttribute("rx", "0");
      shape.setAttribute("ry", "0");
      return;
    }
    const local = new DOMPoint(point.x, point.y).matrixTransform(toLocal);
    const radius = point.radius / scale;
    // Stretch along the direction of travel, thin across it, keeping the area.
    const long = radius * Math.sqrt(point.stretch);
    const short = radius / Math.sqrt(point.stretch);
    const cx = local.x.toFixed(1);
    const cy = local.y.toFixed(1);
    shape.setAttribute("cx", cx);
    shape.setAttribute("cy", cy);
    shape.setAttribute("rx", long.toFixed(1));
    shape.setAttribute("ry", short.toFixed(1));
    shape.setAttribute("transform", `rotate(${((point.angle * 180) / Math.PI).toFixed(1)} ${cx} ${cy})`);
    minX = Math.min(minX, local.x - long);
    minY = Math.min(minY, local.y - long);
    maxX = Math.max(maxX, local.x + long);
    maxY = Math.max(maxY, local.y + long);
  });

  // Every filter length is in screen px; convert to this SVG's units.
  const std = INK_BLUR / scale;
  blur.setAttribute("stdDeviation", std.toFixed(2));
  noise.setAttribute("baseFrequency", `${(INK_NOISE_X * scale).toFixed(5)} ${(INK_NOISE_Y * scale).toFixed(5)}`);
  tear.setAttribute("scale", (INK_TEAR / scale).toFixed(1));

  if (points.length === 0) {
    // A zero-size filter region renders nothing, so the mask reveals nothing.
    filter.setAttribute("width", "0");
    filter.setAttribute("height", "0");
    return;
  }
  const margin = std * 3 + INK_TEAR / scale / 2;
  filter.setAttribute("x", (minX - margin).toFixed(1));
  filter.setAttribute("y", (minY - margin).toFixed(1));
  filter.setAttribute("width", (maxX - minX + margin * 2).toFixed(1));
  filter.setAttribute("height", (maxY - minY + margin * 2).toFixed(1));
}

/**
 * Paints the shared trail into the `InkMask` inside `svgRef` every frame.
 * Does nothing in `static` mode; a layer that needs a fixed reveal there draws
 * it itself.
 */
export function useInkMaskLayer(svgRef: RefObject<SVGSVGElement | null>) {
  const trail = useInkReveal();

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || trail.mode === "static") return;
    return trail.addLayer((points) => paintInkMask(svg, points));
  }, [svgRef, trail]);

  return trail;
}
```

- [ ] **Step 3: Add the new point fields to the static headgear reveal**

In `components/sections/headgear-reveal.tsx`, replace:

```tsx
      paintInkMask(svg, [{ x: face.x, y: face.y, radius: STATIC_RADIUS * matrix.a }]);
```

with:

```tsx
      paintInkMask(svg, [
        { x: face.x, y: face.y, radius: STATIC_RADIUS * matrix.a, angle: 0, stretch: 1 },
      ]);
```

- [ ] **Step 4: Verify**

```bash
npx tsc --noEmit
npm run lint
npm run build
npm run dev
```

With the preloader skipped, at desktop width:

- [ ] Before touching the mouse, nothing is revealed.
- [ ] Moving the mouse slowly across the hero leaves small reveal patches; flicking it fast leaves long streaks pointing the way the mouse went.
- [ ] Reveal edges are ragged, broken into sideways strips, not smooth round blobs.
- [ ] Stop the mouse over the face and keep it there: within about a second the headgear, lime watermark, weave, and slashes are all gone.
- [ ] Start moving again: the reveal comes back straight away, with no jump from the previous position.
- [ ] In the console, run `window.dispatchEvent(new Event("portfolio:strike"))` with the hero on screen: a fast reveal sweeps from lower left to upper right and fades.
- [ ] In DevTools device mode (a phone with touch), a blob still drifts over the face on its own, with torn edges.
- [ ] Console is clean.

- [ ] **Step 5: Commit**

```bash
git add hooks/use-ink-trail.ts components/sections/ink-reveal.tsx components/sections/headgear-reveal.tsx
git commit -m "feat(hero): reveal only while moving, with torn stretched edges"
```

---

### Task 13.2: Tuck the hero copy and telemetry into the bottom corners

**Files:**
- Create: `components/sections/hero-status.tsx`
- Delete: `components/sections/telemetry-bar.tsx`
- Modify: `components/sections/hero.tsx` (full replacement)

**Interfaces consumed:** `siteConfig.availability`, `siteConfig.timeZone`, `siteConfig.timeZoneLabel`; `useLocalTime`; `InkRevealSection`, `HeroBackdropReveal`, `HeroVisual`; `baybayin`.
**Interfaces produced:** `AvailabilityStatus` and `LocalClock` from `@/components/sections/hero-status`, each with props `{ className?: string }`. `TelemetryBar` no longer exists.

`components/sections/hero-visual.tsx` is **not** changed: the portrait keeps its current size.

- [ ] **Step 1: Create `components/sections/hero-status.tsx`**

```tsx
"use client";

import { siteConfig } from "@/data/site";
import { useLocalTime } from "@/hooks/use-local-time";
import { cn } from "@/lib/utils";

const TELEMETRY_TEXT = "font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-muted";

/** Pulsing availability dot and label, from `siteConfig.availability`. */
export function AvailabilityStatus({ className }: { className?: string }) {
  const { availability } = siteConfig;

  return (
    <p className={cn("flex items-center gap-3", TELEMETRY_TEXT, className)}>
      <span aria-hidden className="relative flex size-2">
        {availability.isAvailable ? (
          <span className="absolute inset-0 animate-pulse-dot rounded-full bg-accent" />
        ) : null}
        <span
          className={cn(
            "relative size-2 rounded-full",
            availability.isAvailable
              ? "bg-accent shadow-[0_0_10px_var(--color-accent)]"
              : "bg-muted",
          )}
        />
      </span>
      <span className={availability.isAvailable ? "text-fg" : undefined}>
        {availability.label}
      </span>
    </p>
  );
}

/** Ticking wall-clock time in the owner's time zone. */
export function LocalClock({ className }: { className?: string }) {
  const time = useLocalTime(siteConfig.timeZone);

  return (
    <p className={cn("flex items-center gap-2 tabular-nums", TELEMETRY_TEXT, className)}>
      <span>Local</span>
      <span className="text-fg">{time ?? "--:--:--"}</span>
      <span className="text-accent">{siteConfig.timeZoneLabel}</span>
    </p>
  );
}
```

- [ ] **Step 2: Delete the old telemetry bar**

```bash
git rm components/sections/telemetry-bar.tsx
```

- [ ] **Step 3: Replace `components/sections/hero.tsx`**

```tsx
import { CodeXml, Download } from "lucide-react";

import { HeroBackdropReveal } from "@/components/sections/hero-backdrop-reveal";
import { AvailabilityStatus, LocalClock } from "@/components/sections/hero-status";
import { HeroVisual } from "@/components/sections/hero-visual";
import { InkRevealSection } from "@/components/sections/ink-reveal";
import { Button } from "@/components/ui/button";
import { baybayin } from "@/data/baybayin";
import { siteConfig } from "@/data/site";

export function Hero() {
  return (
    <InkRevealSection
      id="hero"
      className="relative flex flex-col overflow-hidden px-6 pt-24 pb-10 lg:min-h-svh"
    >
      {/* Hidden layer behind everything: weave and strike slashes. */}
      <HeroBackdropReveal />

      <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col">
        <HeroVisual watermark={siteConfig.watermark} />

        {/*
         * Below lg the copy flows under the portrait. From lg up it is tucked
         * into the bottom corners so the portrait and the reveal own the screen:
         * identity bottom-left, clock and actions bottom-right.
         */}
        <div className="relative z-20 -mt-16 flex flex-col items-center gap-6 text-center lg:absolute lg:inset-x-0 lg:bottom-0 lg:mt-0 lg:flex-row lg:items-end lg:justify-between lg:text-left">
          <div className="flex flex-col items-center gap-3 lg:items-start">
            <AvailabilityStatus />
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-muted">
              {siteConfig.name}
            </span>
            <h1 className="font-display text-5xl uppercase leading-[0.85] text-fg sm:text-6xl">
              Full Stack
              <span className="block text-accent">Developer</span>
            </h1>
            <p className="flex flex-col items-center gap-1 whitespace-nowrap sm:flex-row sm:items-baseline sm:gap-3 lg:justify-start">
              <span aria-hidden className="font-baybayin text-base text-muted">
                {baybayin.motto.text}
              </span>
              <span className="font-mono text-[0.625rem] uppercase tracking-[0.3em] text-muted">
                Diligence &amp; discipline
              </span>
            </p>
          </div>

          <div className="flex flex-col items-center gap-4 lg:items-end">
            <LocalClock />
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild>
                <a href={siteConfig.githubUrl} target="_blank" rel="noopener noreferrer">
                  <CodeXml aria-hidden />
                  GitHub
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href={siteConfig.resumePath} download>
                  <Download aria-hidden />
                  Resume
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </InkRevealSection>
  );
}
```

- [ ] **Step 4: Verify**

```bash
npx tsc --noEmit
npm run lint
npm run build
npm run dev
```

- [ ] At desktop width there is no telemetry strip under the header; the portrait and watermark are the same size and position as before this task.
- [ ] Bottom-left, top to bottom: the pulsing `AVAILABLE FOR WORK` dot, the name, a smaller `FULL STACK / DEVELOPER` headline, the baybayin motto.
- [ ] Bottom-right: `LOCAL hh:mm:ss GMT+8` ticking, with GitHub and Resume buttons (normal size, not large) below it.
- [ ] At 375px everything stacks centred under the portrait in the same order, with no horizontal scrollbar.
- [ ] `grep -r "TelemetryBar" app components` returns nothing.

- [ ] **Step 5: Commit**

```bash
git add components/sections/hero-status.tsx components/sections/hero.tsx
git commit -m "feat(hero): tuck copy and telemetry into the bottom corners"
```

(The deletion from Step 2 is already staged and is included in this commit.)

---

### Task 13.3: Add the command palette

**Files:**
- Modify: `package.json`, `package-lock.json` (via npm)
- Create: `hooks/use-command-palette.ts`
- Create: `components/command-palette/command-palette.tsx`
- Modify: `components/ui/preloader.tsx`
- Modify: `app/layout.tsx`

**Interfaces consumed:** `INK_STRIKE_EVENT` (Task 13.1); `navLinks`; `siteConfig`; `getCaseStudyProjects`; `PROJECT_CATEGORY_LABELS`; `useLenis`.
**Interfaces produced:**
- From `@/hooks/use-command-palette`: `setCommandPaletteOpen(next: boolean)`, `useCommandPaletteOpen(): boolean`, `useModifierKeyLabel(): string` (`"⌘"` on Apple devices, `"Ctrl"` elsewhere and on the server).
- From `@/components/command-palette/command-palette`: `CommandPalette` with props `{ projects: PaletteProject[] }` and `interface PaletteProject { slug; title; category; techStack }`.
- `STORAGE_KEY` is now exported from `@/components/ui/preloader`.

Read `node_modules/cmdk/README.md` after installing.

- [ ] **Step 1: Install the dependencies**

```bash
npm install cmdk@^1.1.1 @radix-ui/react-dialog@^1.1.23
```

Expected: `package.json` lists `"cmdk": "^1.1.1"` and `"@radix-ui/react-dialog": "^1.1.23"` under `dependencies`.

- [ ] **Step 2: Create `hooks/use-command-palette.ts`**

```ts
import { useSyncExternalStore } from "react";

/*
 * Open state of the command palette, shared by the palette itself and every
 * button that opens it, without a React context provider. A tiny external
 * store: the palette renders once in the root layout, triggers can live
 * anywhere.
 */
let open = false;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setCommandPaletteOpen(next: boolean) {
  if (open === next) return;
  open = next;
  listeners.forEach((listener) => listener());
}

/** Whether the palette is open. Always `false` on the server. */
export function useCommandPaletteOpen(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => open,
    () => false,
  );
}

function subscribeNever() {
  return () => {};
}

/**
 * The label for the palette shortcut's modifier key: "⌘" on Apple platforms,
 * "Ctrl" elsewhere. "Ctrl" on the server and during hydration.
 */
export function useModifierKeyLabel(): string {
  return useSyncExternalStore(
    subscribeNever,
    () => (/Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘" : "Ctrl"),
    () => "Ctrl",
  );
}
```

- [ ] **Step 3: Export the preloader's storage key**

In `components/ui/preloader.tsx`, replace:

```tsx
const STORAGE_KEY = "portfolio_preloaded";
```

with:

```tsx
export const STORAGE_KEY = "portfolio_preloaded";
```

- [ ] **Step 4: Create `components/command-palette/command-palette.tsx`**

```tsx
"use client";

import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Command } from "cmdk";
import { useLenis } from "lenis/react";
import {
  ArrowUp,
  Check,
  Clipboard,
  CodeXml,
  CornerDownLeft,
  Download,
  FileText,
  Hash,
  RotateCcw,
  Search,
  Zap,
} from "lucide-react";

import { STORAGE_KEY as PRELOADER_STORAGE_KEY } from "@/components/ui/preloader";
import { navLinks } from "@/data/navigation";
import { siteConfig } from "@/data/site";
import { setCommandPaletteOpen, useCommandPaletteOpen } from "@/hooks/use-command-palette";
import { INK_STRIKE_EVENT } from "@/hooks/use-ink-trail";

/** The slice of a project the palette needs. Built on the server in the root layout. */
export interface PaletteProject {
  slug: string;
  title: string;
  /** Human-readable category, e.g. "Full-Stack". */
  category: string;
  techStack: string[];
}

/** Characters typed before the hidden commands start matching. */
const SECRET_MIN_QUERY = 2;

interface PaletteItemProps {
  value: string;
  keywords?: string[];
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  hint?: string;
  onSelect: () => void;
  children: ReactNode;
}

function PaletteItem({ value, keywords, icon: Icon, hint, onSelect, children }: PaletteItemProps) {
  return (
    <Command.Item
      value={value}
      keywords={keywords}
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-fg/80 transition-colors data-[selected=true]:bg-accent/10 data-[selected=true]:text-accent"
    >
      <Icon aria-hidden className="size-4 shrink-0" />
      <span className="flex-1 truncate">{children}</span>
      {hint ? (
        <span className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-muted">
          {hint}
        </span>
      ) : null}
    </Command.Item>
  );
}

/**
 * Site-wide command palette, opened with Ctrl+K / ⌘K or any button that calls
 * `setCommandPaletteOpen(true)`. Jumps to sections, opens case studies (search
 * by name or tech), runs quick actions, and hides two easter eggs that only
 * match once something is typed.
 */
export function CommandPalette({ projects }: { projects: PaletteProject[] }) {
  const open = useCommandPaletteOpen();
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const onHome = usePathname() === "/";
  const lenis = useLenis();
  // An action picked in the palette runs only after the palette has closed and
  // Lenis has restarted; restarting Lenis cancels any scroll already in flight.
  const pendingAction = useRef<(() => void) | null>(null);

  // Ctrl+K / ⌘K toggles the palette from anywhere, except during the preloader.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "k" || !(event.metaKey || event.ctrlKey)) return;
      if (document.documentElement.hasAttribute("data-preloader-active")) return;
      event.preventDefault();
      setCommandPaletteOpen(!open);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Lenis would keep scrolling the page under the dialog, so it is stopped while
  // the palette is open. The cleanup restarts it before the closed-state effect
  // runs the pending action.
  useEffect(() => {
    if (!open) {
      const action = pendingAction.current;
      pendingAction.current = null;
      action?.();
      return;
    }
    lenis?.stop();
    return () => lenis?.start();
  }, [lenis, open]);

  function onOpenChange(next: boolean) {
    setCommandPaletteOpen(next);
    if (!next) {
      setSearch("");
      setCopied(false);
    }
  }

  /** Closes the palette, then runs `action` once it has closed. */
  function run(action: () => void) {
    pendingAction.current = action;
    onOpenChange(false);
  }

  function scrollToTarget(target: string | number, onComplete?: () => void) {
    if (lenis) {
      lenis.scrollTo(target, { offset: typeof target === "string" ? -96 : 0, onComplete });
      return;
    }
    if (typeof target === "string") document.querySelector(target)?.scrollIntoView();
    else window.scrollTo(0, target);
    onComplete?.();
  }

  function goToSection(href: string) {
    if (onHome) scrollToTarget(href);
    else router.push(`/${href}`);
  }

  function downloadResume() {
    const link = document.createElement("a");
    link.href = siteConfig.resumePath;
    link.download = "";
    link.click();
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(siteConfig.email);
      setCopied(true);
      window.setTimeout(() => onOpenChange(false), 900);
    } catch {
      // Clipboard blocked (e.g. insecure context): fall back to the mail app.
      run(() => window.location.assign(`mailto:${siteConfig.email}`));
    }
  }

  function replayIntro() {
    try {
      sessionStorage.removeItem(PRELOADER_STORAGE_KEY);
    } catch {
      // Storage blocked: the preloader cannot run either way.
    }
    // A full page load, not router.push: the preloader's gate script only runs
    // while the HTML is being parsed.
    window.location.assign(window.location.origin);
  }

  function strike() {
    scrollToTarget(0, () => window.dispatchEvent(new Event(INK_STRIKE_EVENT)));
  }

  const showSecrets = search.trim().length >= SECRET_MIN_QUERY;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-95 bg-bg/70 backdrop-blur-sm" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed top-[12vh] left-1/2 z-96 w-[min(40rem,calc(100%-2rem))] -translate-x-1/2 overflow-hidden rounded-card border border-line bg-surface shadow-[0_0_80px_-30px_var(--color-accent)] focus:outline-none"
        >
          <Dialog.Title className="sr-only">Command palette</Dialog.Title>

          <Command label="Command palette" loop className="flex flex-col">
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search aria-hidden className="size-4 shrink-0 text-muted" />
              <Command.Input
                value={search}
                onValueChange={setSearch}
                placeholder="Jump to a section, search projects, run a command…"
                className="h-14 flex-1 bg-transparent text-sm text-fg placeholder:text-muted focus:outline-none"
              />
              <kbd className="rounded-md border border-line px-1.5 py-0.5 font-mono text-[0.625rem] text-muted">
                ESC
              </kbd>
            </div>

            <Command.List
              data-lenis-prevent
              className="max-h-[min(24rem,60vh)] overflow-y-auto overscroll-contain p-2 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-2 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[0.625rem] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.25em] [&_[cmdk-group-heading]]:text-muted"
            >
              <Command.Empty className="px-3 py-10 text-center font-mono text-xs uppercase tracking-[0.2em] text-muted">
                No match <span className="text-line-strong">{"//"}</span> try another word
              </Command.Empty>

              <Command.Group heading="Navigate">
                <PaletteItem
                  value="Top"
                  keywords={["home", "hero", "start"]}
                  icon={ArrowUp}
                  onSelect={() => run(() => (onHome ? scrollToTarget(0) : router.push("/")))}
                >
                  Top
                </PaletteItem>
                {navLinks.map((link) => (
                  <PaletteItem
                    key={link.href}
                    value={link.label}
                    icon={Hash}
                    onSelect={() => run(() => goToSection(link.href))}
                  >
                    {link.label}
                  </PaletteItem>
                ))}
              </Command.Group>

              {projects.length > 0 ? (
                <Command.Group heading="Case studies">
                  {projects.map((project) => (
                    <PaletteItem
                      key={project.slug}
                      value={`Case study ${project.title}`}
                      keywords={[project.category, ...project.techStack]}
                      icon={FileText}
                      hint={project.category}
                      onSelect={() => run(() => router.push(`/projects/${project.slug}`))}
                    >
                      {project.title}
                    </PaletteItem>
                  ))}
                </Command.Group>
              ) : null}

              <Command.Group heading="Actions">
                <PaletteItem
                  value="Download résumé"
                  keywords={["resume", "cv", "pdf"]}
                  icon={Download}
                  onSelect={() => run(downloadResume)}
                >
                  Download résumé
                </PaletteItem>
                <PaletteItem
                  value="Copy email"
                  keywords={["mail", "contact", siteConfig.email]}
                  icon={copied ? Check : Clipboard}
                  hint={copied ? "Copied" : siteConfig.email}
                  onSelect={copyEmail}
                >
                  {copied ? "Email copied" : "Copy email"}
                </PaletteItem>
                <PaletteItem
                  value="Open GitHub"
                  keywords={["code", "repositories", "source"]}
                  icon={CodeXml}
                  onSelect={() =>
                    run(() => window.open(siteConfig.githubUrl, "_blank", "noopener,noreferrer"))
                  }
                >
                  Open GitHub
                </PaletteItem>
              </Command.Group>

              {showSecrets ? (
                <Command.Group heading="Secrets">
                  <PaletteItem
                    value="Replay intro"
                    keywords={["preloader", "intro", "loading", "again"]}
                    icon={RotateCcw}
                    onSelect={() => run(replayIntro)}
                  >
                    Replay intro
                  </PaletteItem>
                  {onHome ? (
                    <PaletteItem
                      value="Strike"
                      keywords={["arnis", "slash", "reveal", "headgear"]}
                      icon={Zap}
                      onSelect={() => run(strike)}
                    >
                      Strike
                    </PaletteItem>
                  ) : null}
                </Command.Group>
              ) : null}
            </Command.List>

            <div className="flex items-center gap-4 border-t border-line px-4 py-2.5 font-mono text-[0.625rem] uppercase tracking-[0.2em] text-muted">
              <span>↑↓ Navigate</span>
              <span className="flex items-center gap-1">
                <CornerDownLeft aria-hidden className="size-3" /> Select
              </span>
              <span className="ml-auto text-accent">
                {siteConfig.initials} {"//"} CMD
              </span>
            </div>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

- [ ] **Step 5: Mount the palette in the root layout**

Replace `app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import { Anton, Geist, Geist_Mono, Noto_Sans_Tagalog, UnifrakturCook } from "next/font/google";

import { Backdrop } from "@/components/layout/backdrop";
import { CommandPalette } from "@/components/command-palette/command-palette";
import { SmoothScrollProvider } from "@/components/providers/smooth-scroll-provider";
import { siteConfig } from "@/data/site";
import { getCaseStudyProjects } from "@/lib/queries";
import { PROJECT_CATEGORY_LABELS } from "@/types";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Condensed display face for the hero watermark and headline. Anton ships a
// single static weight, so `weight` is required.
const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: "400",
});

// Blackletter face for the preloader monogram. `display: "block"` hides the
// letter until the font arrives instead of flashing a fallback serif "G"; the
// file is preloaded, so the wait is short.
const unifraktur = UnifrakturCook({
  variable: "--font-unifraktur",
  subsets: ["latin"],
  weight: "700",
  display: "block",
});

// Baybayin script for the decorative accents in `data/baybayin.ts`. Only the
// Tagalog subset is loaded, so Latin text never falls back to this face.
const notoTagalog = Noto_Sans_Tagalog({
  variable: "--font-noto-tagalog",
  subsets: ["tagalog"],
  weight: "400",
});

export const metadata: Metadata = {
  title: `${siteConfig.name} — ${siteConfig.role}`,
  description: siteConfig.description,
  openGraph: {
    title: `${siteConfig.name} — ${siteConfig.role}`,
    description: siteConfig.description,
    type: "website",
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Only what the palette needs, so the full case study text stays on the server.
  const paletteProjects = (await getCaseStudyProjects()).map((project) => ({
    slug: project.slug,
    title: project.title,
    category: PROJECT_CATEGORY_LABELS[project.category],
    techStack: project.techStack,
  }));

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${anton.variable} ${unifraktur.variable} ${notoTagalog.variable} h-full antialiased`}
      // The preloader's inline gate script adds an attribute to <html> before
      // React hydrates.
      suppressHydrationWarning
    >
      <body className="min-h-full bg-bg font-sans text-fg">
        <Backdrop />
        <SmoothScrollProvider>
          {children}
          <CommandPalette projects={paletteProjects} />
        </SmoothScrollProvider>
      </body>
    </html>
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

With the preloader skipped, at http://localhost:3000:

- [ ] Ctrl+K (⌘K on a Mac) opens a dark dialog with a search box, groups **Navigate**, **Case studies**, **Actions**, and a footer hint. Ctrl+K again or Esc closes it. The page behind does not scroll while it is open.
- [ ] Arrow keys move a lime highlight and wrap from the last item to the first; Enter runs the highlighted item.
- [ ] Scroll halfway down, open the palette, pick **Stack**: the palette closes and the page smooth-scrolls to the Stack section.
- [ ] Type `supabase` or `unity`: only matching case studies remain. Pick one: its case study opens.
- [ ] **Download résumé** downloads `resume.pdf`. **Copy email** changes to "Email copied", closes about a second later, and the email is on the clipboard. **Open GitHub** opens the GitHub URL in a new tab.
- [ ] With the search empty there is no **Secrets** group. Type `strike`: **Strike** appears. Run it from far down the page: the page scrolls to the top, then a reveal sweeps across the hero.
- [ ] Type `intro` and run **Replay intro**: the page reloads and the preloader plays.
- [ ] On `/projects/ledger`, Ctrl+K works; **Stack** navigates to the home page's Stack section; **Strike** does not exist there.
- [ ] While the preloader is playing, Ctrl+K does nothing.
- [ ] Console is clean, including no `DialogContent requires a DialogTitle` warning in `npm run dev`.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json hooks/use-command-palette.ts components/command-palette components/ui/preloader.tsx app/layout.tsx
git commit -m "feat(palette): add site-wide command palette"
```

---

### Task 13.4: Add the name wordmark and palette button to the header

**Files:**
- Modify: `data/site.ts` (one insertion — do not replace the file)
- Modify: `components/layout/site-header.tsx` (full replacement)

**Interfaces consumed:** `setCommandPaletteOpen`, `useModifierKeyLabel` (Task 13.3); `NavButton` behaviour from Phase 12.
**Interfaces produced:** `siteConfig.wordmark: readonly [string, string]`.

- [ ] **Step 1: Add the wordmark to `data/site.ts`**

Insert these two lines directly above the line `  role: "Full Stack Developer",`:

```ts
  /** Two-line header wordmark, set in Anton. Keep each line short. */
  wordmark: ["John Paul", "Garaza"],
```

- [ ] **Step 2: Replace `components/layout/site-header.tsx`**

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLenis } from "lenis/react";
import { CodeXml, Mail, Menu, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { navLinks } from "@/data/navigation";
import { siteConfig, socialLinks } from "@/data/site";
import { setCommandPaletteOpen, useModifierKeyLabel } from "@/hooks/use-command-palette";
import { cn } from "@/lib/utils";

// lucide-react v1 removed brand icons (no `Github` export), so the "Github"
// key from `data/site.ts` maps to a generic code icon.
const socialIcons = { Github: CodeXml, Mail } as const;

interface NavButtonProps {
  href: string;
  onHome: boolean;
  onNavigate: (href: string) => void;
  className?: string;
  children: React.ReactNode;
}

/** Smooth-scrolls to the section on the home page; links to it everywhere else. */
function NavButton({ href, onHome, onNavigate, className, children }: NavButtonProps) {
  if (onHome) {
    return (
      <Button variant="ghost" size="sm" className={className} onClick={() => onNavigate(href)}>
        {children}
      </Button>
    );
  }
  return (
    <Button asChild variant="ghost" size="sm" className={className}>
      <Link href={`/${href}`}>{children}</Link>
    </Button>
  );
}

/** Two-line name wordmark, like a racing driver's logo. */
function Wordmark() {
  return (
    <span className="flex flex-col font-display text-lg uppercase leading-[0.85] tracking-wide text-fg">
      <span>{siteConfig.wordmark[0]}</span>
      <span>{siteConfig.wordmark[1]}</span>
    </span>
  );
}

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // Section anchors only exist on the home page. Elsewhere, links navigate to
  // `/#anchor` instead of smooth-scrolling.
  const onHome = usePathname() === "/";
  const modifierKey = useModifierKeyLabel();

  const lenis = useLenis(({ scroll }) => {
    setScrolled(scroll > 32);
  });

  function scrollTo(href: string) {
    setMenuOpen(false);
    if (lenis) {
      lenis.scrollTo(href, { offset: -96 });
      return;
    }
    document.querySelector(href)?.scrollIntoView();
  }

  return (
    <header className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <nav
        aria-label="Primary"
        className={cn(
          "flex w-full max-w-4xl items-center justify-between gap-4 rounded-full border py-2 pr-2 pl-5 transition-colors duration-300",
          scrolled
            ? "border-line bg-surface/70 backdrop-blur-xl"
            : "border-transparent bg-transparent",
        )}
      >
        {onHome ? (
          <button
            type="button"
            aria-label="Back to top"
            onClick={() => lenis?.scrollTo(0)}
            className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            <Wordmark />
          </button>
        ) : (
          <Link
            href="/"
            aria-label="Home"
            className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            <Wordmark />
          </Link>
        )}

        <ul className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <NavButton href={link.href} onHome={onHome} onNavigate={scrollTo}>
                {link.label}
              </NavButton>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 px-2"
            aria-label="Open command palette"
            aria-keyshortcuts="Control+K Meta+K"
            onClick={() => setCommandPaletteOpen(true)}
          >
            <Search aria-hidden />
            <kbd className="hidden rounded-md border border-line px-1.5 py-0.5 font-mono text-[0.625rem] tracking-normal sm:inline">
              {modifierKey} K
            </kbd>
          </Button>

          {socialLinks.map((link) => {
            const Icon = socialIcons[link.icon as keyof typeof socialIcons];
            return (
              <Button key={link.href} asChild variant="ghost" size="sm" className="px-2">
                <a
                  href={link.href}
                  aria-label={link.label}
                  target={link.href.startsWith("http") ? "_blank" : undefined}
                  rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                >
                  <Icon aria-hidden />
                </a>
              </Button>
            );
          })}

          <Button
            variant="ghost"
            size="sm"
            className="px-2 md:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X aria-hidden /> : <Menu aria-hidden />}
          </Button>
        </div>
      </nav>

      {menuOpen ? (
        <ul className="absolute top-16 w-[calc(100%-2rem)] max-w-3xl space-y-1 rounded-3xl border border-line bg-surface/95 p-3 backdrop-blur-xl md:hidden">
          {navLinks.map((link) => (
            <li key={link.href}>
              <NavButton
                href={link.href}
                onHome={onHome}
                onNavigate={scrollTo}
                className="w-full justify-start"
              >
                {link.label}
              </NavButton>
            </li>
          ))}
        </ul>
      ) : null}
    </header>
  );
}
```

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit
npm run lint
npm run build
npm run dev
```

- [ ] Top-left of the header shows `JOHN PAUL` over `GARAZA` in the condensed display font. On the home page clicking it scrolls to the top; on a case study it goes home.
- [ ] Right side of the header: a search icon with a `Ctrl K` hint (`⌘ K` on a Mac), then GitHub and email icons. Clicking the search button opens the palette.
- [ ] At 375px: wordmark, search icon (no key hint), GitHub, email, and menu all fit on one row; no horizontal scrollbar.
- [ ] Section links still smooth-scroll on the home page and navigate home from case studies.
- [ ] No hydration warning in the console (the key hint renders `Ctrl` first, then switches to `⌘` on a Mac).

- [ ] **Step 4: Commit**

```bash
git add data/site.ts components/layout/site-header.tsx
git commit -m "feat(header): add name wordmark and command palette button"
```

`data/site.ts` also contains the owner's earlier uncommitted edits (name, initials, GitHub URL); committing them here is intended.

---

### Task 13.5: Phase 13 verification pass

**Files:** none created; fix whatever this task surfaces.

- [ ] **Step 1: Clean production build**

```bash
npx tsc --noEmit
npm run lint
npm run build
npm run start
```

- [ ] **Step 2: Walk the production build**

- [ ] **Idle:** after any mouse movement, stop for 2 seconds: the hero shows no reveal anywhere. Repeat with the cursor over the face, over the watermark, and over empty background.
- [ ] **Performance:** DevTools → Performance, CPU throttling 4×, record 5 seconds of fast mouse circles over the hero. No long frames (red bars) caused by the reveal. If frames drop, report it in the handoff rather than changing constants.
- [ ] **Touch** (device mode, reload): the blob drifts over the face with torn edges. **Touch + reduced motion:** one still headgear reveal, nothing moves.
- [ ] **Mouse + reduced motion:** the reveal still follows movement; the palette opens and closes; palette navigation jumps without smooth scrolling.
- [ ] **Widths** 375px, 768px, 1440px: `document.documentElement.scrollWidth === document.documentElement.clientWidth` is `true`; the header fits on one row; the hero copy does not overlap the buttons.
- [ ] **Keyboard only:** Tab reaches the wordmark, section links, the search button, and the social icons, each with a visible focus ring. Enter on the search button opens the palette with focus in the search box; Esc returns focus to the search button.
- [ ] **Preloader:** first visit still plays; Ctrl+K is ignored until the wipe finishes.
- [ ] **Console:** clean on `/`, `/projects/ledger`, and the 404 page.

- [ ] **Step 3: Commit any fixes**

```bash
git add -A -- app components data hooks lib types
git commit -m "fix: address phase 13 verification findings"
```

If nothing needed fixing, skip the commit.

---

## Handoff checklist (owner-supplied content)

Only the repository owner can resolve these. Do not invent values.

1. `data/site.ts` — name, initials, wordmark, and GitHub URL are set; email and site URL are still placeholders (the palette's **Copy email** copies whatever is there). Also confirm `availability.isAvailable`, `timeZone` / `timeZoneLabel` (`Asia/Manila` / `GMT+8`), and the `watermark` word (sized for ~9 characters).
2. `data/projects.ts` — three example projects (Ledger, Driftline, FleetDesk) need replacing with real ones, including the two example case study write-ups. Gallery images go in `public/images/projects/<slug>/` with their real pixel `width` and `height`.
3. `public/resume.pdf` — minimal placeholder; replace with the real résumé.
4. `public/images/hero/headgear.webp` and `headgear-ghost.webp` — cut out from STIX's product photo as sold by Eljan Sports, with the logo painted over. The photo still belongs to STIX/the retailer. Replacing it with a photo of a borrowed headgear (front view, plain background, even light) removes the risk; re-tune `HEADGEAR` and `FACE` in `components/sections/headgear-reveal.tsx` afterwards.
5. `data/baybayin.ts` — **launch blocker.** Every entry is `reviewed: false`. Someone who reads baybayin must check each `text` (the surname Garaza, "Sipag at Disiplina", "Proyekto", "Kasanayan", "Ugnayan") before the site goes public.
6. `data/strike-angles.ts` — **launch blocker.** Every entry is `confirmed: false`. Check each number, target, and on-screen direction against the owner's sport Arnis anyo.
7. `components/ui/preloader.tsx` — `STATUS_LINES` are hard-coded (`GARAZA // DEV PORTFOLIO`, `SYS.INIT // OK`, `LATENCY // 12MS`); `12MS` is decorative.

**Next phases (planned in the spec, not yet written as tasks):** Phase 14, new home sections (About, Experience, Arnis, Now — the owner picks which); Phase 15, polish and reach (tech marquee, heading reveals, OG images, sitemap, robots, JSON-LD, Vercel Web Analytics, Lighthouse ≥ 90). A redesign of the strike line dividers into a literal slash cut was proposed and is awaiting the owner's approval.
