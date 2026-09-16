# Portfolio Implementation Plan

> **For the builder (OpenCode):** Execute tasks strictly in order. Each task is
> self-contained — read only that task, do exactly what it says, run its
> **Verify** block, then commit. Do not skip ahead, do not batch phases, and do
> not "improve" adjacent files that the task does not list.

> **Status:** Phases 1–6 are complete and committed. **Start at Phase 7** (signature
> visual upgrade). Phase 7 tasks modify files that earlier phases created; where
> an earlier task's code block no longer matches the target design, that task
> carries a "Superseded" note pointing at the Phase 7 task that replaces it.
> Never re-run a completed task's code over the Phase 7 version.

**Goal:** Ship a single-page, dark, motion-driven developer portfolio on Next.js 16 App Router, deployed to Vercel.

**Architecture:** All page content is composed in `app/page.tsx` from section components under `components/sections/`. Every section that renders content is an async Server Component that awaits a function from `lib/queries.ts`; those functions currently return local typed arrays but their signatures are already `Promise`-returning, so swapping them for Supabase queries in Phase 2 is a data-layer edit with zero UI churn. Client-side interactivity (smooth scroll, scroll-linked animation, mobile nav) is isolated in leaf `"use client"` components so the page stays mostly server-rendered.

**Tech Stack:** Next.js 16.3.5 (App Router, Turbopack), React 19.2.8, TypeScript 5 (strict), Tailwind CSS v4.3.3, `motion` v13 (the current package name for Framer Motion), `lenis` v1.3 for smooth scroll, `lucide-react` for icons, shadcn/ui conventions (`cn()` + `cva` + `components/ui/`).

---

## Global Constraints

Copy these exactly; they apply to every task.

- **Node.js 24.19.0, npm 11.17.0.** Verified working versions for this repo.
- **No `src/` directory.** Everything lives at the repository root: `app/`, `components/`, `data/`, `lib/`, `types/`, `public/`.
- **Import alias is `@/*` → repository root.** Import as `@/components/ui/button`, `@/types`, `@/lib/utils`. Never use deep relative paths like `../../..`.
- **Next.js 16 conventions are mandatory.** Before writing framework code, consult `node_modules/next/dist/docs/` as `AGENTS.md` requires. The rules that matter here: `params`, `searchParams`, `cookies()`, and `headers()` are async-only; route component props use the generated globals `PageProps<"/">` / `LayoutProps<"/">` (already used in `app/layout.tsx`) rather than hand-written prop types.
- **`next/image` `quality` is restricted in Next 16.** The default allowed set is `[75]` only. Never pass a `quality` prop unless you also add `images.qualities` to `next.config.ts`. Passing `quality={90}` silently coerces to 75.
- **Dark theme only.** There is no light mode and no theme toggle. Do not write `dark:` variants; write the dark values directly using the theme tokens in `app/globals.css` (see the token table in Phase 7).
- **Accent is electric neon lime (`#ccff00`).** Use it for badges, borders, the live dot, and hover glows. When it is a background fill, the text on it is always `text-accent-ink`. Hover glows use the arbitrary shadow `shadow-[0_0_32px_-6px_var(--color-accent)]` (verified to compile in Tailwind v4.3).
- **`next/image` `priority` is deprecated in Next 16.** Use `preload` for the single above-the-fold LCP image (the hero portrait) and nothing else.
- **`lucide-react` v1 has no brand icons.** There is no `Github` export. The GitHub link uses `CodeXml` (already in place in the header, hero, and cards); do not try to import `Github`.
- **No `scroll-behavior: smooth` in CSS.** Lenis drives scrolling; a CSS smooth-scroll rule fights it. Anchor navigation goes through the Lenis instance (Task 3.2).
- **Respect `prefers-reduced-motion`.** Every scroll-linked or entrance animation must degrade to a static layout. Tasks that add motion say exactly how.
- **Accessibility floor.** Every `<Image>` has meaningful `alt` (or `alt=""` when purely decorative). Every icon-only link or button has an `aria-label`. Every section has an `id` that matches its nav anchor.
- **Commit after every task** using Conventional Commits, e.g. `feat(hero): add hero section`.

### Verification commands

Every task's **Verify** block uses some combination of these. They must all pass before you commit.

```bash
npx tsc --noEmit    # type check
npm run lint        # ESLint flat config
npm run build       # production build (Turbopack)
npm run dev         # visual check at http://localhost:3000
```

There is no test runner in this project and this plan does not add one. Verification is type check + lint + build + the explicit visual checks each task lists.

### Content owned by the repository owner

Three files hold personal content that only the owner can supply. Create them with the structure and example rows given in the tasks below, then flag them in your handoff so the owner can replace the values:

1. `data/site.ts` — name, initials, GitHub URL, email.
2. `data/projects.ts` — the real project entries.
3. `public/resume.pdf` — currently **missing** from the repository. Task 2.4 adds a placeholder so the download button is never a dead link.

---

## Target file structure

```
app/
  layout.tsx                 # fonts (Geist, Geist Mono, Anton), metadata, <Backdrop>, <SmoothScrollProvider>
  page.tsx                   # composes the five sections
  globals.css                # Tailwind v4 theme tokens, custom utilities, Lenis base styles
components/
  layout/
    backdrop.tsx             # page-wide fixed grid + noise layers (server)         [Phase 7]
    site-header.tsx          # floating glass nav (client)
    site-footer.tsx          # footer (server)
  sections/
    hero.tsx                 # server shell: telemetry bar, visual stage, copy
    hero-visual.tsx          # watermark type + glow + portrait, parallax (client)
    telemetry-bar.tsx        # live status dot + local clock (client)                [Phase 7]
    projects-showcase.tsx    # server: awaits getProjects()
    projects-stack.tsx       # sticky scroll stack (client)
    project-card.tsx         # one card in the stack, tilt + spotlight (client)
    bento-grid.tsx           # server: awaits getSkillCategories()
    tech-stack-card.tsx      # one skill group card (server)
    discipline-card.tsx      # Arnis photo card (client, hover swap)
    contact.tsx              # contact CTA (server)
  providers/
    smooth-scroll-provider.tsx  # Lenis root (client)
  ui/
    button.tsx               # cva + Radix Slot, shadcn convention
    badge.tsx                # tech-stack pill
    section-heading.tsx      # shared eyebrow + title
data/
  site.ts                    # identity + social links
  navigation.ts              # nav anchors
  projects.ts                # Project[]
  skills.ts                  # SkillCategory[] + discipline photos
hooks/
  use-local-time.ts          # ticking clock via useSyncExternalStore               [Phase 7]
  use-pointer-tilt.ts        # mouse-tracked 3D tilt + spotlight motion values      [Phase 7]
lib/
  utils.ts                   # cn()
  queries.ts                 # async data access seam (Supabase swap point)
types/
  index.ts                   # ALREADY CREATED — do not rewrite
```

---

# Phase 1 — Environment, dependencies, theme tokens

### Task 1.1: Install dependencies

**Files:**
- Modify: `package.json`, `package-lock.json`

- [x] **Step 1: Install runtime dependencies**

```bash
npm install motion@^13 lenis@^1.3 lucide-react@^1 clsx@^2 tailwind-merge@^3 class-variance-authority@^0.7 @radix-ui/react-slot@^1
```

Notes on why these exact packages: `motion` is the current published name of Framer Motion (v13 — the `framer-motion` package is now an alias of it); import from `motion/react`. `clsx` + `tailwind-merge` + `class-variance-authority` + `@radix-ui/react-slot` are the four packages shadcn/ui components depend on, installed directly so no CLI codegen step is needed.

- [x] **Step 2: Verify**

```bash
npx tsc --noEmit
npm run build
```

Expected: build succeeds, unchanged starter page renders.

- [x] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add motion, lenis, lucide and shadcn utility deps"
```

---

### Task 1.2: Add the `cn()` utility and shadcn config

**Files:**
- Create: `lib/utils.ts`
- Create: `components.json`

- [x] **Step 1: Create `lib/utils.ts`**

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge conditional class names, with later Tailwind utilities winning. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [x] **Step 2: Create `components.json`**

Nothing we write by hand reads this file, but it lets the owner run `npx shadcn@latest add <component>` later and have it land in the right directories with the right alias.

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "app/globals.css",
    "baseColor": "zinc",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

`"tailwind.config": ""` is intentional — Tailwind v4 is CSS-first and this project has no `tailwind.config.*`.

- [x] **Step 3: Verify**

```bash
npx tsc --noEmit
npm run lint
```

- [x] **Step 4: Commit**

```bash
git add lib/utils.ts components.json
git commit -m "chore: add cn() utility and shadcn components.json"
```

---

### Task 1.3: Replace `app/globals.css` with the dark theme token system

> **Superseded by the Phase 7 token update.** The architect has already rewritten `app/globals.css` with the neon palette and new utilities; Task 7.1 commits it. The code block below is the historical Phase 1 version — do not re-apply it.

**Files:**
- Modify: `app/globals.css` (full replacement)

Two things in the current file are actively wrong for this design and must go: the `@media (prefers-color-scheme: dark)` block (the site is dark unconditionally) and `body { font-family: Arial, Helvetica, sans-serif; }`, which overrides the Geist fonts wired up by `next/font` in the root layout.

- [x] **Step 1: Replace the entire contents of `app/globals.css`**

```css
@import "tailwindcss";

/*
 * Literal design tokens. Plain `@theme` (not `@theme inline`) so Tailwind also
 * emits them as real CSS custom properties — the radial glow helpers below
 * reference them directly.
 */
@theme {
  --color-bg: #05060a;
  --color-surface: #0b0d14;
  --color-elevated: #12151f;
  --color-line: #1e2230;
  --color-fg: #f5f6f8;
  --color-muted: #8a90a2;
  --color-accent: #ff4d17;
  --color-accent-soft: #ff8a5c;

  --radius-card: 1.5rem;
}

/*
 * `inline` is required here: these point at the CSS variables that
 * `next/font/google` generates in app/layout.tsx, so the value must be
 * referenced rather than copied at build time.
 */
@theme inline {
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

:root {
  color-scheme: dark;
}

body {
  background-color: var(--color-bg);
  color: var(--color-fg);
  -webkit-font-smoothing: antialiased;
}

::selection {
  background-color: var(--color-accent);
  color: #05060a;
}

/*
 * Lenis base styles, inlined rather than imported from the package so there is
 * no dependency on its dist layout.
 */
html.lenis,
html.lenis body {
  height: auto;
}

.lenis.lenis-smooth {
  scroll-behavior: auto !important;
}

.lenis.lenis-stopped {
  overflow: clip;
}

.lenis.lenis-smooth [data-lenis-prevent] {
  overscroll-behavior: contain;
}

/* Faint telemetry grid used behind the hero. */
.grid-backdrop {
  background-image:
    linear-gradient(to right, rgb(255 255 255 / 0.04) 1px, transparent 1px),
    linear-gradient(to bottom, rgb(255 255 255 / 0.04) 1px, transparent 1px);
  background-size: 64px 64px;
  mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, #000 40%, transparent 100%);
}

/* Ambient accent bloom, positioned by the consuming component. */
.glow {
  background: radial-gradient(
    circle at center,
    color-mix(in oklab, var(--color-accent) 45%, transparent) 0%,
    transparent 70%
  );
  filter: blur(80px);
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [x] **Step 2: Verify**

```bash
npm run build
npm run dev
```

Expected: the starter page now renders on a near-black background in the Geist typeface (not Arial). Some starter-page text will look wrong against the dark background — that is expected and gets replaced in Phase 3.

- [x] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat(theme): replace starter styles with dark token system"
```

---

### Task 1.4: Add `button.tsx`, `badge.tsx`, and `section-heading.tsx`

> **Partially superseded by Task 7.2**, which replaces `button.tsx` and `badge.tsx` with neon-accent variants. `section-heading.tsx` is unchanged.

**Files:**
- Create: `components/ui/button.tsx`
- Create: `components/ui/badge.tsx`
- Create: `components/ui/section-heading.tsx`

**Interfaces produced:** `Button` (standard `button` props plus `variant: "primary" | "outline" | "ghost"`, `size: "sm" | "md" | "lg"`, `asChild?: boolean`), `buttonVariants(opts)`, `Badge` (standard `span` props), `SectionHeading` (props `eyebrow: string`, `title: string`, `className?: string`). Phases 3–6 import all three.

- [x] **Step 1: Create `components/ui/button.tsx`**

```tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium tracking-tight transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-fg text-bg hover:bg-white",
        outline:
          "border border-line bg-transparent text-fg hover:border-accent hover:text-accent",
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

- [x] **Step 2: Create `components/ui/badge.tsx`**

```tsx
import * as React from "react";

import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-line bg-elevated px-3 py-1 font-mono text-xs tracking-tight text-muted",
        className,
      )}
      {...props}
    />
  );
}
```

- [x] **Step 3: Create `components/ui/section-heading.tsx`**

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

- [x] **Step 4: Verify**

```bash
npx tsc --noEmit
npm run lint
npm run build
```

- [x] **Step 5: Commit**

```bash
git add components/ui
git commit -m "feat(ui): add button, badge and section heading primitives"
```

---

# Phase 2 — Types, data layer, asset verification

`types/index.ts` **already exists** and defines `Project`, `ProjectCategory`, `PROJECT_CATEGORY_LABELS`, `Skill`, `SkillGroup`, `SkillCategory`, `DisciplinePhoto`, `NavLink`, and `SocialLink`. Read it before starting this phase. Do not rewrite it; if a task here needs a field it does not have, that is a plan bug — stop and report it.

### Task 2.1: Create `data/site.ts` and `data/navigation.ts`

**Files:**
- Create: `data/site.ts`
- Create: `data/navigation.ts`

**Interfaces produced:** `siteConfig` (object literal), `navLinks: NavLink[]`, `socialLinks: SocialLink[]`.

- [x] **Step 1: Create `data/site.ts`**

The string values here are the repository owner's to set. Use these defaults verbatim, then list this file in your handoff as needing real values.

```ts
import type { SocialLink } from "@/types";

export const siteConfig = {
  name: "Your Name",
  initials: "YN",
  role: "Full Stack Developer",
  description:
    "Full Stack Developer building web applications, games, and the systems behind them.",
  url: "https://example.com",
  email: "you@example.com",
  githubUrl: "https://github.com/your-handle",
  resumePath: "/resume.pdf",
} as const;

export const socialLinks: SocialLink[] = [
  { label: "GitHub", href: siteConfig.githubUrl, icon: "Github" },
  { label: "Email", href: `mailto:${siteConfig.email}`, icon: "Mail" },
];
```

- [x] **Step 2: Create `data/navigation.ts`**

Each `href` must match a section `id` rendered in Phases 3–6.

```ts
import type { NavLink } from "@/types";

export const navLinks: NavLink[] = [
  { label: "Projects", href: "#projects" },
  { label: "Stack", href: "#stack" },
  { label: "Discipline", href: "#discipline" },
  { label: "Contact", href: "#contact" },
];
```

- [x] **Step 3: Verify**

```bash
npx tsc --noEmit
npm run lint
```

- [x] **Step 4: Commit**

```bash
git add data/site.ts data/navigation.ts
git commit -m "feat(data): add site config and navigation links"
```

---

### Task 2.2: Create `data/projects.ts`

**Files:**
- Create: `data/projects.ts`

**Interfaces produced:** `projects: Project[]`.

The three entries below are structurally complete examples covering all three required categories. Their content is the owner's to replace; the shape is not. Flag this file in your handoff.

- [x] **Step 1: Create `data/projects.ts`**

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

- [x] **Step 2: Verify**

```bash
npx tsc --noEmit
npm run lint
```

Expected: no type errors. If one appears, the entry is missing a required field from `types/index.ts`.

- [x] **Step 3: Commit**

```bash
git add data/projects.ts
git commit -m "feat(data): add project entries"
```

---

### Task 2.3: Create `data/skills.ts`

**Files:**
- Create: `data/skills.ts`

**Interfaces produced:** `skillCategories: SkillCategory[]`, `disciplinePhotos: DisciplinePhoto[]`.

The `width`/`height` on the discipline photos are the real intrinsic dimensions of the files on disk (3024×4032, a 3:4 portrait). Use them exactly — `next/image` needs them to reserve layout space.

- [x] **Step 1: Create `data/skills.ts`**

```ts
import type { DisciplinePhoto, SkillCategory } from "@/types";

export const skillCategories: SkillCategory[] = [
  {
    id: "skills-frontend",
    group: "frontend",
    label: "Frontend",
    order: 1,
    skills: [
      { name: "React" },
      { name: "Next.js" },
      { name: "TypeScript" },
      { name: "Tailwind CSS" },
    ],
  },
  {
    id: "skills-backend",
    group: "backend",
    label: "Backend",
    order: 2,
    skills: [{ name: "Node.js" }, { name: "Express" }, { name: "REST APIs" }],
  },
  {
    id: "skills-database",
    group: "database",
    label: "Databases",
    order: 3,
    skills: [{ name: "PostgreSQL" }, { name: "Supabase" }, { name: "MySQL" }],
  },
  {
    id: "skills-game-dev",
    group: "game-dev",
    label: "Game Dev",
    order: 4,
    skills: [{ name: "Unity" }, { name: "C#" }, { name: "Godot" }],
  },
  {
    id: "skills-devops",
    group: "devops",
    label: "DevOps & Tools",
    order: 5,
    skills: [{ name: "Git" }, { name: "Vercel" }, { name: "Docker" }],
  },
];

export const disciplinePhotos: DisciplinePhoto[] = [
  {
    src: "/images/about/arnis-stance.jpg",
    alt: "Competing in Arnis, holding a ready stance before an exchange",
    width: 3024,
    height: 4032,
  },
  {
    src: "/images/about/arnis-action.jpg",
    alt: "Mid-exchange during an Arnis competition bout",
    width: 3024,
    height: 4032,
  },
];
```

- [x] **Step 2: Verify**

```bash
npx tsc --noEmit
npm run lint
```

- [x] **Step 3: Commit**

```bash
git add data/skills.ts
git commit -m "feat(data): add skill categories and discipline photos"
```

---

### Task 2.4: Create the `lib/queries.ts` data seam and verify assets

**Files:**
- Create: `lib/queries.ts`
- Create: `public/resume.pdf`

**Interfaces produced:** `getProjects(): Promise<Project[]>`, `getSkillCategories(): Promise<SkillCategory[]>`. **Every section component in Phases 4 and 5 must call these — no section may import from `data/` directly.** That rule is the entire reason the Supabase migration will not touch the UI.

- [x] **Step 1: Create `lib/queries.ts`**

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

- [x] **Step 2: Confirm the image assets exist at the expected paths**

```bash
ls public/images/hero/hero-portrait.png public/images/about/arnis-stance.jpg public/images/about/arnis-action.jpg
```

Expected: all three listed. They are already present and untracked in git.

Note their real dimensions, which later tasks depend on:

| File | Dimensions | Note |
| --- | --- | --- |
| `hero-portrait.png` | 2048×1365 | **Landscape**, not a tall portrait crop. Task 3.3 frames it accordingly. |
| `arnis-stance.jpg` | 3024×4032 | 3:4 portrait, ~2.0 MB |
| `arnis-action.jpg` | 3024×4032 | 3:4 portrait, ~2.5 MB |

- [x] **Step 3: Create a placeholder `public/resume.pdf`**

`public/resume.pdf` does not exist, and Task 3.3 renders a download button pointing at it. Write a minimal valid one-page PDF so the link resolves; the owner replaces the file later.

```bash
printf '%%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj\ntrailer<</Root 1 0 R>>\n' > public/resume.pdf
```

- [x] **Step 4: Verify**

```bash
npx tsc --noEmit
npm run lint
npm run build
```

- [x] **Step 5: Commit**

Image assets are currently untracked; commit them here alongside the code that will reference them.

```bash
git add lib/queries.ts public/resume.pdf public/images
git commit -m "feat(data): add query seam, resume placeholder and image assets"
```

---

# Phase 3 — Smooth scroll, header, hero

### Task 3.1: Add the Lenis smooth-scroll provider and wire the root layout

**Files:**
- Create: `components/providers/smooth-scroll-provider.tsx`
- Modify: `app/layout.tsx` (full replacement)

**Interfaces produced:** `SmoothScrollProvider` (props `{ children: React.ReactNode }`).

- [x] **Step 1: Create `components/providers/smooth-scroll-provider.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { ReactLenis } from "lenis/react";

/**
 * Mounts Lenis on the document root. Disabled entirely when the visitor has
 * requested reduced motion, in which case native scrolling is used.
 */
export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(query.matches);

    const onChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  if (reducedMotion) {
    return <>{children}</>;
  }

  return (
    <ReactLenis root options={{ duration: 1.1, smoothWheel: true }}>
      {children}
    </ReactLenis>
  );
}
```

- [x] **Step 2: Replace `app/layout.tsx`**

Keep `LayoutProps<"/">` — it is a Next.js 16 generated global, not an import. Note there is deliberately no `data-scroll-behavior` attribute and no `scroll-behavior` CSS: Lenis owns scrolling.

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-bg font-sans text-fg">
        <SmoothScrollProvider>{children}</SmoothScrollProvider>
      </body>
    </html>
  );
}
```

- [x] **Step 3: Verify**

```bash
npx tsc --noEmit
npm run lint
npm run build
npm run dev
```

Expected in the browser: scrolling the starter page feels eased rather than instant, and `<html>` has the `lenis` class in DevTools. Set "Emulate CSS prefers-reduced-motion: reduce" in DevTools → Rendering and reload — the `lenis` class should be gone and scrolling native.

- [x] **Step 4: Commit**

```bash
git add components/providers app/layout.tsx
git commit -m "feat(scroll): add lenis smooth scroll provider"
```

---

### Task 3.2: Build the floating glass header

**Files:**
- Create: `components/layout/site-header.tsx`

**Interfaces consumed:** `navLinks`, `socialLinks`, `siteConfig`, `Button`, `cn()`.
**Interfaces produced:** `SiteHeader` (no props).

Behavior: fixed, centered, glassmorphism pill. Transparent at the top of the page; gains background blur and a border once scrolled past 32px. Anchor clicks are routed through the Lenis instance so they ease rather than jump. Below `md` the anchor links collapse into a toggle button.

- [x] **Step 1: Create `components/layout/site-header.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useLenis } from "lenis/react";
import { Github, Mail, Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { navLinks } from "@/data/navigation";
import { siteConfig, socialLinks } from "@/data/site";
import { cn } from "@/lib/utils";

const socialIcons = { Github, Mail } as const;

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
        <button
          type="button"
          onClick={() => lenis?.scrollTo(0)}
          className="rounded-full px-2 font-mono text-sm font-semibold tracking-[0.2em] text-fg"
        >
          {siteConfig.initials}
        </button>

        <ul className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Button variant="ghost" size="sm" onClick={() => scrollTo(link.href)}>
                {link.label}
              </Button>
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
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => scrollTo(link.href)}
              >
                {link.label}
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </header>
  );
}
```

- [x] **Step 2: Verify**

```bash
npx tsc --noEmit
npm run lint
npm run build
```

The header is not rendered on the page until Task 3.4 — these checks confirm it compiles.

- [x] **Step 3: Commit**

```bash
git add components/layout/site-header.tsx
git commit -m "feat(header): add floating glass navigation"
```

---

### Task 3.3: Build the hero section

> **Superseded by Task 7.4** (layered hero). Both files below are fully replaced there. Also note the code below uses `priority`, which Next.js 16 deprecated — Task 7.4 uses `preload`.

**Files:**
- Create: `components/sections/hero-visual.tsx`
- Create: `components/sections/hero.tsx`

**Interfaces consumed:** `siteConfig`, `Button`.
**Interfaces produced:** `Hero` (no props), `HeroVisual` (no props).

Layout: full-viewport section, headline "Full Stack Developer" set very large and tight, GitHub and Resume buttons beneath it, portrait beside the copy on `lg` and above and below it on smaller screens. Backdrop uses the `grid-backdrop` and `glow` helpers from Task 1.3. No biography paragraph.

The portrait is 2048×1365 — **landscape**. Frame it in a fixed-aspect box with `object-contain` so the cutout is never cropped; do not assume a tall 3:4 frame.

- [x] **Step 1: Create `components/sections/hero-visual.tsx`**

Split out as a client component purely so the entrance animation does not force the whole hero to the client.

```tsx
"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";

export function HeroVisual() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="relative aspect-[3/2] w-full max-w-xl"
    >
      <div
        aria-hidden
        className="glow absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2"
      />
      <Image
        src="/images/hero/hero-portrait.png"
        alt=""
        fill
        priority
        sizes="(min-width: 1024px) 40vw, 90vw"
        className="relative object-contain"
      />
    </motion.div>
  );
}
```

`alt=""` is correct here: the portrait is decorative because the adjacent heading already names the person and the role.

- [x] **Step 2: Create `components/sections/hero.tsx`**

```tsx
import { Download, Github } from "lucide-react";

import { HeroVisual } from "@/components/sections/hero-visual";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/data/site";

export function Hero() {
  return (
    <section
      id="hero"
      className="relative flex min-h-screen items-center overflow-hidden px-6 pt-32 pb-20"
    >
      <div aria-hidden className="grid-backdrop absolute inset-0" />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center gap-12 lg:flex-row lg:justify-between">
        <div className="flex flex-col items-center gap-8 text-center lg:items-start lg:text-left">
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-muted">
            {siteConfig.name}
          </span>

          <h1 className="text-balance text-5xl font-semibold leading-[0.95] tracking-tighter text-fg sm:text-7xl lg:text-8xl">
            Full Stack
            <span className="block text-accent">Developer</span>
          </h1>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <a href={siteConfig.githubUrl} target="_blank" rel="noopener noreferrer">
                <Github aria-hidden />
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

        <HeroVisual />
      </div>
    </section>
  );
}
```

- [x] **Step 3: Verify**

```bash
npx tsc --noEmit
npm run lint
npm run build
```

- [x] **Step 4: Commit**

```bash
git add components/sections/hero.tsx components/sections/hero-visual.tsx
git commit -m "feat(hero): add hero section with portrait and actions"
```

---

### Task 3.4: Replace `app/page.tsx` with the header and hero

**Files:**
- Modify: `app/page.tsx` (full replacement — the entire starter template contents are discarded)

- [x] **Step 1: Replace `app/page.tsx`**

```tsx
import { SiteHeader } from "@/components/layout/site-header";
import { Hero } from "@/components/sections/hero";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
      </main>
    </>
  );
}
```

- [x] **Step 2: Verify**

```bash
npm run build
npm run dev
```

Expected at http://localhost:3000: dark page, "Full Stack Developer" headline with "Developer" in accent orange, portrait rendered without cropping, both buttons working (GitHub opens in a new tab, Resume downloads the placeholder PDF). The header pill gains a blurred background after scrolling ~32px. Nav links will not visibly move the page yet — their target sections do not exist until Phases 4–6. Check the 375px-wide viewport too: the portrait stacks below the copy and the nav collapses to a menu button.

- [x] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat(page): render header and hero"
```

---

# Phase 4 — Scroll-interactive projects showcase

The mechanism: the section is `projects.length × 100vh` tall. Each card sits in a `sticky top-0 h-screen` wrapper, so cards pin in turn and stack on top of one another. A shared `useScroll` progress value drives a downward scale on each card as the next one arrives, producing the layered deck effect. There is no `/projects/[slug]` route in v1.

### Task 4.1: Build the project card

> **Superseded by Task 7.5** (tilt + spotlight), which fully replaces `project-card.tsx`.

**Files:**
- Create: `components/sections/project-card.tsx`

**Interfaces consumed:** `Project`, `PROJECT_CATEGORY_LABELS`, `Badge`, `Button`.
**Interfaces produced:** `ProjectCard` with props `{ project: Project; index: number; total: number; progress: MotionValue<number> }`. Task 4.2 renders it.

- [x] **Step 1: Create `components/sections/project-card.tsx`**

```tsx
"use client";

import { ArrowUpRight, Github } from "lucide-react";
import {
  motion,
  useReducedMotion,
  useTransform,
  type MotionValue,
} from "motion/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PROJECT_CATEGORY_LABELS, type Project } from "@/types";

export interface ProjectCardProps {
  project: Project;
  index: number;
  total: number;
  /** Scroll progress of the whole stack, 0 at the top and 1 at the bottom. */
  progress: MotionValue<number>;
}

export function ProjectCard({ project, index, total, progress }: ProjectCardProps) {
  const reduceMotion = useReducedMotion();

  // Each card shrinks slightly once the next card begins covering it, so the
  // stack reads as a physical deck rather than a flat overlay.
  const targetScale = 1 - (total - index) * 0.04;
  const scale = useTransform(progress, [index / total, 1], [1, targetScale]);

  return (
    <div className="sticky top-0 flex h-screen items-center justify-center px-6">
      <motion.article
        style={{
          scale: reduceMotion ? 1 : scale,
          top: `${index * 1.5}rem`,
        }}
        className="relative flex w-full max-w-4xl flex-col gap-6 rounded-card border border-line bg-surface p-8 sm:p-12"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Badge className="border-accent/40 text-accent">
            {PROJECT_CATEGORY_LABELS[project.category]}
          </Badge>
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
                <Github aria-hidden />
                Repository
              </a>
            </Button>
          ) : null}
        </div>
      </motion.article>
    </div>
  );
}
```

Both link buttons render conditionally because `liveUrl` and `repoUrl` are `string | null` — the game and internship entries in `data/projects.ts` exercise both null cases.

`Project.imageUrl` and `Project.imageAlt` are deliberately not rendered in v1. The fields exist so screenshots can be added later without a data migration; leave them out of this card.

- [x] **Step 2: Verify**

```bash
npx tsc --noEmit
npm run lint
```

- [x] **Step 3: Commit**

```bash
git add components/sections/project-card.tsx
git commit -m "feat(projects): add project card"
```

---

### Task 4.2: Build the sticky stack and the section shell

**Files:**
- Create: `components/sections/projects-stack.tsx`
- Create: `components/sections/projects-showcase.tsx`
- Modify: `app/page.tsx`

**Interfaces produced:** `ProjectsStack` with props `{ projects: Project[] }`; `ProjectsShowcase` (no props, async Server Component).

- [x] **Step 1: Create `components/sections/projects-stack.tsx`**

```tsx
"use client";

import { useRef } from "react";
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
        <ProjectCard
          key={project.id}
          project={project}
          index={index}
          total={projects.length}
          progress={scrollYProgress}
        />
      ))}
    </div>
  );
}
```

The container needs no explicit height: each child is `h-screen`, so the container is naturally `projects.length × 100vh` tall while the sticky cards pin inside it.

- [x] **Step 2: Create `components/sections/projects-showcase.tsx`**

```tsx
import { ProjectsStack } from "@/components/sections/projects-stack";
import { SectionHeading } from "@/components/ui/section-heading";
import { getProjects } from "@/lib/queries";

export async function ProjectsShowcase() {
  const projects = await getProjects();

  return (
    <section id="projects" className="relative px-6 py-24">
      <div className="mx-auto max-w-4xl">
        <SectionHeading eyebrow="Selected Work" title="Projects" />
      </div>
      <ProjectsStack projects={projects} />
    </section>
  );
}
```

This is the pattern every remaining content section follows: an async Server Component awaits `lib/queries.ts` and passes plain data into a client child.

- [x] **Step 3: Add the section to `app/page.tsx`**

```tsx
import { SiteHeader } from "@/components/layout/site-header";
import { Hero } from "@/components/sections/hero";
import { ProjectsShowcase } from "@/components/sections/projects-showcase";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <ProjectsShowcase />
      </main>
    </>
  );
}
```

- [x] **Step 4: Verify**

```bash
npx tsc --noEmit
npm run lint
npm run build
npm run dev
```

Expected in the browser: scrolling past the hero pins each project card in turn; as the next card rises over it, the one beneath scales down slightly and its top edge stays visible as a stacked ledge. The "Projects" nav link now scrolls to this section. Enable "Emulate CSS prefers-reduced-motion: reduce" and reload — cards must still be readable one per screen, just without the scale effect.

- [x] **Step 5: Commit**

```bash
git add components/sections/projects-stack.tsx components/sections/projects-showcase.tsx app/page.tsx
git commit -m "feat(projects): add scroll-driven sticky card stack"
```

---

# Phase 5 — Bento grid: tech stack and Arnis discipline

### Task 5.1: Build the tech stack card

**Files:**
- Create: `components/sections/tech-stack-card.tsx`

**Interfaces consumed:** `SkillCategory`, `Badge`.
**Interfaces produced:** `TechStackCard` with props `{ category: SkillCategory; className?: string }`.

- [x] **Step 1: Create `components/sections/tech-stack-card.tsx`**

```tsx
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SkillCategory } from "@/types";

export interface TechStackCardProps {
  category: SkillCategory;
  className?: string;
}

export function TechStackCard({ category, className }: TechStackCardProps) {
  return (
    <article
      className={cn(
        "flex flex-col gap-4 rounded-card border border-line bg-surface p-6 transition-colors hover:border-accent/40",
        className,
      )}
    >
      <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
        {category.label}
      </h3>
      <ul className="flex flex-wrap gap-2">
        {category.skills.map((skill) => (
          <li key={skill.name}>
            <Badge className="text-fg">{skill.name}</Badge>
          </li>
        ))}
      </ul>
    </article>
  );
}
```

- [x] **Step 2: Verify**

```bash
npx tsc --noEmit
npm run lint
```

- [x] **Step 3: Commit**

```bash
git add components/sections/tech-stack-card.tsx
git commit -m "feat(bento): add tech stack card"
```

---

### Task 5.2: Build the Athletics & Discipline card

**Files:**
- Create: `components/sections/discipline-card.tsx`

**Interfaces consumed:** `disciplinePhotos`.
**Interfaces produced:** `DisciplineCard` with props `{ className?: string }`.

This is the personality card: both Arnis photos, the stance shot as the resting image and the action shot revealed on hover or keyboard focus. It carries its own `id="discipline"` so the nav anchor lands on the card itself.

The source files are ~2 MB each at 3024×4032. The `sizes` values below matter — without them `next/image` would serve a far larger variant than the card ever displays.

- [x] **Step 1: Create `components/sections/discipline-card.tsx`**

```tsx
"use client";

import Image from "next/image";

import { disciplinePhotos } from "@/data/skills";
import { cn } from "@/lib/utils";

const [stance, action] = disciplinePhotos;

export function DisciplineCard({ className }: { className?: string }) {
  return (
    <article
      id="discipline"
      tabIndex={0}
      className={cn(
        "group relative flex flex-col justify-end overflow-hidden rounded-card border border-line bg-surface p-6 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        className,
      )}
    >
      <Image
        src={stance.src}
        alt={stance.alt}
        width={stance.width}
        height={stance.height}
        sizes="(min-width: 1024px) 50vw, 100vw"
        className="absolute inset-0 h-full w-full object-cover object-top opacity-70 transition-opacity duration-500 group-hover:opacity-0 group-focus-visible:opacity-0"
      />
      <Image
        src={action.src}
        alt={action.alt}
        width={action.width}
        height={action.height}
        sizes="(min-width: 1024px) 50vw, 100vw"
        className="absolute inset-0 h-full w-full object-cover object-top opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100"
      />

      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-bg via-bg/60 to-transparent"
      />

      <div className="relative flex flex-col gap-2">
        <span className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
          Athletics &amp; Discipline
        </span>
        <h3 className="text-2xl font-semibold tracking-tight text-fg">
          Competitive Arnis
        </h3>
        <p className="max-w-sm text-sm leading-relaxed text-muted">
          Training and competing in Arnis — the same repetition, timing, and
          composure under pressure that the work demands.
        </p>
      </div>
    </article>
  );
}
```

Do not add a `quality` prop to either image. Next.js 16 restricts `images.qualities` to `[75]` by default and would silently coerce any other value.

- [x] **Step 2: Verify**

```bash
npx tsc --noEmit
npm run lint
```

- [x] **Step 3: Commit**

```bash
git add components/sections/discipline-card.tsx
git commit -m "feat(bento): add arnis discipline card"
```

---

### Task 5.3: Assemble the bento grid section

**Files:**
- Create: `components/sections/bento-grid.tsx`
- Modify: `app/page.tsx`

**Interfaces produced:** `BentoGrid` (no props, async Server Component).

Layout: a 6-column grid on `lg`. The discipline card spans 3 columns and 2 rows so it reads as the visual anchor; the five skill cards fill the remaining cells, with the first one widened to keep the grid balanced.

- [x] **Step 1: Create `components/sections/bento-grid.tsx`**

```tsx
import { DisciplineCard } from "@/components/sections/discipline-card";
import { TechStackCard } from "@/components/sections/tech-stack-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { getSkillCategories } from "@/lib/queries";

export async function BentoGrid() {
  const categories = await getSkillCategories();

  return (
    <section id="stack" className="relative px-6 py-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-12">
        <SectionHeading eyebrow="Toolkit" title="Stack & Discipline" />

        <div className="grid auto-rows-[minmax(11rem,auto)] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <DisciplineCard className="min-h-80 sm:col-span-2 lg:col-span-3 lg:row-span-2" />

          {categories.map((category, index) => (
            <TechStackCard
              key={category.id}
              category={category}
              className={index === 0 ? "lg:col-span-3" : "lg:col-span-1"}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [x] **Step 2: Add the section to `app/page.tsx`**

```tsx
import { SiteHeader } from "@/components/layout/site-header";
import { BentoGrid } from "@/components/sections/bento-grid";
import { Hero } from "@/components/sections/hero";
import { ProjectsShowcase } from "@/components/sections/projects-showcase";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <ProjectsShowcase />
        <BentoGrid />
      </main>
    </>
  );
}
```

- [x] **Step 3: Verify**

```bash
npx tsc --noEmit
npm run lint
npm run build
npm run dev
```

Expected: a modular grid with the Arnis card dominating the left. Hovering it cross-fades the stance photo to the action photo; tabbing to it does the same. The "Stack" and "Discipline" nav links both scroll here. At 375px the grid collapses to one column with no horizontal overflow.

- [x] **Step 4: Commit**

```bash
git add components/sections/bento-grid.tsx app/page.tsx
git commit -m "feat(bento): assemble stack and discipline grid"
```

---

# Phase 6 — Contact, footer, full verification

### Task 6.1: Build the contact section and footer

**Files:**
- Create: `components/sections/contact.tsx`
- Create: `components/layout/site-footer.tsx`
- Modify: `app/page.tsx`

**Interfaces produced:** `Contact` (no props), `SiteFooter` (no props).

- [x] **Step 1: Create `components/sections/contact.tsx`**

```tsx
import { ArrowUpRight, Github, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { siteConfig } from "@/data/site";

export function Contact() {
  return (
    <section id="contact" className="relative overflow-hidden px-6 py-32">
      <div
        aria-hidden
        className="glow absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2"
      />

      <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-8 text-center">
        <SectionHeading
          eyebrow="Contact"
          title="Let's build something."
          className="items-center"
        />

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <a href={`mailto:${siteConfig.email}`}>
              <Mail aria-hidden />
              {siteConfig.email}
            </a>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href={siteConfig.githubUrl} target="_blank" rel="noopener noreferrer">
              <Github aria-hidden />
              GitHub
              <ArrowUpRight aria-hidden />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
```

- [x] **Step 2: Create `components/layout/site-footer.tsx`**

```tsx
import { Github, Mail } from "lucide-react";

import { siteConfig, socialLinks } from "@/data/site";

const socialIcons = { Github, Mail } as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-line px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
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

- [x] **Step 3: Complete `app/page.tsx`**

```tsx
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { BentoGrid } from "@/components/sections/bento-grid";
import { Contact } from "@/components/sections/contact";
import { Hero } from "@/components/sections/hero";
import { ProjectsShowcase } from "@/components/sections/projects-showcase";

export default function Home() {
  return (
    <>
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

- [x] **Step 4: Verify**

```bash
npx tsc --noEmit
npm run lint
npm run build
```

- [x] **Step 5: Commit**

```bash
git add components/sections/contact.tsx components/layout/site-footer.tsx app/page.tsx
git commit -m "feat(contact): add contact section and footer"
```

---

### Task 6.2: Full-site verification pass

**Files:** none created; fix whatever this task surfaces.

- [x] **Step 1: Clean production build**

```bash
rm -rf .next
npm run build
```

Expected: build completes with no errors and no warnings about missing `alt`, missing `sizes`, or unused imports.

- [x] **Step 2: Lint and type check**

```bash
npm run lint
npx tsc --noEmit
```

Expected: both clean.

- [x] **Step 3: Serve the production build and walk the page**

```bash
npm run start
```

At http://localhost:3000, confirm each item:

- [ ] All four nav links scroll smoothly to their sections: `#projects`, `#stack`, `#discipline`, `#contact`.
- [ ] The header is transparent at the top and gains a blurred background after scrolling.
- [ ] The hero portrait is fully visible, never cropped, at 375px / 768px / 1440px widths.
- [ ] The Resume button downloads `resume.pdf`.
- [ ] Every project card pins and stacks correctly, and no card overlaps the bento section.
- [ ] Cards with `liveUrl: null` or `repoUrl: null` render only the buttons they have.
- [ ] The Arnis card cross-fades on hover and on keyboard focus.
- [ ] The footer year is the current year.
- [ ] No horizontal scrollbar at 375px in any section.

- [x] **Step 4: Reduced-motion pass**

In DevTools → Rendering, set "Emulate CSS prefers-reduced-motion: reduce" and reload. Confirm: Lenis is off (no `lenis` class on `<html>`), the hero portrait appears without an entrance animation, and every project card is still fully readable.

- [x] **Step 5: Keyboard pass**

Tab through the page from the top. Confirm every link and button shows a visible accent focus ring, and that the Arnis card receives focus and swaps its photo.

- [x] **Step 6: Commit any fixes**

```bash
git add -A
git commit -m "fix: address full-site verification findings"
```

---

# Phase 7 — Signature visual upgrade

This phase pushes the site toward the landonorris.com feel with five signature elements: layered hero typography, an electric neon accent, a live telemetry bar, tilt-and-spotlight project cards, and page-wide grain and grid. Every code block below was type-checked, linted, built, and screenshot-verified at 375px, 768px, and 1440px before it was written into this plan. Copy the blocks exactly.

### Design tokens (reference)

The architect has **already rewritten `app/globals.css`** — it is modified but uncommitted in the working tree. Do not edit it. Task 7.1 commits it. Token names are unchanged from Phase 1, so every existing `bg-bg` / `text-accent` / `border-line` class picks up the new values automatically.

| Token | Value | Tailwind classes | Use |
| --- | --- | --- | --- |
| `--color-bg` | `#09090b` | `bg-bg`, `from-bg` | Page background |
| `--color-surface` | `#0f0f12` | `bg-surface` | Cards |
| `--color-elevated` | `#17171b` | `bg-elevated` | Default badges |
| `--color-line` | `#27272a` | `border-line` | Card borders, telemetry rules |
| `--color-line-strong` | `#3f3f46` | `border-line-strong` | Outline buttons, watermark stroke |
| `--color-fg` | `#fafafa` | `text-fg` | Primary text |
| `--color-muted` | `#a1a1aa` | `text-muted` | Secondary text |
| `--color-accent` | `#ccff00` | `bg-accent`, `text-accent`, `border-accent/50` | Neon: badges, borders, live dot, glows |
| `--color-accent-soft` | `#e2fd52` | `hover:bg-accent-soft` | Hover state of accent fills |
| `--color-accent-ink` | `#09090b` | `text-accent-ink` | Text on accent fills |
| `--font-display` | Anton (via `--font-anton`) | `font-display` | Watermark and hero headline |
| `--animate-pulse-dot` | 1.8s ring | `animate-pulse-dot` | Live status dot |

Custom utilities defined in `globals.css` with `@utility`:

| Utility | Effect |
| --- | --- |
| `text-outline` | Transparent fill, 1px `line-strong` stroke — hollow display type |
| `text-outline-accent` | Same, with a 60% neon stroke |
| `bg-grid` | 80px faint grid, radially faded toward the viewport edges |
| `bg-noise` | Tiled SVG `feTurbulence` grain; set strength with `opacity-*` |

The old `.grid-backdrop` class was **removed** — the page-wide `bg-grid` layer from Task 7.1 replaces it. The `.glow` class still exists, retuned to a 22% neon mix.

---

### Task 7.1: Commit tokens, add the display font, and mount the backdrop layers

**Files:**
- Commit (already modified by the architect — do not edit): `app/globals.css`
- Create: `components/layout/backdrop.tsx`
- Modify: `app/layout.tsx` (full replacement)

**Interfaces produced:** `Backdrop` (no props). The `font-display` utility becomes functional once `--font-anton` is defined by this task.

- [x] **Step 1: Confirm the token update is present**

```bash
git diff --stat app/globals.css
grep -n "ccff00\|@utility bg-noise\|--font-display" app/globals.css
```

Expected: `app/globals.css` shows as modified, and all three patterns match. If they do not match, stop and report — do not recreate the file.

- [x] **Step 2: Create `components/layout/backdrop.tsx`**

```tsx
/**
 * Page-wide atmosphere layers, fixed to the viewport so content scrolls over
 * them.
 *
 * The grid sits at `-z-10`: behind every section, but still above the canvas,
 * because `<body>`'s background propagates to the canvas (`<html>` has no
 * background of its own). The noise sits at `z-100`, above everything including
 * the header, and ignores the pointer so it never intercepts clicks.
 */
export function Backdrop() {
  return (
    <>
      <div aria-hidden className="bg-grid pointer-events-none fixed inset-0 -z-10" />
      <div
        aria-hidden
        className="bg-noise pointer-events-none fixed inset-0 z-100 opacity-[0.05]"
      />
    </>
  );
}
```

Do not add a background color to `<html>` anywhere. If `<html>` gets a background, the body background stops propagating to the canvas and paints over the `-z-10` grid.

- [x] **Step 3: Replace `app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Anton, Geist, Geist_Mono } from "next/font/google";

import { Backdrop } from "@/components/layout/backdrop";
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
      className={`${geistSans.variable} ${geistMono.variable} ${anton.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-bg font-sans text-fg">
        <Backdrop />
        <SmoothScrollProvider>{children}</SmoothScrollProvider>
      </body>
    </html>
  );
}
```

- [x] **Step 4: Verify**

```bash
npx tsc --noEmit
npm run lint
npm run build
npm run dev
```

Expected in the browser: every existing accent (the "Developer" headline word, category badges, focus rings, text selection) is now neon lime instead of orange. A faint 80px grid is visible across the whole page and stays fixed while content scrolls. A very subtle film grain sits over everything, including the header. The hero's old square grid is gone. Primary buttons are still white — that changes in Task 7.2.

- [x] **Step 5: Commit**

```bash
git add app/globals.css app/layout.tsx components/layout/backdrop.tsx
git commit -m "feat(theme): neon accent tokens, display font and backdrop layers"
```

---

### Task 7.2: Neon accent on buttons, badges, and skill cards

**Files:**
- Modify: `components/ui/button.tsx` (full replacement)
- Modify: `components/ui/badge.tsx` (full replacement)
- Modify: `components/sections/tech-stack-card.tsx` (full replacement)

**Interfaces produced:** `Button` keeps its exact props (`variant: "primary" | "outline" | "ghost"`, `size`, `asChild`). `Badge` gains `variant?: "default" | "accent"` and exports `badgeVariants`. Existing `<Badge className="...">` call sites keep compiling.

- [x] **Step 1: Replace `components/ui/button.tsx`**

Primary becomes a neon fill with dark ink and a glow on hover. Outline gets a stronger hairline and a softer glow. `transition-colors` widens to include `box-shadow` so the glow animates.

```tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium tracking-tight transition-[color,background-color,border-color,box-shadow] duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-accent text-accent-ink hover:bg-accent-soft hover:shadow-[0_0_32px_-6px_var(--color-accent)]",
        outline:
          "border border-line-strong bg-transparent text-fg hover:border-accent hover:text-accent hover:shadow-[0_0_32px_-10px_var(--color-accent)]",
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

- [x] **Step 2: Replace `components/ui/badge.tsx`**

`BadgeProps` is a type alias rather than an empty `interface … extends` so the `@typescript-eslint/no-empty-object-type` rule never fires.

```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 font-mono text-xs tracking-tight transition-colors",
  {
    variants: {
      variant: {
        default: "border-line bg-elevated text-muted",
        accent: "border-accent/40 bg-accent/10 text-accent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export type BadgeProps = React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}

export { badgeVariants };
```

- [x] **Step 3: Replace `components/sections/tech-stack-card.tsx`**

Adds a neon border and outer glow on hover, and lights the card label.

```tsx
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SkillCategory } from "@/types";

export interface TechStackCardProps {
  category: SkillCategory;
  className?: string;
}

export function TechStackCard({ category, className }: TechStackCardProps) {
  return (
    <article
      className={cn(
        "group flex flex-col gap-4 rounded-card border border-line bg-surface p-6 transition-[border-color,box-shadow] duration-300 hover:border-accent/50 hover:shadow-[0_0_40px_-16px_var(--color-accent)]",
        className,
      )}
    >
      <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-muted transition-colors group-hover:text-accent">
        {category.label}
      </h3>
      <ul className="flex flex-wrap gap-2">
        {category.skills.map((skill) => (
          <li key={skill.name}>
            <Badge className="text-fg">{skill.name}</Badge>
          </li>
        ))}
      </ul>
    </article>
  );
}
```

- [x] **Step 4: Verify**

```bash
npx tsc --noEmit
npm run lint
npm run build
npm run dev
```

Expected: the hero GitHub button and the "Live Demo" buttons are neon with near-black text and glow on hover. Outline buttons turn neon on hover. Hovering a skill card in the bento grid gives it a neon border, a soft outer glow, and a neon label.

- [x] **Step 5: Commit**

```bash
git add components/ui/button.tsx components/ui/badge.tsx components/sections/tech-stack-card.tsx
git commit -m "feat(ui): neon accent buttons, badges and skill card glow"
```

---

### Task 7.3: Build the telemetry bar

**Files:**
- Modify: `data/site.ts` (full replacement)
- Create: `hooks/use-local-time.ts`
- Create: `components/sections/telemetry-bar.tsx`

**Interfaces produced:** `siteConfig` gains `watermark: "DEVELOPER"`, `availability: { isAvailable: true; label: string }`, `timeZone: "Asia/Manila"`, `timeZoneLabel: "GMT+8"`. `useLocalTime(timeZone: string): string | null`. `TelemetryBar` (props `{ className?: string }`). Task 7.4 renders the bar and reads `siteConfig.watermark`.

- [x] **Step 1: Replace `data/site.ts`**

The existing fields are unchanged; four fields are added at the end of `siteConfig`.

```ts
import type { SocialLink } from "@/types";

export const siteConfig = {
  name: "Your Name",
  initials: "YN",
  role: "Full Stack Developer",
  description:
    "Full Stack Developer building web applications, games, and the systems behind them.",
  url: "https://example.com",
  email: "you@example.com",
  githubUrl: "https://github.com/your-handle",
  resumePath: "/resume.pdf",
  /**
   * Giant outline word layered behind the hero portrait. The type size is
   * tuned for roughly 9 characters; much longer words bleed off both edges.
   */
  watermark: "DEVELOPER",
  /** Drives the pulsing status dot in the hero telemetry bar. */
  availability: {
    isAvailable: true,
    label: "Available for work",
  },
  /** IANA zone for the telemetry clock. Asia/Manila is GMT+8 with no DST. */
  timeZone: "Asia/Manila",
  timeZoneLabel: "GMT+8",
} as const;

export const socialLinks: SocialLink[] = [
  { label: "GitHub", href: siteConfig.githubUrl, icon: "Github" },
  { label: "Email", href: `mailto:${siteConfig.email}`, icon: "Mail" },
];
```

- [x] **Step 2: Create `hooks/use-local-time.ts`**

This uses `useSyncExternalStore`, not `useState` + `useEffect`. Two reasons: the server snapshot is `null`, so server-rendered and hydrated markup always match (a clock rendered on the server would be seconds stale and trigger a hydration mismatch); and it avoids calling `setState` inside an effect, which the React Compiler lint rules in this ESLint config discourage. Do not "simplify" it into an effect.

```ts
import { useSyncExternalStore } from "react";

const formatters = new Map<string, Intl.DateTimeFormat>();

function getFormatter(timeZone: string) {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    formatters.set(timeZone, formatter);
  }
  return formatter;
}

function subscribe(onStoreChange: () => void) {
  const id = window.setInterval(onStoreChange, 1000);
  return () => window.clearInterval(id);
}

/**
 * Current wall-clock time in `timeZone` as "HH:MM:SS", updating once a second.
 *
 * Returns null on the server and during hydration, so server and client markup
 * always match; callers render a placeholder for null. The snapshot is a
 * string, so React compares it by value and the component only re-renders when
 * the displayed second actually changes.
 */
export function useLocalTime(timeZone: string): string | null {
  return useSyncExternalStore(
    subscribe,
    () => getFormatter(timeZone).format(new Date()),
    () => null,
  );
}
```

- [x] **Step 3: Create `components/sections/telemetry-bar.tsx`**

Layout: status on the left, role in the center (`md` and up), clock on the right. The pulsing ring is a CSS animation, so the existing global `prefers-reduced-motion` rule in `globals.css` already stops it — the solid dot stays. Do **not** add `aria-live` to the clock; it would announce every second to screen readers.

```tsx
"use client";

import { siteConfig } from "@/data/site";
import { useLocalTime } from "@/hooks/use-local-time";
import { cn } from "@/lib/utils";

export function TelemetryBar({ className }: { className?: string }) {
  const time = useLocalTime(siteConfig.timeZone);
  const { availability } = siteConfig;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 border-y border-line py-3 font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-muted",
        className,
      )}
    >
      <p className="flex items-center gap-3">
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

      <p className="hidden md:block">{siteConfig.role}</p>

      <p className="flex items-center gap-2 tabular-nums">
        <span className="hidden sm:inline">Local</span>
        <span className="text-fg">{time ?? "--:--:--"}</span>
        <span className="text-accent">{siteConfig.timeZoneLabel}</span>
      </p>
    </div>
  );
}
```

- [x] **Step 4: Verify**

```bash
npx tsc --noEmit
npm run lint
npm run build
```

The bar is not rendered until Task 7.4; these checks confirm it compiles.

- [x] **Step 5: Commit**

```bash
git add data/site.ts hooks/use-local-time.ts components/sections/telemetry-bar.tsx
git commit -m "feat(hero): add live telemetry bar with status dot and local clock"
```

---

### Task 7.4: Rebuild the hero with layered typography

**Files:**
- Modify: `components/sections/hero-visual.tsx` (full replacement)
- Modify: `components/sections/hero.tsx` (full replacement)

**Interfaces consumed:** `TelemetryBar`, `siteConfig.watermark`, `Button`, the `font-display`, `text-outline`, `glow`, `bg-linear-to-t` utilities.
**Interfaces produced:** `HeroVisual` now takes props `{ watermark: string }`. `Hero` still takes no props, so `app/page.tsx` needs no change.

Composition, back to front:

1. **Glow** — neon bloom behind the portrait.
2. **Watermark** — giant hollow Anton "DEVELOPER", bleeding off both edges.
3. **Portrait** — `hero-portrait.png` is a true transparent cutout (verified: ~69% of pixels have alpha 0; the subject fills the middle ~55% of the width and touches the bottom edge). Because it comes after the watermark in the DOM, the head and hood paint over the letters.
4. **Fade** — a bottom gradient hides the waist cut.
5. **Copy** — the solid Anton headline and the buttons. On `lg` they sit across the bottom of the stage overlapping the faded portrait; below `lg` they flow underneath it.

On scroll the portrait sinks and the watermark rises, so the layers separate in depth. With reduced motion both stay still and the entrance animations are skipped.

- [x] **Step 1: Replace `components/sections/hero-visual.tsx`**

Two details that must not change:

- **The watermark is nested inside the portrait layer.** That keeps it positioned relative to the portrait at every viewport size, so the head always overlaps the letters.
- **`preload`, not `priority`.** `priority` is deprecated in Next.js 16. The portrait is the single LCP image, which is the case `preload` is for.

```tsx
"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

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
         * Layer 1: outline watermark. It comes first in the DOM, so the
         * portrait after it paints on top. `justify-center` on an overflowing
         * flex item bleeds equally off both sides, which is intended.
         */}
        <motion.div
          aria-hidden
          style={{ y: reduceMotion ? 0 : watermarkY }}
          className="pointer-events-none absolute inset-x-0 top-[16%] flex select-none justify-center"
        >
          <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: 48 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, ease: EASE_OUT_EXPO }}
            className="whitespace-nowrap font-display text-[clamp(4.5rem,21vw,22rem)] uppercase leading-[0.8] text-outline"
          >
            {watermark}
          </motion.p>
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
            className="object-contain object-bottom"
          />
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

- [x] **Step 2: Replace `components/sections/hero.tsx`**

`lg:min-h-svh` is deliberate: the hero is a full-viewport stage only on large screens. On phones a forced full height left a large empty band above the portrait.

```tsx
import { CodeXml, Download } from "lucide-react";

import { HeroVisual } from "@/components/sections/hero-visual";
import { TelemetryBar } from "@/components/sections/telemetry-bar";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/data/site";

export function Hero() {
  return (
    <section
      id="hero"
      className="relative flex flex-col overflow-hidden px-6 pt-24 pb-10 lg:min-h-svh"
    >
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
    </section>
  );
}
```

- [x] **Step 3: Verify**

```bash
npx tsc --noEmit
npm run lint
npm run build
npm run dev
```

Expected at 1440×900:

- The telemetry bar sits under the floating header: pulsing neon dot and "AVAILABLE FOR WORK" on the left, "FULL STACK DEVELOPER" centered, "LOCAL HH:MM:SS GMT+8" on the right, ticking every second.
- A giant hollow "DEVELOPER" spans nearly the full width, and **the hood and face sit in front of the middle letters**.
- The solid "FULL STACK / DEVELOPER" headline sits bottom-left overlapping the portrait's faded lower edge; the neon GitHub button and outline Resume button sit bottom-right.
- Scrolling down, the watermark drifts up faster than the portrait.

Expected at 375px (DevTools device toolbar): the portrait is large and centered with the watermark behind the hood, the headline and stacked buttons sit below it, the clock shows without the "Local" label, and **there is no horizontal scrollbar**. In DevTools run `document.documentElement.scrollWidth === window.innerWidth` — it must return `true`.

With "Emulate CSS prefers-reduced-motion: reduce": no entrance animation, no parallax, and the status dot is solid with no ring.

- [x] **Step 4: Commit**

```bash
git add components/sections/hero-visual.tsx components/sections/hero.tsx
git commit -m "feat(hero): layered watermark typography with parallax portrait"
```

---

### Task 7.5: Add mouse-tracked tilt and spotlight to project cards

**Files:**
- Create: `hooks/use-pointer-tilt.ts`
- Modify: `components/sections/project-card.tsx` (full replacement)

**Interfaces produced:** `usePointerTilt({ disabled?: boolean }): { handlers: { onPointerMove, onPointerLeave }; tiltStyle: { rotateX, rotateY, transformPerspective } | undefined; spotlight: MotionValue<string> }`. `ProjectCard` props are unchanged, so `projects-stack.tsx` needs no change.

The card now has three nested layers, and the split is load-bearing:

| Layer | Element | Responsibility |
| --- | --- | --- |
| Sticky | `div.sticky` | Pins the card while the stack scrolls (unchanged) |
| Scroll | `motion.div` | Stack `scale` and `top` offset, **and** receives pointer events |
| Tilt | `motion.article` | `rotateX` / `rotateY`, spotlight overlay, neon border glow |

Pointer events must be measured on the scroll layer, never on the rotating article. `getBoundingClientRect()` on a rotating element changes as it rotates, which feeds back into the pointer math and makes the card jitter. The scroll layer only scales uniformly around its center, so normalized 0–1 pointer coordinates stay correct.

- [ ] **Step 1: Create `hooks/use-pointer-tilt.ts`**

```ts
import type { PointerEvent as ReactPointerEvent } from "react";
import {
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";

const MAX_TILT_DEG = 6;
const TILT_SPRING = { stiffness: 200, damping: 20, mass: 0.5 };

/**
 * Mouse-tracked 3D tilt plus a radial spotlight that follows the cursor.
 *
 * - Spread `handlers` onto an element that does NOT rotate. Measuring the
 *   rotating element itself feeds the tilt back into the pointer math and
 *   makes the card jitter.
 * - Apply `tiltStyle` to the child that should rotate.
 * - Use `spotlight` as the `background` of an overlay inside that child.
 *
 * Only mouse input is tracked, so touch scrolling never tilts anything.
 */
export function usePointerTilt({ disabled = false }: { disabled?: boolean } = {}) {
  // Pointer position within the element, 0–1 per axis; 0.5 is dead center.
  const pointerX = useMotionValue(0.5);
  const pointerY = useMotionValue(0.5);

  const rotateX = useSpring(
    useTransform(pointerY, [0, 1], [MAX_TILT_DEG, -MAX_TILT_DEG]),
    TILT_SPRING,
  );
  const rotateY = useSpring(
    useTransform(pointerX, [0, 1], [-MAX_TILT_DEG, MAX_TILT_DEG]),
    TILT_SPRING,
  );

  const spotX = useTransform(pointerX, (value) => `${value * 100}%`);
  const spotY = useTransform(pointerY, (value) => `${value * 100}%`);
  const spotlight = useMotionTemplate`radial-gradient(520px circle at ${spotX} ${spotY}, color-mix(in oklab, var(--color-accent) 14%, transparent), transparent 70%)`;

  function onPointerMove(event: ReactPointerEvent<HTMLElement>) {
    if (event.pointerType !== "mouse") return;
    const rect = event.currentTarget.getBoundingClientRect();
    pointerX.set((event.clientX - rect.left) / rect.width);
    pointerY.set((event.clientY - rect.top) / rect.height);
  }

  function onPointerLeave() {
    pointerX.set(0.5);
    pointerY.set(0.5);
  }

  return {
    handlers: { onPointerMove, onPointerLeave },
    tiltStyle: disabled ? undefined : { rotateX, rotateY, transformPerspective: 1000 },
    spotlight,
  };
}
```

- [ ] **Step 2: Replace `components/sections/project-card.tsx`**

The category badge switches from a hand-written `className` to `variant="accent"` from Task 7.2. With reduced motion, tilt is disabled but the spotlight and border glow remain — they are color changes, not motion.

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

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit
npm run lint
npm run build
npm run dev
```

Expected: move the mouse over a pinned project card. The card tilts up to 6° toward the cursor with a springy follow, a soft neon spotlight tracks the cursor inside the card, the border turns neon, and a neon glow appears around the card. Moving the mouse off the card eases it back flat and fades the spotlight out. The scroll-stack scaling from Phase 4 still works while hovering. In DevTools device mode with touch emulation, dragging over a card must **not** tilt it. With reduced motion emulated, the card does not tilt but the spotlight and glow still appear.

- [ ] **Step 4: Commit**

```bash
git add hooks/use-pointer-tilt.ts components/sections/project-card.tsx
git commit -m "feat(projects): mouse-tracked card tilt with neon spotlight"
```

---

### Task 7.6: Phase 7 verification pass

**Files:** none created; fix whatever this task surfaces.

- [ ] **Step 1: Clean build, lint, type check**

```bash
rm -rf .next
npm run build
npm run lint
npx tsc --noEmit
```

Expected: all clean, and no `priority` deprecation warning in the build output.

- [ ] **Step 2: Walk the five signature elements on the production build**

```bash
npm run start
```

- [ ] **Layered typography:** at 1440px, 768px, and 375px, the hood and face overlap the hollow "DEVELOPER" watermark.
- [ ] **Neon accent:** badges, primary buttons, focus rings, the live dot, and hover glows are `#ccff00`; the page background is `#09090b`.
- [ ] **Telemetry:** the clock ticks every second in GMT+8 and matches the actual time in Manila; the status dot pulses.
- [ ] **Tilt + spotlight:** project cards tilt and spotlight under the mouse, and do not tilt on touch.
- [ ] **Noise + grid:** grain is faintly visible over the whole page including the header, and the grid stays fixed while scrolling. Neither blocks clicks: every nav link, button, and card link still works.

- [ ] **Step 3: Regression checks from Task 6.2**

- [ ] `document.documentElement.scrollWidth === window.innerWidth` is `true` at 375px, 768px, and 1440px.
- [ ] All four nav links still scroll to their sections.
- [ ] Reduced motion: no Lenis, no parallax, no entrance animations, no tilt, no pulse ring.
- [ ] Keyboard: every link and button still shows the (now neon) focus ring; the Arnis card still swaps photos on focus.

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: address phase 7 verification findings"
```

---

## Handoff checklist

Report these to the repository owner when Phase 7 is done:

1. `data/site.ts` — name, initials, email, GitHub URL, and site URL are placeholders. Also confirm `availability.isAvailable`, `timeZone` / `timeZoneLabel` (set to `Asia/Manila` / `GMT+8`), and the `watermark` word (sized for ~9 characters).
2. `data/projects.ts` — three structurally complete example projects need replacing with real ones. Adding or removing entries automatically changes the scroll-stack height; no component edits needed.
3. `public/resume.pdf` — a minimal placeholder PDF; replace with the real résumé.
4. Optional next steps, not in scope for v1: a `/projects/[slug]` detail route, and the Supabase swap (replace the two function bodies in `lib/queries.ts`; the `Project` and `SkillCategory` fields map 1:1 to columns, snake_case in Postgres).
