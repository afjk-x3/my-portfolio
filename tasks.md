# Portfolio Implementation Plan

> **For the builder (OpenCode):** Execute tasks strictly in order. Each task is
> self-contained — read only that task, do exactly what it says, run its
> **Verify** block, then commit. Do not skip ahead, do not batch phases, and do
> not "improve" adjacent files that the task does not list.

> **Status:** Phases 1–16 are complete and committed. Next: Phase 17 (remove the
> strike dividers, strike angles, and baybayin). After it: Phase 18 (new home
> sections) or Phase 19 (polish). The design is in
> `docs/superpowers/specs/2026-09-16-portfolio-v2-design.md` (§4f); read it only
> if a task does not answer a question. Step-by-step history of earlier phases
> was removed from this file; read Phases 1–10 with `git show 633c7fb:tasks.md`,
> Phases 11–12 with `git show f9256c3:tasks.md`, Phase 13 with
> `git show 76da151:tasks.md`, Phases 14–15 with `git show bfb7a61:tasks.md`,
> and Phase 16 with `git show 53267ef:tasks.md` only if a task explicitly tells
> you to.

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
- **Accent is electric neon lime (`#ccff00`).** Use it for badges, borders, the live dot, the hero slashes, and hover glows. When it is a background fill, the text on it is always `text-accent-ink`. Hover glows use `shadow-[0_0_32px_-6px_var(--color-accent)]`. Filipino/Arnis motifs never add a new colour.
- **SVG colours come from Tailwind classes, not `var()` attributes.** Write `className="stroke-accent"` / `fill-accent`, not `stroke="var(--color-accent)"`.
- **`lucide-react` v1 has no brand icons.** There is no `Github` export. GitHub links use `CodeXml`.
- **No `scroll-behavior: smooth` in CSS.** Lenis drives scrolling. Anchor navigation on the home page goes through the Lenis instance (`lenis.scrollTo(href, { offset: -96 })` in `components/layout/site-header.tsx`).
- **Respect `prefers-reduced-motion`.** Every scroll-linked or entrance animation must degrade to a static layout. Lenis is disabled entirely under reduced motion, and a global rule in `app/globals.css` shortens every CSS animation and transition to near zero.
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

This is the tree after Phase 17. Files marked **[17]** are changed by Phase 17. Phase 17 also deletes `components/ui/strike-line.tsx`, `strike-mark.tsx`, `strike-button.tsx`, `strike-finisher.tsx`, `hooks/use-strike-rhythm.ts`, `lib/strike-audio.ts`, `data/strike-angles.ts`, `data/baybayin.ts`, and `public/audio/strikes/`.

```
app/
  layout.tsx                 # fonts, metadata, <Backdrop>, <SmoothScrollProvider>, <CommandPalette> [17]
  page.tsx                   # <Preloader>, <SiteHeader>, sections, <SiteFooter> [17]
  globals.css                # theme tokens, utilities (bg-weave), animations, Lenis base, preloader gate [17]
  not-found.tsx              # "DNF // Did not finish" 404
components/
  command-palette/
    command-palette.tsx      # Ctrl+K / ⌘K palette: navigate, actions, secrets (client)
  layout/
    backdrop.tsx             # page-wide fixed grid + noise layers (server)
    site-header.tsx          # glass nav: name wordmark, section links, palette button, socials (client)
    site-footer.tsx          # footer with weave texture and a hairline (server) [17]
  sections/
    hero.tsx                 # <InkRevealSection>: backdrop reveal, visual stage, corner copy + status [17]
    hero-visual.tsx          # watermark + glow + portrait, parallax (client)
    hero-watermark.tsx       # SVG outline word + ink-revealed neon fill (client)
    hero-backdrop-reveal.tsx # ink-revealed weave + four slashes at fixed angles across the hero (client) [17]
    headgear-reveal.tsx      # ink-revealed headgear photo over the face (client)
    ink-reveal.tsx           # InkRevealSection, InkMask (torn-edge filter), paintInkMask, useInkMaskLayer (client)
    hero-status.tsx          # AvailabilityStatus + LocalClock (client)
    projects-showcase.tsx    # server: awaits getProjects() (id="projects") [17]
    projects-stack.tsx       # sticky scroll stack (client)
    project-card.tsx         # one card in the stack, tilt + spotlight (client)
    bento-grid.tsx           # server: awaits getSkillCategories() (id="stack") [17]
    tech-stack-card.tsx      # one skill group card (server)
    discipline-card.tsx      # Arnis photo card, hover/focus cross-fade, full-stance crop (client, id="discipline")
    contact.tsx              # contact CTA (server, id="contact") [17]
  providers/
    smooth-scroll-provider.tsx  # Lenis root (client)
  ui/
    button.tsx               # cva + Radix Slot, neon variants, strike wipe on hover
    badge.tsx                # tech-stack pill
    section-heading.tsx      # eyebrow + title [17]
    preloader.tsx            # intro on every full load: monogram + counter, opens at top (client) [17]
data/
  site.ts                    # siteConfig (identity, wordmark, watermark, availability, time zone) + socialLinks
  navigation.ts              # nav anchors
  projects.ts                # Project[]
  skills.ts                  # SkillCategory[] + discipline photos
hooks/
  use-ink-trail.ts           # shared ink trail: move-only, speed-sized drops, strike event
  use-command-palette.ts     # palette open state + modifier key label
  use-local-time.ts          # ticking clock via useSyncExternalStore
  use-media-query.ts         # matchMedia via useSyncExternalStore
  use-pointer-tilt.ts        # mouse-tracked 3D tilt + spotlight motion values
lib/
  utils.ts                   # cn()
  queries.ts                 # async data access seam (Supabase swap point)
types/
  index.ts                   # shared domain types — extend, do not rewrite [17]
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
| `--color-accent` | `#ccff00` | `bg-accent`, `text-accent`, `border-accent/50`, `stroke-accent`, `fill-accent` | Neon: badges, borders, live dot, glows, hero slashes |
| `--color-accent-soft` | `#e2fd52` | `hover:bg-accent-soft` | Hover state of accent fills |
| `--color-accent-ink` | `#09090b` | `text-accent-ink` | Text on accent fills |

| Font class | Face | Use |
| --- | --- | --- |
| `font-sans` | Geist | Body |
| `font-mono` | Geist Mono | Telemetry, labels, counters |
| `font-display` | Anton | Watermark, hero headline |
| `font-gothic` | UnifrakturCook | Preloader monogram only |

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

**Stacking order:** header `z-50`, preloader overlay `z-90`, command palette overlay `z-95` and dialog `z-96`, page-wide film grain `z-100`.

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
16. Interactive sword-slash rhythm dividers with sound, and the hero portrait fade fix. The dividers are removed again in Phase 17; the fade fix stays.

---

# Phase 17 — Remove the strike dividers, strike angles, and baybayin

The owner decided on 2026-10-23 to drop three motifs from Phases 11–16:

- **Strike dividers:** the four `<StrikeLine>` bands with the STRIKE button, combo, scars, finisher, and sword sounds.
- **Strike-angle data:** `data/strike-angles.ts`. It was never confirmed by the owner, and only the dividers and the hero slashes read it.
- **Baybayin:** every script accent (preloader name, hero motto, section eyebrows) and the Noto Sans Tagalog font. No entry was ever reviewed by a reader.

The Arnis identity stays through the headgear reveal, the discipline photos, and the woven texture. The design note is §4f of the spec.

**These stay exactly as they are. Do not edit or rename them, even where the code says "strike":**

- The hero backdrop slashes. Task 17.2 turns their four angles into plain numbers, so the hero looks the same.
- The command palette's **Strike** secret and the `portfolio:strike` sweep in `hooks/use-ink-trail.ts`.
- The Arnis photos (`discipline-card.tsx`) and the headgear reveal (`headgear-reveal.tsx`).
- The strike wipe on button hover in `components/ui/button.tsx`.

Every block below was applied in order to a scratch copy at commit `71ca813`. After each task the copy passed `npx tsc --noEmit`, `npm run lint`, and `npm run build` with Turbopack. The new spacing (hero → projects gap, footer hairline, preloader without the script line, hero motto) was checked at 1440px by making the same changes live in the running production page. Copy the blocks exactly.

**Rules for this phase:**

- Delete files with `git rm`, so the deletions are already staged when you commit.
- Visitors may still have `portfolio_strike_best`, `portfolio_strike_hint_seen`, and `portfolio_strike_muted` in `localStorage` from the old dividers. Leave them. Nothing reads them any more.

### Task 17.1: Remove the strike dividers and their sound clips

**Files:**
- Modify: `app/page.tsx` (full replacement)
- Modify: `components/layout/site-footer.tsx`
- Modify: `components/sections/projects-showcase.tsx` (one class)
- Modify: `app/globals.css` (two deletions)
- Delete: `components/ui/strike-line.tsx`, `components/ui/strike-mark.tsx`, `components/ui/strike-button.tsx`, `components/ui/strike-finisher.tsx`, `hooks/use-strike-rhythm.ts`, `lib/strike-audio.ts`, and the whole `public/audio/strikes/` folder

**Interfaces consumed / produced:** none. After this task nothing exports or imports `StrikeLine`, `StrikeMark`, `StrikeButton`, `StrikeFinisher`, `useStrikeRhythm`, or anything from `@/lib/strike-audio`.

- [ ] **Step 1: Replace `app/page.tsx`**

```tsx
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { BentoGrid } from "@/components/sections/bento-grid";
import { Contact } from "@/components/sections/contact";
import { Hero } from "@/components/sections/hero";
import { ProjectsShowcase } from "@/components/sections/projects-showcase";
import { Preloader } from "@/components/ui/preloader";

export default function Home() {
  return (
    <>
      {/* First, so its gate script runs before any page content is parsed. */}
      <Preloader />
      <SiteHeader />
      <main>
        <Hero />
        <ProjectsShowcase />
        <BentoGrid />
        <Contact />
      </main>
      <SiteFooter />
    </>
  );
}
```

- [ ] **Step 2: Swap the footer's strike divider for a plain hairline**

In `components/layout/site-footer.tsx`, delete this import line:

```tsx
import { StrikeLine } from "@/components/ui/strike-line";
```

Then replace:

```tsx
      <StrikeLine angle={12} at={0.5} className="mb-6 px-0" />
```

with:

```tsx
      <div aria-hidden className="relative mx-auto mb-6 h-px max-w-6xl bg-line" />
```

- [ ] **Step 3: Restore the gap above the projects heading**

The strike band (96–128px tall) used to separate the hero from the projects heading. In `components/sections/projects-showcase.tsx`, replace:

```tsx
    <section id="projects" className="relative px-6 pt-8 pb-24">
```

with:

```tsx
    <section id="projects" className="relative px-6 pt-24 pb-24">
```

- [ ] **Step 4: Remove the strike tokens from `app/globals.css`**

In the `@theme` block, delete these two lines. The `--color-scar` token is not used anywhere.

```css
  /* Strike scars: semi-transparent accent for healed cuts on dividers. */
  --color-scar: #ccff0044;
```

In the same block, delete the approach ring, together with the blank line after it. Stop before `  @keyframes status-in {`, which stays.

```css
  /*
   * Strike approach ring: shrinks steadily onto the STRIKE button and touches
   * it when the next press is due. Linear, so its speed is easy to read; the
   * component sets `animation-duration` to the visitor's tempo.
   */
  --animate-approach-ring: approach-ring 0.6s linear both;

  @keyframes approach-ring {
    from {
      transform: scale(2.6);
      opacity: 0.15;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }

```

- [ ] **Step 5: Delete the strike files**

```bash
git rm components/ui/strike-line.tsx components/ui/strike-mark.tsx components/ui/strike-button.tsx components/ui/strike-finisher.tsx hooks/use-strike-rhythm.ts lib/strike-audio.ts
git rm -r public/audio/strikes
```

`public/` should now hold only `images/` and `resume.pdf`.

- [ ] **Step 6: Verify**

```bash
grep -rnE "strike-(line|mark|button|finisher)|use-strike-rhythm|strike-audio|audio/strikes|approach-ring|color-scar" app components hooks lib
npx tsc --noEmit
npm run lint
npm run build
npm run start
```

Expected: the `grep` prints nothing, and the other commands pass. If `tsc` reports `Cannot find name 'LayoutProps'`, run `npx next typegen` once and re-run it (see Global Constraints).

After the intro, at 1440px:

- [ ] No divider bands, sword buttons, speaker icons, or `ANGLE` labels anywhere on the page.
- [ ] Between the hero's GitHub / Resume buttons and the "SELECTED WORK" eyebrow there is a clear gap of about 130px. The heading is not crammed against the hero.
- [ ] The footer has a thin grey hairline above the copyright row, about 140px below the contact buttons.
- [ ] Moving the mouse over the hero still reveals the weave, the lime slashes, and the headgear.
- [ ] Press Ctrl+K, type `st`, and pick **Strike**: a lime sweep still crosses the hero.
- [ ] DevTools → Network: no request to `/audio/strikes/`.
- [ ] At 375px: no horizontal scrollbar.
- [ ] Console is clean.

- [ ] **Step 7: Commit**

```bash
git add app/page.tsx app/globals.css components/layout/site-footer.tsx components/sections/projects-showcase.tsx
git commit -m "refactor(strike): remove the interactive strike dividers and sound clips"
```

---

### Task 17.2: Hardcode the hero slash angles and remove the strike-angle data

**Files:**
- Modify: `components/sections/hero-backdrop-reveal.tsx`
- Modify: `types/index.ts` (one deletion)
- Delete: `data/strike-angles.ts`

**Interfaces consumed / produced:** none. After this task `getStrike`, `strikeAngles`, and the `StrikeAngle` type no longer exist.

- [ ] **Step 1: Give the hero slashes their own angles**

In `components/sections/hero-backdrop-reveal.tsx`, delete this import line:

```tsx
import { getStrike } from "@/data/strike-angles";
```

Replace:

```tsx
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
```

with:

```tsx
/**
 * Bold strike slashes crossing the whole hero. Each is anchored at a point
 * given in percent of the hero and runs far past both edges, so only
 * fragments ever show through the ink trail. `degrees` is the slash's
 * direction: 0 points right and angles grow clockwise, so 90 is straight down.
 */
const SLASHES = [
  { degrees: 135, x: "22%", y: "38%", width: 18 },
  { degrees: 45, x: "80%", y: "30%", width: 12 },
  { degrees: 90, x: "63%", y: "50%", width: 8 },
  { degrees: 180, x: "50%", y: "82%", width: 14 },
] as const;
```

Replace:

```tsx
          <svg key={slash.strike} x={slash.x} y={slash.y} overflow="visible">
```

with:

```tsx
          <svg key={slash.degrees} x={slash.x} y={slash.y} overflow="visible">
```

Replace:

```tsx
              transform={`rotate(${getStrike(slash.strike).degrees ?? 0})`}
```

with:

```tsx
              transform={`rotate(${slash.degrees})`}
```

- [ ] **Step 2: Delete the `StrikeAngle` type**

At the end of `types/index.ts`, delete this block and the blank line before it. The file must still end with the closing `}` of `BaybayinEntry` and a newline.

```ts
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

- [ ] **Step 3: Delete the data file**

```bash
git rm data/strike-angles.ts
```

- [ ] **Step 4: Verify**

```bash
grep -rnE "strike-angles|getStrike|StrikeAngle|strikeAngles" app components data hooks lib types
npx tsc --noEmit
npm run lint
npm run build
npm run start
```

Expected: the `grep` prints nothing, and the other commands pass. After the intro, at 1440px:

- [ ] In the DevTools console, this prints `["rotate(135)", "rotate(45)", "rotate(90)", "rotate(180)"]`. That matches the angles before this task.

```js
[...document.querySelectorAll("#hero svg line")].map((line) => line.getAttribute("transform"))
```

- [ ] Sweeping the mouse across the whole hero reveals the same four lime slashes as before: one rising to the right left of the portrait, one falling to the right at the top right, one vertical right of the face, and one horizontal low across the hero.
- [ ] Console is clean.

- [ ] **Step 5: Commit**

```bash
git add components/sections/hero-backdrop-reveal.tsx types/index.ts
git commit -m "refactor(hero): hardcode the backdrop slash angles and remove strike-angle data"
```

---

### Task 17.3: Remove the baybayin accents and their font

**Files:**
- Modify: `components/ui/section-heading.tsx` (full replacement)
- Modify: `components/sections/projects-showcase.tsx`, `components/sections/bento-grid.tsx`, `components/sections/contact.tsx`, `components/sections/hero.tsx`
- Modify: `components/ui/preloader.tsx`
- Modify: `app/layout.tsx`, `app/globals.css`, `types/index.ts`
- Delete: `data/baybayin.ts`

**Interfaces consumed / produced:** `SectionHeading` loses its `script` prop and keeps `{ eyebrow, title, className? }`. The `BaybayinEntry` type, the `baybayin` export, and the `font-baybayin` class no longer exist.

- [ ] **Step 1: Replace `components/ui/section-heading.tsx`**

```tsx
import { cn } from "@/lib/utils";

export interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  className?: string;
}

export function SectionHeading({ eyebrow, title, className }: SectionHeadingProps) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <span className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.25em] text-accent">
        <span aria-hidden className="h-px w-8 bg-accent" />
        {eyebrow}
      </span>
      <h2 className="text-balance text-4xl font-semibold tracking-tight text-fg sm:text-5xl">
        {title}
      </h2>
    </div>
  );
}
```

- [ ] **Step 2: Drop `script` from the three section headings**

In each of `components/sections/projects-showcase.tsx`, `components/sections/bento-grid.tsx`, and `components/sections/contact.tsx`, delete this import line:

```tsx
import { baybayin } from "@/data/baybayin";
```

In `projects-showcase.tsx`, replace:

```tsx
        <SectionHeading eyebrow="Selected Work" title="Projects" script={baybayin.projects} />
```

with:

```tsx
        <SectionHeading eyebrow="Selected Work" title="Projects" />
```

In `bento-grid.tsx`, replace:

```tsx
        <SectionHeading eyebrow="Toolkit" title="Stack & Discipline" script={baybayin.stack} />
```

with:

```tsx
        <SectionHeading eyebrow="Toolkit" title="Stack & Discipline" />
```

In `contact.tsx`, delete this line from the `<SectionHeading>` props:

```tsx
          script={baybayin.contact}
```

- [ ] **Step 3: Keep only the English motto in the hero**

In `components/sections/hero.tsx`, delete this import line:

```tsx
import { baybayin } from "@/data/baybayin";
```

Replace:

```tsx
            <p className="flex flex-col items-center gap-1 whitespace-nowrap sm:flex-row sm:items-baseline sm:gap-3 lg:justify-start">
              <span aria-hidden className="font-baybayin text-base text-muted">
                {baybayin.motto.text}
              </span>
              <span className="font-mono text-[0.625rem] uppercase tracking-[0.3em] text-muted">
                Diligence &amp; discipline
              </span>
            </p>
```

with:

```tsx
            <p className="font-mono text-[0.625rem] uppercase tracking-[0.3em] text-muted">
              Diligence &amp; discipline
            </p>
```

- [ ] **Step 4: Remove the baybayin name from the preloader**

In `components/ui/preloader.tsx`, delete this import line and the blank line above it:

```tsx
import { baybayin } from "@/data/baybayin";
```

Then delete this element and the blank line after it. The counter `<div className="mt-8 ...">` that follows stays.

```tsx
              <span className="animate-status-in mt-4 font-baybayin text-2xl text-accent/80 md:text-3xl">
                {baybayin.name.text}
              </span>

```

- [ ] **Step 5: Stop loading Noto Sans Tagalog**

In `app/layout.tsx`, replace:

```tsx
import { Anton, Geist, Geist_Mono, Noto_Sans_Tagalog, UnifrakturCook } from "next/font/google";
```

with:

```tsx
import { Anton, Geist, Geist_Mono, UnifrakturCook } from "next/font/google";
```

Delete this block and the blank line after it:

```tsx
// Baybayin script for the decorative accents in `data/baybayin.ts`. Only the
// Tagalog subset is loaded, so Latin text never falls back to this face.
const notoTagalog = Noto_Sans_Tagalog({
  variable: "--font-noto-tagalog",
  subsets: ["tagalog"],
  weight: "400",
});
```

In the `<html>` `className`, delete ` ${notoTagalog.variable}` so that the end of the string reads `${unifraktur.variable} h-full antialiased`.

In `app/globals.css`, in the `@theme inline` block, delete:

```css
  --font-baybayin: var(--font-noto-tagalog);
```

- [ ] **Step 6: Delete the `BaybayinEntry` type and the data file**

At the end of `types/index.ts`, delete this block and the blank line before it. The file must then end with the closing `}` of `SocialLink` and a newline.

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
```

```bash
git rm data/baybayin.ts
```

- [ ] **Step 7: Verify**

```bash
grep -rniE "baybayin|tagalog" app components data hooks lib types
npx tsc --noEmit
npm run lint
npm run build
npm run start
```

Expected: the `grep` prints nothing, and the other commands pass.

- [ ] Preloader: the "G" monogram, then the counter and bar, then the three status lines. There is no script line under the G, and the stack still looks centred and evenly spaced.
- [ ] Hero at 1440px: under "FULL STACK DEVELOPER" there is one small line, "DILIGENCE & DISCIPLINE", left-aligned with the headline. At 375px it is centred.
- [ ] Section eyebrows read `— SELECTED WORK`, `— TOOLKIT`, and `— CONTACT`, with nothing after the English.
- [ ] DevTools → Network → Font: no Noto Sans Tagalog file is requested.
- [ ] At 375px: no horizontal scrollbar.
- [ ] Console is clean.

- [ ] **Step 8: Commit**

```bash
git add app/layout.tsx app/globals.css types/index.ts components/ui/section-heading.tsx components/ui/preloader.tsx components/sections/hero.tsx components/sections/projects-showcase.tsx components/sections/bento-grid.tsx components/sections/contact.tsx
git commit -m "refactor: remove the baybayin accents and the Noto Sans Tagalog font"
```

---

### Task 17.4: Phase 17 verification pass

**Files:** none created; fix whatever this task surfaces.

- [ ] **Step 1: Clean production build**

```bash
grep -rniE "baybayin|tagalog|strike-angles|getStrike|strike-(line|mark|button|finisher)|use-strike-rhythm|strike-audio" app components data hooks lib types
npx tsc --noEmit
npm run lint
npm run build
npm run start
```

Expected: the `grep` prints nothing, and the other commands pass.

- [ ] **Step 2: Walk the production build**

- [ ] **Widths** 375px, 768px, and 1440px: no horizontal scrollbar, and the gaps between hero, projects, stack, contact, and footer look deliberate, with no section crammed against the next.
- [ ] **Header nav:** Projects, Stack, Discipline, and Contact each scroll to the right place, with the section heading visible below the header.
- [ ] **Kept pieces:** the hero ink reveal (weave, slashes, watermark fill, headgear), the palette's **Strike** secret, the discipline card's hover cross-fade, and the button wipe on hover all behave as before.
- [ ] **Keyboard only:** Tab through the whole page. There are no leftover focus stops where the dividers used to be, and every stop shows the accent focus ring.
- [ ] **Reduced motion** (DevTools → Rendering → prefers-reduced-motion: reduce, then reload): the page renders statically, with no errors.
- [ ] **Console:** clean.

- [ ] **Step 3: Commit any fixes**

```bash
git add -A -- app components data hooks lib types
git commit -m "fix: address phase 17 verification findings"
```

If nothing needed fixing, skip the commit.

---

## Handoff checklist (owner-supplied content)

Only the repository owner can resolve these. Do not invent values.

1. `data/site.ts` — name, initials, wordmark, and GitHub URL are set; email and site URL are still placeholders (the palette's **Copy email** copies whatever is there). Also confirm `availability.isAvailable`, `timeZone` / `timeZoneLabel` (`Asia/Manila` / `GMT+8`), and the `watermark` word (sized for ~9 characters).
2. `data/projects.ts` — three example projects (Ledger, Driftline, FleetDesk) need replacing with real ones.
3. `public/resume.pdf` — minimal placeholder; replace with the real résumé.
4. `public/images/hero/headgear.webp` and `headgear-ghost.webp` — cut out from STIX's product photo as sold by Eljan Sports, with the logo painted over. The photo still belongs to STIX/the retailer. Replacing it with a photo of a borrowed headgear (front view, plain background, even light) removes the risk; re-tune `HEADGEAR` and `FACE` in `components/sections/headgear-reveal.tsx` afterwards.
5. `components/ui/preloader.tsx` — `STATUS_LINES` are hard-coded (`GARAZA // DEV PORTFOLIO`, `SYS.INIT // OK`, `LATENCY // 12MS`); `12MS` is decorative.

**Next phases (planned in the spec, not yet written as tasks):** Phase 18, new home sections (About, Experience, Arnis, Now — the owner picks which); Phase 19, polish and reach (tech marquee, heading reveals, OG images, sitemap, robots, JSON-LD, Vercel Web Analytics, Lighthouse ≥ 90).
