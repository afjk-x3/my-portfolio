# Projects as a standings list — Design

**Date:** 2026-10-24
**Status:** Approved by the owner on 2026-10-24; built in Phase 19 of `tasks.md`
**Replaces:** the pinned card stack in `#projects` (`projects-stack.tsx`, `project-card.tsx`)

## Intent

With six real projects, the pinned stack gives each one a full screen of scrolling: about six screens of mostly text before the visitor reaches the Stack section. The owner finds one card per project a hassle. A recruiter should be able to see every project at a glance and open the one they care about.

## Goals, non-goals, anti-goals

- **Goals:** all six projects visible within about one screen; one click or tap opens a project's details; the racing theme carries through; it works with text only, as the content is today.
- **Non-goals:** project screenshots or hover thumbnails (they wait for the owner's images), filtering by category, separate case study pages.
- **Anti-goals:** nothing that only works on hover; no pinned or scroll-hijacking sections; no layout that looks empty until screenshots arrive.

## Approaches considered

| Approach | Trade-off | Outcome |
| --- | --- | --- |
| **A. Standings list** — one row per project like race results, a row expands in place | Scans in one screen and works with text only; no project stands out visually until screenshots exist | **Chosen by the owner** |
| B. Two featured cards, the rest listed | Spotlights the best work, but the big cards look empty without screenshots and need a "featured" choice | Not chosen |
| C. Grid of six cards | Familiar and scannable, but six text boxes without screenshots, and it repeats the Stack section's card grid right below | Not chosen |
| Sideways-scrolling strip | Hijacks scrolling (a motion-sickness risk) and is still long | Dropped before presenting |

## Decided by the owner

- The projects section becomes a standings list (approach A).

## The design (architect's calls, open to correction)

- **Rows:** one per project, in `order`. Columns: position (`P1`–`P6`, mono), project title, category label, year, and an open/close chevron. Below `md`, category and year move under the title so a row stays one line wide.
- **Expanding:** one row open at a time; opening another closes the previous one. **P1 starts open**, so the section never looks like a bare table and shows what a row holds. Clicking the open row closes it.
- **Open row:** the same content the card has today: summary, description, tech badges, and the Live Demo / Repository buttons (each only when its URL exists).
- **Look:** hairline rows (`border-line`) on the page background, no card boxes. The open row and the hovered row get the lime accent on the position number and a faint surface tint. Hover is only a highlight; everything works by click, tap, and keyboard.
- **Motion:** the open row's details expand with a short height animation; with reduced motion they appear at once.
- **Deep links:** each row keeps `id={slug}`. Loading `/#<slug>`, or changing the hash to it, opens that row; `scroll-padding-top` already keeps it clear of the header. The rows are no longer pinned, so the marker spans from Phase 18 are no longer needed.
- **Accessibility:** each row's header is a `<button aria-expanded aria-controls>` inside an `<h3>`, and the details are a `role="region"` labelled by it. Rows are at least 44px tall, with the accent focus ring.
- **Removed:** the pinned stack, the card's 3D tilt and spotlight, and `hooks/use-pointer-tilt.ts` (nothing else uses it).
- **Unchanged:** `data/projects.ts`, the `Project` type, and the `getProjects()` data seam.

## Left to the builder

Exact spacing, type sizes, and animation timing, within the design system in `tasks.md`.
