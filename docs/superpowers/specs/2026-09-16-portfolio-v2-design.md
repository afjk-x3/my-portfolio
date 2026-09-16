# Portfolio v2 — Design Spec

**Date:** 2026-09-16
**Status:** Approved in brainstorming, awaiting owner review of this document
**Builds on:** Phases 1–10 in `tasks.md` (single-page portfolio, telemetry styling, headgear reveal, preloader)

---

## 1. Context

The portfolio began as an OJT challenge from the owner's team lead: recreate the craft of landonorris.com. Phases 1–10 delivered a dark, neon-lime, telemetry-styled single page with a cursor-driven headgear reveal and a gothic monogram preloader.

v2 turns that recreation into the owner's own brand while making it useful for job hunting.

**Owner profile:** IT student currently on OJT, full-stack developer, competitive Arnis athlete, based in the Philippines.

**Goals, in priority order:**

1. **Personal brand** — a visitor should remember *who* the owner is (developer + Arnis athlete + Filipino), not only what they built.
2. **Job hunting** — a recruiter should be able to judge the owner's work in under two minutes and link directly to a single project.
3. **Craft** — keep the landonorris.com level of polish that started the project.

**Non-goals:** blog, CMS/admin panel, light mode, custom cursor, WebGL, contact form, testimonials.

---

## 2. Decisions made

| Topic | Decision |
| --- | --- |
| Structure | Home stays one scroll page; each project gets a `/projects/[slug]` case study page. |
| Visual direction | Keep the dark telemetry base and blend in Filipino/Arnis identity. No new accent colour; neon lime stays the only accent. |
| Motifs | Baybayin accents, Arnis strike lines, woven (inabel-inspired) texture. |
| Copy voice | Confident and disciplined: short, direct sentences with an athlete's mindset. |
| Sequencing | Identity system first, then case studies, then new home sections, then polish. Nothing is styled twice. |
| Case study content | Typed data extending `Project` in `data/projects.ts`, not MDX. Keeps the `lib/queries.ts` Supabase seam. |
| Timeline | No deadline. Quality first; each phase ships and is verified before the next. |
| Home sections | Four candidates are designed (§6). **The owner picks which to build before Phase 13 is planned.** |
| Analytics | Vercel Web Analytics, added in Phase 14. |

---

## 3. Delivery phases

| Phase | Name | Depends on |
| --- | --- | --- |
| 11 | Identity system + full-hero cursor reveal | — |
| 12 | Project case studies | 11 |
| 13 | New home sections (owner's selection) | 11; Experience links to 12 |
| 14 | Polish and reach | 11–13 |

Each phase is written into `tasks.md` as atomic builder tasks only when the previous phase is verified.

---

## 4. Phase 11 — Identity system and full-hero cursor reveal

### 4.1 Principle

Telemetry is the structure; Filipino/Arnis identity is the texture. Motifs appear as lines, patterns, and small script accents — never as new colour blocks. Every motif degrades cleanly under `prefers-reduced-motion`.

### 4.2 Baybayin accents

- **Font:** Noto Sans Tagalog via `next/font/google` (confirmed available in the installed Next.js font data), exposed as `--font-baybayin` / `font-baybayin`.
- **Single source of truth:** `data/baybayin.ts` exports every baybayin string used on the site. Each entry has `id`, `text` (baybayin), `latin` (romanised source), `meaning` (English), and `reviewed: boolean`.
- **Review gate:** transliteration errors are easy to make and publicly embarrassing. The owner or a baybayin reader confirms every entry and flips `reviewed` to `true` before launch. Phase 14 verification fails if any entry is unreviewed.
- **Placements:**
  - Preloader: the owner's name in baybayin beneath the monogram.
  - Section eyebrows: `SectionHeading` gains an optional `script` prop rendered beside the index and English label, e.g. `01 · <baybayin> · PROJECTS`.
  - Hero: one faint line under the headline.
- **Accessibility:** all baybayin is decorative (`aria-hidden`) and always sits next to English.

### 4.3 Arnis strike lines

- **Component:** `components/ui/strike-line.tsx` — an SVG diagonal that draws in (`pathLength` 0→1) when scrolled into view, with an optional telemetry label such as `ANGLE 01 // 45°`.
- **Angles:** `data/strike-angles.ts` maps angle numbers to degrees. The owner competes in sport Arnis (live stick, padded stick, and anyo) with a Modern Arnis background, so numbering follows the twelve basic strikes as taught for sport Arnis anyo. Numbering differs between systems, so the owner confirms each number-to-degree entry; until then the file carries `confirmed: false` and the Phase 14 gate treats it like unreviewed baybayin.
- **Placements:** section dividers (replacing plain borders), button hover (a diagonal slash wipe replaces the flat fill change), and the case study page entry wipe (Phase 12).
- **Reduced motion:** lines render fully drawn; wipes become fades.

### 4.4 Woven texture

- **Utility:** `bg-weave` in `app/globals.css` — an inline SVG diamond-twill pattern loosely inspired by Ilocano inabel. No image request.
- **Strength:** 3–5% opacity on surfaces; ~8% inside the hero reveal layer (§4.5).
- **Placements:** case study header band, Arnis band (if built), footer, and the hero reveal layer. The page-wide racing grid stays everywhere else.
- **Cultural care:** the pattern is generic geometry. It must not reproduce T'boli t'nalak designs, which originate in dream-weaving and carry cultural meaning.

### 4.5 Full-hero cursor reveal

**Reference behaviour (observed on landonorris.com, 2026-09-16):** the reveal responds anywhere in the hero, not just over the face. Two full-screen layers exist; the blob shows the hidden one — a patterned background everywhere, a helmet over the head. The trail lingers briefly and shrinks away.

**Current behaviour:** `components/sections/headgear-reveal.tsx` tracks the pointer only inside the portrait box and reveals only the headgear photo, so moving the cursor away from the face has no visible effect.

**Target behaviour:**

- Pointer tracking covers the entire hero section.
- **Hidden layer contents, back to front:**
  1. Woven diamond pattern at ~8% white.
  2. Arnis strike slashes: 3–5 bold lime diagonals at real attack angles spanning the whole hero, so only fragments show through the blob.
  3. The `DEVELOPER` watermark, solid lime, aligned exactly with the outline watermark.
  4. The headgear photo over the face, at the existing calibrated `HEADGEAR` position.
- Outside the blob nothing changes: outline watermark, grid, portrait, faint headgear ghost.
- **Trail:** "ink drops" replace the chained 8-circle trail. Drops are emitted along the pointer path; each shrinks to zero over ~1 s, so fast movement leaves a lingering, fading trail.

**Architecture:**

- **Shared trail state** in viewport coordinates, produced by one hook (`hooks/use-ink-trail.ts`) running a single `requestAnimationFrame` loop that writes to a mutable store (no React re-render per frame). The loop runs only while the hero is in view.
- **One masked SVG per coordinate space.** The watermark and the portrait move with separate parallax transforms, so a single hero-wide mask cannot stay aligned with both. Each revealed layer lives in its own SVG inside the element it must align with, and converts the shared trail into local coordinates with its own `getScreenCTM()` — the technique the current component already uses successfully.
  - Hero-wide SVG: weave + strike slashes.
  - Watermark SVG: the watermark rendered as SVG `<text>` for **both** the outline and the lime fill, so the two share identical geometry. The HTML outline watermark is replaced by this SVG.
  - Portrait SVG: headgear ghost + masked headgear (the existing component, refactored to consume the shared trail).
- **Filter cost:** each gooey filter's region is set every frame to the bounding box of the live drops (plus blur margin), never the full hero.
- **Modes (unchanged policy):** fine pointer → cursor-driven; touch → a blob wanders over the face; reduced motion → a fixed reveal over the face with no animation.
- **Pointer events:** all reveal SVGs stay `pointer-events: none`; the headline and buttons remain clickable.
- **Headgear branding:** the architect removes the STIX logo from `public/images/hero/headgear.webp` and `headgear-ghost.webp` (painted over to match the surrounding padding) before this phase's tasks are written. File names, dimensions, and the `HEADGEAR` / `FACE` constants stay unchanged.

**Acceptance criteria:**

- Moving the cursor anywhere in the hero shows the hidden layer inside the blob.
- The lime watermark fill never visibly misaligns with the outline, including mid-parallax scroll.
- A steady 60 fps while moving the cursor on a mid-range laptop (Chrome Performance panel, 4× CPU throttle shows no long frames attributable to the reveal).
- No layout shift, no horizontal overflow at 375 / 768 / 1440 px, clean console.
- No WebGL and no new runtime dependencies.

---

## 5. Phase 12 — Project case studies

### 5.1 Route

- `app/projects/[slug]/page.tsx`, statically generated from the project list (`generateStaticParams`), with per-project `generateMetadata`.
- Unknown slug → `notFound()`.
- New `app/not-found.tsx`: styled 404 reading `DNF // DID NOT FINISH`, with a link home.
- Next.js 16 async `params` conventions apply; the plan verifies them against `node_modules/next/dist/docs/`.

### 5.2 Data

`types/index.ts` gains:

```ts
interface CaseStudyStep { title: string; body: string }
interface CaseStudyResult { value: string; label: string }
interface CaseStudyImage { src: string; alt: string; caption: string; width: number; height: number }

interface CaseStudy {
  role: string;          // "Full-stack developer"
  timeframe: string;     // "Jan–Apr 2026"
  team: string;          // "Solo" | "Team of 4"
  problem: string;
  approach: CaseStudyStep[];
  highlights: CaseStudyStep[];
  results: CaseStudyResult[];
  gallery: CaseStudyImage[];
  lessons: string;
}
```

- `Project` gains `caseStudy: CaseStudy | null`. Projects without one remain card-only.
- `lib/queries.ts` gains `getProjectBySlug(slug): Promise<Project | null>`.
- Future Supabase shape: `case_study` as a single `jsonb` column on `projects`.

### 5.3 Page layout

1. **Header band** on `bg-weave`: category eyebrow, title in Anton, spec row `ROLE / YEAR / TEAM / STACK / STATUS`, Live and Repo buttons when URLs exist.
2. **Body**, separated by strike lines: `01 Problem`, `02 Approach` (numbered sectors), `03 Highlights`, `04 Results` (large telemetry numbers), `05 Gallery`, `06 Lessons`. Empty arrays hide their section.
3. **Footer:** `NEXT LAP →` card linking to the next project by `order` (wrapping to the first), and `← Back to projects` linking to `/#projects`.
4. **Entry:** diagonal wipe on mount; fade under reduced motion.

### 5.4 Changes to existing components

- `project-card.tsx`: "Read case study" button, and the title becomes a link, when `caseStudy` is non-null.
- `site-header.tsx`: on `/`, anchors smooth-scroll through Lenis as today; on any other route, links navigate to `/#<anchor>`.
- The preloader remains mounted only on `/`; returning home in the same session does not replay it.

### 5.5 Confidential OJT work

No special mode. The owner writes confidential case studies without the company name or private screenshots (e.g. "Internal dispatch dashboard for a logistics company").

---

## 6. Phase 13 — New home sections (owner selects)

Each section is independent: its own data file, query, and component. Any subset can ship.

**Proposed order with all four:** Hero → About → Projects → Experience → Arnis → Stack → Now → Contact.

### 6.1 About (`#about`)

- Left: 2–3 short paragraphs in the confident/disciplined voice, ending with a "Looking for" line (role type and availability).
- Right: quick-facts telemetry panel, e.g. `BASE // PH`, `STATUS // STUDENT + OJT`, `FOCUS // FULL-STACK`, `DISCIPLINE // ARNIS`.
- Data: `data/about.ts`. Motion: line-by-line reveal on scroll.

### 6.2 Experience (`#experience`)

- Vertical timeline of "sectors" (`S1`, `S2`, …) joined by strike-line ticks.
- Each entry: dates, organisation, role, 2–3 achievement points, tech badges, optional link to a case study.
- Data: `data/experience.ts`, query `getExperience()`.

```ts
interface ExperienceEntry {
  id: string;
  kind: "work" | "education" | "milestone";
  org: string;
  role: string;
  start: string;        // "2026-01"
  end: string | null;   // null = present
  points: string[];
  techStack: string[];
  projectSlug?: string;
  order: number;
}
```

### 6.3 Arnis (`#arnis`)

- Stats row with count-up numbers: years trained, competitions, gold / silver / bronze.
- Standings table `POS | EVENT | CATEGORY | YEAR`, first places highlighted in lime. `CATEGORY` uses the sport Arnis disciplines the owner competes in: `LIVE STICK`, `PADDED STICK`, `ANYO` (plus weight or division where relevant).
- 2–3 action photos with strike-line hover wipes, on `bg-weave`.
- Data: `data/arnis.ts`, query `getArnisRecord()`.
- **If built:** the Arnis card leaves the bento grid (which becomes tech-only) and the nav label changes from "Discipline" to "Arnis". **If not built:** the bento grid stays as is.

### 6.4 Now (`#now`)

- "Building / Learning / Training" list with a `LAST SYNC // <month year>` stamp from `data/now.ts`.
- GitHub contribution graph fetched server-side from the GitHub GraphQL API using `GITHUB_TOKEN`, revalidated daily, drawn as a custom lime grid.
- **Failure handling:** a missing token or failed request hides the graph and logs a server warning; the list still renders and the build never fails because of GitHub.

### 6.5 Navigation

The header shows at most five links, chosen from the built sections in this priority: Projects, Experience, Arnis (or Discipline), Stack, Contact. About and Now are reached by scrolling. The mobile menu lists every section.

---

## 7. Phase 14 — Polish and reach

### 7.1 Motion

- **Tech stack marquee:** a horizontal band of stack names in Anton outline type after the projects section. Pauses on hover; static under reduced motion.
- **Heading reveal:** one consistent scroll-in reveal for all section headings.

### 7.2 Sharing and search

- `app/opengraph-image.tsx` for the home page and a per-project OG image for case studies (name, project title, stack, brand styling).
- `app/sitemap.ts` and `app/robots.ts` generated from the project list.
- JSON-LD `Person` structured data: name, role, GitHub, location.

### 7.3 Analytics

- Vercel Web Analytics (`@vercel/analytics`), mounted once in `app/layout.tsx`. Cookieless, so no consent banner is needed.
- Custom events: `resume_download` (Résumé button), `case_study_view` (with `slug`), and `outbound_click` (with `target`: `github` | `live` | `repo` | `email`).
- Data is only collected on the Vercel production deployment; local development and preview builds send nothing.
- No personal data is attached to any event.

### 7.4 Final verification bar

- Lighthouse mobile ≥ 90 in Performance, Accessibility, Best Practices, and SEO on `/` and one case study page.
- No horizontal overflow at 375 px on any page; clean console in production.
- Every `data/baybayin.ts` entry has `reviewed: true`, and every `data/strike-angles.ts` entry has `confirmed: true`. The owner currently has no baybayin reviewer, so this gate blocks launch until one is found.
- Keyboard pass: every interactive element shows the accent focus ring.

---

## 8. Owner-supplied content

Code cannot provide these. The builder uses clearly marked placeholders until the owner replaces them.

1. `data/site.ts` — real name, initials, email, GitHub URL, site URL.
2. `data/projects.ts` — 3+ real projects, each with case study text and screenshots.
3. `public/resume.pdf` — real résumé.
4. Headgear photo: the owner does not own a headgear. Short term, the STIX product cut-out stays with its logo removed. Recommended later: borrow a teammate's or club headgear and photograph it (front view, plain background, even light), then re-tune `HEADGEAR` / `FACE`.
5. Baybayin strings reviewed by a reader.
6. Strike-angle degree mapping for sport Arnis anyo, as the owner learned it.
7. For selected Phase 13 sections: about copy, OJT and school timeline, Arnis competition record and photos, "now" list, and a GitHub token.

---

## 9. Risks

| Risk | Mitigation |
| --- | --- |
| Incorrect baybayin | Single data file with a `reviewed` flag; launch gate in Phase 14. |
| Cultural misuse of weaving patterns | Generic geometry only; no t'nalak reproduction. |
| Reveal filter cost on large screens | Filter regions bounded to live drops; loop paused when the hero is off-screen; 60 fps acceptance test. |
| Watermark fill misalignment | Outline and fill share one SVG `<text>` geometry. |
| Motif clutter | Fixed opacity budget (weave 3–8%), lime reserved for slashes and fills, motifs never add new colours. |
| Headgear image rights | Logo removed now, which avoids implying brand use but does not remove the photographer's copyright. Accepted risk for a personal portfolio; if a takedown request arrives, or a borrowed headgear can be photographed, swap the image and re-tune `HEADGEAR` / `FACE`. |
| GitHub API failure | Graph hides itself; build unaffected. |

---

## 10. Open decision

**Which Phase 13 sections to build** (About, Experience, Arnis, Now — any subset). Needed before Phase 13 is written into `tasks.md`; Phases 11 and 12 can be planned without it.
