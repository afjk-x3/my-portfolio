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
| Structure | Home is one scroll page. Case study pages were built in Phase 12 and **removed in Phase 14** at the owner's request (2026-09-17). |
| Visual direction | Keep the dark telemetry base and blend in Filipino/Arnis identity. No new accent colour; neon lime stays the only accent. |
| Motifs | Baybayin accents, Arnis strike lines, woven (inabel-inspired) texture. |
| Copy voice | Confident and disciplined: short, direct sentences with an athlete's mindset. |
| Sequencing | Identity system first, then case studies, then new home sections, then polish. Nothing is styled twice. |
| Case study content | Typed data extending `Project` in `data/projects.ts`, not MDX. Keeps the `lib/queries.ts` Supabase seam. |
| Timeline | No deadline. Quality first; each phase ships and is verified before the next. |
| Home sections | Four candidates are designed (§6). **The owner picks which to build before Phase 17 is planned.** |
| Analytics | Vercel Web Analytics, added in Phase 18. |

---

## 3. Delivery phases

| Phase | Name | Depends on |
| --- | --- | --- |
| 11 | Identity system + full-hero cursor reveal | — |
| 12 | Project case studies | 11 |
| 13 | Hero refinement + command palette (§4b, added 2026-09-17) | 11, 12 |
| 14 | Remove case studies + slash-cut strike lines (§4c, added 2026-09-17) | 11, 12 |
| 15 | Targeted fixes: intro on every load, hero on reload, projects gap, discipline card (§4d, added 2026-09-17) | 13, 14 |
| 16 | Interactive sword-slash dividers (§4e, added 2026-09-17) | 14 |
| 17 | New home sections (owner's selection) | 11 |
| 18 | Polish and reach | 11–17 |

Each phase is written into `tasks.md` as atomic builder tasks only when the previous phase is verified.

---

## 4. Phase 11 — Identity system and full-hero cursor reveal

### 4.1 Principle

Telemetry is the structure; Filipino/Arnis identity is the texture. Motifs appear as lines, patterns, and small script accents — never as new colour blocks. Every motif degrades cleanly under `prefers-reduced-motion`.

### 4.2 Baybayin accents

- **Font:** Noto Sans Tagalog via `next/font/google` (confirmed available in the installed Next.js font data), exposed as `--font-baybayin` / `font-baybayin`.
- **Single source of truth:** `data/baybayin.ts` exports every baybayin string used on the site. Each entry has `id`, `text` (baybayin), `latin` (romanised source), `meaning` (English), and `reviewed: boolean`.
- **Review gate:** transliteration errors are easy to make and publicly embarrassing. The owner or a baybayin reader confirms every entry and flips `reviewed` to `true` before launch. Phase 18 verification fails if any entry is unreviewed.
- **Placements:**
  - Preloader: the owner's name in baybayin beneath the monogram.
  - Section eyebrows: `SectionHeading` gains an optional `script` prop rendered beside the index and English label, e.g. `01 · <baybayin> · PROJECTS`.
  - Hero: one faint line under the headline.
- **Accessibility:** all baybayin is decorative (`aria-hidden`) and always sits next to English.

### 4.3 Arnis strike lines

- **Component:** `components/ui/strike-line.tsx` — an SVG diagonal that draws in (`pathLength` 0→1) when scrolled into view, with an optional telemetry label such as `ANGLE 01 // 45°`.
- **Angles:** `data/strike-angles.ts` maps angle numbers to degrees. The owner competes in sport Arnis (live stick, padded stick, and anyo) with a Modern Arnis background, so numbering follows the twelve basic strikes as taught for sport Arnis anyo. Numbering differs between systems, so the owner confirms each number-to-degree entry; until then the file carries `confirmed: false` and the Phase 18 gate treats it like unreviewed baybayin.
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

## 4b. Phase 13 — Hero refinement and command palette (added 2026-09-17)

After Phases 11–12 shipped, the owner compared the hero with landonorris.com again. Decisions:

- **Reveal only while moving.** A still cursor shows nothing; each drop fades within ~0.9 s. Drop size and stretch grow with pointer speed, and drops are stretched along the direction of travel. Touch keeps the drifting reveal; touch + reduced motion keeps the fixed reveal.
- **Torn edges.** The mask filter adds a noise displacement (long horizontal, short vertical wavelength) before the alpha threshold, so edges break into sideways strips like the reference. Still SVG, still bounded to the live drops.
- **Hero copy kept but smaller.** Availability and name bottom-left above a smaller headline and the motto; local clock above normal-size buttons bottom-right. The top telemetry strip is removed. The portrait keeps its Phase 11 size (an enlarged, full-bleed portrait was tried and rejected by the owner).
- **Header.** Two-line name wordmark (`siteConfig.wordmark`) replaces the initials; section links stay; a search button with a `Ctrl K` / `⌘ K` hint opens the palette.
- **Command palette.** `cmdk` inside a Radix dialog, mounted once in the root layout. Groups: Navigate (top + section links), Case studies (search by title, category, or tech), Actions (download résumé, copy email, open GitHub), and Secrets that render only after typing 2+ characters (Replay intro; Strike, home page only, which scrolls to the top and plays a diagonal reveal sweep via a `portfolio:strike` window event).
- **Not taken from the reference:** "next race" card, move-the-mouse hint, contour-line background.

---

## 4c. Phase 14 — Remove case studies, slash-cut strike lines (added 2026-09-17)

**Case studies removed.** The owner decided against case study pages. `app/projects/`, `components/case-study/`, the `CaseStudy` types and data, the case study queries, the palette's Case studies group, the card's "Read case study" button and title link, and the `strike-wipe` animation are removed. The DNF 404 page, `Project.slug`, and the header's route-aware links stay. §5 below is kept as a record only.

**Slash-cut strike lines.**

The Phase 11 dividers read as separators, not strikes. Approved redesign of `StrikeLine`:

- **Band:** 128px tall (96px on phones) with the full-width hairline through the middle.
- **Blade:** a tapered neon polygon (7px at the entry end, pointed at the exit) crossing the hairline at the strike's real angle and running off the band. Each divider sets `at`, the point along the line where it cuts, so dividers are not identical.
- **Motion, once when scrolled into view:** the blade cuts entry → tip in 0.22 s with a blurred streak; a flash at the crossing and a pulse running outward along the hairline; the blade cools to 25% opacity and stays as a scar; the `ANGLE nn // deg°` label fades in beside it. Reduced motion renders the scar and label immediately.
- **Angles:** dividers use only diagonal and overhead strikes (1, 2, 8, 9, 12); `StrikeLine` throws for thrusts and horizontal strikes. Home: 1, 2, 9. Footer: 12.

---

## 4d. Phase 15 — Targeted fixes (added 2026-09-17)

- **Intro on every full load.** The preloader no longer uses `sessionStorage`; it plays on every full page load, including reloads. A module-level flag prevents a replay on client-side navigation within the same document.
- **Hero on reload.** The reported "portrait pushed behind the navbar" was the browser restoring the scroll position on reload, not a layout bug; at scroll 0 the head and headgear reveal are correct. The gate script sets `history.scrollRestoration = "manual"` so every load opens at the top.
- **Projects gap.** Project cards pin near the top (below the header) instead of the vertical centre; the section's top padding is reduced; the Phase 14 strike band is 128px (96px on phones).
- **Discipline card.** Portrait-friendly card shapes per breakpoint, focal point 80% (45% on the landscape tablet card), and a gradient limited to the bottom 40%, so the full stance is visible.
- **Next.js "1 Issue" badge.** Not reproducible on the owner's dev server or a fresh one; the verification task captures the exact error if it returns.

---

## 4e. Phase 16 — Interactive sword-slash dividers (added 2026-09-17)

The Phase 14 strike line dividers become a small rhythm game. Each divider is independent.

### Slashes

- **First view:** the divider auto-cuts its own strike once, the first time it scrolls into view (as in Phase 14).
- **Look:** a crescent sword slash — thin at both tips, thickest in the middle, white core, lime glow, and a short afterimage trail — sweeping in about 0.2 s, rotated to the strike's angle and curving in the direction that strike swings (angles 1 and 2 bow opposite ways). It flashes, sends the Phase 14 pulse along the hairline, and cools to a thin, faint crescent scar.
- **Thrusts (5, 6, 7, 10, 11):** a sword stab — a narrow bright spike jabs into the line with a ring burst and leaves a small dot scar.
- **Horizontal strikes (3, 4):** the arc is tilted about 12° so it still reads as a swing.
- **Order and position:** each press cuts the next strike in the 12-strike order (wrapping 12 → 1), at a random point along the line.
- **Scars:** stay until reload; at most 12 per divider, oldest fading out first.
- **Layers:** the bright effect renders unclipped (large slashes spill over neighbouring content, never intercepting pointer events); scars are clipped to the divider band.

### Button

- One round, lime-outlined STRIKE button with a sword icon at the right end of each divider, with a small speaker toggle beside it.
- Squashes on press, flashes lime on PERFECT, shakes on MISS.
- Space or Enter strikes while it has focus. Its accessible name includes the next strike.

### Rhythm and combo

Revised 2026-09-17 after owner testing: a fixed 100 BPM beat graded on `click` was too hard (click fires on release, and the expanding ring gave no warning of the next beat). The rhythm now follows the visitor.

- **Tempo:** the first press starts a combo; the gap to the second press (300–1200 ms) sets the tempo. After each on-pace press the tempo moves 40% toward that gap, clamped to 300–1200 ms.
- **Grading:** a gap within ±8% of the tempo is PERFECT, within ±25% GOOD; both add 1 to the combo. A press far too early, or a second press under 300 ms, is a MISS: "MISS", a dull thud, the combo restarts from that press, and a normal-size slash is still cut.
- **Ending:** no press by tempo × 1.25 (1200 ms before a tempo exists) ends the combo quietly.
- **Cue:** once a tempo exists, an approach ring shrinks linearly from 2.6× onto the button and touches it exactly when the next press is due. With reduced motion, a static ring appears at that moment instead.
- **Input:** presses count on pointer-down and on Space / Enter key-down (no key repeat); a `click` counts only without a preceding pointer or key press (assistive-technology activation).
- **Slash size by combo level:** 1–3 → 1×, 4–6 → 1.3×, 7–9 → 1.6×, 10–12 → 2×. A PERFECT press is one size step larger than its level, with a white flash and a "PERFECT" pop.
- **Finisher:** 12 presses in a row play an X-shaped double slash across the full viewport width, a flash, the finisher sound, and "ANYO COMPLETE"; then the combo resets.
- **Readout:** the divider label shows the current strike, `COMBO ×n` while a combo runs, and `BEST ×n`.
- **Best combo:** remembered per browser (`localStorage`, read and written defensively; the feature works without it).
- **First-press hint:** "KEEP YOUR PACE" for a few seconds, the first time a visitor ever presses a STRIKE button (remembered per browser).

### Sound

- **Source:** short CC0 (public domain) clips in `public/audio/strikes/`, each ≤ ~40 KB, with source URL and licence recorded in `public/audio/strikes/CREDITS.md`. The architect asks the owner before downloading any clip.
- **Set:** slash whoosh (louder and slightly higher-pitched as the combo grows); stab hit for thrusts, plus a short ring on PERFECT; finisher; soft thud on MISS. No beat tick.
- **Playback:** Web Audio API, clips decoded once on the first press (browsers block audio before a user gesture).
- **Default:** silent until the first press, then on; the speaker toggle mutes, and the choice is remembered per browser.

### Reduced motion

The rhythm still works. The approach ring does not animate (a static ring appears when the next press is due); slashes and stabs appear directly as scars; the finisher shows its text without the screen-wide X; no shake or squash.

### Accessibility

Decorative SVG stays `aria-hidden`. Only the finisher is announced, through a polite live region; PERFECT, GOOD, and MISS are not announced.

### Units

| Unit | Responsibility |
| --- | --- |
| `hooks/use-strike-rhythm.ts` | Adaptive tempo from the visitor's presses, PERFECT/GOOD/MISS grading, combo, next-press cue, best combo. No rendering. |
| `lib/strike-audio.ts` | Lazily loads and decodes the clips, plays them with volume and pitch, mute state. |
| `components/ui/strike-mark.tsx` | Renders one crescent slash or stab: bright effect layer plus scar. |
| `components/ui/strike-button.tsx` | Round STRIKE button, approach ring, press-down input, feedback pops, mute toggle. |
| `components/ui/strike-finisher.tsx` | Full-width X-slash overlay and "ANYO COMPLETE". |
| `components/ui/strike-line.tsx` | The divider: owns the list of cuts, wires button, rhythm, audio, marks, and finisher. Keeps its `{ angle, at, className }` props (the first automatic cut). |

---

## 5. Phase 12 — Project case studies (removed in Phase 14; record only)

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

## 6. Phase 17 — New home sections (owner selects)

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

## 7. Phase 18 — Polish and reach

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
7. For selected Phase 17 sections: about copy, OJT and school timeline, Arnis competition record and photos, "now" list, and a GitHub token.

---

## 9. Risks

| Risk | Mitigation |
| --- | --- |
| Incorrect baybayin | Single data file with a `reviewed` flag; launch gate in Phase 18. |
| Cultural misuse of weaving patterns | Generic geometry only; no t'nalak reproduction. |
| Reveal filter cost on large screens | Filter regions bounded to live drops; loop paused when the hero is off-screen; 60 fps acceptance test. |
| Watermark fill misalignment | Outline and fill share one SVG `<text>` geometry. |
| Motif clutter | Fixed opacity budget (weave 3–8%), lime reserved for slashes and fills, motifs never add new colours. |
| Headgear image rights | Logo removed now, which avoids implying brand use but does not remove the photographer's copyright. Accepted risk for a personal portfolio; if a takedown request arrives, or a borrowed headgear can be photographed, swap the image and re-tune `HEADGEAR` / `FACE`. |
| GitHub API failure | Graph hides itself; build unaffected. |

---

## 10. Open decision

**Which Phase 17 sections to build** (About, Experience, Arnis, Now — any subset). Needed before Phase 17 is written into `tasks.md`; Phases 11 and 12 can be planned without it.
