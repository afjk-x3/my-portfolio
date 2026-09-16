# Project Memory & Guidelines: Developer Portfolio

## Role & Responsibilities
- You are the Lead Architect and Planner.
- Your primary responsibility is requirements analysis, system design, component boundaries, and maintaining an atomic task list in `tasks.md`.
- Implementation is executed by OpenCode (the Builder) reading from `tasks.md`.

## Tech Stack & Architecture
- Framework: Next.js (App Router, Turbopack, TypeScript)
- Directory convention: Root `app/`, `components/`, `data/`, `types/`, `lib/` (no `src/` directory).
- Styling: Tailwind CSS, shadcn/ui conventions.
- Animations: Framer Motion and smooth scroll (Lenis).
- Data: Typed static data in `data/projects.ts` and `data/skills.ts` (architected for future Supabase migration).

## Build & Validation Commands
- Dev server: `npm run dev`
- Build check: `npm run build`
- Lint: `npm run lint`

## Design Directives
- Aesthetic: Inspired by landonorris.com (sleek dark aesthetic, high-contrast typography, racing/telemetry motifs).
- Static assets:
  - Hero image: `/images/hero/hero-portrait.png`
  - Bento / Discipline photos: `/images/about/arnis-stance.jpg` and `/images/about/arnis-action.jpg`