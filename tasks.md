# Portfolio Implementation Plan

> **For the builder (OpenCode):** Execute tasks strictly in order. Each task is
> self-contained — read only that task, do exactly what it says, run its
> **Verify** block, then commit. Do not skip ahead, do not batch phases, and do
> not "improve" adjacent files that the task does not list.

> **Status:** Phases 1–19 are complete and committed. Phases 17 (strike and
> baybayin removal) and 18 (accessibility, touch, and layout fixes) are on branch
> `feat/phase-17-18`, not yet merged into `master`. Their verification walks
> were run at 375px (touch), 1366×768, and 1440px; reduced motion was not
> emulated. Phase 19 (projects as a standings list; design in
> `docs/superpowers/specs/2026-10-24-projects-standings-design.md`) is complete on
> the same branch. Next: Phase 20 (new home sections) or Phase 21 (polish). The design is in
> `docs/superpowers/specs/2026-09-16-portfolio-v2-design.md` (§4f, §4g); read it only
> if a task does not answer a question. Step-by-step history of earlier phases
> was removed from this file; read Phases 1–10 with `git show 633c7fb:tasks.md`,
> Phases 11–12 with `git show f9256c3:tasks.md`, Phase 13 with
> `git show 76da151:tasks.md`, Phases 14–15 with `git show bfb7a61:tasks.md`,
> and Phase 16 with `git show 53267ef:tasks.md` only if a task explicitly tells
> you to.

**Goal:** A single-page, dark, motion-driven developer portfolio on Next.js 16 App Router with a command palette, deployed to Vercel.

**Architecture:** `app/page.tsx` composes the home page from section components in `components/sections/`. Every section that renders data is an async Server Component that awaits a function from `lib/queries.ts`. Those functions return local typed arrays today, but they already return `Promise`s, so the Supabase swap only changes the data layer and no UI code. Client-side interactivity (smooth scroll, scroll-linked animation, cursor effects, the preloader, the mobile nav) is isolated in leaf `"use client"` components.

**Tech Stack:** Next.js 16.4.2 from Task 18.1, 16.3.5 before it (App Router, Turbopack), React 19.2.8, TypeScript 5 (strict), Tailwind CSS v4, `motion` v13 (the current package name for Framer Motion, imported from `motion/react`), `lenis` v1.3, `lucide-react` v1, shadcn/ui conventions (`cn()` + `cva` + `components/ui/`). No three.js, no WebGL.

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
- **Accessibility floor.** Every `<Image>` has meaningful `alt` (or `alt=""` when purely decorative). Every icon-only link or button has an `aria-label`. Every section has an `id` that matches its nav anchor. From Phase 18: visible text is at least 12px (body copy 16px), every tap target is at least 44px on touch screens (use the `pointer-coarse:` variant), and nothing that matters appears on hover only.
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

This is the tree after Phase 19. Files marked **[17]**, **[18]**, or **[19]** are changed by that phase. Phase 19 also deletes `components/sections/projects-stack.tsx`, `project-card.tsx`, and `hooks/use-pointer-tilt.ts`. Phase 17 also deletes `components/ui/strike-line.tsx`, `strike-mark.tsx`, `strike-button.tsx`, `strike-finisher.tsx`, `hooks/use-strike-rhythm.ts`, `lib/strike-audio.ts`, `data/strike-angles.ts`, `data/baybayin.ts`, and `public/audio/strikes/`. Phase 18 also changes `package.json`, `package-lock.json`, and `README.md`.

```
app/
  layout.tsx                 # fonts, metadata, skip link, <Backdrop>, <SmoothScrollProvider>, <CommandPalette> [17] [18]
  page.tsx                   # <Preloader>, <SiteHeader>, <main id="main"> sections, <SiteFooter> [17] [18]
  globals.css                # theme tokens, utilities (bg-weave), animations, Lenis base, preloader gate, scroll padding [17] [18]
  not-found.tsx              # "DNF // Did not finish" 404 [18]
  opengraph-image.tsx        # generated 1200×630 link preview card [18]
components/
  command-palette/
    command-palette.tsx      # Ctrl+K / ⌘K palette: navigate, actions, secrets (client)
  layout/
    backdrop.tsx             # page-wide fixed grid + noise layers (server)
    site-header.tsx          # glass nav: name wordmark, section links, palette button, socials (client) [18]
    site-footer.tsx          # footer with weave texture and a hairline (server) [17] [18]
  sections/
    hero.tsx                 # <InkRevealSection>: backdrop reveal, visual stage, corner copy + status; name + role h1 [17] [18]
    hero-visual.tsx          # watermark + glow + portrait, parallax (client)
    hero-watermark.tsx       # SVG outline word + ink-revealed neon fill (client)
    hero-backdrop-reveal.tsx # ink-revealed weave + four slashes at fixed angles across the hero (client) [17]
    headgear-reveal.tsx      # ink-revealed headgear photo over the face (client) [18]
    ink-reveal.tsx           # InkRevealSection, InkMask (torn-edge filter), paintInkMask, useInkMaskLayer (client) [18]
    hero-status.tsx          # AvailabilityStatus + LocalClock (client) [18]
    projects-showcase.tsx    # server: awaits getProjects() (id="projects") [17]
    projects-standings.tsx   # standings list: which row is open, /#<slug> deep links (client) [19]
    project-row.tsx          # one row: header button + animated details (client) [19]
    bento-grid.tsx           # server: awaits getSkillCategories() (id="stack"); photo + 2×2 skill cards [17] [18]
    tech-stack-card.tsx      # one skill group card, label top / tags bottom (server) [18]
    discipline-card.tsx      # Arnis photo card: hover/focus cross-fade, side by side on touch (client, id="discipline") [18]
    contact.tsx              # contact CTA (server, id="contact") [17]
  providers/
    smooth-scroll-provider.tsx  # Lenis root (client)
  ui/
    button.tsx               # cva + Radix Slot, neon variants, strike wipe on hover, 44px `sm` on touch [18]
    badge.tsx                # tech-stack pill
    section-heading.tsx      # eyebrow + title [17]
    preloader.tsx            # intro on every full load, skippable: monogram + counter + status lines, opens at top (client) [17] [18]
data/
  site.ts                    # siteConfig (identity, wordmark, watermark, availability, time zone) + socialLinks [18]
  navigation.ts              # nav anchors
  projects.ts                # Project[]
  skills.ts                  # SkillCategory[] + discipline photos
hooks/
  use-ink-trail.ts           # shared ink trail: pointer mode (move-only drops) or touch mode, strike event [18]
  use-command-palette.ts     # palette open state + modifier key label
  use-local-time.ts          # ticking clock via useSyncExternalStore
  use-media-query.ts         # matchMedia via useSyncExternalStore
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

**Stacking order:** header `z-50`, skip link while focused `z-60` **[18]**, preloader overlay `z-90`, command palette overlay `z-95` and dialog `z-96`, page-wide film grain `z-100`.

---

## How the key pieces work

Read this before changing any of these files.

- **Projects standings** (Phase 19; `projects-standings.tsx`, `project-row.tsx`): the projects are split into groups by `PROJECT_GROUPS` (Work: client, internship, and personal projects; Academic), each an `<ol>` of rows in `order` numbered from P1. Every row starts closed, and one row is open at a time across all groups (Task 19.3). A `/#<slug>` hash, on load or on `hashchange`, opens that row without animation and scrolls it into view (`scroll-padding-top` keeps it below the header), so a row collapsing above it cannot shift it. Each group's heading is an `<h3>`, and each row's header is a `<button aria-expanded>` inside an `<h4>`. Adding or removing projects needs no component edits. (Phases 4–18 used a pinned card stack, which was replaced here.)
- **Preloader** (`preloader.tsx`, gate styles in `globals.css`):
  - The overlay is always in the server HTML but CSS keeps it `display: none` unless `<html>` has `data-preloader-active`. An inline script, rendered first on the page, sets that attribute during parsing only when `sessionStorage` lacks `portfolio_preloaded` (from Task 15.1: on every full load, and it also sets `history.scrollRestoration = "manual"` so a reload opens at the top; a module flag stops client-side navigation from replaying it). That is why `<html>` has `suppressHydrationWarning`. Do not add a `flex` class to the overlay; `display` belongs to the gate.
  - React reads storage through `useSyncExternalStore` with `true` as the server snapshot.
  - `animate()` tweens a motion value 0→100 over `COUNT_DURATION` (1.6 s); holds `EXIT_HOLD` (0.2 s); exits with `y: "-100%"` over 0.8 s, or a fade under reduced motion. On exit completion the storage key is written and the scroll lock released.
  - Scroll lock is CSS `overflow: hidden` on `<html>` plus `lenis.stop()`.
  - From Phase 18, any `keydown`, `pointerdown`, or `wheel` while the counter runs sets `counted`, which starts the exit wipe at once. When the exit completes on a touch screen (and without reduced motion), it dispatches `portfolio:strike`, so phone visitors see the headgear reveal once.
- **Ink reveal** (Phase 11; `use-ink-trail.ts`, `ink-reveal.tsx`, and the three hero layers):
  - `InkRevealSection` renders the hero `<section>` and owns one **ink trail**: a single `requestAnimationFrame` loop, running only while the hero is on screen, that drops "ink" along the cursor's path **only while it moves**. Drop size and stretch grow with speed, and each drop shrinks away over 900 ms, so a still cursor shows nothing. A `portfolio:strike` window event plays a scripted diagonal sweep. Positions are in viewport pixels. Nothing in the loop causes a React render.
  - Each masked layer is an SVG containing an `<InkMask>` (a blur → noise-displacement tear → alpha-threshold filter over a mask of rotated ellipses). `useInkMaskLayer` registers the SVG with the trail; every frame `paintInkMask` converts the drops into that SVG's own coordinates with `getScreenCTM()` — which already includes parallax and entrance transforms — and resizes the filter region to fit only the live drops.
  - There is one masked SVG per coordinate space because the watermark and the portrait move at different parallax speeds: `HeroBackdropReveal` (whole hero: weave + strike slashes), `HeroWatermark` (outline word + neon fill, drawn from identical `<text>`), and `HeadgearReveal` (portrait pixels: headgear photo over the face).
  - Modes (Phase 18): a fine pointer drives the trail (`pointer`). On touch screens (`touch`) nothing follows the finger, so the face stays visible, and only `portfolio:strike` sweeps reveal anything. The earlier `wander` and `static` modes, which kept the headgear over the face on phones, are gone.
  - If the portrait or headgear image changes, re-tune only `HEADGEAR` in `headgear-reveal.tsx`.
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
17. Strike dividers, strike-angle data, and baybayin removed; hero slashes keep fixed angles.
18. Next.js 16.4.2, skip link and focus offset, 44px touch targets, 12px/16px text floor, name in the h1 and `GARAZA` watermark, face visible on touch, honest and skippable preloader, both Arnis photos on touch, project deep links and a plain list on phones, 2×2 stack grid, Open Graph image, README.
19. Projects shown as standings lists, grouped into Work and Academic and closed by default, with the label column showing Client, Internship, Personal, or Academic; `/#<slug>` opens a row; the pinned card stack, tilt, and spotlight removed.

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

- [x] **Step 1: Replace `app/page.tsx`**

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

- [x] **Step 2: Swap the footer's strike divider for a plain hairline**

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

- [x] **Step 3: Restore the gap above the projects heading**

The strike band (96–128px tall) used to separate the hero from the projects heading. In `components/sections/projects-showcase.tsx`, replace:

```tsx
    <section id="projects" className="relative px-6 pt-8 pb-24">
```

with:

```tsx
    <section id="projects" className="relative px-6 pt-24 pb-24">
```

- [x] **Step 4: Remove the strike tokens from `app/globals.css`**

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

- [x] **Step 5: Delete the strike files**

```bash
git rm components/ui/strike-line.tsx components/ui/strike-mark.tsx components/ui/strike-button.tsx components/ui/strike-finisher.tsx hooks/use-strike-rhythm.ts lib/strike-audio.ts
git rm -r public/audio/strikes
```

`public/` should now hold only `images/` and `resume.pdf`.

- [x] **Step 6: Verify**

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

- [x] **Step 7: Commit**

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

- [x] **Step 1: Give the hero slashes their own angles**

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

- [x] **Step 2: Delete the `StrikeAngle` type**

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

- [x] **Step 3: Delete the data file**

```bash
git rm data/strike-angles.ts
```

- [x] **Step 4: Verify**

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

- [x] **Step 5: Commit**

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

- [x] **Step 1: Replace `components/ui/section-heading.tsx`**

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

- [x] **Step 2: Drop `script` from the three section headings**

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

- [x] **Step 3: Keep only the English motto in the hero**

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

- [x] **Step 4: Remove the baybayin name from the preloader**

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

- [x] **Step 5: Stop loading Noto Sans Tagalog**

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

- [x] **Step 6: Delete the `BaybayinEntry` type and the data file**

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

- [x] **Step 7: Verify**

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

- [x] **Step 8: Commit**

```bash
git add app/layout.tsx app/globals.css types/index.ts components/ui/section-heading.tsx components/ui/preloader.tsx components/sections/hero.tsx components/sections/projects-showcase.tsx components/sections/bento-grid.tsx components/sections/contact.tsx
git commit -m "refactor: remove the baybayin accents and the Noto Sans Tagalog font"
```

---

### Task 17.4: Phase 17 verification pass

**Files:** none created; fix whatever this task surfaces.

- [x] **Step 1: Clean production build**

```bash
grep -rniE "baybayin|tagalog|strike-angles|getStrike|strike-(line|mark|button|finisher)|use-strike-rhythm|strike-audio" app components data hooks lib types
npx tsc --noEmit
npm run lint
npm run build
npm run start
```

Expected: the `grep` prints nothing, and the other commands pass.

- [x] **Step 2: Walk the production build**

- [ ] **Widths** 375px, 768px, and 1440px: no horizontal scrollbar, and the gaps between hero, projects, stack, contact, and footer look deliberate, with no section crammed against the next.
- [ ] **Header nav:** Projects, Stack, Discipline, and Contact each scroll to the right place, with the section heading visible below the header.
- [ ] **Kept pieces:** the hero ink reveal (weave, slashes, watermark fill, headgear), the palette's **Strike** secret, the discipline card's hover cross-fade, and the button wipe on hover all behave as before.
- [ ] **Keyboard only:** Tab through the whole page. There are no leftover focus stops where the dividers used to be, and every stop shows the accent focus ring.
- [ ] **Reduced motion** (DevTools → Rendering → prefers-reduced-motion: reduce, then reload): the page renders statically, with no errors.
- [ ] **Console:** clean.

- [x] **Step 3: Commit any fixes**

```bash
git add -A -- app components data hooks lib types
git commit -m "fix: address phase 17 verification findings"
```

If nothing needed fixing, skip the commit.

---

# Phase 18 — Accessibility, touch, and layout fixes

These are fixes from a UI/UX review of the live page (ui-ux-pro-max guidelines, measured at 375px and 1440px). None of them needs new content from the owner. In order:

1. **Security:** upgrade Next.js past a critical advisory.
2. **Keyboard:** add a skip link, and keep focus clear of the fixed header.
3. **Touch targets:** at least 44px on touch screens. Small buttons and the wordmark were 31–36px and the footer icons 16px.
4. **Text size:** at least 12px for labels and 16px for body copy. Some labels were 10–11px and the body copy 14px.
5. **Hero:** the name becomes part of the `h1`, and the watermark becomes the surname.
6. **Touch hero:** on phones the face stays visible instead of permanently covered by the headgear.
7. **Preloader:** honest status lines, and any key, click, or tap skips it.
8. **Discipline card:** on touch screens both photos show, because there is no hover.
9. **Projects:** each project gets a deep link (`/#<slug>`), and on phones the stack becomes a plain list, so no card can hide its own buttons.
10. **Stack grid:** a balanced 2×2 grid replaces the wide, mostly empty Frontend card.
11. **Link previews:** a generated Open Graph image.
12. **README.**

**Deliberately not in this phase:**

- **Project screenshots.** The card layout depends on the real images. On a 1366×768 laptop, a card with even a 224px image strip no longer fits the pinned stack. This waits for the owner's screenshots.
- **About section and Game Dev skills.** Both need owner copy and confirmed skills.
- **Showing the preloader once per session.** The owner chose every load in Phase 15. This phase only makes it skippable.

Every block below was applied in order to a scratch copy with Phase 17 already applied. After each task the copy passed `npx tsc --noEmit`, `npm run lint`, and `npm run build`. Three things were checked live in the production page at 375px and 1366–1440px:

- The layout changes (44px header buttons fit at 375px, the side-by-side discipline photos, the 2×2 stack grid).
- Deep links: a link to the pinned card itself landed on the wrong card, and the marker element in Task 18.9 fixes that.
- `scroll-padding-top` with Lenis.

The Open Graph image was rendered and inspected. Copy the blocks exactly.

### Task 18.1: Upgrade Next.js past the critical advisory

**Files:**
- Modify: `package.json`, `package-lock.json`

`npm audit` reports a **critical** advisory for `next` 16.0.0–16.4.0 (including remote code execution in `next/og`, which Task 18.11 uses), plus high-severity advisories for `sharp` and `source-map-js`. `16.4.2` is the newest patch that has been out for over a week. Both versions stay pinned exactly, as before.

- [x] **Step 1: Upgrade and fix the transitive packages**

```bash
npm install --save-exact next@16.4.2 eslint-config-next@16.4.2
npm audit fix
```

- [x] **Step 2: Verify**

```bash
npm audit
npx tsc --noEmit
npm run lint
npm run build
npm run start
```

Expected: `npm audit` prints `found 0 vulnerabilities`. In `package.json`, `"next"` and `"eslint-config-next"` both read exactly `"16.4.2"`, with no `^`. The build banner says `Next.js 16.4.2`, and the other commands pass. After the intro, the page looks and behaves exactly as before, and the console is clean.

- [x] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "fix(deps): upgrade next to 16.4.2 for security advisories"
```

---

### Task 18.2: Add a skip link and keep focus clear of the header

**Files:**
- Modify: `app/globals.css`, `app/layout.tsx`, `app/page.tsx`, `app/not-found.tsx`

The header is fixed, so a control reached with Tab could scroll in underneath it, which fails WCAG 2.2 AA "Focus not obscured". There was also no way to jump past the header.

- [x] **Step 1: Offset focus and anchor scrolling in `app/globals.css`**

Replace:

```css
:root {
  color-scheme: dark;
}
```

with:

```css
:root {
  color-scheme: dark;
  /* Keeps keyboard focus and in-page link targets clear of the fixed header. */
  scroll-padding-top: 6rem;
}
```

- [x] **Step 2: Add the skip link in `app/layout.tsx`**

Replace:

```tsx
      <body className="min-h-full bg-bg font-sans text-fg" suppressHydrationWarning>
        <Backdrop />
```

with:

```tsx
      <body className="min-h-full bg-bg font-sans text-fg" suppressHydrationWarning>
        {/* First Tab stop on every page: jumps past the header to the content. */}
        <a
          href="#main"
          className="sr-only rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-ink focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Skip to content
        </a>
        <Backdrop />
```

- [x] **Step 3: Give both `<main>` elements the target id**

In `app/page.tsx`, replace `      <main>` with `      <main id="main">`.

In `app/not-found.tsx`, replace:

```tsx
    <main className="relative flex min-h-svh
```

with:

```tsx
    <main id="main" className="relative flex min-h-svh
```

(The rest of that line stays as it is.)

- [x] **Step 4: Verify**

```bash
npx tsc --noEmit
npm run lint
npm run build
npm run start
```

After the intro, at 1440px:

- [ ] Click the page background, then press Tab once. A lime "Skip to content" pill appears in the top-left corner, above the header. Press Enter: the page jumps past the header, and the next Tab focuses the hero's GitHub button.
- [ ] Scroll so that a project card's "Repository" button sits under the header, click the background just above the card, and press Tab until that button is focused. The page scrolls so the button is fully below the header.
- [ ] Open `/does-not-exist`. The first Tab shows the same pill, and Enter moves to the 404 content.
- [ ] The skip link is invisible until focused, and it never shows on mouse click.
- [ ] Console is clean.

- [x] **Step 5: Commit**

```bash
git add app/globals.css app/layout.tsx app/page.tsx app/not-found.tsx
git commit -m "feat(a11y): add a skip link and keep focus clear of the fixed header"
```

---

### Task 18.3: Make tap targets 44px on touch screens

**Files:**
- Modify: `components/ui/button.tsx`, `components/layout/site-header.tsx`, `components/layout/site-footer.tsx`

`pointer-coarse:` is Tailwind v4's variant for `@media (pointer: coarse)`, which matches phones and tablets. Mouse users see no change.

- [x] **Step 1: Grow the small button size on touch screens**

In `components/ui/button.tsx`, replace:

```tsx
        sm: "h-9 px-4 text-sm",
```

with:

```tsx
        // On touch screens small buttons grow to the 44px minimum tap size.
        sm: "h-9 px-4 text-sm pointer-coarse:h-11 pointer-coarse:min-w-11",
```

This covers the header's icon buttons, the mobile menu links, and the project card buttons.

- [x] **Step 2: Give the header wordmark a 44px hit area**

The wordmark is a plain `<button>` on the home page and a `<Link>` elsewhere, and both are 31px tall. In `components/layout/site-header.tsx`, this exact `className` appears twice. Replace **both** occurrences of:

```tsx
className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
```

with:

```tsx
className="flex items-center rounded-md pointer-coarse:min-h-11 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
```

- [x] **Step 3: Give the footer icons a 44px hit area**

In `components/layout/site-footer.tsx`, replace:

```tsx
        <ul className="flex items-center gap-5">
```

with:

```tsx
        <ul className="flex items-center gap-1">
```

Then replace:

```tsx
                  className="text-muted transition-colors hover:text-fg"
```

with:

```tsx
                  className="flex size-11 items-center justify-center rounded-full text-muted transition-colors hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
```

- [x] **Step 4: Verify**

```bash
npx tsc --noEmit
npm run lint
npm run build
npm run start
```

- [ ] DevTools device toolbar → a phone preset (it emulates touch), then reload. In the console, this prints only values of `44` or more:

```js
[...document.querySelectorAll("header button, header a, footer a")].filter((el) => el.offsetParent).map((el) => Math.round(Math.min(el.getBoundingClientRect().width, el.getBoundingClientRect().height)))
```

- [ ] At 375px the header still fits on one line, with the wordmark, search, GitHub, email, and menu buttons, and there is no horizontal scrollbar.
- [ ] The mobile menu links and the project card buttons are visibly taller (44px).
- [ ] Back on desktop with a mouse, the header and project buttons are the same size as before. The footer icons are spaced a little wider, and Tab shows a lime ring on each one.
- [ ] Console is clean.

- [x] **Step 5: Commit**

```bash
git add components/ui/button.tsx components/layout/site-header.tsx components/layout/site-footer.tsx
git commit -m "feat(a11y): grow tap targets to 44px on touch screens"
```

---

### Task 18.4: Raise the smallest text sizes

**Files:**
- Modify: `components/sections/hero-status.tsx`, `components/sections/hero.tsx`, `components/layout/site-header.tsx`, `components/sections/project-card.tsx`, `components/sections/discipline-card.tsx`

- [x] **Step 1: Hero telemetry, motto, and the Ctrl K hint to 12px**

In `components/sections/hero-status.tsx`, replace:

```tsx
const TELEMETRY_TEXT = "font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-muted";
```

with:

```tsx
const TELEMETRY_TEXT = "font-mono text-xs uppercase tracking-[0.2em] text-muted";
```

In `components/sections/hero.tsx`, replace:

```tsx
            <p className="font-mono text-[0.625rem] uppercase tracking-[0.3em] text-muted">
```

with:

```tsx
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted">
```

In `components/layout/site-header.tsx`, at the end of the `<kbd>` element's `className`, replace:

```tsx
font-mono text-[0.625rem] tracking-normal sm:inline">
```

with:

```tsx
font-mono text-xs tracking-normal sm:inline">
```

- [x] **Step 2: Body copy to 16px**

In `components/sections/project-card.tsx`, replace:

```tsx
              <p className="max-w-2xl text-sm leading-relaxed text-muted">
```

with:

```tsx
              <p className="max-w-2xl text-base leading-relaxed text-muted">
```

In `components/sections/discipline-card.tsx`, replace:

```tsx
        <p className="max-w-sm text-sm leading-relaxed text-muted">
```

with:

```tsx
        <p className="max-w-sm text-base leading-relaxed text-muted">
```

- [x] **Step 3: Verify**

```bash
npx tsc --noEmit
npm run lint
npm run build
npm run start
```

- [ ] At 375px and 1440px, this prints `[]` in the console. Visible text no longer goes below 12px (the preloader and the decorative `aria-hidden` layers are excluded):

```js
[...document.querySelectorAll("main *, header *, footer *")].filter((el) => !el.closest("[aria-hidden]") && el.offsetParent && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && parseFloat(getComputedStyle(el).fontSize) < 12).map((el) => el.textContent.trim())
```

- [ ] The project descriptions and the Arnis card text are visibly larger and still sit comfortably inside their cards.
- [ ] Console is clean.

- [x] **Step 4: Commit**

```bash
git add components/sections/hero-status.tsx components/sections/hero.tsx components/layout/site-header.tsx components/sections/project-card.tsx components/sections/discipline-card.tsx
git commit -m "feat(a11y): raise label text to 12px and body copy to 16px"
```

---

### Task 18.5: Put the name in the hero heading and the watermark

**Files:**
- Modify: `components/sections/hero.tsx`, `data/site.ts`

The page's only `h1` was "Full Stack Developer", so search results and screen readers got the role but not the person. The watermark also repeated "DEVELOPER" right above the headline.

- [x] **Step 1: Wrap the name and the role in one `h1`**

In `components/sections/hero.tsx`, replace:

```tsx
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-muted">
              {siteConfig.name}
            </span>
            <h1 className="font-display text-5xl uppercase leading-[0.85] text-fg sm:text-6xl">
              Full Stack
              <span className="block text-accent">Developer</span>
            </h1>
```

with:

```tsx
            {/*
             * The name is part of the h1, so search engines and screen readers
             * get who before what. The visible layout is unchanged.
             */}
            <h1 className="flex flex-col items-center gap-3 lg:items-start">
              <span className="font-mono text-xs uppercase tracking-[0.3em] text-muted">
                {siteConfig.name}
                <span className="sr-only">, </span>
              </span>
              <span className="font-display text-5xl uppercase leading-[0.85] text-fg sm:text-6xl">
                Full Stack
                <span className="block text-accent">Developer</span>
              </span>
            </h1>
```

- [x] **Step 2: Make the watermark the surname**

In `data/site.ts`, replace:

```ts
  watermark: "DEVELOPER",
```

with:

```ts
  watermark: "GARAZA",
```

- [x] **Step 3: Verify**

```bash
npx tsc --noEmit
npm run lint
npm run build
npm run start
```

- [ ] At 1440px and 375px, the hero copy looks exactly as before: the small grey name, then "FULL STACK / DEVELOPER".
- [ ] In the console, `document.querySelector("h1").textContent` prints `John Paul R. Garaza, Full StackDeveloper`. The missing space comes from the line break and is fine for screen readers, which read the block as two lines.
- [ ] The outline watermark behind the portrait now reads GARAZA. "GA" and "ZA" show either side of the head, and moving the mouse over it reveals the lime fill.
- [ ] Console is clean.

- [x] **Step 4: Commit**

```bash
git add components/sections/hero.tsx data/site.ts
git commit -m "feat(hero): put the name in the h1 and the surname in the watermark"
```

---

### Task 18.6: Keep the face visible on touch screens

**Files:**
- Modify: `hooks/use-ink-trail.ts`, `components/sections/ink-reveal.tsx`, `components/sections/headgear-reveal.tsx`, `components/ui/preloader.tsx`

On phones, the `wander` mode kept a reveal drifting over the face, and `static` mode (touch plus reduced motion) pinned the headgear over it permanently. So phone visitors never saw the owner's face. This task replaces both modes with a single `touch` mode, in which nothing is revealed except a strike sweep. One sweep plays as the intro wipes away, so phone visitors still see the headgear once. The palette's **Strike** secret keeps working everywhere.

**Interfaces consumed / produced:** `RevealMode` becomes `"pointer" | "touch"`. `InkTrail` loses `setHome`, and the `InkHome` type is removed. `INK_POOL` becomes `MAX_DROPS`, because there is no `wander` head any more. `useInkMaskLayer` now returns nothing.

- [x] **Step 1: Replace the touch modes in `hooks/use-ink-trail.ts`**

Replace:

```ts
import { useInView, useReducedMotion } from "motion/react";
```

with:

```ts
import { useInView } from "motion/react";
```

Replace:

```ts
/**
 * - `pointer`: a mouse or trackpad drives the reveal. Ink appears only while
 *   the pointer moves.
 * - `wander`: touch screens; the reveal drifts over the face on its own.
 * - `static`: touch plus reduced motion; one fixed reveal, no animation.
 */
export type RevealMode = "pointer" | "wander" | "static";
```

with:

```ts
/**
 * - `pointer`: a mouse or trackpad drives the reveal. Ink appears only while
 *   the pointer moves.
 * - `touch`: touch screens. Nothing follows the finger, so the face stays
 *   visible; only a strike sweep (`INK_STRIKE_EVENT`) reveals anything.
 */
export type RevealMode = "pointer" | "touch";
```

Delete this block, together with the blank line after it:

```ts
/**
 * Where the reveal rests in `wander` mode, in viewport pixels, plus how far
 * it drifts from there (`span`, also in viewport pixels).
 */
export type InkHome = () => { x: number; y: number; span: number } | null;
```

In the `InkTrail` interface, delete these two lines:

```ts
  /** Sets (or clears, with `null`) the resting point used in `wander` mode. */
  setHome: (home: InkHome | null) => void;
```

Replace:

```ts
/** Most drops alive at once, not counting the `wander` head. */
export const MAX_DROPS = 36;

/** Shapes every masked layer must render: the drops plus the `wander` head. */
export const INK_POOL = MAX_DROPS + 1;
```

with:

```ts
/** Most drops alive at once. */
export const MAX_DROPS = 36;

/** Shapes every masked layer must render: one per drop. */
export const INK_POOL = MAX_DROPS;
```

Replace:

```ts
  const reduceMotion = useReducedMotion() ?? false;
  const finePointer = useMediaQuery("(pointer: fine)");
  const mode: RevealMode = finePointer ? "pointer" : reduceMotion ? "static" : "wander";

  const layersRef = useRef(new Set<InkLayer>());
  const homeRef = useRef<InkHome | null>(null);
```

with:

```ts
  const finePointer = useMediaQuery("(pointer: fine)");
  const mode: RevealMode = finePointer ? "pointer" : "touch";

  const layersRef = useRef(new Set<InkLayer>());
```

Replace:

```ts
    if (!container || !inView || mode === "static") return;
```

with:

```ts
    if (!container || !inView) return;
```

Replace:

```ts
    const head = { x: 0, y: 0, placed: false, strength: 0 };
```

with:

```ts
    const head = { x: 0, y: 0, placed: false };
```

Delete this line (the line above it, `let last = performance.now();`, stays):

```ts
    const start = last;
```

Replace the end of the pointer branch, including the whole `wander` branch:

```ts
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
```

with:

```ts
        } else {
          head.placed = false;
          lastDrop = null;
        }
      }
```

Delete these lines, together with the blank line after them:

```ts
      // Touch has no pointer to follow, so the drifting head stays visible.
      if (mode === "wander" && head.strength > 0.002) {
        points.push({ x: head.x, y: head.y, radius: radius * head.strength, angle: 0, stretch: 1 });
      }
```

In the `useMemo` at the end, delete:

```ts
      setHome: (home) => {
        homeRef.current = home;
      },
```

- [x] **Step 2: Simplify `useInkMaskLayer` in `components/sections/ink-reveal.tsx`**

Replace:

```tsx
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

with:

```tsx
/** Paints the shared trail into the `InkMask` inside `svgRef` every frame. */
export function useInkMaskLayer(svgRef: RefObject<SVGSVGElement | null>) {
  const trail = useInkReveal();

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    return trail.addLayer((points) => paintInkMask(svg, points));
  }, [svgRef, trail]);
}
```

- [x] **Step 3: Remove the face-pinning code from `components/sections/headgear-reveal.tsx`**

Replace:

```tsx
import { useEffect, useRef } from "react";

import {
  InkMask,
  paintInkMask,
  useInkMaskLayer,
  useSvgId,
} from "@/components/sections/ink-reveal";
```

with:

```tsx
import { useRef } from "react";

import { InkMask, useInkMaskLayer, useSvgId } from "@/components/sections/ink-reveal";
```

Delete this block, together with the blank line after it:

```tsx
/** Middle of the face: where the reveal rests on touch devices. */
const FACE = { x: 1029, y: 520 } as const;

/** Radius of the fixed reveal in `static` mode, in portrait pixels. */
const STATIC_RADIUS = 300;

/** How far the `wander` reveal drifts from the face, in portrait pixels. */
const WANDER_SPAN = 140;
```

Replace:

```tsx
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
      paintInkMask(svg, [
        { x: face.x, y: face.y, radius: STATIC_RADIUS * matrix.a, angle: 0, stretch: 1 },
      ]);
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
```

with:

```tsx
  useInkMaskLayer(svgRef);
```

- [x] **Step 4: Play one sweep on touch screens as the intro ends**

In `components/ui/preloader.tsx`, replace:

```tsx
} from "motion/react";

/**
 * Set on
```

with:

```tsx
} from "motion/react";

import { INK_STRIKE_EVENT } from "@/hooks/use-ink-trail";

/**
 * Set on
```

Then replace:

```tsx
  const handleExitComplete = () => {
    playedThisLoad = true;
    setExited(true);
  };
```

with:

```tsx
  const handleExitComplete = () => {
    playedThisLoad = true;
    setExited(true);
    // Touch screens have no cursor to drive the hero reveal, so play it once.
    if (!reduceMotion && !window.matchMedia("(pointer: fine)").matches) {
      window.dispatchEvent(new Event(INK_STRIKE_EVENT));
    }
  };
```

- [x] **Step 5: Verify**

```bash
grep -rnE "wander|static\"|setHome|InkHome|STATIC_RADIUS|WANDER_SPAN|\bFACE\b" components hooks
npx tsc --noEmit
npm run lint
npm run build
npm run start
```

Expected: the `grep` prints nothing, and the other commands pass.

- [ ] **Phone** (DevTools device toolbar, phone preset, reload): as the intro wipes away, one lime diagonal sweep crosses the hero and briefly shows the headgear. After that the face stays fully visible, with only the faint headgear outline. Nothing drifts over it.
- [ ] **Phone with reduced motion** (Rendering → prefers-reduced-motion: reduce, reload): no sweep, and the face is visible from the start.
- [ ] **Desktop with a mouse:** the cursor reveal behaves exactly as before, including the headgear over the face, and there is no sweep at the end of the intro. Ctrl+K → type `st` → **Strike** still sweeps the hero.
- [ ] Console is clean.

- [x] **Step 6: Commit**

```bash
git add hooks/use-ink-trail.ts components/sections/ink-reveal.tsx components/sections/headgear-reveal.tsx components/ui/preloader.tsx
git commit -m "feat(hero): keep the face visible on touch screens"
```

---

### Task 18.7: Make the preloader honest and skippable

**Files:**
- Modify: `components/ui/preloader.tsx`

`SYS.INIT // OK` and `LATENCY // 12MS` presented invented telemetry, and the 2.6 s intro could not be skipped. The status lines now show real facts, and any key, click, tap, or wheel turn jumps straight to the exit wipe. It still plays on every full load, as the owner chose in Phase 15.

- [x] **Step 1: Import the site config**

Replace:

```tsx
import { INK_STRIKE_EVENT } from "@/hooks/use-ink-trail";
```

with:

```tsx
import { siteConfig } from "@/data/site";
import { INK_STRIKE_EVENT } from "@/hooks/use-ink-trail";
```

- [x] **Step 2: Replace the status lines**

Replace:

```tsx
const STATUS_LINES = [
  { label: "GARAZA", value: "DEV PORTFOLIO", accent: false },
  { label: "SYS.INIT", value: "OK", accent: true },
  { label: "LATENCY", value: "12MS", accent: false },
] as const;
```

with:

```tsx
/** Telemetry-styled, but every line is true: nothing here pretends to be measured. */
const STATUS_LINES = [
  { label: "GARAZA", value: "DEV PORTFOLIO", accent: false },
  { label: "BASE", value: "PHILIPPINES", accent: false },
  {
    label: "STATUS",
    value: siteConfig.availability.label,
    accent: siteConfig.availability.isAvailable,
  },
] as const;
```

- [x] **Step 3: Skip on any input**

Replace:

```tsx
 * upward wipe that uncovers the hero. Plays on every full page load, including
 * reloads.
 */
```

with:

```tsx
 * upward wipe that uncovers the hero. Plays on every full page load, including
 * reloads. Any key, click, tap, or wheel turn skips straight to the wipe.
 */
```

Directly below the counter effect, which ends with:

```tsx
    return () => controls.stop();
  }, [visible, progress]);
```

add this effect (keep one blank line between them):

```tsx
  useEffect(() => {
    if (!visible) return;
    const skip = () => setCounted(true);
    const events = ["keydown", "pointerdown", "wheel"] as const;
    events.forEach((name) => window.addEventListener(name, skip, { passive: true }));
    return () => events.forEach((name) => window.removeEventListener(name, skip));
  }, [visible]);
```

- [x] **Step 4: Tell the visitor they can skip**

Replace:

```tsx
            {/* Neon leading edge, visible as the overlay wipes upward. */}
```

with:

```tsx
            <p
              aria-hidden
              className="animate-status-in absolute inset-x-0 bottom-10 text-center font-mono text-xs uppercase tracking-[0.3em] text-muted"
              style={{ animationDelay: "0.9s" }}
            >
              Tap or press any key to skip
            </p>

            {/* Neon leading edge, visible as the overlay wipes upward. */}
```

- [x] **Step 5: Verify**

```bash
npx tsc --noEmit
npm run lint
npm run build
npm run start
```

- [ ] Reload: the status lines read `GARAZA // DEV PORTFOLIO`, `BASE // PHILIPPINES`, and `STATUS // AVAILABLE FOR WORK` (lime). "TAP OR PRESS ANY KEY TO SKIP" fades in near the bottom.
- [ ] Reload and press any key at about 30%: the counter stops and the wipe starts at once. Repeat with a click, a mouse-wheel turn, and (phone preset) a tap. Each one skips.
- [ ] Reload and do nothing: the intro still runs its full 2.6 s.
- [ ] After a skip, scrolling works immediately and the page opens at the hero.
- [ ] Reduced motion: a key press skips to the fade-out.
- [ ] Console is clean.

- [x] **Step 6: Commit**

```bash
git add components/ui/preloader.tsx
git commit -m "feat(preloader): show real status lines and skip on any input"
```

---

### Task 18.8: Show both Arnis photos on touch screens

**Files:**
- Modify: `components/sections/discipline-card.tsx`

The action photo only appeared on hover or keyboard focus, so phone visitors never saw it. On touch screens (`pointer-coarse:`) the two photos now sit side by side. Tailwind's `hover` variant already applies only on devices that can hover, so the mouse cross-fade is unchanged.

- [x] **Step 1: Split the card on touch screens**

Replace:

```tsx
      <Image
        src={stance.src}
```

with:

```tsx
      {/* Touch screens have no hover, so there the two photos sit side by side. */}
      <Image
        src={stance.src}
```

At the end of the first `<Image>`'s `className`, replace:

```tsx
group-hover:opacity-0 group-focus-visible:opacity-0"
```

with:

```tsx
group-hover:opacity-0 group-focus-visible:opacity-0 pointer-coarse:w-1/2"
```

At the end of the second `<Image>`'s `className`, replace:

```tsx
group-hover:opacity-100 group-focus-visible:opacity-100"
```

with:

```tsx
group-hover:opacity-100 group-focus-visible:opacity-100 pointer-coarse:left-1/2 pointer-coarse:w-1/2 pointer-coarse:opacity-70"
```

- [x] **Step 2: Verify**

```bash
npx tsc --noEmit
npm run lint
npm run build
npm run start
```

- [ ] Phone preset: the Arnis card shows the stance photo on the left half and the action photo on the right half, both at the same brightness, with the text over the bottom of both.
- [ ] Desktop with a mouse: unchanged. The stance photo fills the card, and hovering cross-fades to the action photo.
- [ ] Console is clean.

- [x] **Step 3: Commit**

```bash
git add components/sections/discipline-card.tsx
git commit -m "feat(stack): show both Arnis photos on touch screens"
```

---

### Task 18.9: Deep-link each project, and use a plain list on phones

**Files:**
- Modify: `components/sections/projects-stack.tsx` (full replacement)
- Modify: `components/sections/project-card.tsx`

**Interfaces consumed / produced:** every project is reachable at `/#<slug>` (for example `/#ledger`), so a single project can be linked from a résumé or message.

Two findings shaped this task:

- **Deep links:** putting the `id` on the pinned card wrapper does not work. Browsers measure a pinned element where it is pinned, so `/#driftline` landed with FleetDesk covering Driftline. A zero-height marker placed before each card, in normal flow, lands correctly. This was tested for all three cards at 1366×768.
- **Phones:** at 375px wide with 16px descriptions, the first card is 686px tall. Pinned 112px from the top, it overflows a 667px phone screen, so its buttons would be hidden under the next card. Below `md` the cards become a plain list.

- [x] **Step 1: Replace `components/sections/projects-stack.tsx`**

```tsx
"use client";

import { Fragment, useRef } from "react";
import { useScroll } from "motion/react";

import { ProjectCard } from "@/components/sections/project-card";
import type { Project } from "@/types";

export function ProjectsStack({ projects }: { projects: Project[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  // "start start" → the container top hits the viewport top (progress 0).
  // "end end"     → the container bottom hits the viewport bottom (progress 1).
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  return (
    <div ref={containerRef} className="relative">
      {projects.map((project, index) => (
        <Fragment key={project.id}>
          {/*
           * Deep-link target for `/#<slug>`. The pinned card can't be the
           * target: browsers measure a pinned element where it is pinned, so
           * the link would land on a later card. This marker stays where the
           * card's slot begins. On the stack, the negative margin cancels the
           * header offset so the card lands pinned on top.
           */}
          <span id={project.slug} className="block md:-scroll-mt-24" />
          <ProjectCard
            project={project}
            index={index}
            total={projects.length}
            progress={scrollYProgress}
          />
        </Fragment>
      ))}
    </div>
  );
}
```

- [x] **Step 2: Pin the cards from `md` up only**

In `components/sections/project-card.tsx`, replace:

```tsx
import { Button } from "@/components/ui/button";
import { usePointerTilt } from "@/hooks/use-pointer-tilt";
```

with:

```tsx
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";
import { usePointerTilt } from "@/hooks/use-pointer-tilt";
```

Replace:

```tsx
  const reduceMotion = useReducedMotion() ?? false;

  // Each card shrinks
```

with:

```tsx
  const reduceMotion = useReducedMotion() ?? false;
  // Below md the cards are a plain list: a pinned card taller than a short
  // phone screen would hide its own buttons under the next card.
  const stacked = useMediaQuery("(min-width: 768px)");

  // Each card shrinks
```

Replace:

```tsx
    <div className="sticky top-0 flex h-screen items-start justify-center px-6 pt-28">
```

with:

```tsx
    <div className="flex items-start justify-center px-6 pt-8 md:sticky md:top-0 md:h-screen md:pt-28">
```

Replace:

```tsx
          scale: reduceMotion ? 1 : scale,
          top: `${index * 1.5}rem`,
```

with:

```tsx
          scale: reduceMotion || !stacked ? 1 : scale,
          top: stacked ? `${index * 1.5}rem` : 0,
```

- [x] **Step 3: Verify**

```bash
npx tsc --noEmit
npm run lint
npm run build
npm run start
```

- [ ] At 1366×768 and 1440px, the stack pins, scales, and offsets exactly as before.
- [ ] At 1366×768, open `/#driftline` in a new tab and wait for the intro. Driftline is the top card of the stack, fully visible below the header, and FleetDesk is not covering it. Repeat for `/#ledger` and `/#fleetdesk`.
- [ ] While on the page, change the address to `/#ledger` and press Enter: the page jumps to Ledger the same way.
- [ ] At 375×667 (DevTools responsive mode): the three cards scroll by as a normal list, 32px apart, with no pinning and no shrinking. Every card's buttons can be tapped. `/#fleetdesk` lands with FleetDesk's top just below the header.
- [ ] Console is clean.

- [x] **Step 4: Commit**

```bash
git add components/sections/projects-stack.tsx components/sections/project-card.tsx
git commit -m "feat(projects): deep-link each project and list them plainly on phones"
```

---

### Task 18.10: Balance the stack grid

**Files:**
- Modify: `components/sections/bento-grid.tsx`, `components/sections/tech-stack-card.tsx`

From `lg` up, the Frontend card spanned three columns but held only four tags, so most of it was empty. The four skill cards now form an even 2×2 grid beside the Arnis photo. Each card keeps its label at the top and its tags at the bottom, which matches the photo card's bottom-aligned text.

- [x] **Step 1: Use a four-column grid**

In `components/sections/bento-grid.tsx`, replace:

```tsx
        <div className="grid auto-rows-[minmax(11rem,auto)] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <DisciplineCard className="aspect-4/5 sm:col-span-2 sm:aspect-4/3 lg:col-span-3 lg:row-span-2 lg:aspect-auto lg:min-h-[36rem]" />

          {categories.map((category, index) => (
            <TechStackCard
              key={category.id}
              category={category}
              className={index === 0 ? "lg:col-span-3" : "lg:col-span-1"}
            />
          ))}
```

with:

```tsx
        {/* From lg up: the discipline photo on the left half, the stack cards in a 2×2 grid on the right. */}
        <div className="grid auto-rows-[minmax(11rem,auto)] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DisciplineCard className="aspect-4/5 sm:col-span-2 sm:aspect-4/3 lg:row-span-2 lg:aspect-auto lg:min-h-[36rem]" />

          {categories.map((category) => (
            <TechStackCard key={category.id} category={category} />
          ))}
```

- [x] **Step 2: Push the tags to the bottom of each card**

In `components/sections/tech-stack-card.tsx`, replace:

```tsx
        "group flex flex-col gap-4 rounded-card
```

with:

```tsx
        "group flex flex-col justify-between gap-4 rounded-card
```

(The rest of that class string stays as it is.)

- [x] **Step 3: Verify**

```bash
npx tsc --noEmit
npm run lint
npm run build
npm run start
```

- [ ] 1440px: the Arnis photo fills the left half. On the right, Frontend and Backend form the top row and Databases and DevOps & Tools the bottom row, all four the same size. Each has its label at the top and its tags at the bottom.
- [ ] 768px: the Arnis card spans the full width, with the four skill cards below it in two rows of two.
- [ ] 375px: everything is one column, and each skill card shows its label at the top and its tags at the bottom.
- [ ] Console is clean.

- [x] **Step 4: Commit**

```bash
git add components/sections/bento-grid.tsx components/sections/tech-stack-card.tsx
git commit -m "feat(stack): balance the skill cards into a 2x2 grid"
```

---

### Task 18.11: Generate the link preview image

**Files:**
- Create: `app/opengraph-image.tsx`
- Modify: `app/layout.tsx`

Shared links had no preview image. This adds a 1200×630 card generated at build time from `siteConfig`: the availability label, the name, and the role in lime, with a lime bar along the bottom.

`metadataBase` is deliberately not set. On a Vercel production deployment, Next.js resolves the image URL from `VERCEL_PROJECT_PRODUCTION_URL`, and on preview deployments from the preview URL. Local builds print a `metadataBase property ... using "http://localhost:3000"` warning, and that warning is expected.

- [x] **Step 1: Create `app/opengraph-image.tsx`**

```tsx
import { ImageResponse } from "next/og";

import { siteConfig } from "@/data/site";

export const alt = `${siteConfig.name}, ${siteConfig.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/*
 * The image is rendered outside the page, where the CSS tokens do not exist,
 * so the colours are copied from app/globals.css: bg, fg, muted, and accent.
 */
const BG = "#09090b";
const FG = "#fafafa";
const MUTED = "#a1a1aa";
const ACCENT = "#ccff00";

/** Link preview card for chats and social posts, generated at build time. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: 80,
          background: BG,
          color: FG,
        }}
      >
        <div style={{ fontSize: 26, letterSpacing: 8, color: MUTED, textTransform: "uppercase" }}>
          {siteConfig.availability.label}
        </div>
        <div style={{ marginTop: 20, fontSize: 84, lineHeight: 1.05 }}>{siteConfig.name}</div>
        <div style={{ marginTop: 12, fontSize: 56, color: ACCENT }}>{siteConfig.role}</div>
        <div
          style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 10, background: ACCENT }}
        />
      </div>
    ),
    size,
  );
}
```

- [x] **Step 2: Ask for the large preview card**

In `app/layout.tsx`, replace:

```tsx
    description: siteConfig.description,
    type: "website",
  },
};
```

with:

```tsx
    description: siteConfig.description,
    type: "website",
  },
  // The preview image itself comes from `app/opengraph-image.tsx`.
  twitter: {
    card: "summary_large_image",
  },
};
```

- [x] **Step 3: Verify**

```bash
npx tsc --noEmit
npm run lint
npm run build
npm run start
```

Expected: everything passes. The build lists `○ /opengraph-image` as a static route and prints the expected `metadataBase` warning.

- [ ] Open `http://localhost:3000/opengraph-image`. A 1200×630 PNG shows "AVAILABLE FOR WORK" in spaced grey capitals, "John Paul R. Garaza" in large white type on one line, and "Full Stack Developer" in lime, all bottom-left on near-black, with a lime bar along the bottom edge.
- [ ] View the home page source. It contains `<meta property="og:image"` with a `/opengraph-image` URL, `<meta property="og:image:alt" content="John Paul R. Garaza, Full Stack Developer"`, and `<meta name="twitter:card" content="summary_large_image"`.
- [ ] Console is clean.

- [x] **Step 4: Commit**

```bash
git add app/opengraph-image.tsx app/layout.tsx
git commit -m "feat(seo): generate the link preview image"
```

---

### Task 18.12: Write the README

**Files:**
- Modify: `README.md` (full replacement; it is currently empty)

- [x] **Step 1: Replace `README.md`**

````markdown
# John Paul R. Garaza — Developer Portfolio

A single-page developer portfolio: dark, neon-lime, and telemetry-styled, with a
cursor-driven ink reveal in the hero, a scroll-pinned project stack, and a
Ctrl+K / ⌘K command palette.

## Stack

- Next.js 16 (App Router, Turbopack) and React 19
- TypeScript (strict)
- Tailwind CSS v4, following shadcn/ui conventions
- Motion for animation and Lenis for smooth scrolling
- cmdk for the command palette

## Run it

```bash
npm ci
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint
```

## Where things live

| Path | What it holds |
| --- | --- |
| `app/` | Root layout, home page, 404 page, design tokens (`globals.css`), link preview image |
| `components/sections/` | One component per home page section |
| `components/ui/` | Buttons, badges, section headings, the preloader |
| `data/` | All site content: identity and links (`site.ts`), projects, skills, navigation |
| `lib/queries.ts` | Async data access; components read data only through this file |
| `types/index.ts` | Shared types for the data files |

## Editing content

Everything a visitor reads comes from `data/`. Projects are in
`data/projects.ts`; skills and the discipline photos are in `data/skills.ts`;
name, email, links, and availability are in `data/site.ts`. Components never
import those arrays directly. They go through `lib/queries.ts`, so moving the
data to a database later only changes that one file.

## Accessibility

Every animation respects `prefers-reduced-motion`, decorative layers are
hidden from screen readers, and the whole page works from the keyboard: skip
link, visible focus rings, and the command palette.
````

- [x] **Step 2: Verify**

Open `README.md` in a Markdown preview (or on GitHub after pushing). The headings, the bash block, and the table render correctly, and every path it names exists.

- [x] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: write the README"
```

---

### Task 18.13: Phase 18 verification pass

**Files:** none created; fix whatever this task surfaces.

- [x] **Step 1: Clean production build**

```bash
npm audit
npx tsc --noEmit
npm run lint
npm run build
npm run start
```

Expected: 0 vulnerabilities, and everything else passes (the `metadataBase` warning is expected).

- [x] **Step 2: Walk the production build**

- [ ] **Widths** 375px, 768px, 1366×768, and 1440px: no horizontal scrollbar. The project stack pins only from 768px up, and every project card's buttons can be reached at every width.
- [ ] **Phone preset (touch):** every tap target is at least 44px, the face is visible after the single intro sweep, and both Arnis photos show.
- [ ] **Keyboard only:** the skip link is the first stop. Every stop shows the accent focus ring and is never hidden behind the header. The command palette opens with Ctrl+K.
- [ ] **Reduced motion:** the page is static and readable, the preloader fades and can be skipped, and on touch there is no sweep.
- [ ] **Deep links:** `/#ledger`, `/#driftline`, `/#fleetdesk`, `/#stack`, and `/#contact` each land on their target, also on a fresh load with the intro.
- [ ] **Console:** clean.

- [x] **Step 3: Commit any fixes**

```bash
git add -A -- app components data hooks lib types
git commit -m "fix: address phase 18 verification findings"
```

If nothing needed fixing, skip the commit.

---

# Phase 19 — Projects as a standings list

**Goal:** replace the pinned card stack in `#projects` with a standings list. There is one row per project, all six fit on about one screen, and a row opens in place.

**Architecture:** `projects-showcase.tsx` (server) still awaits `getProjects()` and now renders `<ProjectsStandings>` (client). That component owns which row is open and the `/#<slug>` deep links. Each row is a `<ProjectRow>` (client): a header button plus details that animate open. The pinned stack, the card, and the tilt hook are deleted.

**Spec:** `docs/superpowers/specs/2026-10-24-projects-standings-design.md`. Read it before Task 19.1; the plan argues from it.

**Rules for this phase** (on top of Global Constraints):

- One row is open at a time. P1 is open on load unless the URL hash names another project. Clicking the open row closes it, so having no row open is allowed.
- Hover is only a highlight. Every action works by click, tap, Enter, and Space.
- No pinning, no scroll-linked motion. The only animation is the details opening and closing, and it is instant under reduced motion.
- `data/projects.ts`, the `Project` type, and `lib/queries.ts` do not change.

**Review Focus.** These are the cases most likely to break, and Task 19.1's Verify block checks each one:

1. **Deep link on a fresh load** (`/#kaalerto`, during the intro): the row must end up open and fully below the header. The risk is that P1 collapsing above it shifts it up out of place.
2. **A hash that is not a project** (`/#stack`, `/#contact`, `/#nope`): the rows do not change, and P1 stays open.
3. **A project with no links** (Intern Docs): its details have no empty button row or stray gap.
4. **Keyboard:** Tab reaches every row header, Enter and Space toggle it, and focus stays on the header.
5. **375px:** long titles and the tag lists wrap, with no horizontal scrollbar.

### Task 19.1: Build the standings list and remove the stack

**Files:**
- Create: `components/sections/project-row.tsx`
- Create: `components/sections/projects-standings.tsx`
- Modify: `components/sections/projects-showcase.tsx`
- Delete: `components/sections/projects-stack.tsx`, `components/sections/project-card.tsx`, `hooks/use-pointer-tilt.ts`

**Interfaces:**
- Consumes: `Project` and `PROJECT_CATEGORY_LABELS` from `@/types`; `Badge` and `Button` from `components/ui`; `ArrowUpRight`, `ChevronDown`, `CodeXml` from `lucide-react`; `AnimatePresence`, `motion`, `useReducedMotion` from `motion/react`.
- Produces:
  - `ProjectRow({ project, position, open, animate, onToggle }: { project: Project; position: number; open: boolean; animate: boolean; onToggle: () => void })`.
  - `ProjectsStandings({ projects }: { projects: Project[] })`.
  - DOM ids: row `<li id={slug}>`, header button `id="{slug}-header"`, details `id="{slug}-details"`.

- [x] **Step 1: Create `components/sections/project-row.tsx`** (`"use client"`)

  - **Markup:** `<li id={project.slug} className="border-t border-line">` › `<h3>` › a `<button type="button">` with `id`, `aria-expanded={open}`, `aria-controls="{slug}-details"`, `onClick={onToggle}`, and `group` on the button.
  - **Header grid:** below `md`, three columns: position `3rem`, title `minmax(0,1fr)`, chevron `auto`. Category and year sit under the title as one mono line. From `md`: position `3rem`, title `minmax(0,1fr)`, category `10rem`, year `4rem`, chevron `1.5rem`. Minimum height 44px, `py-5`, `px-2`, `text-left`, and the accent focus ring (`focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`).
  - **Header text:** position `P{position}` in `font-mono text-sm`, `text-muted`, turning `text-accent` when open or hovered (`group-hover:`). Title in `font-display text-2xl uppercase tracking-wide text-fg sm:text-3xl`. Category (`PROJECT_CATEGORY_LABELS`) and year in `font-mono text-xs uppercase tracking-[0.2em] text-muted`. `ChevronDown` is `aria-hidden` and rotates 180° when open.
  - **Tint:** open rows get `bg-surface`; hovered rows get `hover:bg-surface/60`.
  - **Details:** wrap in `<AnimatePresence initial={false}>`. When `open`, render `<motion.div id="{slug}-details" role="region" aria-labelledby="{slug}-header" className="overflow-hidden">` animating `height` 0 → `"auto"` and `opacity` 0 → 1. Use `duration: 0.35` with ease `[0.16, 1, 0.3, 1]`, or `duration: 0` under reduced motion. When `animate` is false (a deep-link open), render the details instead as a plain `<div>` with the same `id`, `role`, and `aria-labelledby`, outside `AnimatePresence`. That way every row reaches its final height in a single render: a `duration: 0` motion animation still waits a frame, which let the deep-link scroll land before the row above finished closing.
  - **Details content:** pad to line up with the title column at every width (`pr-2 pb-8 pl-[4.5rem]`, which is the 3rem position column, the 1rem gap, and the 0.5rem padding). Show the summary (`text-lg text-fg/80`), the description (`max-w-2xl text-base leading-relaxed text-muted`), and the tech `<ul>` of `<Badge>`s. Show the links row only when `liveUrl || repoUrl`. Its buttons are exactly the old card's: `Button size="sm"` with "Live Demo" and `ArrowUpRight`, and `variant="outline"` with `CodeXml` and "Repository". Both open in a new tab with `rel="noopener noreferrer"`.

- [x] **Step 2: Create `components/sections/projects-standings.tsx`** (`"use client"`)

  It renders `<ol className="border-b border-line">` (the showcase's container already limits the width) with one `ProjectRow` per project, `position={index + 1}`. The state is `{ slug: string | null; animate: boolean }`, starting as `{ slug: projects[0]?.slug ?? null, animate: true }`. Toggling a row sets `{ slug: open ? null : project.slug, animate: true }`.

  The hash logic is the part the signatures don't determine:

```tsx
  // Row to scroll to once a deep-link open has rendered.
  const scrollTarget = useRef<string | null>(null);

  // Opens the row named by the URL hash, without animation. The browser has
  // already jumped to the hash, but the row closing above the target shifts
  // it, so the effect below scrolls again once the new layout is in place.
  useEffect(() => {
    function openFromHash() {
      const slug = decodeURIComponent(window.location.hash.slice(1));
      if (!projects.some((project) => project.slug === slug)) return;
      scrollTarget.current = slug;
      setOpen({ slug, animate: false });
    }
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, [projects]);

  useEffect(() => {
    const slug = scrollTarget.current;
    if (!slug) return;
    scrollTarget.current = null;
    document.getElementById(slug)?.scrollIntoView();
  }, [open]);
```

  (A first version scrolled from `requestAnimationFrame` right after `setOpen`. On a fresh load of `/#kaalerto` it left the row 450px above the screen, because the rows were still animating.)

- [x] **Step 3: Swap it in, and delete the stack**

  In `projects-showcase.tsx`, replace the `ProjectsStack` import and element with `ProjectsStandings`. Wrap the heading and the list in the existing `mx-auto max-w-4xl` container, with `gap-10` between them. Then:

```bash
git rm components/sections/projects-stack.tsx components/sections/project-card.tsx hooks/use-pointer-tilt.ts
```

- [x] **Step 4: Verify**

```bash
grep -rnE "ProjectsStack|ProjectCard|usePointerTilt|projects-stack|project-card|use-pointer-tilt" app components hooks lib
npx tsc --noEmit
npm run lint
npm run build
npm run start
```

  Expected: the `grep` prints nothing, and the other commands pass. After the intro:

- [ ] 1440px: six rows, P1–P6, fit within about one screen below the "Projects" heading, with BridgeIt (P1) open. Clicking KaAlerto opens it and closes BridgeIt; clicking KaAlerto again closes it, leaving all rows closed.
- [ ] Hovering a closed row tints it and turns its position number lime. Nothing else changes on hover.
- [ ] Intern Docs' details end after its tags, with no empty space where buttons would be. WasThere shows both Live Demo and Repository.
- [ ] A fresh load of `/#kaalerto` (new tab, wait for the intro) shows KaAlerto open and fully below the header, with BridgeIt closed. Changing the address to `/#labanan` opens LABANAN the same way.
- [ ] `/#stack` and `/#nope` leave BridgeIt open and change no rows.
- [ ] Keyboard: Tab reaches each row header, with a lime focus ring. Enter and Space toggle the row, and focus stays on the header.
- [ ] 375px with the phone preset: category and year sit under each title, there is no horizontal scrollbar, and every row header is at least 44px tall.
- [ ] Reduced motion: rows open and close instantly.
- [ ] Console is clean.

- [x] **Step 5: Commit**

```bash
git add components/sections/project-row.tsx components/sections/projects-standings.tsx components/sections/projects-showcase.tsx
git commit -m "feat(projects): replace the pinned card stack with a standings list"
```

---

### Task 19.2: Phase 19 verification pass

**Files:** none created; fix whatever this task surfaces.

- [x] **Step 1: Clean production build**

```bash
npx tsc --noEmit
npm run lint
npm run build
npm run start
```

- [x] **Step 2: Walk the production build**

- [ ] Widths 375px, 768px, 1366×768, and 1440px: no horizontal scrollbar. The page from the hero to the Stack section is about six screens shorter than with the stack.
- [ ] The header's "Projects" link scrolls to the section heading, which sits fully below the header.
- [ ] The command palette, the hero reveal, and the Stack section behave as before.
- [ ] Console is clean.

- [x] **Step 3: Commit any fixes**

```bash
git add -A -- app components data hooks lib types
git commit -m "fix: address phase 19 verification findings"
```

If nothing needed fixing, skip the commit.

---

### Task 19.3: Group the standings and start closed

The owner's revision of 2026-10-24 (the design doc's "Revision" section): every row starts closed; the projects split into a **Work** group and an **Academic** group, each numbered from P1; and the label column shows where a project came from instead of its type.

**Files:**
- Modify: `types/index.ts`, `data/projects.ts`, `components/sections/projects-standings.tsx`, `components/sections/project-row.tsx`

**Interfaces:**
- Produces: `ProjectCategory = "client" | "internship" | "personal" | "academic"`, labelled `Client`, `Internship`, `Personal`, and `Academic` in `PROJECT_CATEGORY_LABELS`. `PROJECT_GROUPS: readonly ProjectGroup[]`, where `interface ProjectGroup { id: string; label: string; categories: readonly ProjectCategory[] }`, in display order: Work holds `client`, `internship`, and `personal`; Academic holds `academic`.

- [x] **Step 1: Retype the categories and recategorise the data**

  In `data/projects.ts`: BridgeIt `client`, KaAlerto `internship`, WasThere `personal`, Intern Docs `internship`, Tatak Norte `academic`, LABANAN `academic`. Append to KaAlerto's description: "Built with my internship team as one of our monthly builds."

- [x] **Step 2: Render one standings list per group**

  - In `ProjectsStandings`, the initial state becomes `{ slug: null, animate: true }`.
  - For each entry in `PROJECT_GROUPS` that has projects, render a group heading `<h3>` (mono, uppercase, wide tracking, muted, with the project count beside it), then that group's `<ol>`. Positions restart at P1 in each group.
  - One row is still open at a time across both groups, and the deep-link logic is unchanged.
  - In `ProjectRow`, the row's heading becomes an `<h4>`, so the outline reads section `h2` › group `h3` › project `h4`.

- [x] **Step 3: Verify**

```bash
npx tsc --noEmit
npm run lint
npm run build
npm run start
```

- [ ] After the intro, every row is closed. The headings read "Work" over BridgeIt, KaAlerto, WasThere, and Intern Docs as P1–P4, then "Academic" over Tatak Norte and LABANAN as P1–P2.
- [ ] The labels read Client, Internship, Personal, Internship, Academic, Academic, and KaAlerto's details end with the monthly-build sentence.
- [ ] Opening a row in one group closes an open row in the other.
- [ ] `/#labanan` on a fresh load opens LABANAN below the header.
- [ ] At 375px there is no horizontal scrollbar. Console is clean.

- [x] **Step 4: Commit**

```bash
git add types/index.ts data/projects.ts components/sections/projects-standings.tsx components/sections/project-row.tsx
git commit -m "feat(projects): group the standings into work and academic, closed by default"
```

---

## Handoff checklist (owner-supplied content)

Only the repository owner can resolve these. Do not invent values.

1. `data/site.ts` — name, initials, wordmark, and GitHub URL are set; email and site URL are still placeholders (the palette's **Copy email** copies whatever is there). Also confirm `availability.isAvailable`, `timeZone` / `timeZoneLabel` (`Asia/Manila` / `GMT+8`), and the `watermark` word (`GARAZA` from Task 18.5; sized for up to ~9 characters).
2. `data/projects.ts` — holds the owner's six real projects (2026-10-24): BridgeIt, KaAlerto, WasThere, Intern Docs, Tatak Norte, and LABANAN, newest first. Each still needs a screenshot. The cards do not display `imageUrl` yet. That was deferred from Phase 18 because the layout depends on the real screenshots and must still fit the pinned stack on a 1366×768 screen, so it gets its own task once the screenshots exist.
3. `public/resume.pdf` — minimal placeholder; replace with the real résumé.
4. `public/images/hero/headgear.webp` and `headgear-ghost.webp` — cut out from STIX's product photo as sold by Eljan Sports, with the logo painted over. The photo still belongs to STIX/the retailer. Replacing it with a photo of a borrowed headgear (front view, plain background, even light) removes the risk; re-tune `HEADGEAR` in `components/sections/headgear-reveal.tsx` afterwards.
5. `components/ui/preloader.tsx` — from Task 18.7, `STATUS_LINES` read `GARAZA // DEV PORTFOLIO`, `BASE // PHILIPPINES`, and the availability label from `data/site.ts`. Confirm that `PHILIPPINES` is how the owner wants their base shown.

**Next phases (planned in the spec, not yet written as tasks):** Phase 20, new home sections (About, Experience, Arnis, Now — the owner picks which); Phase 21, polish and reach (tech marquee, heading reveals, sitemap, robots, JSON-LD, Vercel Web Analytics, Lighthouse ≥ 90). The home page's Open Graph image is already done in Task 18.11.
