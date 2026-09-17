# Portfolio Implementation Plan

> **For the builder (OpenCode):** Execute tasks strictly in order. Each task is
> self-contained — read only that task, do exactly what it says, run its
> **Verify** block, then commit. Do not skip ahead, do not batch phases, and do
> not "improve" adjacent files that the task does not list.

> **Status:** Phases 1–10 are complete and committed. **Start at Phase 11**
> (identity system and full-hero cursor reveal), then Phase 12 (project case
> studies). The design these phases implement is
> `docs/superpowers/specs/2026-09-16-portfolio-v2-design.md`; read it only if a
> task does not answer a question. The step-by-step history of Phases 1–10 was
> removed from this file; read it with `git show 633c7fb:tasks.md` only if a task
> explicitly tells you to.

**Goal:** A single-page, dark, motion-driven developer portfolio on Next.js 16 App Router with per-project case study pages, deployed to Vercel.

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

Files marked **[11]** or **[12]** are created or changed by that phase.

```
app/
  layout.tsx                 # fonts (Geist, Geist Mono, Anton, UnifrakturCook, Noto Sans Tagalog [11]), metadata, <Backdrop>, <SmoothScrollProvider>
  page.tsx                   # <Preloader>, <SiteHeader>, sections separated by <StrikeLine> [11], <SiteFooter>
  globals.css                # theme tokens, utilities (bg-weave [11]), animations (strike-wipe [12]), Lenis base, preloader gate
  not-found.tsx              # "DNF // Did not finish" 404 [12]
  projects/[slug]/page.tsx   # case study page, statically generated [12]
components/
  case-study/                # [12]
    case-study-header.tsx    # title band: weave, Anton title, spec row, links
    case-study-body.tsx      # numbered sections; empty ones are hidden
    next-lap.tsx             # next case study card + back link
  layout/
    backdrop.tsx             # page-wide fixed grid + noise layers (server)
    site-header.tsx          # floating glass nav; smooth-scroll on home, links elsewhere [12] (client)
    site-footer.tsx          # footer with weave texture and strike line [11] (server)
  sections/
    hero.tsx                 # <InkRevealSection> [11]: backdrop reveal, telemetry bar, visual stage, copy, motto [11]
    hero-visual.tsx          # watermark + glow + portrait, parallax (client)
    hero-watermark.tsx       # SVG outline word + ink-revealed neon fill [11] (client)
    hero-backdrop-reveal.tsx # ink-revealed weave + strike slashes across the hero [11] (client)
    headgear-reveal.tsx      # ink-revealed headgear photo over the face [11] (client)
    ink-reveal.tsx           # InkRevealSection, InkMask, paintInkMask, useInkMaskLayer [11] (client)
    telemetry-bar.tsx        # live status dot + local clock (client)
    projects-showcase.tsx    # server: awaits getProjects() (id="projects")
    projects-stack.tsx       # sticky scroll stack (client)
    project-card.tsx         # one card in the stack, tilt + spotlight, case study links [12] (client)
    bento-grid.tsx           # server: awaits getSkillCategories() (id="stack")
    tech-stack-card.tsx      # one skill group card (server)
    discipline-card.tsx      # Arnis photo card, hover/focus cross-fade (client, id="discipline")
    contact.tsx              # contact CTA (server, id="contact")
  providers/
    smooth-scroll-provider.tsx  # Lenis root (client)
  ui/
    button.tsx               # cva + Radix Slot, neon variants, strike wipe on hover [11]
    badge.tsx                # tech-stack pill
    section-heading.tsx      # eyebrow + optional baybayin script [11] + title
    strike-line.tsx          # divider cut at an Arnis strike angle [11] (client)
    preloader.tsx            # first-visit monogram + baybayin name [11] + counter overlay (client)
data/
  site.ts                    # siteConfig (identity, watermark, availability, time zone) + socialLinks
  navigation.ts              # nav anchors
  projects.ts                # Project[] with case studies [12]
  skills.ts                  # SkillCategory[] + discipline photos
  baybayin.ts                # every baybayin string, with review flags [11]
  strike-angles.ts           # the 12 Arnis strikes, with confirmation flags [11]
hooks/
  use-ink-trail.ts           # shared cursor ink trail engine [11]
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
| `font-baybayin` | Noto Sans Tagalog | Baybayin from `data/baybayin.ts` only **[11]** |

| Utility / class | Effect |
| --- | --- |
| `text-outline` | Transparent fill, 1px `line-strong` stroke — hollow display type |
| `text-outline-accent` | Same, with a 60% neon stroke |
| `bg-grid` | 80px faint grid, radially faded toward the viewport edges |
| `bg-noise` | Tiled SVG grain; set strength with `opacity-*` |
| `bg-weave` | Tiled woven diamond lattice in white; always on its own `aria-hidden` layer at `opacity-[0.03]`–`opacity-[0.05]` **[11]** |
| `.glow` | 22% neon radial glow |
| `animate-pulse-dot` | Live status dot ring |
| `animate-monogram-in`, `animate-monogram-breathe`, `animate-status-in` | Preloader entrance animations |
| `animate-strike-wipe` | Case study arrival wipe **[12]** |

**Stacking order:** header `z-50`, preloader overlay and case study wipe `z-90`, page-wide film grain `z-100`.

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
  - `InkRevealSection` renders the hero `<section>` and owns one **ink trail**: a single `requestAnimationFrame` loop, running only while the hero is on screen, that drops "ink" along the cursor's path. Each drop shrinks away over 900 ms. Positions are in viewport pixels. Nothing in the loop causes a React render.
  - Each masked layer is an SVG containing an `<InkMask>` (a gooey filter plus a mask of circles). `useInkMaskLayer` registers the SVG with the trail; every frame `paintInkMask` converts the drops into that SVG's own coordinates with `getScreenCTM()` — which already includes parallax and entrance transforms — and resizes the filter region to fit only the live drops.
  - There is one masked SVG per coordinate space because the watermark and the portrait move at different parallax speeds: `HeroBackdropReveal` (whole hero: weave + strike slashes), `HeroWatermark` (outline word + neon fill, drawn from identical `<text>`), and `HeadgearReveal` (portrait pixels: headgear photo over the face).
  - Modes: a fine pointer drives the trail (`pointer`); touch screens get a drop that drifts over the face (`wander`), using the face position that `HeadgearReveal` reports through `setHome`; touch plus reduced motion shows one fixed headgear reveal (`static`) and nothing else.
  - If the portrait or headgear image changes, re-tune only `HEADGEAR` and `FACE` in `headgear-reveal.tsx`.
- **Case studies** (Phase 12): a project with `caseStudy: null` stays card-only. Projects with a case study get a statically generated page at `/projects/<slug>`; `dynamicParams = false` makes every other slug a 404. In `CaseStudyBody`, empty strings and empty arrays hide their section, and the remaining sections are numbered consecutively.

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

---

# Phase 11 — Identity system and full-hero cursor reveal

This phase blends Filipino/Arnis identity into the telemetry design — baybayin accents, Arnis strike lines, and a woven diamond texture — and rebuilds the hero reveal so it works like landonorris.com: the cursor leaves a lingering ink trail **anywhere** in the hero, and inside that trail you see a hidden layer (woven texture, neon strike slashes, the watermark filled in lime, and the headgear over the face).

Every block below was type-checked, linted, and built with Turbopack in a scratch copy of this repository at commit `a5ce8f3`, then checked in a production build: the reveal was exercised with a real mouse at 1440px (lime watermark fill, headgear, weave, and slash fragments all showed inside the trail; the SVG watermark lands on the exact position of the old HTML one), the page had no horizontal overflow at 375px, and the console was clean. The touch (`wander`) and reduced-motion (`static`) modes and the frame-rate check could not be exercised there and are covered by Task 11.7. Copy the blocks exactly.

**Rules for this phase:**

- The only new dependency is the Noto Sans Tagalog font through `next/font/google`. No npm installs.
- Never type baybayin characters outside `data/baybayin.ts`, and do not edit its strings: they are written as Unicode escapes on purpose.
- `components/sections/ink-reveal.tsx` must stay free of per-frame React state. Layers paint by setting SVG attributes directly.

### Task 11.1: Add the baybayin font, weave texture, motif data, and logo-free headgear

**Files:**
- Commit (already modified by the architect — do not edit): `public/images/hero/headgear.webp`
- Modify: `app/layout.tsx`
- Modify: `app/globals.css` (two insertions)
- Modify: `types/index.ts` (append)
- Create: `data/baybayin.ts`
- Create: `data/strike-angles.ts`

**Interfaces produced:**
- Tailwind classes `font-baybayin` and `bg-weave`.
- Types `BaybayinEntry` and `StrikeAngle` from `@/types`.
- `baybayin` from `@/data/baybayin`, with keys `name`, `motto`, `projects`, `stack`, `contact`, each a `BaybayinEntry`.
- `strikeAngles: StrikeAngle[]` and `getStrike(number: number): StrikeAngle` from `@/data/strike-angles`. `getStrike` throws for numbers outside 1–12.

The architect already replaced `public/images/hero/headgear.webp` with a copy whose STIX logo patch is painted over with the surrounding red padding texture. Same file name and 648×700 size, so `HEADGEAR` and `FACE` do not change. It shows as modified in `git status`; this task commits it.

- [ ] **Step 1: Load the baybayin font in `app/layout.tsx`**

Replace the `next/font/google` import line:

```tsx
import { Anton, Geist, Geist_Mono, UnifrakturCook } from "next/font/google";
```

with:

```tsx
import { Anton, Geist, Geist_Mono, Noto_Sans_Tagalog, UnifrakturCook } from "next/font/google";
```

Insert this block directly above `export const metadata`:

```tsx
// Baybayin script for the decorative accents in `data/baybayin.ts`. Only the
// Tagalog subset is loaded, so Latin text never falls back to this face.
const notoTagalog = Noto_Sans_Tagalog({
  variable: "--font-noto-tagalog",
  subsets: ["tagalog"],
  weight: "400",
});

```

In the `<html>` `className`, replace `${unifraktur.variable} h-full antialiased` with `${unifraktur.variable} ${notoTagalog.variable} h-full antialiased`.

- [ ] **Step 2: Add the font token and the weave utility to `app/globals.css`**

In the `@theme inline` block, add one line after `--font-gothic: var(--font-unifraktur);`:

```css
  --font-baybayin: var(--font-noto-tagalog);
```

Insert this block directly above the comment that starts `/*` followed by ` * Ambient accent bloom`:

```css
/*
 * Woven diamond texture, loosely inspired by Ilocano inabel: an interlocking
 * diamond lattice with a smaller diamond inside each cell. Deliberately generic
 * geometry, not a copy of any specific textile. Drawn in white; consumers set
 * the strength with an `opacity-*` utility on a dedicated decorative layer.
 */
@utility bg-weave {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Cg fill='none' stroke='%23fff' stroke-width='1'%3E%3Cpath d='M16 0 32 16 16 32 0 16Z'/%3E%3Cpath d='M16 9 23 16 16 23 9 16Z'/%3E%3C/g%3E%3Cpath fill='%23fff' d='M16 14.5 17.5 16 16 17.5 14.5 16Z'/%3E%3C/svg%3E");
  background-size: 32px 32px;
}

```

- [ ] **Step 3: Append the motif types to `types/index.ts`**

Add to the end of the file:

```ts
/**
 * One decorative baybayin string. Baybayin is always `aria-hidden` and always
 * sits beside English, so `meaning` is documentation, not rendered alt text.
 */
export interface BaybayinEntry {
  /** Baybayin characters (Unicode Tagalog block, U+1700–U+171F). */
  text: string;
  /** The Filipino word(s) the characters spell. */
  latin: string;
  /** English meaning. */
  meaning: string;
  /**
   * Flipped to `true` only after someone who reads baybayin has checked the
   * `text`. The launch gate fails while any entry is `false`.
   */
  reviewed: boolean;
}

/** One of the twelve basic Arnis strikes. */
export interface StrikeAngle {
  /** 1–12, as numbered in the owner's sport Arnis anyo. */
  number: number;
  /** Where the strike lands on the opponent, e.g. "Left temple". */
  target: string;
  /**
   * Direction of the stick's path on screen, in degrees: 0 points right and
   * angles grow clockwise, so 90 is straight down. `null` for thrusts, which
   * travel toward the viewer and have no on-screen line.
   */
  degrees: number | null;
  /** Flipped to `true` once the owner confirms this entry for their style. */
  confirmed: boolean;
}
```

- [ ] **Step 4: Create `data/baybayin.ts`**

```ts
import type { BaybayinEntry } from "@/types";

/*
 * Every baybayin string on the site lives here. Characters are written as
 * Unicode escapes so that no editor, font, or copy-paste can silently change
 * them. Conventions used:
 *
 * - Modern orthography with the krus-kudlit (U+1714) cancelling a final vowel.
 * - The letter DA (U+1707) also writes RA, as in pre-colonial usage.
 * - Z has no letter and is written with SA (U+1710).
 *
 * None of these have been checked by a baybayin reader yet. Do not flip
 * `reviewed` to `true` without one.
 */
export const baybayin = {
  name: {
    text: "\u1704\u1707\u1710",
    latin: "Garaza",
    meaning: "The owner's surname",
    reviewed: false,
  },
  motto: {
    text: "\u1710\u1712\u1709\u1704\u1714 \u1700\u1706\u1714 \u1707\u1712\u1710\u1712\u1709\u1714\u170E\u1712\u1708",
    latin: "Sipag at Disiplina",
    meaning: "Diligence and discipline",
    reviewed: false,
  },
  projects: {
    text: "\u1709\u1714\u1707\u1713\u170C\u1712\u1703\u1714\u1706\u1713",
    latin: "Proyekto",
    meaning: "Project",
    reviewed: false,
  },
  stack: {
    text: "\u1703\u1710\u1708\u170C\u1708\u1714",
    latin: "Kasanayan",
    meaning: "Skills",
    reviewed: false,
  },
  contact: {
    text: "\u1702\u1704\u1714\u1708\u170C\u1708\u1714",
    latin: "Ugnayan",
    meaning: "Connection, contact",
    reviewed: false,
  },
} satisfies Record<string, BaybayinEntry>;
```

- [ ] **Step 5: Create `data/strike-angles.ts`**

```ts
import type { StrikeAngle } from "@/types";

/*
 * The twelve basic strikes, numbered as commonly taught for sport Arnis anyo
 * and Modern Arnis, from a right-handed striker's point of view. Numbering
 * differs between systems, so every entry stays `confirmed: false` until the
 * owner checks it against their own training.
 */
export const strikeAngles: StrikeAngle[] = [
  { number: 1, target: "Left temple", degrees: 135, confirmed: false },
  { number: 2, target: "Right temple", degrees: 45, confirmed: false },
  { number: 3, target: "Left side of the body", degrees: 180, confirmed: false },
  { number: 4, target: "Right side of the body", degrees: 0, confirmed: false },
  { number: 5, target: "Stomach (thrust)", degrees: null, confirmed: false },
  { number: 6, target: "Left chest (thrust)", degrees: null, confirmed: false },
  { number: 7, target: "Right chest (thrust)", degrees: null, confirmed: false },
  { number: 8, target: "Left knee", degrees: 135, confirmed: false },
  { number: 9, target: "Right knee", degrees: 45, confirmed: false },
  { number: 10, target: "Left eye (thrust)", degrees: null, confirmed: false },
  { number: 11, target: "Right eye (thrust)", degrees: null, confirmed: false },
  { number: 12, target: "Crown of the head", degrees: 90, confirmed: false },
];

/** Looks up a strike by number. Throws on a number outside 1–12. */
export function getStrike(number: number): StrikeAngle {
  const strike = strikeAngles.find((entry) => entry.number === number);
  if (!strike) throw new Error(`Unknown strike angle: ${number}`);
  return strike;
}
```

- [ ] **Step 6: Verify**

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Expected: all three pass. Nothing on the page changes yet except that the build now downloads Noto Sans Tagalog. In `npm run dev`, confirm in DevTools → Elements that `<html>` has a class containing `noto_sans_tagalog`.

- [ ] **Step 7: Commit**

```bash
git add public/images/hero/headgear.webp app/layout.tsx app/globals.css types/index.ts data/baybayin.ts data/strike-angles.ts
git commit -m "feat(identity): add baybayin font, weave texture, and motif data"
```

---

### Task 11.2: Add strike line dividers and the woven footer

**Files:**
- Create: `components/ui/strike-line.tsx`
- Modify: `app/page.tsx`
- Modify: `components/layout/site-footer.tsx` (full replacement)

**Interfaces consumed:** `getStrike` (Task 11.1), `bg-weave` (Task 11.1), `cn`.
**Interfaces produced:** `StrikeLine` with props `{ angle: number; className?: string }`. `angle` must be a strike with a line (1, 2, 3, 4, 8, 9, 12); a thrust number throws during render.

- [ ] **Step 1: Create `components/ui/strike-line.tsx`**

```tsx
"use client";

import { motion, useReducedMotion } from "motion/react";

import { getStrike } from "@/data/strike-angles";
import { cn } from "@/lib/utils";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

/** Box the diagonal slash is drawn in, in px. */
const SLASH_BOX = 40;

export interface StrikeLineProps {
  /** Strike number from `data/strike-angles.ts`. Thrusts (no line) are invalid. */
  angle: number;
  className?: string;
}

/**
 * Section divider: two hairlines meeting at a short neon slash cut at a real
 * Arnis strike angle, with a telemetry label. Draws itself in the first time it
 * scrolls into view; with reduced motion it renders fully drawn.
 */
export function StrikeLine({ angle, className }: StrikeLineProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const strike = getStrike(angle);
  if (strike.degrees === null) {
    throw new Error(`Strike ${angle} is a thrust and has no line to draw`);
  }

  // Unit vector of the stick's path. Screen y grows downward, which matches the
  // clockwise degree convention in `data/strike-angles.ts`.
  const radians = (strike.degrees * Math.PI) / 180;
  const half = SLASH_BOX / 2 - 4;
  const dx = Math.cos(radians) * half;
  const dy = Math.sin(radians) * half;
  const center = SLASH_BOX / 2;
  const label = `ANGLE ${String(strike.number).padStart(2, "0")} // ${strike.degrees}°`;

  const drawn = { pathLength: 1, scaleX: 1, opacity: 1 };
  const hidden = reduceMotion ? drawn : { pathLength: 0, scaleX: 0, opacity: 0 };
  const viewport = { once: true, margin: "0px 0px -15% 0px" } as const;

  return (
    <div
      aria-hidden
      className={cn("mx-auto flex w-full max-w-6xl items-center gap-4 px-6", className)}
    >
      <motion.span
        initial={{ scaleX: hidden.scaleX }}
        whileInView={{ scaleX: 1 }}
        viewport={viewport}
        transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
        className="h-px flex-1 origin-right bg-line"
      />

      <svg
        width={SLASH_BOX}
        height={SLASH_BOX}
        viewBox={`0 0 ${SLASH_BOX} ${SLASH_BOX}`}
        className="shrink-0 overflow-visible"
      >
        {/* The stick travels from the start of the path to its end. */}
        <motion.path
          d={`M ${center - dx} ${center - dy} L ${center + dx} ${center + dy}`}
          className="stroke-accent"
          strokeWidth={2}
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: hidden.pathLength }}
          whileInView={{ pathLength: 1 }}
          viewport={viewport}
          transition={{ duration: 0.5, delay: 0.35, ease: EASE_OUT_EXPO }}
        />
      </svg>

      <motion.span
        initial={{ opacity: hidden.opacity }}
        whileInView={{ opacity: 1 }}
        viewport={viewport}
        transition={{ duration: 0.4, delay: 0.6 }}
        className="shrink-0 font-mono text-[0.65rem] tracking-[0.25em] text-muted"
      >
        {label}
      </motion.span>

      <motion.span
        initial={{ scaleX: hidden.scaleX }}
        whileInView={{ scaleX: 1 }}
        viewport={viewport}
        transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
        className="h-px flex-1 origin-left bg-line"
      />
    </div>
  );
}
```

- [ ] **Step 2: Put dividers between the home page sections**

In `app/page.tsx`, add the import after the `Preloader` import:

```tsx
import { StrikeLine } from "@/components/ui/strike-line";
```

Replace the four section lines inside `<main>`:

```tsx
        <Hero />
        <ProjectsShowcase />
        <BentoGrid />
        <Contact />
```

with:

```tsx
        <Hero />
        <StrikeLine angle={1} className="py-6" />
        <ProjectsShowcase />
        <StrikeLine angle={2} className="py-6" />
        <BentoGrid />
        <StrikeLine angle={3} className="py-6" />
        <Contact />
```

- [ ] **Step 3: Replace `components/layout/site-footer.tsx`**

The footer's top border becomes a strike line, over a faint woven texture.

```tsx
import { CodeXml, Mail } from "lucide-react";

import { StrikeLine } from "@/components/ui/strike-line";
import { siteConfig, socialLinks } from "@/data/site";

// lucide-react v1 removed brand icons (no `Github` export), so the "Github"
// key from `data/site.ts` maps to a generic code icon — same as the header.
const socialIcons = { Github: CodeXml, Mail } as const;

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden px-6 pt-4 pb-10">
      <div aria-hidden className="bg-weave pointer-events-none absolute inset-0 opacity-[0.04]" />

      <StrikeLine angle={12} className="mb-10 px-0" />

      <div className="relative mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
        <p className="font-mono text-xs text-muted">
          © {new Date().getFullYear()} {siteConfig.name}
        </p>

        <ul className="flex items-center gap-5">
          {socialLinks.map((link) => {
            const Icon = socialIcons[link.icon as keyof typeof socialIcons];
            return (
              <li key={link.href}>
                <a
                  href={link.href}
                  aria-label={link.label}
                  target={link.href.startsWith("http") ? "_blank" : undefined}
                  rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="text-muted transition-colors hover:text-fg"
                >
                  <Icon aria-hidden className="size-4" />
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </footer>
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

At http://localhost:3000, scroll slowly from the hero to the footer:

- [ ] Between hero/projects, projects/stack, and stack/contact, a divider appears: two hairlines grow out from a short neon slash, then a label fades in. Labels read `ANGLE 01 // 135°`, `ANGLE 02 // 45°`, `ANGLE 03 // 180°`.
- [ ] The slash for angle 01 runs from top-right to bottom-left, angle 02 from top-left to bottom-right, angle 03 is horizontal.
- [ ] The footer has a divider labelled `ANGLE 12 // 90°` with a vertical slash, and a barely visible diamond texture behind the copyright line.
- [ ] Each divider animates only the first time it enters the viewport.
- [ ] With DevTools → Rendering → "Emulate CSS prefers-reduced-motion: reduce" and a reload, every divider is already fully drawn.

- [ ] **Step 5: Commit**

```bash
git add components/ui/strike-line.tsx app/page.tsx components/layout/site-footer.tsx
git commit -m "feat(identity): add strike line dividers and woven footer"
```

---

### Task 11.3: Add the strike wipe to buttons

**Files:**
- Modify: `components/ui/button.tsx` (full replacement)

**Interfaces produced:** unchanged `Button` / `buttonVariants` API. `primary` and `outline` variants now clip their content (`overflow-hidden`) and create a stacking context (`isolate`).

- [ ] **Step 1: Replace `components/ui/button.tsx`**

```tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/*
 * Strike wipe: `before:` is a skewed band parked off the left edge. On hover it
 * slashes across to the right, like a stick cutting through. `isolate` plus
 * `before:-z-10` paints the band above the button's own background but below
 * its label and icon. The global reduced-motion rule shortens the transition to
 * near zero, so the slash is simply skipped there.
 */
const strikeWipe =
  "relative isolate overflow-hidden before:pointer-events-none before:absolute before:inset-y-0 before:left-0 before:-z-10 before:w-1/2 before:-translate-x-[150%] before:-skew-x-[30deg] before:transition-transform before:duration-500 before:ease-out hover:before:translate-x-[250%]";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium tracking-tight transition-[color,background-color,border-color,box-shadow] duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: `${strikeWipe} bg-accent text-accent-ink before:bg-white/45 hover:bg-accent-soft hover:shadow-[0_0_32px_-6px_var(--color-accent)]`,
        outline: `${strikeWipe} border border-line-strong bg-transparent text-fg before:bg-accent/15 hover:border-accent hover:text-accent hover:shadow-[0_0_32px_-10px_var(--color-accent)]`,
        ghost: "text-muted hover:text-fg",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-6 text-sm",
        lg: "h-13 px-8 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  /** Render the child element instead of a <button> — use for <a> links. */
  asChild?: boolean;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />
  );
}

export { buttonVariants };
```

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit
npm run lint
npm run build
npm run dev
```

- [ ] Hovering the hero **GitHub** button (primary) sends a pale diagonal band slashing left to right across it, under the label. The label and icon stay fully readable.
- [ ] Hovering **Resume** (outline) sends a faint lime band across it the same way.
- [ ] Moving the pointer off a button sends the band back. No band is ever visible outside the button's rounded edge.
- [ ] Ghost buttons in the header nav have no band.
- [ ] Keyboard focus still shows the accent outline ring around the whole button (the ring is not clipped).

- [ ] **Step 3: Commit**

```bash
git add components/ui/button.tsx
git commit -m "feat(ui): add strike wipe to buttons"
```

---

### Task 11.4: Add baybayin accents to headings, the preloader, and the hero

**Files:**
- Modify: `components/ui/section-heading.tsx` (full replacement)
- Modify: `components/sections/projects-showcase.tsx`
- Modify: `components/sections/bento-grid.tsx`
- Modify: `components/sections/contact.tsx`
- Modify: `components/ui/preloader.tsx`
- Modify: `components/sections/hero.tsx`

**Interfaces consumed:** `baybayin` and `BaybayinEntry` (Task 11.1), `font-baybayin`.
**Interfaces produced:** `SectionHeading` gains an optional prop `script?: BaybayinEntry`.

- [ ] **Step 1: Replace `components/ui/section-heading.tsx`**

```tsx
import { cn } from "@/lib/utils";
import type { BaybayinEntry } from "@/types";

export interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  /** Decorative baybayin shown after the eyebrow. Pass an entry from `data/baybayin.ts`. */
  script?: BaybayinEntry;
  className?: string;
}

export function SectionHeading({ eyebrow, title, script, className }: SectionHeadingProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <span className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.25em] text-accent">
        <span aria-hidden className="h-px w-8 bg-accent" />
        {eyebrow}
        {script ? (
          <span aria-hidden className="font-baybayin text-sm tracking-normal text-muted">
            {script.text}
          </span>
        ) : null}
      </span>
      <h2 className="text-balance text-4xl font-semibold tracking-tight text-fg sm:text-5xl">
        {title}
      </h2>
    </div>
  );
}
```

- [ ] **Step 2: Pass scripts from the three sections**

In each file below, add this import directly after the `SectionHeading` import:

```tsx
import { baybayin } from "@/data/baybayin";
```

Then make these replacements:

- `components/sections/projects-showcase.tsx`: `<SectionHeading eyebrow="Selected Work" title="Projects" />` → `<SectionHeading eyebrow="Selected Work" title="Projects" script={baybayin.projects} />`
- `components/sections/bento-grid.tsx`: `<SectionHeading eyebrow="Toolkit" title="Stack & Discipline" />` → `<SectionHeading eyebrow="Toolkit" title="Stack & Discipline" script={baybayin.stack} />`
- `components/sections/contact.tsx`: in the `<SectionHeading` props, add the line `script={baybayin.contact}` directly after `eyebrow="Contact"`.

- [ ] **Step 3: Add the baybayin name to the preloader**

In `components/ui/preloader.tsx`, add after the `motion/react` import block (after its closing `} from "motion/react";` line):

```tsx

import { baybayin } from "@/data/baybayin";
```

Then replace:

```tsx
              <div className="mt-10 flex items-baseline font-mono tabular-nums">
```

with:

```tsx
              <span className="animate-status-in mt-4 font-baybayin text-2xl text-accent/80 md:text-3xl">
                {baybayin.name.text}
              </span>

              <div className="mt-8 flex items-baseline font-mono tabular-nums">
```

- [ ] **Step 4: Add the motto under the hero headline**

In `components/sections/hero.tsx`, add this import directly above the `siteConfig` import:

```tsx
import { baybayin } from "@/data/baybayin";
```

Then replace:

```tsx
              <span className="block text-accent">Developer</span>
            </h1>
```

with:

```tsx
              <span className="block text-accent">Developer</span>
            </h1>
            <p className="flex flex-col items-center gap-1 whitespace-nowrap sm:flex-row sm:items-baseline sm:gap-3 lg:justify-start">
              <span aria-hidden className="font-baybayin text-lg text-muted">
                {baybayin.motto.text}
              </span>
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-muted">
                Diligence &amp; discipline
              </span>
            </p>
```

- [ ] **Step 5: Verify**

```bash
npx tsc --noEmit
npm run lint
npm run build
npm run dev
```

- [ ] The Projects, Stack & Discipline, and Contact eyebrows each end with a short line of baybayin in grey. It renders as baybayin letters, never as empty boxes (□).
- [ ] With the preloader key cleared, the preloader shows three baybayin characters in lime between the "G" monogram and the counter.
- [ ] Under the hero headline, a line of baybayin sits next to `DILIGENCE & DISCIPLINE`. At 375px the two stack vertically and neither wraps mid-line; from 640px up they sit side by side.
- [ ] No horizontal scrollbar at 375px: `document.documentElement.scrollWidth === document.documentElement.clientWidth` is `true`.

- [ ] **Step 6: Commit**

```bash
git add components/ui/section-heading.tsx components/sections/projects-showcase.tsx components/sections/bento-grid.tsx components/sections/contact.tsx components/ui/preloader.tsx components/sections/hero.tsx
git commit -m "feat(identity): add baybayin accents to headings, preloader, and hero"
```

---

### Task 11.5: Drive the headgear reveal from a shared ink trail

**Files:**
- Create: `hooks/use-ink-trail.ts`
- Create: `components/sections/ink-reveal.tsx`
- Modify: `components/sections/headgear-reveal.tsx` (full replacement)
- Modify: `components/sections/hero.tsx`

**Interfaces consumed:** `useMediaQuery` from `@/hooks/use-media-query`; `useInView`, `useReducedMotion` from `motion/react`.
**Interfaces produced:**
- From `@/hooks/use-ink-trail`: `type RevealMode = "pointer" | "wander" | "static"`, `interface InkPoint { x; y; radius }`, `type InkLayer`, `type InkHome`, `interface InkTrail { mode; addLayer(layer): () => void; setHome(home | null): void }`, `MAX_DROPS`, `INK_POOL`, `useInkTrail(containerRef)`.
- From `@/components/sections/ink-reveal`: `InkRevealSection` (accepts every `<section>` prop), `useInkReveal()`, `useSvgId(prefix)`, `InkMask` with props `{ id; x; y; width; height }`, `paintInkMask(svg, points)`, `useInkMaskLayer(svgRef)` (returns the `InkTrail`).

After this task the headgear reveal looks as before when the cursor is over the face, but it now responds anywhere in the hero and leaves a trail that shrinks away. The watermark and background layers come in Task 11.6.

- [ ] **Step 1: Create `hooks/use-ink-trail.ts`**

```ts
"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useInView, useReducedMotion } from "motion/react";

import { useMediaQuery } from "@/hooks/use-media-query";

/**
 * - `pointer`: a mouse or trackpad drives the reveal.
 * - `wander`: touch screens; the reveal drifts over the face on its own.
 * - `static`: touch plus reduced motion; one fixed reveal, no animation.
 */
export type RevealMode = "pointer" | "wander" | "static";

/** A live drop of the trail, in viewport (client) pixels. */
export interface InkPoint {
  x: number;
  y: number;
  radius: number;
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

/** Most drops alive at once, not counting the head that sits under the cursor. */
export const MAX_DROPS = 36;

/** Circles every masked layer must render: the drops plus the head. */
export const INK_POOL = MAX_DROPS + 1;

/** Milliseconds a drop takes to shrink from full size to nothing. */
const DROP_LIFE = 900;

/** Distance in px the head travels between two dropped drops. */
const DROP_SPACING = 16;

/**
 * Drop radius in px. The gooey filter's threshold eats roughly the outer 40%
 * of each circle, so this is larger than the visible blob.
 */
function baseRadius() {
  return Math.min(150, window.innerWidth * 0.22);
}

function damp(current: number, target: number, lambda: number, dt: number) {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

/**
 * The shared cursor trail behind the hero reveal. One `requestAnimationFrame`
 * loop, running only while `containerRef` is on screen, emits "ink drops" along
 * the pointer's path. Each drop shrinks away over `DROP_LIFE`, so fast movement
 * leaves a lingering trail. Registered layers receive every live drop each
 * frame and paint their own masks; nothing here triggers a React render.
 */
export function useInkTrail(containerRef: RefObject<HTMLElement | null>): InkTrail {
  const inView = useInView(containerRef);
  const reduceMotion = useReducedMotion() ?? false;
  const finePointer = useMediaQuery("(pointer: fine)");
  const mode: RevealMode = finePointer ? "pointer" : reduceMotion ? "static" : "wander";

  const layersRef = useRef(new Set<InkLayer>());
  const homeRef = useRef<InkHome | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !inView || mode === "static") return;

    const layers = layersRef.current;
    const drops: { x: number; y: number; born: number }[] = [];
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

    let last = performance.now();
    const start = last;
    let frame = requestAnimationFrame(function tick(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      // Where the head is heading, and whether it should be showing at all.
      let target: { x: number; y: number } | null = null;
      if (mode === "pointer") {
        // Re-checked every frame: scrolling moves the hero under a still cursor.
        const rect = container!.getBoundingClientRect();
        const inside =
          pointer.seen &&
          pointer.x >= rect.left &&
          pointer.x <= rect.right &&
          pointer.y >= rect.top &&
          pointer.y <= rect.bottom;
        if (inside) target = pointer;
      } else {
        const home = homeRef.current?.();
        if (home) {
          const t = (now - start) / 1000;
          target = {
            x: home.x + Math.sin(t * 0.6) * home.span,
            y: home.y + Math.sin(t * 0.9) * home.span * 0.85,
          };
        }
      }

      if (target && !head.placed) {
        head.x = target.x;
        head.y = target.y;
        head.placed = true;
      }
      head.strength = damp(head.strength, target ? 1 : 0, 6, dt);
      if (target) {
        head.x = damp(head.x, target.x, 18, dt);
        head.y = damp(head.y, target.y, 18, dt);
      }

      // Drop ink at even spacing along the head's path since the last drop.
      if (target) {
        if (!lastDrop) lastDrop = { x: head.x, y: head.y };
        const dx = head.x - lastDrop.x;
        const dy = head.y - lastDrop.y;
        const distance = Math.hypot(dx, dy);
        const steps = Math.floor(distance / DROP_SPACING);
        for (let i = 1; i <= steps; i++) {
          const f = (i * DROP_SPACING) / distance;
          drops.push({ x: lastDrop.x + dx * f, y: lastDrop.y + dy * f, born: now });
        }
        if (steps > 0) {
          const f = (steps * DROP_SPACING) / distance;
          lastDrop = { x: lastDrop.x + dx * f, y: lastDrop.y + dy * f };
        }
        if (drops.length > MAX_DROPS) drops.splice(0, drops.length - MAX_DROPS);
      } else {
        lastDrop = null;
      }
      while (drops.length > 0 && now - drops[0].born > DROP_LIFE) drops.shift();

      const radius = baseRadius();
      const points: InkPoint[] = drops.map((drop) => {
        const age = (now - drop.born) / DROP_LIFE;
        return { x: drop.x, y: drop.y, radius: radius * (1 - age * age) };
      });
      if (head.strength > 0.002) {
        points.push({ x: head.x, y: head.y, radius: radius * head.strength });
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

- [ ] **Step 2: Create `components/sections/ink-reveal.tsx`**

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
 * The gooey filter blurs the drops together, then sharpens the alpha back to a
 * crisp edge, so they merge into one liquid shape. Its region starts empty and
 * `paintInkMask` resizes it every frame to fit only the live drops.
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
        <feGaussianBlur data-ink-blur="" stdDeviation={INK_BLUR} />
        <feColorMatrix values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -10" />
      </filter>
      <mask id={`${id}-mask`} maskUnits="userSpaceOnUse" x={x} y={y} width={width} height={height}>
        <g filter={`url(#${id}-goo)`}>
          {Array.from({ length: INK_POOL }, (_, i) => (
            <circle key={i} data-ink-drop="" r="0" fill="#fff" />
          ))}
        </g>
      </mask>
    </>
  );
}

/**
 * Converts the trail from viewport pixels into this SVG's user units and writes
 * it into the `InkMask` circles. `getScreenCTM` already includes every CSS
 * transform on the SVG's ancestors (parallax, entrance scale), so the reveal
 * stays aligned while those animate.
 */
export function paintInkMask(svg: SVGSVGElement, points: readonly InkPoint[]) {
  const circles = svg.querySelectorAll<SVGCircleElement>("[data-ink-drop]");
  const filter = svg.querySelector<SVGFilterElement>("[data-ink-filter]");
  const blur = svg.querySelector<SVGFEGaussianBlurElement>("[data-ink-blur]");
  const matrix = svg.getScreenCTM();
  if (!filter || !blur || !matrix) return;

  const toLocal = matrix.inverse();
  const scale = Math.hypot(matrix.a, matrix.b) || 1;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  circles.forEach((circle, i) => {
    const point = points[i];
    if (!point) {
      circle.setAttribute("r", "0");
      return;
    }
    const local = new DOMPoint(point.x, point.y).matrixTransform(toLocal);
    const radius = point.radius / scale;
    circle.setAttribute("cx", local.x.toFixed(1));
    circle.setAttribute("cy", local.y.toFixed(1));
    circle.setAttribute("r", radius.toFixed(1));
    minX = Math.min(minX, local.x - radius);
    minY = Math.min(minY, local.y - radius);
    maxX = Math.max(maxX, local.x + radius);
    maxY = Math.max(maxY, local.y + radius);
  });

  const std = INK_BLUR / scale;
  blur.setAttribute("stdDeviation", std.toFixed(2));

  if (points.length === 0) {
    // A zero-size filter region renders nothing, so the mask reveals nothing.
    filter.setAttribute("width", "0");
    filter.setAttribute("height", "0");
    return;
  }
  const margin = std * 3;
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

- [ ] **Step 3: Replace `components/sections/headgear-reveal.tsx`**

```tsx
"use client";

import { useEffect, useRef } from "react";

import {
  InkMask,
  paintInkMask,
  useInkMaskLayer,
  useSvgId,
} from "@/components/sections/ink-reveal";

/*
 * Every coordinate in this file is in hero-portrait.png pixels. The SVG uses
 * the portrait's own dimensions as its viewBox and sits exactly on top of the
 * portrait's 3:2 box, so these numbers stay aligned at every screen size.
 */
const PORTRAIT = { width: 2048, height: 1365 } as const;

/**
 * Where the headgear photo is drawn. Calibrated so the cage covers the face
 * and the shell sits just above the hood. Re-tune only if either image changes.
 */
const HEADGEAR = { x: 419, y: 90, width: 1166, height: 1260 } as const;

/** Middle of the face: where the reveal rests on touch devices. */
const FACE = { x: 1029, y: 520 } as const;

/** Radius of the fixed reveal in `static` mode, in portrait pixels. */
const STATIC_RADIUS = 300;

/** How far the `wander` reveal drifts from the face, in portrait pixels. */
const WANDER_SPAN = 140;

/**
 * Reveals a photo of an Arnis headgear over the face in the hero portrait,
 * inside the shared ink trail: the face is fully covered wherever the trail
 * is. A faint line-art ghost of the headgear is always visible as a hint. Must
 * be placed inside the same 3:2 box as the portrait, inside an
 * `InkRevealSection`.
 */
export function HeadgearReveal() {
  const svgRef = useRef<SVGSVGElement>(null);
  const id = useSvgId("headgear");
  const trail = useInkMaskLayer(svgRef);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    // Touch + reduced motion: one fixed reveal over the face, no animation.
    // Painted in viewport pixels so it goes through the same code path.
    if (trail.mode === "static") {
      const matrix = svg.getScreenCTM();
      if (!matrix) return;
      const face = new DOMPoint(FACE.x, FACE.y).matrixTransform(matrix);
      paintInkMask(svg, [{ x: face.x, y: face.y, radius: STATIC_RADIUS * matrix.a }]);
      return;
    }

    // Tell the trail where the face is, for the `wander` drift on touch.
    trail.setHome(() => {
      const matrix = svg.getScreenCTM();
      if (!matrix) return null;
      const face = new DOMPoint(FACE.x, FACE.y).matrixTransform(matrix);
      return { x: face.x, y: face.y, span: WANDER_SPAN * matrix.a };
    });
    return () => trail.setHome(null);
  }, [trail]);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${PORTRAIT.width} ${PORTRAIT.height}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
      className="pointer-events-none absolute inset-0 size-full"
    >
      <defs>
        <InkMask id={id} x={HEADGEAR.x} y={HEADGEAR.y} width={HEADGEAR.width} height={HEADGEAR.height} />
      </defs>

      {/* Always-visible hint, like the wireframe dome on landonorris.com. */}
      <image href="/images/hero/headgear-ghost.webp" {...HEADGEAR} opacity="0.22" />
      <image href="/images/hero/headgear.webp" {...HEADGEAR} mask={`url(#${id}-mask)`} />
    </svg>
  );
}
```

- [ ] **Step 4: Make the hero section own the trail**

In `components/sections/hero.tsx`, add this import directly after the `HeroVisual` import:

```tsx
import { InkRevealSection } from "@/components/sections/ink-reveal";
```

Replace the opening tag `<section` with `<InkRevealSection` (keep its `id` and `className` props exactly), and the closing tag `</section>` with `</InkRevealSection>`.

- [ ] **Step 5: Verify**

```bash
npx tsc --noEmit
npm run lint
npm run build
npm run dev
```

With the preloader skipped, at 1440px:

- [ ] Moving the mouse over the face reveals the headgear inside a liquid blob, as before.
- [ ] Moving the mouse quickly across the face leaves a trail of blob that shrinks away within about a second of the mouse stopping or leaving.
- [ ] With the mouse still over the face, the blob stays.
- [ ] Moving the mouse far from the face shows nothing yet (the other layers come in Task 11.6). Moving it out of the hero, or out of the window, makes the blob shrink away.
- [ ] Scrolling the hero half out of view while the mouse is still does not leave a frozen blob.
- [ ] In DevTools device mode (a phone with touch), the blob drifts slowly over the face on its own.
- [ ] Console is clean.

- [ ] **Step 6: Commit**

```bash
git add hooks/use-ink-trail.ts components/sections/ink-reveal.tsx components/sections/headgear-reveal.tsx components/sections/hero.tsx
git commit -m "refactor(hero): drive the headgear reveal from a shared ink trail"
```

---

### Task 11.6: Reveal the weave, strike slashes, and neon watermark across the hero

**Files:**
- Create: `components/sections/hero-watermark.tsx`
- Create: `components/sections/hero-backdrop-reveal.tsx`
- Modify: `components/sections/hero-visual.tsx` (full replacement)
- Modify: `components/sections/hero.tsx` (full replacement)

**Interfaces consumed:** `InkMask`, `useInkMaskLayer`, `useSvgId`, `InkRevealSection` (Task 11.5); `getStrike` (Task 11.1); `baybayin` (Task 11.1); `HeadgearReveal`.
**Interfaces produced:** `HeroWatermark` with props `{ text: string }`; `HeroBackdropReveal` (no props, must be inside `InkRevealSection`).

The HTML watermark (`<motion.p>` with `text-outline`) is replaced by an SVG that draws the outline and the neon fill from identical `<text>` elements. Its box, font size, and centre point match the old paragraph exactly, so the word does not move.

- [ ] **Step 1: Create `components/sections/hero-watermark.tsx`**

```tsx
"use client";

import { useRef } from "react";

import { InkMask, useInkMaskLayer, useSvgId } from "@/components/sections/ink-reveal";

const TEXT_CLASS = "font-display text-[clamp(4.5rem,21vw,22rem)]";

/**
 * The giant hero word, drawn twice from identical SVG text: a hollow outline
 * that is always visible, and a solid neon copy that shows only inside the ink
 * trail. Same text, same attributes, same SVG, so the two can never drift apart.
 */
export function HeroWatermark({ text }: { text: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const id = useSvgId("hero-watermark");
  useInkMaskLayer(svgRef);

  const word = text.toUpperCase();

  return (
    <svg
      ref={svgRef}
      aria-hidden
      // One line of the word at 0.8 line height. The word overflows both sides
      // on purpose; the hero section clips it.
      className="h-[clamp(3.6rem,16.8vw,17.6rem)] w-full overflow-visible select-none"
    >
      <defs>
        <InkMask id={id} x="-100%" y="-100%" width="300%" height="300%" />
      </defs>
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        fill="none"
        strokeWidth="1"
        className={`${TEXT_CLASS} stroke-line-strong`}
      >
        {word}
      </text>
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        mask={`url(#${id}-mask)`}
        className={`${TEXT_CLASS} fill-accent`}
      >
        {word}
      </text>
    </svg>
  );
}
```

- [ ] **Step 2: Create `components/sections/hero-backdrop-reveal.tsx`**

```tsx
"use client";

import { useRef } from "react";

import { InkMask, useInkMaskLayer, useSvgId } from "@/components/sections/ink-reveal";
import { getStrike } from "@/data/strike-angles";

/**
 * Bold strike slashes crossing the whole hero. Each is anchored at a point
 * given in percent of the hero and runs far past both edges, so only
 * fragments ever show through the ink trail.
 */
const SLASHES = [
  { strike: 1, x: "22%", y: "38%", width: 18 },
  { strike: 2, x: "80%", y: "30%", width: 12 },
  { strike: 12, x: "63%", y: "50%", width: 8 },
  { strike: 3, x: "50%", y: "82%", width: 14 },
] as const;

/** Half the length of each slash, in px: longer than any screen diagonal. */
const SLASH_REACH = 3000;

/**
 * The hidden layer behind the hero portrait: a woven diamond texture and neon
 * strike slashes, visible only inside the cursor's ink trail.
 */
export function HeroBackdropReveal() {
  const svgRef = useRef<SVGSVGElement>(null);
  const id = useSvgId("hero-backdrop");
  useInkMaskLayer(svgRef);

  return (
    <svg ref={svgRef} aria-hidden className="pointer-events-none absolute inset-0 size-full">
      <defs>
        {/* Same diamond lattice as the `bg-weave` utility. */}
        <pattern id={`${id}-weave`} width="32" height="32" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="#fff" strokeWidth="1">
            <path d="M16 0 32 16 16 32 0 16Z" />
            <path d="M16 9 23 16 16 23 9 16Z" />
          </g>
          <path fill="#fff" d="M16 14.5 17.5 16 16 17.5 14.5 16Z" />
        </pattern>
        <InkMask id={id} x="0" y="0" width="100%" height="100%" />
      </defs>

      <g mask={`url(#${id}-mask)`}>
        <rect width="100%" height="100%" fill={`url(#${id}-weave)`} opacity="0.08" />
        {SLASHES.map((slash) => (
          // A nested <svg> moves the origin to a percentage position, which a
          // `transform` cannot do; the line then rotates around that origin.
          <svg key={slash.strike} x={slash.x} y={slash.y} overflow="visible">
            <line
              x1={-SLASH_REACH}
              y1="0"
              x2={SLASH_REACH}
              y2="0"
              transform={`rotate(${getStrike(slash.strike).degrees ?? 0})`}
              strokeWidth={slash.width}
              className="stroke-accent"
            />
          </svg>
        ))}
      </g>
    </svg>
  );
}
```

- [ ] **Step 3: Replace `components/sections/hero-visual.tsx`**

```tsx
"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

import { HeadgearReveal } from "@/components/sections/headgear-reveal";
import { HeroWatermark } from "@/components/sections/hero-watermark";

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

export function HeroVisual({ watermark }: { watermark: string }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  // 0 while the stage top is at the viewport top, 1 once the stage has
  // scrolled fully out above it.
  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ["start start", "end start"],
  });

  // The portrait sinks slowly and the watermark rises against it. The
  // watermark is nested inside the portrait layer, so its offset stacks on top
  // of the portrait's and the two visibly separate in depth while scrolling.
  const portraitY = useTransform(scrollYProgress, [0, 1], ["0%", "12%"]);
  const watermarkY = useTransform(scrollYProgress, [0, 1], ["0%", "-80%"]);

  return (
    <div ref={stageRef} className="relative flex flex-1 items-end justify-center">
      {/* Layer 0: accent bloom behind everything. */}
      <div
        aria-hidden
        className="glow absolute bottom-[15%] left-1/2 size-[28rem] -translate-x-1/2"
      />

      {/*
       * Width is the smallest of: 140% of the container, 64rem, and whatever
       * width keeps the 3:2 portrait's height inside the viewport minus the
       * hero's top padding, telemetry bar, and bottom padding (~12rem).
       *
       * 140% is safe because the subject only occupies the middle ~55% of the
       * PNG; the transparent margins bleed off-screen and the section's
       * `overflow-hidden` clips them. On phones this is what makes the portrait
       * large enough to read.
       */}
      <motion.div
        style={{ y: reduceMotion ? 0 : portraitY }}
        className="relative w-[min(140%,64rem,calc((100svh_-_12rem)*1.5))] shrink-0"
      >
        {/*
         * Layer 1: the watermark, outline plus its ink-revealed neon fill. It
         * comes first in the DOM, so the portrait after it paints on top.
         */}
        <motion.div
          aria-hidden
          style={{ y: reduceMotion ? 0 : watermarkY }}
          className="pointer-events-none absolute inset-x-0 top-[16%]"
        >
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 48 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, ease: EASE_OUT_EXPO }}
          >
            <HeroWatermark text={watermark} />
          </motion.div>
        </motion.div>

        {/* Layer 2: the transparent cutout portrait, in front of the watermark. */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.15, ease: EASE_OUT_EXPO }}
          className="relative aspect-[3/2] w-full"
        >
          <Image
            src="/images/hero/hero-portrait.png"
            alt=""
            fill
            preload
            sizes="(min-width: 1024px) 1024px, 100vw"
            className="object-contain object-bottom -translate-y-8"
          />
          {/* Layer 3: headgear photo over the face, revealed by the ink trail. */}
          <HeadgearReveal />
        </motion.div>
      </motion.div>

      {/* The portrait is cut off at the waist; fade that edge into the page. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-bg via-bg/70 to-transparent"
      />
    </div>
  );
}
```

- [ ] **Step 4: Replace `components/sections/hero.tsx`**

The only change from the result of Task 11.5 is `<HeroBackdropReveal />` as the first child of the section, plus its import.

```tsx
import { CodeXml, Download } from "lucide-react";

import { HeroBackdropReveal } from "@/components/sections/hero-backdrop-reveal";
import { HeroVisual } from "@/components/sections/hero-visual";
import { InkRevealSection } from "@/components/sections/ink-reveal";
import { TelemetryBar } from "@/components/sections/telemetry-bar";
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

      <div className="relative z-20 mx-auto w-full max-w-7xl">
        <TelemetryBar />
      </div>

      <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col">
        <HeroVisual watermark={siteConfig.watermark} />

        {/*
         * Below lg the copy flows under the portrait. From lg up it is pinned
         * across the bottom of the stage, overlapping the faded portrait edge.
         */}
        <div className="relative z-20 -mt-16 flex flex-col items-center gap-6 text-center lg:absolute lg:inset-x-0 lg:bottom-0 lg:mt-0 lg:flex-row lg:items-end lg:justify-between lg:text-left">
          <div className="flex flex-col gap-3">
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-muted">
              {siteConfig.name}
            </span>
            <h1 className="font-display text-6xl uppercase leading-[0.85] text-fg sm:text-7xl lg:text-8xl">
              Full Stack
              <span className="block text-accent">Developer</span>
            </h1>
            <p className="flex flex-col items-center gap-1 whitespace-nowrap sm:flex-row sm:items-baseline sm:gap-3 lg:justify-start">
              <span aria-hidden className="font-baybayin text-lg text-muted">
                {baybayin.motto.text}
              </span>
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-muted">
                Diligence &amp; discipline
              </span>
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <a href={siteConfig.githubUrl} target="_blank" rel="noopener noreferrer">
                <CodeXml aria-hidden />
                GitHub
              </a>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href={siteConfig.resumePath} download>
                <Download aria-hidden />
                Resume
              </a>
            </Button>
          </div>
        </div>
      </div>
    </InkRevealSection>
  );
}
```

- [ ] **Step 5: Verify**

```bash
npx tsc --noEmit
npm run lint
npm run build
npm run dev
```

With the preloader skipped, at 1440px:

- [ ] Before touching the mouse, the hero looks the same as before this task: outline `DEVELOPER` in the same place, portrait, faint headgear ghost.
- [ ] Sweeping the mouse over the `DEVELOPER` letters fills them solid lime inside the trail, with the fill exactly on top of the outline — no double edges.
- [ ] Sweeping the mouse over empty areas left and right of the portrait shows a faint diamond texture inside the trail, and in places a fragment of a thick lime diagonal, vertical, or horizontal bar.
- [ ] The portrait, headline, and buttons always paint over the revealed layer, and the buttons stay clickable while the trail passes over them.
- [ ] Scroll down slowly with the mouse still over the watermark: the word and portrait separate in depth (parallax), and the lime fill stays locked to the outline.
- [ ] At 375px: no horizontal scrollbar, the watermark is in the same place as before this task.
- [ ] Console is clean.

- [ ] **Step 6: Commit**

```bash
git add components/sections/hero-watermark.tsx components/sections/hero-backdrop-reveal.tsx components/sections/hero-visual.tsx components/sections/hero.tsx
git commit -m "feat(hero): reveal weave, strike slashes, and neon watermark across the hero"
```

---

### Task 11.7: Phase 11 verification pass

**Files:** none created; fix whatever this task surfaces.

- [ ] **Step 1: Clean production build**

```bash
npx tsc --noEmit
npm run lint
npm run build
npm run start
```

Expected: all pass with no warnings about missing `alt`, `sizes`, or fonts.

- [ ] **Step 2: Walk the production build at http://localhost:3000**

- [ ] **First visit** (storage key cleared): the preloader shows the baybayin name, counts to 100, and wipes away. Then the hero reveal works as in Task 11.6.
- [ ] **Performance:** DevTools → Performance, CPU throttling **4× slowdown**, record 5 seconds of continuous fast mouse circles over the whole hero. The frames track shows no long frames (red bars) caused by the reveal, and each frame's Scripting + Rendering + Painting stays under about 8 ms. If frames drop, report it in the handoff rather than changing constants.
- [ ] **Idle cost:** with the mouse outside the hero for 3 seconds, the recording shows no repeated "Paint" events coming from the hero.
- [ ] **Off screen:** scroll the hero fully out of view and record 3 seconds; there are no repeating "Animation frame fired" events.
- [ ] **Touch** (DevTools device mode, e.g. Pixel 7, reload): the blob drifts over the face on its own; the rest of the hero reveal (weave, slashes, lime watermark) appears only where the drifting trail passes.
- [ ] **Touch + reduced motion** (device mode plus Rendering → prefers-reduced-motion: reduce, reload): one still headgear reveal over the face, nothing moves, nothing else is revealed.
- [ ] **Mouse + reduced motion:** the cursor still drives the reveal; the preloader fades instead of wiping; strike line dividers are already drawn.
- [ ] **Widths:** at 375px, 768px, and 1440px, `document.documentElement.scrollWidth === document.documentElement.clientWidth` is `true`, and every baybayin string renders as letters, not boxes.
- [ ] **Buttons:** every primary and outline button on the page shows the strike wipe on hover and a visible focus ring on keyboard focus.
- [ ] **Console:** clean on first visit and on reload.

- [ ] **Step 3: Commit any fixes**

```bash
git add -A -- app components data hooks lib types
git commit -m "fix: address phase 11 verification findings"
```

If nothing needed fixing, skip the commit.

---

# Phase 12 — Project case studies

Every project with a written case study gets its own statically generated page at `/projects/<slug>`, reachable from its card. The page has a woven title band with a telemetry spec row, numbered sections separated by strike lines, and a "Next lap" link to the next case study. Unknown slugs and projects without a case study return a styled 404.

Every block below was type-checked, linted, and built with Turbopack in the same scratch copy, on top of Phase 11, then tested against the production build: `/projects/ledger` and `/projects/driftline` are generated; Ledger shows all six sections (a temporary gallery image was used to check the gallery and then removed) and Driftline only Problem and Approach; `/projects/fleetdesk`, `/projects/nope`, and `/nope/x` return HTTP 404 with the DNF page; header links on a case study navigate to `/#stack` and land on the section; card links navigate to the case study at the top of the page; going back does not replay the preloader. Copy the blocks exactly.

### Task 12.1: Add the case study data model

**Files:**
- Modify: `types/index.ts`
- Modify: `data/projects.ts` (full replacement)
- Modify: `lib/queries.ts` (full replacement)

**Interfaces produced:**
- Types `CaseStudy`, `CaseStudyStep`, `CaseStudyResult`, `CaseStudyImage` from `@/types`, and the new required field `Project.caseStudy: CaseStudy | null`.
- From `@/lib/queries`: `getProjectBySlug(slug: string): Promise<Project | null>`, `getCaseStudyProjects(): Promise<Project[]>` (only projects with a case study, in `order`), `getNextCaseStudy(slug: string): Promise<Project | null>` (wraps to the first; `null` when there are fewer than two case studies or the slug has none).

The two example write-ups in `data/projects.ts` are placeholders for the owner, like the rest of that file. Ledger fills every section; Driftline fills only some, to prove that empty sections are hidden. FleetDesk has none.

- [ ] **Step 1: Add the case study types to `types/index.ts`**

Replace the end of the `Project` interface and the comment that follows it:

```ts
  /** Ascending sort key for the scroll stack. Lower renders first. */
  order: number;
}

/** Groups the bento tech-stack cards. */
```

with:

```ts
  /** Ascending sort key for the scroll stack. Lower renders first. */
  order: number;
  /**
   * Long-form write-up rendered at `/projects/[slug]`. `null` keeps the
   * project card-only. Becomes a single `case_study` jsonb column in Supabase.
   */
  caseStudy: CaseStudy | null;
}

/** A titled paragraph: one approach step or one technical highlight. */
export interface CaseStudyStep {
  title: string;
  body: string;
}

/** A headline number on the case study, e.g. { value: "3×", label: "Faster reports" }. */
export interface CaseStudyResult {
  value: string;
  label: string;
}

/** A screenshot in the case study gallery. `src` is a path under /public. */
export interface CaseStudyImage {
  src: string;
  alt: string;
  caption: string;
  width: number;
  height: number;
}

/**
 * The case study body. Empty strings and empty arrays hide their section, so a
 * write-up can ship before every part is ready.
 */
export interface CaseStudy {
  /** e.g. "Full-stack developer". */
  role: string;
  /** e.g. "Jan–Apr 2026". */
  timeframe: string;
  /** e.g. "Solo" or "Team of 4". */
  team: string;
  problem: string;
  approach: CaseStudyStep[];
  highlights: CaseStudyStep[];
  results: CaseStudyResult[];
  gallery: CaseStudyImage[];
  lessons: string;
}

/** Groups the bento tech-stack cards. */
```

- [ ] **Step 2: Replace `data/projects.ts`**

```ts
import type { Project } from "@/types";

export const projects: Project[] = [
  {
    id: "project-ledger",
    slug: "ledger",
    title: "Ledger",
    category: "full-stack",
    summary: "Real-time expense tracking with shared household budgets.",
    description:
      "A full-stack budgeting application with authenticated multi-user households, live balance updates, and monthly reporting. Built around server components with optimistic client updates on the transaction list.",
    techStack: ["Next.js", "TypeScript", "PostgreSQL", "Tailwind CSS"],
    liveUrl: "https://example.com",
    repoUrl: "https://github.com/your-handle/ledger",
    imageUrl: null,
    imageAlt: null,
    year: 2025,
    order: 1,
    // Example write-up showing every section. Replace with the real story.
    caseStudy: {
      role: "Full-stack developer",
      timeframe: "Jan–Apr 2025",
      team: "Solo",
      problem:
        "Shared households tracked money in group chats and spreadsheets. Nobody knew the real balance until the end of the month, and settling up started arguments.",
      approach: [
        {
          title: "Model the money first",
          body: "Designed the schema around households, members, and transactions before writing any UI, so every balance is derived rather than stored.",
        },
        {
          title: "Server components by default",
          body: "Lists and reports render on the server. Only the transaction form and live balance are client components.",
        },
        {
          title: "Optimistic updates",
          body: "New transactions appear instantly and reconcile with the server response, so the app feels local even on slow connections.",
        },
      ],
      highlights: [
        {
          title: "Race-free balances",
          body: "Two members adding expenses at the same moment used to double-count. Moving the balance calculation into a single SQL view removed the race entirely.",
        },
        {
          title: "Monthly reports in one query",
          body: "Replaced a loop of per-category queries with one grouped query, cutting report load time from seconds to milliseconds.",
        },
      ],
      results: [
        { value: "12", label: "Households using it" },
        { value: "<200ms", label: "Report load time" },
        { value: "0", label: "Spreadsheets left" },
      ],
      gallery: [],
      lessons:
        "Derive, don't store. Every bug that reached users came from a value that was saved when it could have been calculated.",
    },
  },
  {
    id: "project-driftline",
    slug: "driftline",
    title: "Driftline",
    category: "game-dev",
    summary: "A top-down arcade racer with procedurally generated circuits.",
    description:
      "A 2D racing game featuring a custom drift physics model, lap ghosting, and a seeded track generator. Includes a replay system that records and plays back input frames rather than transforms.",
    techStack: ["Unity", "C#", "Shader Graph"],
    liveUrl: null,
    repoUrl: "https://github.com/your-handle/driftline",
    imageUrl: null,
    imageAlt: null,
    year: 2024,
    order: 2,
    // Example of a partial write-up: sections with no content are hidden.
    caseStudy: {
      role: "Solo developer",
      timeframe: "Jun–Aug 2024",
      team: "Solo",
      problem:
        "Arcade racers either feel floaty or punish every mistake. The goal was drifting that is easy to start and hard to master.",
      approach: [
        {
          title: "Physics before graphics",
          body: "Built the drift model with grey boxes and tuned it for two weeks before drawing a single sprite.",
        },
      ],
      highlights: [],
      results: [],
      gallery: [],
      lessons: "",
    },
  },
  {
    id: "project-fleetdesk",
    slug: "fleetdesk",
    title: "FleetDesk",
    category: "internship",
    summary: "Internal dispatch dashboard built during on-the-job training.",
    description:
      "An operations dashboard for coordinating vehicle dispatch and driver assignments, delivered during an OJT placement. Replaced a spreadsheet workflow used daily by the dispatch team.",
    techStack: ["React", "Node.js", "Express", "MySQL"],
    liveUrl: null,
    repoUrl: null,
    imageUrl: null,
    imageAlt: null,
    year: 2024,
    order: 3,
    caseStudy: null,
  },
];
```

- [ ] **Step 3: Replace `lib/queries.ts`**

```ts
import { projects } from "@/data/projects";
import { skillCategories } from "@/data/skills";
import type { Project, SkillCategory } from "@/types";

/**
 * Data access seam.
 *
 * These are async today even though the local arrays are synchronous. That is
 * deliberate: when these are replaced with Supabase queries, the signatures do
 * not change and no consuming component needs editing.
 */

export async function getProjects(): Promise<Project[]> {
  return [...projects].sort((a, b) => a.order - b.order);
}

export async function getSkillCategories(): Promise<SkillCategory[]> {
  return [...skillCategories].sort((a, b) => a.order - b.order);
}

/** The project with this slug, or `null` when none matches. */
export async function getProjectBySlug(slug: string): Promise<Project | null> {
  return projects.find((project) => project.slug === slug) ?? null;
}

/** Projects that have a case study, in display order. */
export async function getCaseStudyProjects(): Promise<Project[]> {
  const all = await getProjects();
  return all.filter((project) => project.caseStudy !== null);
}

/**
 * The case study after `slug` in display order, wrapping to the first. `null`
 * when `slug` is the only case study.
 */
export async function getNextCaseStudy(slug: string): Promise<Project | null> {
  const studies = await getCaseStudyProjects();
  const index = studies.findIndex((project) => project.slug === slug);
  if (index === -1 || studies.length < 2) return null;
  return studies[(index + 1) % studies.length];
}
```

- [ ] **Step 4: Verify**

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Expected: all pass. Nothing visible changes yet.

- [ ] **Step 5: Commit**

```bash
git add types/index.ts data/projects.ts lib/queries.ts
git commit -m "feat(projects): add case study data model"
```

---

### Task 12.2: Build the case study page and the 404 page

**Files:**
- Modify: `app/globals.css` (one insertion)
- Create: `components/case-study/case-study-header.tsx`
- Create: `components/case-study/case-study-body.tsx`
- Create: `components/case-study/next-lap.tsx`
- Create: `app/projects/[slug]/page.tsx`
- Create: `app/not-found.tsx`

**Interfaces consumed:** `getProjectBySlug`, `getCaseStudyProjects`, `getNextCaseStudy`, `CaseStudy`, `Project` (Task 12.1); `StrikeLine` (Task 11.2); `baybayin` (Task 11.1); `bg-weave`; `Button`; `SiteHeader`; `SiteFooter`; `PROJECT_CATEGORY_LABELS`.
**Interfaces produced:** `animate-strike-wipe` class; `CaseStudyHeader` `{ project; caseStudy }`; `CaseStudyBody` `{ caseStudy }`; `NextLap` `{ next: Project | null }`; route `/projects/[slug]`.

Read `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/dynamic-routes.md`, `.../02-route-segment-config/dynamicParams.md`, and `.../03-file-conventions/not-found.md` before starting.

- [ ] **Step 1: Add the arrival wipe animation to `app/globals.css`**

In the `@theme` block, insert this directly above `  @keyframes status-in {`:

```css
  /*
   * Case study arrival: a skewed panel with a neon leading edge slides off to
   * the right, uncovering the page. CSS-only, so it also runs without JS.
   */
  --animate-strike-wipe: strike-wipe 0.9s cubic-bezier(0.76, 0, 0.24, 1) 0.05s both;

  @keyframes strike-wipe {
    from {
      transform: skewX(-12deg) translateX(0);
    }
    to {
      transform: skewX(-12deg) translateX(110%);
    }
  }

```

- [ ] **Step 2: Create `components/case-study/case-study-header.tsx`**

```tsx
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CodeXml } from "lucide-react";

import { Button } from "@/components/ui/button";
import { baybayin } from "@/data/baybayin";
import { PROJECT_CATEGORY_LABELS, type CaseStudy, type Project } from "@/types";

function projectStatus(project: Project) {
  if (project.liveUrl) return "Live";
  if (project.repoUrl) return "Source only";
  return "Private";
}

export interface CaseStudyHeaderProps {
  project: Project;
  caseStudy: CaseStudy;
}

/** Title band of a case study: woven texture, Anton title, telemetry spec row. */
export function CaseStudyHeader({ project, caseStudy }: CaseStudyHeaderProps) {
  const specs = [
    { label: "Role", value: caseStudy.role },
    { label: "Year", value: `${project.year} · ${caseStudy.timeframe}` },
    { label: "Team", value: caseStudy.team },
    { label: "Stack", value: project.techStack.join(" / ") },
    { label: "Status", value: projectStatus(project) },
  ];

  return (
    <header className="relative overflow-hidden px-6 pt-32 pb-16 sm:pt-40">
      <div aria-hidden className="bg-weave pointer-events-none absolute inset-0 opacity-[0.05]" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-bg to-transparent"
      />

      <div className="relative mx-auto flex max-w-6xl flex-col gap-10">
        <Link
          href="/#projects"
          className="flex w-fit items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-muted transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          <ArrowLeft aria-hidden className="size-4" />
          Back to projects
        </Link>

        <div className="flex flex-col gap-5">
          <span className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.25em] text-accent">
            <span aria-hidden className="h-px w-8 bg-accent" />
            {PROJECT_CATEGORY_LABELS[project.category]}
            <span aria-hidden className="font-baybayin text-sm tracking-normal text-muted">
              {baybayin.projects.text}
            </span>
          </span>
          <h1 className="font-display text-6xl uppercase leading-[0.85] text-fg sm:text-8xl lg:text-9xl">
            {project.title}
          </h1>
          <p className="max-w-2xl text-lg text-fg/80 sm:text-xl">{project.summary}</p>
        </div>

        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-3 lg:grid-cols-5">
          {specs.map((spec) => (
            <div key={spec.label} className="flex flex-col gap-2 bg-surface p-4 last:col-span-2 sm:last:col-span-1">
              <dt className="font-mono text-[0.65rem] uppercase tracking-[0.25em] text-muted">
                {spec.label}
              </dt>
              <dd className="text-sm text-fg">{spec.value}</dd>
            </div>
          ))}
        </dl>

        {project.liveUrl || project.repoUrl ? (
          <div className="flex flex-wrap gap-3">
            {project.liveUrl ? (
              <Button asChild>
                <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                  Live Demo
                  <ArrowUpRight aria-hidden />
                </a>
              </Button>
            ) : null}
            {project.repoUrl ? (
              <Button asChild variant="outline">
                <a href={project.repoUrl} target="_blank" rel="noopener noreferrer">
                  <CodeXml aria-hidden />
                  Repository
                </a>
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Create `components/case-study/case-study-body.tsx`**

```tsx
import type { ReactNode } from "react";
import Image from "next/image";

import { StrikeLine } from "@/components/ui/strike-line";
import type { CaseStudy } from "@/types";

/** Strike angles used for the dividers, in order. All have on-screen lines. */
const DIVIDER_STRIKES = [1, 2, 12, 3, 4, 8];

interface Block {
  id: string;
  title: string;
  content: ReactNode;
}

function buildBlocks(caseStudy: CaseStudy): Block[] {
  const blocks: (Block | null)[] = [
    caseStudy.problem
      ? {
          id: "problem",
          title: "Problem",
          content: (
            <p className="max-w-3xl text-xl leading-relaxed text-fg/90 sm:text-2xl">
              {caseStudy.problem}
            </p>
          ),
        }
      : null,
    caseStudy.approach.length > 0
      ? {
          id: "approach",
          title: "Approach",
          content: (
            <ol className="grid gap-4 md:grid-cols-2">
              {caseStudy.approach.map((step, index) => (
                <li
                  key={step.title}
                  className="flex flex-col gap-3 rounded-card border border-line bg-surface p-6"
                >
                  <span className="font-mono text-xs tracking-[0.25em] text-accent">
                    SECTOR {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-xl font-semibold tracking-tight text-fg">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-muted">{step.body}</p>
                </li>
              ))}
            </ol>
          ),
        }
      : null,
    caseStudy.highlights.length > 0
      ? {
          id: "highlights",
          title: "Highlights",
          content: (
            <ul className="flex flex-col gap-8">
              {caseStudy.highlights.map((highlight) => (
                <li key={highlight.title} className="flex max-w-3xl flex-col gap-2 border-l-2 border-accent pl-6">
                  <h3 className="text-xl font-semibold tracking-tight text-fg">{highlight.title}</h3>
                  <p className="leading-relaxed text-muted">{highlight.body}</p>
                </li>
              ))}
            </ul>
          ),
        }
      : null,
    caseStudy.results.length > 0
      ? {
          id: "results",
          title: "Results",
          content: (
            <dl className="grid gap-8 sm:grid-cols-3">
              {caseStudy.results.map((result) => (
                <div key={result.label} className="flex flex-col gap-2">
                  <dt className="font-mono text-xs uppercase tracking-[0.25em] text-muted">
                    {result.label}
                  </dt>
                  <dd className="font-display text-6xl leading-none text-accent sm:text-7xl">
                    {result.value}
                  </dd>
                </div>
              ))}
            </dl>
          ),
        }
      : null,
    caseStudy.gallery.length > 0
      ? {
          id: "gallery",
          title: "Gallery",
          content: (
            <div className="grid gap-6 md:grid-cols-2">
              {caseStudy.gallery.map((image) => (
                <figure key={image.src} className="flex flex-col gap-3">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    width={image.width}
                    height={image.height}
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="w-full rounded-card border border-line"
                  />
                  <figcaption className="font-mono text-xs text-muted">{image.caption}</figcaption>
                </figure>
              ))}
            </div>
          ),
        }
      : null,
    caseStudy.lessons
      ? {
          id: "lessons",
          title: "Lessons",
          content: (
            <p className="max-w-3xl text-xl leading-relaxed text-fg/90 sm:text-2xl">
              {caseStudy.lessons}
            </p>
          ),
        }
      : null,
  ];
  return blocks.filter((block): block is Block => block !== null);
}

/**
 * The numbered case study sections. Sections with no content are left out and
 * the remaining ones are numbered consecutively.
 */
export function CaseStudyBody({ caseStudy }: { caseStudy: CaseStudy }) {
  const blocks = buildBlocks(caseStudy);

  return (
    <div className="flex flex-col gap-16 pb-24">
      {blocks.map((block, index) => (
        <section key={block.id} aria-labelledby={`case-${block.id}`} className="flex flex-col gap-16">
          <StrikeLine angle={DIVIDER_STRIKES[index % DIVIDER_STRIKES.length]} />
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6">
            <h2
              id={`case-${block.id}`}
              className="flex items-baseline gap-4 font-display text-4xl uppercase text-fg sm:text-5xl"
            >
              <span className="font-mono text-sm tracking-[0.25em] text-accent">
                {String(index + 1).padStart(2, "0")}
              </span>
              {block.title}
            </h2>
            {block.content}
          </div>
        </section>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Create `components/case-study/next-lap.tsx`**

```tsx
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { PROJECT_CATEGORY_LABELS, type Project } from "@/types";

/** End of a case study: the next case study, and a way back to the list. */
export function NextLap({ next }: { next: Project | null }) {
  return (
    <nav aria-label="Case studies" className="px-6 pb-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        {next ? (
          <Link
            href={`/projects/${next.slug}`}
            className="group relative flex flex-col gap-4 overflow-hidden rounded-card border border-line bg-surface p-8 transition-[border-color,box-shadow] duration-300 hover:border-accent/50 hover:shadow-[0_0_60px_-24px_var(--color-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:p-12"
          >
            <span className="font-mono text-xs tracking-[0.25em] text-accent">NEXT LAP</span>
            <span className="flex items-center justify-between gap-6">
              <span className="font-display text-5xl uppercase leading-none text-fg sm:text-7xl">
                {next.title}
              </span>
              <ArrowRight
                aria-hidden
                className="size-10 shrink-0 text-accent transition-transform duration-300 group-hover:translate-x-2"
              />
            </span>
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
              {PROJECT_CATEGORY_LABELS[next.category]} · {next.year}
            </span>
          </Link>
        ) : null}

        <Link
          href="/#projects"
          className="flex w-fit items-center gap-2 font-mono text-xs uppercase tracking-[0.25em] text-muted transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          <ArrowLeft aria-hidden className="size-4" />
          Back to projects
        </Link>
      </div>
    </nav>
  );
}
```

- [ ] **Step 5: Create `app/projects/[slug]/page.tsx`**

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CaseStudyBody } from "@/components/case-study/case-study-body";
import { CaseStudyHeader } from "@/components/case-study/case-study-header";
import { NextLap } from "@/components/case-study/next-lap";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { siteConfig } from "@/data/site";
import { getCaseStudyProjects, getNextCaseStudy, getProjectBySlug } from "@/lib/queries";

// Only projects with a case study get a page; any other slug is a 404.
export const dynamicParams = false;

export async function generateStaticParams() {
  const projects = await getCaseStudyProjects();
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return {};

  const title = `${project.title} — ${siteConfig.name}`;
  return {
    title,
    description: project.summary,
    openGraph: { title, description: project.summary, type: "article" },
  };
}

export default async function CaseStudyPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project?.caseStudy) notFound();

  const next = await getNextCaseStudy(project.slug);

  return (
    <>
      {/* Diagonal neon wipe that uncovers the page on arrival. CSS only. */}
      <div
        aria-hidden
        className="animate-strike-wipe pointer-events-none fixed inset-y-0 -left-1/4 z-90 w-[150%] border-l-2 border-accent bg-bg"
      />
      <SiteHeader />
      <main>
        <CaseStudyHeader project={project} caseStudy={project.caseStudy} />
        <CaseStudyBody caseStudy={project.caseStudy} />
        <NextLap next={next} />
      </main>
      <SiteFooter />
    </>
  );
}
```

- [ ] **Step 6: Create `app/not-found.tsx`**

```tsx
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center gap-8 overflow-hidden px-6 text-center">
      <div aria-hidden className="bg-weave pointer-events-none absolute inset-0 opacity-[0.04]" />

      <span className="relative font-mono text-xs uppercase tracking-[0.3em] text-accent">
        404 <span className="text-line-strong">{"//"}</span> Did not finish
      </span>
      <h1 className="relative font-display text-[clamp(6rem,30vw,18rem)] uppercase leading-[0.8] text-outline-accent">
        DNF
      </h1>
      <p className="relative max-w-md text-muted">
        This page left the track. The link may be old, or the project may no longer be listed.
      </p>
      <Button asChild className="relative">
        <Link href="/">
          <ArrowLeft aria-hidden />
          Back to the start
        </Link>
      </Button>
    </main>
  );
}
```

- [ ] **Step 7: Verify**

```bash
npx next typegen
npx tsc --noEmit
npm run lint
npm run build
```

Expected: the build's route list shows `/projects/[slug]` with `● /projects/ledger` and `● /projects/driftline`, and nothing for `fleetdesk`.

```bash
npm run start
```

- [ ] http://localhost:3000/projects/ledger: a diagonal dark panel with a lime edge slides off to the right on arrival. The page shows "Back to projects", the `FULL-STACK` eyebrow with baybayin, a huge `LEDGER` title, the summary, a five-cell spec row (Role, Year, Team, Stack, Status `Live`), and Live Demo / Repository buttons.
- [ ] Below it: `01 Problem`, `02 Approach` (three `SECTOR` cards), `03 Highlights`, `04 Results` (three big lime numbers), `05 Lessons`, each preceded by a strike line divider. There is no Gallery section. At the bottom, a `NEXT LAP` card for Driftline and a "Back to projects" link.
- [ ] The browser tab title is `Ledger — Your Name`.
- [ ] http://localhost:3000/projects/driftline shows only `01 Problem` and `02 Approach`, Status `Source only`, and a `NEXT LAP` card for Ledger.
- [ ] http://localhost:3000/projects/fleetdesk and http://localhost:3000/projects/anything show the `DNF` page with "Back to the start". In DevTools → Network, the document status is 404.
- [ ] At 375px on the Ledger page: no horizontal scrollbar; the spec row is two columns with Status spanning the full last row.
- [ ] With reduced motion emulated and a reload, there is no visible wipe.

- [ ] **Step 8: Commit**

```bash
git add app/globals.css components/case-study app/projects app/not-found.tsx
git commit -m "feat(case-study): add case study pages and 404"
```

---

### Task 12.3: Link project cards and the header to case studies

**Files:**
- Modify: `components/sections/project-card.tsx` (full replacement)
- Modify: `components/layout/site-header.tsx` (full replacement)

**Interfaces consumed:** `Project.caseStudy` (Task 12.1); route `/projects/[slug]` (Task 12.2); `Link` from `next/link`; `usePathname` from `next/navigation`.
**Interfaces produced:** none new.

On a project card with a case study, the title becomes a link and "Read case study" becomes the primary button; Live Demo drops to an outline button so only one primary button shows. Cards without a case study are unchanged. On any page other than `/`, the header's section links go to `/#<section>` and the initials go to `/`; on the home page they keep smooth-scrolling.

- [ ] **Step 1: Replace `components/sections/project-card.tsx`**

```tsx
"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, CodeXml } from "lucide-react";
import {
  motion,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "motion/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePointerTilt } from "@/hooks/use-pointer-tilt";
import { PROJECT_CATEGORY_LABELS, type Project } from "@/types";

export interface ProjectCardProps {
  project: Project;
  index: number;
  total: number;
  /** Scroll progress of the whole stack, 0 at the top and 1 at the bottom. */
  progress: MotionValue<number>;
}

export function ProjectCard({ project, index, total, progress }: ProjectCardProps) {
  const reduceMotion = useReducedMotion() ?? false;

  // Each card shrinks slightly once the next card begins covering it, so the
  // stack reads as a physical deck rather than a flat overlay.
  const targetScale = 1 - (total - index) * 0.04;
  const scale = useTransform(progress, [index / total, 1], [1, targetScale]);

  const { handlers, tiltStyle, spotlight } = usePointerTilt({ disabled: reduceMotion });

  return (
    <div className="sticky top-0 flex h-screen items-center justify-center px-6">
      {/*
       * Scroll layer: stack scale and offset. It is also the pointer
       * measurement box, which is why it must never rotate.
       */}
      <motion.div
        {...handlers}
        style={{
          scale: reduceMotion ? 1 : scale,
          top: `${index * 1.5}rem`,
        }}
        className="relative w-full max-w-4xl"
      >
        {/* Tilt layer. */}
        <motion.article
          style={tiltStyle}
          className="group relative overflow-hidden rounded-card border border-line bg-surface p-8 transition-[border-color,box-shadow] duration-300 hover:border-accent/50 hover:shadow-[0_0_60px_-24px_var(--color-accent)] sm:p-12"
        >
          <motion.div
            aria-hidden
            style={{ background: spotlight }}
            className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />

          <div className="relative flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Badge variant="accent">{PROJECT_CATEGORY_LABELS[project.category]}</Badge>
              <span className="font-mono text-xs text-muted">{project.year}</span>
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
                {project.caseStudy ? (
                  <Link
                    href={`/projects/${project.slug}`}
                    className="transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                  >
                    {project.title}
                  </Link>
                ) : (
                  project.title
                )}
              </h3>
              <p className="text-lg text-fg/80">{project.summary}</p>
              <p className="max-w-2xl text-sm leading-relaxed text-muted">
                {project.description}
              </p>
            </div>

            <ul className="flex flex-wrap gap-2">
              {project.techStack.map((tech) => (
                <li key={tech}>
                  <Badge>{tech}</Badge>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-3">
              {project.caseStudy ? (
                <Button asChild size="sm">
                  <Link href={`/projects/${project.slug}`}>
                    Read case study
                    <ArrowRight aria-hidden />
                  </Link>
                </Button>
              ) : null}
              {project.liveUrl ? (
                <Button asChild size="sm" variant={project.caseStudy ? "outline" : "primary"}>
                  <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                    Live Demo
                    <ArrowUpRight aria-hidden />
                  </a>
                </Button>
              ) : null}
              {project.repoUrl ? (
                <Button asChild variant="outline" size="sm">
                  <a href={project.repoUrl} target="_blank" rel="noopener noreferrer">
                    <CodeXml aria-hidden />
                    Repository
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
        </motion.article>
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 2: Replace `components/layout/site-header.tsx`**

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLenis } from "lenis/react";
import { CodeXml, Mail, Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { navLinks } from "@/data/navigation";
import { siteConfig, socialLinks } from "@/data/site";
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

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // Section anchors only exist on the home page. Elsewhere, links navigate to
  // `/#anchor` instead of smooth-scrolling.
  const onHome = usePathname() === "/";

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
          "flex w-full max-w-3xl items-center justify-between gap-4 rounded-full border px-4 py-2 transition-colors duration-300",
          scrolled
            ? "border-line bg-surface/70 backdrop-blur-xl"
            : "border-transparent bg-transparent",
        )}
      >
        {onHome ? (
          <button
            type="button"
            onClick={() => lenis?.scrollTo(0)}
            className="rounded-full px-2 font-mono text-sm font-semibold tracking-[0.2em] text-fg"
          >
            {siteConfig.initials}
          </button>
        ) : (
          <Link
            href="/"
            className="rounded-full px-2 font-mono text-sm font-semibold tracking-[0.2em] text-fg"
          >
            {siteConfig.initials}
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
npm run start
```

- [ ] On the home page, the Ledger card shows `Read case study` (lime), `Live Demo` (outline), `Repository` (outline). Driftline shows `Read case study` and `Repository`. FleetDesk shows no buttons and a plain title.
- [ ] Hovering the Ledger and Driftline titles turns them lime; clicking a title or `Read case study` opens the case study scrolled to the top.
- [ ] Header nav on the home page still smooth-scrolls to each section.
- [ ] On `/projects/ledger`, clicking `Stack` in the header opens the home page at the Stack section, and clicking the `YN` initials opens the home page at the top. The mobile menu (375px) behaves the same way.
- [ ] Browser Back from a case study returns to the home page without replaying the preloader.
- [ ] Console is clean on both pages.

- [ ] **Step 4: Commit**

```bash
git add components/sections/project-card.tsx components/layout/site-header.tsx
git commit -m "feat(projects): link cards and header to case studies"
```

---

### Task 12.4: Phase 12 verification pass

**Files:** none created; fix whatever this task surfaces.

- [ ] **Step 1: Clean production build**

```bash
npx tsc --noEmit
npm run lint
npm run build
npm run start
```

- [ ] **Step 2: Walk the production build**

- [ ] Full home page from preloader to footer: Phase 11 checks still pass (reveal, dividers, baybayin, button wipes).
- [ ] Both case studies at 375px, 768px, and 1440px: no horizontal overflow, every divider draws in once, the `NEXT LAP` arrow nudges right on hover.
- [ ] Keyboard only: Tab from the top of a case study reaches "Back to projects", the Live/Repo buttons, the `NEXT LAP` card, and the final back link, each with a visible accent focus ring. Enter follows each link.
- [ ] JavaScript disabled (DevTools Command Menu → "Disable JavaScript"), open `/projects/ledger`: the arrival wipe still plays and the page is fully readable.
- [ ] `view-source:http://localhost:3000/projects/ledger` contains `<title>Ledger — Your Name</title>` and an `og:type` of `article`.
- [ ] Console is clean on `/`, `/projects/ledger`, `/projects/driftline`, and the 404 page.

- [ ] **Step 3: Commit any fixes**

```bash
git add -A -- app components data hooks lib types
git commit -m "fix: address phase 12 verification findings"
```

If nothing needed fixing, skip the commit.

---

## Handoff checklist (owner-supplied content)

Only the repository owner can resolve these. Do not invent values.

1. `data/site.ts` — name, initials, email, GitHub URL, and site URL are placeholders. Also confirm `availability.isAvailable`, `timeZone` / `timeZoneLabel` (`Asia/Manila` / `GMT+8`), and the `watermark` word (sized for ~9 characters).
2. `data/projects.ts` — three example projects (Ledger, Driftline, FleetDesk) need replacing with real ones, including the two example case study write-ups. Gallery images go in `public/images/projects/<slug>/` with their real pixel `width` and `height`.
3. `public/resume.pdf` — minimal placeholder; replace with the real résumé.
4. `public/images/hero/headgear.webp` and `headgear-ghost.webp` — cut out from STIX's product photo as sold by Eljan Sports, with the logo painted over. The photo still belongs to STIX/the retailer. Replacing it with a photo of a borrowed headgear (front view, plain background, even light) removes the risk; re-tune `HEADGEAR` and `FACE` in `components/sections/headgear-reveal.tsx` afterwards.
5. `data/baybayin.ts` — **launch blocker.** Every entry is `reviewed: false`. Someone who reads baybayin must check each `text` (the surname Garaza, "Sipag at Disiplina", "Proyekto", "Kasanayan", "Ugnayan") before the site goes public.
6. `data/strike-angles.ts` — **launch blocker.** Every entry is `confirmed: false`. Check each number, target, and on-screen direction against the owner's sport Arnis anyo.
7. `components/ui/preloader.tsx` — `STATUS_LINES` are hard-coded (`GARAZA // DEV PORTFOLIO`, `SYS.INIT // OK`, `LATENCY // 12MS`); `12MS` is decorative.

**Next phases (planned in the spec, not yet written as tasks):** Phase 13, new home sections (About, Experience, Arnis, Now — the owner picks which); Phase 14, polish and reach (tech marquee, heading reveals, OG images, sitemap, robots, JSON-LD, Vercel Web Analytics, Lighthouse ≥ 90).
