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
