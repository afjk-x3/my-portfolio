# Portfolio Implementation Plan

> **For the builder (OpenCode):** Execute tasks strictly in order. Each task is
> self-contained — read only that task, do exactly what it says, run its
> **Verify** block, then commit. Do not skip ahead, do not batch phases, and do
> not "improve" adjacent files that the task does not list.

> **Status:** Phases 1–13 are complete and committed. **Start at Phase 14**
> (remove case studies, slash-cut strike lines), then **Phase 15** (targeted
> fixes: intro on every load, hero on reload, projects gap, discipline card).
> The design is in `docs/superpowers/specs/2026-09-16-portfolio-v2-design.md`
> (§4c and §4d); read it only if a task does not answer a question. Step-by-step
> history of earlier phases was removed from this file; read Phases 1–10 with
> `git show 633c7fb:tasks.md`, Phases 11–12 with `git show f9256c3:tasks.md`, and
> Phase 13 with `git show 76da151:tasks.md` only if a task explicitly tells you to.

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

Until Task 15.1 lands, the preloader plays once per tab session: replay it with `sessionStorage.removeItem("portfolio_preloaded")` and a reload, skip it with `sessionStorage.setItem("portfolio_preloaded", "1")` and a reload. From Task 15.1 on, it plays on every full page load (about 2.6 s); wait for the wipe before testing.

---

## Current file structure

Files marked **[14]** or **[15]** are changed by that phase; Task 14.1 also deletes `app/projects/` and `components/case-study/`.

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
    discipline-card.tsx      # Arnis photo card, hover/focus cross-fade, full-stance crop [15] (client, id="discipline")
    contact.tsx              # contact CTA (server, id="contact")
  providers/
    smooth-scroll-provider.tsx  # Lenis root (client)
  ui/
    button.tsx               # cva + Radix Slot, neon variants, strike wipe on hover
    badge.tsx                # tech-stack pill
    section-heading.tsx      # eyebrow + optional baybayin script + title
    strike-line.tsx          # divider slashed by an Arnis strike: blade, impact, scar [14] (client)
    preloader.tsx            # intro on every full load: monogram + baybayin name + counter, opens at top [15] (client)
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

---

# Phase 14 — Remove case studies, then slash-cut strike lines

Two independent changes, in this order: Task 14.1 removes the case study pages and every link to them; Task 14.2 turns the strike line dividers into a literal slash cut. (The discipline card framing moved to Task 15.3.) Task 14.1 was type-checked, linted, and built with Turbopack in a scratch copy at commit `76da151`, then checked in a production build: the cards show only Live Demo / Repository, the palette shows only Navigate and Actions, and `/projects/ledger` returns 404.


**Task 14.2 background.** The Phase 11 dividers read as plain separators: a 40px slash in a hairline, and angle 03 was horizontal, so it looked like a dash. This phase turns every divider into a literal strike. The first time a divider scrolls into view:

1. **Cut (0.22 s):** a tapered neon blade — thick where the stick enters, sharp where it exits — slices across a 128px band (96px on phones) at the strike's real angle, running off the top and bottom of the band. A blurred streak flares behind it.
2. **Impact:** a flash where the blade crosses the hairline, and a brightness pulse runs outward along the line in both directions.
3. **Scar:** the blade cools to 25% opacity and stays; the `ANGLE 01 // 135°` label fades in beside the cut.

With reduced motion, the scar and label render immediately. Horizontal strikes (3, 4) are no longer allowed as dividers, and each divider cuts the line at a different point.

This block was type-checked, linted, and built with Turbopack in a scratch copy of this repository at commit `76da151`, then checked in a production build at 1919×955: before scrolling into view the divider shows only the hairline; after it plays, the blade is at opacity 0.25 with its mask fully drawn and the label visible; the home page dividers read `ANGLE 01 // 135°`, `ANGLE 02 // 45°`, `ANGLE 09 // 45°`; the case study dividers of that commit also rendered correctly (they are removed by Task 14.1). The in-between frames of the cut (streak, flash, pulse) could not be captured there and are covered by the Verify block. Copy the blocks exactly.

### Task 14.1: Remove case studies

**Files:**
- Delete: `app/projects/` (the whole folder)
- Delete: `components/case-study/` (the whole folder)
- Modify: `components/sections/project-card.tsx` (full replacement)
- Modify: `components/command-palette/command-palette.tsx` (full replacement)
- Modify: `app/layout.tsx` (full replacement)
- Modify: `lib/queries.ts` (full replacement)
- Modify: `data/projects.ts` (full replacement)
- Modify: `types/index.ts` (one removal)
- Modify: `app/globals.css` (one removal)

**Interfaces produced:**
- `Project` no longer has `caseStudy`; `CaseStudy`, `CaseStudyStep`, `CaseStudyResult`, `CaseStudyImage` no longer exist.
- `getProjectBySlug`, `getCaseStudyProjects`, `getNextCaseStudy` no longer exist. `lib/queries.ts` exports only `getProjects` and `getSkillCategories`.
- `CommandPalette` takes no props; `PaletteProject` no longer exists.
- The `animate-strike-wipe` class no longer exists.

**Kept on purpose:** `app/not-found.tsx` (the DNF 404 page, used by every unknown URL), `Project.slug`, and the route-aware `NavButton` in `site-header.tsx`.

The owner decided the portfolio should not have case study pages. Project cards go back to their pre-Phase-12 form: plain title, Live Demo (primary) and Repository (outline) buttons.

- [ ] **Step 1: Delete the case study route and components**

```bash
git rm -r app/projects components/case-study
```

- [ ] **Step 2: Replace `components/sections/project-card.tsx`**

```tsx
"use client";

import { ArrowUpRight, CodeXml } from "lucide-react";
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
                {project.title}
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
              {project.liveUrl ? (
                <Button asChild size="sm">
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

- [ ] **Step 3: Replace `components/command-palette/command-palette.tsx`**

The **Case studies** group, the `projects` prop, and the `FileText` icon are removed; everything else is unchanged.

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
 * `setCommandPaletteOpen(true)`. Jumps to sections, runs quick actions, and
 * hides two easter eggs that only match once something is typed.
 */
export function CommandPalette() {
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
                placeholder="Jump to a section or run a command…"
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

- [ ] **Step 4: Replace `app/layout.tsx`**

The layout no longer loads case studies for the palette, so it is no longer `async`.

```tsx
import type { Metadata } from "next";
import { Anton, Geist, Geist_Mono, Noto_Sans_Tagalog, UnifrakturCook } from "next/font/google";

import { Backdrop } from "@/components/layout/backdrop";
import { CommandPalette } from "@/components/command-palette/command-palette";
import { SmoothScrollProvider } from "@/components/providers/smooth-scroll-provider";
import { siteConfig } from "@/data/site";
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

export default function RootLayout({ children }: LayoutProps<"/">) {
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
          <CommandPalette />
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 5: Replace `lib/queries.ts`**

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
```

- [ ] **Step 6: Replace `data/projects.ts`**

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
  },
];
```

- [ ] **Step 7: Remove the case study types from `types/index.ts`**

Delete everything from the `caseStudy` field's doc comment (the line starting `  /**` directly above `   * Long-form write-up rendered at`) down to and including the closing `}` of `export interface CaseStudy { ... }`, then close the `Project` interface. The result around that spot must read exactly:

```ts
  /** Ascending sort key for the scroll stack. Lower renders first. */
  order: number;
}

/** Groups the bento tech-stack cards. */
```

- [ ] **Step 8: Remove the arrival wipe animation from `app/globals.css`**

In the `@theme` block, delete this whole block (it sits directly above `  @keyframes status-in {`):

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

- [ ] **Step 9: Verify**

`.next/types` still describes the deleted route, so regenerate it before type checking:

```bash
npx next typegen
npx tsc --noEmit
npm run lint
npm run build
```

Expected: the build's route list shows only `○ /` and `○ /_not-found`.

```bash
grep -rn "caseStudy\|CaseStudy\|case-study\|getProjectBySlug\|strike-wipe" app components lib types data hooks
```

Expected: no output.

```bash
npm run start
```

- [ ] Project cards: Ledger shows **Live Demo** (lime) and **Repository**; Driftline shows **Repository**; FleetDesk shows no buttons. No title is a link, and there is no "Read case study" button.
- [ ] Ctrl+K: the palette shows only **Navigate** and **Actions**; typing `unity` shows no project.
- [ ] http://localhost:3000/projects/ledger shows the DNF 404 page with status 404.
- [ ] Header, hero reveal, and palette actions still work; console is clean.

- [ ] **Step 10: Commit**

```bash
git add -A -- app components lib data types
git commit -m "refactor(projects): remove case study pages and links"
```

`data/skills.ts` may contain the owner's uncommitted edits; including them in this commit is fine.

---

### Task 14.2: Replace the strike line dividers with a slash cut

**Files:**
- Modify: `components/ui/strike-line.tsx` (full replacement)
- Modify: `app/page.tsx`
- Modify: `components/layout/site-footer.tsx`

**Interfaces consumed:** `getStrike` from `@/data/strike-angles`; `cn`; `motion`, `useReducedMotion`, `Variants` from `motion/react`.
**Interfaces produced:** `StrikeLine` props become `{ angle: number; at?: number; className?: string }`. `at` (default `0.5`) is where the blade crosses the line, from 0 (left) to 1 (right); keep it within 0.15–0.85. `angle` must be 1, 2, 8, 9, or 12: thrusts **and horizontal strikes** now throw during render.

- [ ] **Step 1: Replace `components/ui/strike-line.tsx`**

```tsx
"use client";

import { useId } from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";

import { getStrike } from "@/data/strike-angles";
import { cn } from "@/lib/utils";

/** Full length of the blade in px. Longer than the band, so both ends run off it. */
const BLADE_LENGTH = 480;

/** Thickness of the blade where the stick enters, in px. It tapers to a point. */
const BLADE_WIDTH = 7;

/** Seconds the blade takes to cut from entry to tip. */
const CUT_DURATION = 0.22;

/** Seconds until the blade crosses the hairline: the middle of the cut. */
const IMPACT_AT = CUT_DURATION / 2;

const cut: Variants = {
  hidden: { pathLength: 0 },
  strike: { pathLength: 1, transition: { duration: CUT_DURATION, ease: [0.2, 0.8, 0.2, 1] } },
  rest: { pathLength: 1 },
};

/** The blade cools from full neon to a faint scar that stays. */
const scar: Variants = {
  hidden: { opacity: 1 },
  strike: { opacity: 0.25, transition: { delay: 0.55, duration: 0.6 } },
  rest: { opacity: 0.25 },
};

/** Blurred motion streak that flares while the blade cuts. */
const streak: Variants = {
  hidden: { opacity: 0 },
  strike: { opacity: [0, 0.8, 0], transition: { duration: 0.35, times: [0, 0.4, 1] } },
  rest: { opacity: 0 },
};

/** Flash where the blade meets the hairline. */
const flash: Variants = {
  hidden: { scale: 0, opacity: 0 },
  strike: {
    scale: [0, 1.6],
    opacity: [1, 0],
    transition: { delay: IMPACT_AT, duration: 0.4, ease: "easeOut" },
  },
  rest: { scale: 0, opacity: 0 },
};

/** Brightness pulse running outward along the hairline from the impact. */
const pulse: Variants = {
  hidden: { scaleX: 0, opacity: 0 },
  strike: {
    scaleX: [0, 1],
    opacity: [1, 0],
    transition: { delay: IMPACT_AT, duration: 0.7, ease: "easeOut" },
  },
  rest: { scaleX: 1, opacity: 0 },
};

const label: Variants = {
  hidden: { opacity: 0, y: 4 },
  strike: { opacity: 1, y: 0, transition: { delay: 0.5, duration: 0.4 } },
  rest: { opacity: 1, y: 0 },
};

export interface StrikeLineProps {
  /**
   * Strike number from `data/strike-angles.ts`. Only diagonal and overhead
   * strikes (1, 2, 8, 9, 12) are allowed; thrusts and horizontal strikes throw.
   */
  angle: number;
  /** Where the blade crosses the line, from 0 (left) to 1 (right). Keep within 0.15–0.85. */
  at?: number;
  className?: string;
}

/**
 * Section divider cut by a real Arnis strike. The first time it scrolls into
 * view, a tapered neon blade slashes across the hairline at the strike's angle
 * with a motion streak, flashes on impact, sends a pulse along the line, and
 * cools to a faint scar beside a telemetry label. With reduced motion it
 * renders straight away as the scar.
 */
export function StrikeLine({ angle, at = 0.5, className }: StrikeLineProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const maskId = `strike-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const strike = getStrike(angle);
  if (strike.degrees === null) {
    throw new Error(`Strike ${angle} is a thrust and has no line to draw`);
  }
  if (strike.degrees % 180 === 0) {
    throw new Error(`Strike ${angle} is horizontal and reads as a plain line`);
  }

  const half = BLADE_LENGTH / 2;
  // Drawn along the x axis, then rotated to the strike's direction of travel:
  // wide where the stick enters (-half), sharp where it exits (+half).
  const blade = `${-half},${-BLADE_WIDTH / 2} ${half},0 ${-half},${BLADE_WIDTH / 2}`;
  const streakShape = `${-half},${-BLADE_WIDTH * 1.5} ${half},0 ${-half},${BLADE_WIDTH * 1.5}`;
  const text = `ANGLE ${String(strike.number).padStart(2, "0")} // ${strike.degrees}°`;
  const percent = `${at * 100}%`;

  return (
    <div aria-hidden className={cn("mx-auto w-full max-w-6xl px-6", className)}>
      <motion.div
        initial={reduceMotion ? "rest" : "hidden"}
        whileInView={reduceMotion ? "rest" : "strike"}
        viewport={{ once: true, margin: "0px 0px -20% 0px" }}
        className="relative h-24 overflow-hidden sm:h-32"
      >
        <span className="absolute inset-x-0 top-1/2 h-px bg-line" />
        <motion.span
          variants={pulse}
          style={{ width: percent }}
          className="absolute top-1/2 left-0 h-px origin-right bg-linear-to-l from-accent to-transparent"
        />
        <motion.span
          variants={pulse}
          style={{ left: percent }}
          className="absolute top-1/2 right-0 h-px origin-left bg-linear-to-r from-accent to-transparent"
        />

        <svg className="absolute inset-0 size-full overflow-visible">
          {/* A nested <svg> puts the origin on the hairline at `at`. */}
          <svg x={percent} y="50%" overflow="visible">
            <g transform={`rotate(${strike.degrees})`}>
              <defs>
                <mask
                  id={maskId}
                  maskUnits="userSpaceOnUse"
                  x={-half - 20}
                  y={-40}
                  width={BLADE_LENGTH + 40}
                  height={80}
                >
                  {/* Drawing this line from entry to tip is what cuts the blade in. */}
                  <motion.path
                    d={`M ${-half} 0 L ${half} 0`}
                    stroke="#fff"
                    strokeWidth={60}
                    fill="none"
                    variants={cut}
                  />
                </mask>
              </defs>
              <motion.polygon
                points={streakShape}
                mask={`url(#${maskId})`}
                style={{ filter: "blur(6px)" }}
                className="fill-accent"
                variants={streak}
              />
              <motion.polygon
                points={blade}
                mask={`url(#${maskId})`}
                className="fill-accent"
                variants={scar}
              />
            </g>
            <motion.circle r={22} className="fill-accent" variants={flash} />
          </svg>
        </svg>

        <motion.span
          variants={label}
          style={at > 0.6 ? { right: `calc(${(1 - at) * 100}% + 32px)` } : { left: `calc(${percent} + 32px)` }}
          className="absolute top-1/2 -translate-y-[calc(100%+12px)] font-mono text-[0.65rem] tracking-[0.25em] whitespace-nowrap text-muted"
        >
          {text}
        </motion.span>
      </motion.div>
    </div>
  );
}
```

- [ ] **Step 2: Update the home page dividers**

In `app/page.tsx`, replace:

```tsx
        <StrikeLine angle={1} className="py-6" />
        <ProjectsShowcase />
        <StrikeLine angle={2} className="py-6" />
        <BentoGrid />
        <StrikeLine angle={3} className="py-6" />
```

with:

```tsx
        <StrikeLine angle={1} at={0.3} />
        <ProjectsShowcase />
        <StrikeLine angle={2} at={0.68} />
        <BentoGrid />
        <StrikeLine angle={9} at={0.42} />
```

- [ ] **Step 3: Update the footer divider**

In `components/layout/site-footer.tsx`, replace:

```tsx
      <StrikeLine angle={12} className="mb-10 px-0" />
```

with:

```tsx
      <StrikeLine angle={12} at={0.5} className="mb-6 px-0" />
```

- [ ] **Step 4: Verify**

```bash
npx tsc --noEmit
npm run lint
npm run build
npm run start
```

With the preloader skipped, at http://localhost:3000, scroll slowly past each divider:

- [ ] **Hero → Projects:** a neon blade cuts from top-right to bottom-left across the line at about 30% from the left, fast. A soft glow streak flares with it, a flash pops where it crosses the line, and a bright pulse runs outward along the line both ways. The blade then fades to a faint scar and `ANGLE 01 // 135°` appears to its right.
- [ ] **Projects → Stack:** cuts top-left to bottom-right at about 68%; the label `ANGLE 02 // 45°` sits to the **left** of the cut.
- [ ] **Stack → Contact:** `ANGLE 09 // 45°`, top-left to bottom-right at about 42%.
- [ ] **Footer:** a vertical cut in the middle, `ANGLE 12 // 90°`.
- [ ] Each blade is visibly thicker at its starting end and pointed at the other end.
- [ ] Each divider plays once; scrolling back up and down again shows only the scar.
- [ ] Reduced motion (DevTools → Rendering → prefers-reduced-motion: reduce, reload): every divider is already a scar with its label; nothing animates.
- [ ] At 375px: the band is shorter, the label does not overlap the blade or run off the screen, and there is no horizontal scrollbar.
- [ ] Console is clean.

- [ ] **Step 5: Commit**

```bash
git add components/ui/strike-line.tsx app/page.tsx components/layout/site-footer.tsx
git commit -m "feat(identity): turn strike line dividers into a slash cut"
```

---

# Phase 15 — Targeted fixes: intro on every load, hero on reload, projects gap, discipline card

Four fixes reported by the owner after Phase 13, plus a check of the Next.js "1 Issue" badge. Run this phase **after Phase 14**: Tasks 15.1 and 15.2 edit files that Task 14.1 replaces, and their anchors match the Task 14.1 versions.

**Diagnosis (checked by the architect against the owner's dev server and a production build, 1895×916):**

- **"The hero portrait is pushed up behind the navbar."** The layout is not broken. At scroll position 0 the whole hood and face are visible below the header, and the headgear reveal lines up with the face. The owner's screenshots were taken **after a reload while scrolled down**: the browser restores the old scroll position (reloading at `scrollY` 620 reproduces the screenshots exactly: the 916px hero mostly scrolled out, the corner copy at the top edge, the header in its scrolled glass style, and the headgear's lower neck guard showing over the chest). So the fix is to always open at the top on a full load, which also suits the intro playing on every load. No padding, `object-fit`, or headgear coordinate changes are needed, and none should be made.
- **Gap before Projects.** Each project card is pinned in a full-screen `sticky` wrapper with `items-center`, so the first card sat about 300px below the "Projects" heading. Pinning the cards near the top instead (below the header) brings that to 112px; the section's top padding is also reduced.
- **Discipline card.** The photos use `object-top` in a short, wide card, so only the tent roof shows.
- **"1 Issue" badge.** Could not be reproduced: on the owner's running dev server and on a fresh dev server of commit `76da151`, a first load with the intro, a reload while scrolled, scrolling, and opening/closing the command palette all left the console and the Next.js dev overlay empty. Task 15.4 tells you how to capture it if it reappears.

Every code block below was type-checked, linted, and built with Turbopack in a scratch copy at commit `76da151`, then checked in a production build at 1895×916: reloading from `scrollY` 620 shows the intro immediately (`data-preloader-active` set, overlay `display: flex`), `history.scrollRestoration` is `manual`, and the page is at `scrollY` 0; the "Projects" heading ends 112px above the first card; the stack still ends before the Stack section; the discipline card measures 568×576 with `object-position: 50% 80%`. The intro's counter and wipe could not run to completion there (the test browser pauses animation while hidden) and are covered by Task 15.4. Copy the blocks exactly.

### Task 15.1: Play the intro on every load and always open at the top

**Files:**
- Modify: `components/ui/preloader.tsx` (full replacement)
- Modify: `components/command-palette/command-palette.tsx` (two edits)
- Modify: `app/globals.css` (comment only)

**Interfaces consumed:** none new.
**Interfaces produced:** `STORAGE_KEY` is no longer exported from `@/components/ui/preloader`, and `sessionStorage` is no longer used anywhere. The gate script now sets `history.scrollRestoration = "manual"` on every full load.

**Behaviour after this task:**
- Every full page load (first visit, reload, typing the URL) plays the intro and opens the page at the top.
- Client-side navigation back to the home page (for example from the 404 page's "Back to the start" link) does not replay it; a module-level flag remembers that it already played in this document.
- The palette's **Replay intro** simply loads the home page again.

- [ ] **Step 1: Replace `components/ui/preloader.tsx`**

```tsx
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
 * and before React has loaded. On every full page load it flags `<html>`,
 * which makes the server-rendered overlay visible and locks scrolling, so the
 * intro never flashes in late. It also turns off the browser's scroll
 * restoration: without that, a reload reopens the page wherever it was
 * scrolled to, and the intro wipes away to reveal the middle of the page
 * instead of the hero.
 */
const GATE_SCRIPT = `try{history.scrollRestoration="manual"}catch(e){}document.documentElement.setAttribute("${ACTIVE_ATTRIBUTE}","")`;

/*
 * Whether the intro has already played in this document. Module state lives
 * as long as the page: a reload starts a new document and plays the intro
 * again, but client-side navigation back to the home page does not.
 */
let playedThisLoad = false;

function readShouldPlay() {
  return !playedThisLoad;
}

// Nothing to subscribe to: the value only changes when the intro finishes,
// and that is followed by a state update anyway.
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
 * Intro: the Gothic monogram, a telemetry counter from 00 to 100, then an
 * upward wipe that uncovers the hero. Plays on every full page load, including
 * reloads.
 */
export function Preloader() {
  // The server always renders the overlay (CSS keeps it hidden unless the gate
  // script flagged the page). After hydration this switches to the module
  // flag, so a client-side return to the home page does not replay the intro.
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
  // it back before paint. The flag is re-read so that a client-side return to
  // the home page, whose `shouldPlay` is still the server value during the
  // hydration commit, never flashes the overlay.
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
    playedThisLoad = true;
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
```

- [ ] **Step 2: Update the command palette**

In `components/command-palette/command-palette.tsx`, delete this import line:

```tsx
import { STORAGE_KEY as PRELOADER_STORAGE_KEY } from "@/components/ui/preloader";
```

Then replace:

```tsx
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
```

with:

```tsx
  function replayIntro() {
    // A full page load, not router.push: the preloader plays on every full load,
    // and its gate script only runs while the HTML is being parsed.
    window.location.assign(window.location.origin);
  }
```

- [ ] **Step 3: Update the gate comment in `app/globals.css`**

Replace:

```css
 * Preloader gate. The overlay is in the server HTML on every load but stays
 * hidden unless the inline gate script flagged a first visit on <html>, so
 * returning visitors and no-JS visitors never see it. Unlayered on purpose:
 * this must beat any Tailwind display utility.
```

with:

```css
 * Preloader gate. The overlay is in the server HTML on every load but stays
 * hidden unless the inline gate script flagged <html>, which it does on every
 * full page load; no-JS visitors never see it. Unlayered on purpose: this must
 * beat any Tailwind display utility.
```

- [ ] **Step 4: Verify**

```bash
npx tsc --noEmit
npm run lint
npm run build
npm run start
```

```bash
grep -rn "sessionStorage\|portfolio_preloaded\|STORAGE_KEY" app components hooks lib
```

Expected: no output.

At http://localhost:3000:

- [ ] Load the page: the intro plays (monogram, counter to 100, upward wipe) and reveals the hero at the top.
- [ ] Scroll halfway down the page, then reload (F5): the intro plays again, and after the wipe the page is at the very top with the full hood and face visible below the header.
- [ ] Repeat the reload several times: the intro plays every time.
- [ ] Open http://localhost:3000/does-not-exist, click **Back to the start**: the home page appears without the intro (client-side navigation). Reload there: the intro plays.
- [ ] Ctrl+K → type `intro` → **Replay intro**: the page reloads and the intro plays.
- [ ] During the intro, the wheel, keyboard, and Ctrl+K do nothing; right after the wipe, scrolling works.
- [ ] Console is clean, with no hydration warning.

- [ ] **Step 5: Commit**

```bash
git add components/ui/preloader.tsx components/command-palette/command-palette.tsx app/globals.css
git commit -m "feat(preloader): play the intro on every load and open at the top"
```

---

### Task 15.2: Tighten the gap before the projects

**Files:**
- Modify: `components/sections/projects-showcase.tsx` (one class change)
- Modify: `components/sections/project-card.tsx` (one class change)

**Interfaces consumed / produced:** none.

- [ ] **Step 1: Reduce the section's top padding**

In `components/sections/projects-showcase.tsx`, replace:

```tsx
    <section id="projects" className="relative px-6 py-24">
```

with:

```tsx
    <section id="projects" className="relative px-6 pt-8 pb-24">
```

- [ ] **Step 2: Pin the cards near the top instead of the vertical centre**

In `components/sections/project-card.tsx`, replace:

```tsx
    <div className="sticky top-0 flex h-screen items-center justify-center px-6">
```

with:

```tsx
    <div className="sticky top-0 flex h-screen items-start justify-center px-6 pt-28">
```

`pt-28` (112px) keeps a pinned card clear of the floating header.

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit
npm run lint
npm run build
npm run start
```

At 1440px or wider:

- [ ] Between the hero and "SELECTED WORK / Projects" there is only the strike line divider and a small margin; no empty screen-height gap.
- [ ] The first project card starts roughly 110px below the "Projects" heading instead of in the middle of the screen.
- [ ] Scrolling through the projects: each card pins just below the header and the next card stacks over it, slightly lower, exactly as before. No card is hidden behind the header.
- [ ] After the last card, the Stack section follows without any card overlapping it.
- [ ] At 375px: cards pin below the header and stay fully readable; no horizontal scrollbar.

- [ ] **Step 4: Commit**

```bash
git add components/sections/projects-showcase.tsx components/sections/project-card.tsx
git commit -m "fix(projects): pin cards near the top and tighten the section gap"
```

---

### Task 15.3: Show the fighter's full stance on the Athletics & Discipline card

**Files:**
- Modify: `components/sections/discipline-card.tsx` (three class changes)
- Modify: `components/sections/bento-grid.tsx` (one class change)

**Interfaces consumed / produced:** none.

**Why these values.** Both photos are portrait (3024×4032); the athlete runs from about 22% (top of the headgear) to 95% (feet) of the photo height, with the tent roof above. The architect rendered the exact `object-cover` crop of both photos at each card size:

| Breakpoint | Card | Focal point | What is in frame |
| --- | --- | --- | --- |
| Phone | `aspect-4/5` (≈327×409) | `center 80%` | headgear to feet |
| Tablet (`sm`) | `aspect-4/3` (≈720×540) | `center 45%` | headgear to knees; a landscape card cannot fit a full standing figure, and 80% here would cut the headgear off |
| Desktop (`lg`) | two rows, `min-h-[36rem]` (≈568×576) | `center 80%` | headgear to feet |

The text gradient is shortened to the bottom 40% (solid at the bottom, 70% at 20% height), so the red gear stays bright and only the feet sit under the text. On desktop, the taller card also makes the two grid rows it spans taller, so the tech stack cards beside it grow.

- [ ] **Step 1: Set the focal point on both photos**

In `components/sections/discipline-card.tsx`, replace `object-cover object-top` with `object-cover object-[center_80%] sm:object-[center_45%] lg:object-[center_80%]` in **both** `<Image>` `className`s.

- [ ] **Step 2: Shorten the text gradient**

In the same file, replace:

```tsx
        className="absolute inset-0 bg-gradient-to-t from-bg via-bg/60 to-transparent"
```

with:

```tsx
        className="absolute inset-0 bg-linear-to-t from-bg via-bg/70 via-20% to-transparent to-40%"
```

- [ ] **Step 3: Give the card a portrait-friendly shape**

In `components/sections/bento-grid.tsx`, replace:

```tsx
          <DisciplineCard className="min-h-80 sm:col-span-2 lg:col-span-3 lg:row-span-2" />
```

with:

```tsx
          <DisciplineCard className="aspect-4/5 sm:col-span-2 sm:aspect-4/3 lg:col-span-3 lg:row-span-2 lg:aspect-auto lg:min-h-[36rem]" />
```

- [ ] **Step 4: Verify**

```bash
npx tsc --noEmit
npm run lint
npm run build
npm run start
```

Scroll to **Stack & Discipline**:

- [ ] **Desktop (1440px):** the card is roughly square. The whole fighter is visible from the top of the headgear down to the feet, with only a strip of tent roof above; the red armour is bright, not darkened.
- [ ] Hover the card, and Tab to it: the action photo fades in with the same framing (headgear, armour, stick, and lunge all in frame).
- [ ] "Athletics & Discipline", "Competitive Arnis", and the paragraph are readable over the dark bottom of the card.
- [ ] **Tablet (768px):** a 4:3 card across both columns; the headgear is not cut off at the top.
- [ ] **Phone (375px):** a 4:5 card with the full stance above and behind the text; no horizontal scrollbar.
- [ ] The tech stack cards still line up with no overlap.

- [ ] **Step 5: Commit**

```bash
git add components/sections/discipline-card.tsx components/sections/bento-grid.tsx
git commit -m "fix(bento): show the fighter's full stance on the discipline card"
```

---

### Task 15.4: Phase 15 verification pass and the Next.js issue badge

**Files:** none created; fix whatever this task surfaces.

- [ ] **Step 1: Clean restart of the dev server**

Stale errors from hot reloads while files were being edited are a common source of the dev overlay's issue badge, so start from a clean slate:

```bash
rm -rf .next
npx next typegen
npx tsc --noEmit
npm run lint
npm run dev
```

- [ ] **Step 2: Walk the site in `npm run dev`, then check the badge**

1. Load http://localhost:3000 and let the intro finish.
2. Move the mouse across the hero; scroll to the footer and back; open and close the palette with Ctrl+K; run **Strike** from the palette.
3. Reload while scrolled halfway down.
4. Open http://localhost:3000/nope and click **Back to the start**.

After each step, look at the bottom-left Next.js badge and the browser console:

- [ ] **No badge and a clean console:** the issue was a stale hot-reload error. Nothing to fix.
- [ ] **A badge appears:** click it, and copy the exact error title, message, and the first stack frame that points into `app/` or `components/` into your handoff. If it is a hydration mismatch, also note which element the diff highlights. Do not guess at a fix: report it so the architect can plan one.

- [ ] **Step 3: Production walk**

```bash
npm run build
npm run start
```

- [ ] Every Task 15.1–15.3 check still passes together.
- [ ] Phase 14 checks still pass: no case study links, strike line dividers slash in, palette shows Navigate and Actions.
- [ ] At 375px, 768px, and 1440px: `document.documentElement.scrollWidth === document.documentElement.clientWidth` is `true`.
- [ ] Console is clean.

- [ ] **Step 4: Commit any fixes**

```bash
git add -A -- app components data hooks lib types
git commit -m "fix: address phase 15 verification findings"
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

**Next phases (planned in the spec, not yet written as tasks):** Phase 16, new home sections (About, Experience, Arnis, Now — the owner picks which); Phase 17, polish and reach (tech marquee, heading reveals, OG images, sitemap, robots, JSON-LD, Vercel Web Analytics, Lighthouse ≥ 90).
