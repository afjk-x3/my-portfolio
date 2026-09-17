/**
 * Shared domain types for the portfolio.
 *
 * These are deliberately shaped so that the Phase 2 Supabase migration is a
 * data-layer change only: every field below maps 1:1 to a column on a
 * `projects` / `skill_categories` table (snake_case in Postgres, camelCase
 * here). UI components consume these types and never talk to a data source
 * directly — see `lib/queries.ts`.
 */

/** Groups the projects showcase filters and labels by. */
export type ProjectCategory = "full-stack" | "game-dev" | "internship";

/** Human-readable labels for each category, used for card tags. */
export const PROJECT_CATEGORY_LABELS: Record<ProjectCategory, string> = {
  "full-stack": "Full-Stack",
  "game-dev": "Game Dev",
  internship: "OJT / Internship",
};

export interface Project {
  /** Stable identifier. Becomes the Supabase `id` (uuid) column. */
  id: string;
  /** URL-safe key. Reserved for a future `/projects/[slug]` route. */
  slug: string;
  title: string;
  category: ProjectCategory;
  /** One-line hook rendered on the card. Keep under ~90 characters. */
  summary: string;
  /** Longer body copy rendered under the summary. 2-3 sentences. */
  description: string;
  /** Badge labels, e.g. ["Next.js", "Supabase", "Tailwind"]. */
  techStack: string[];
  /** Deployed URL, or null when the project is not publicly hosted. */
  liveUrl: string | null;
  /** Repository URL, or null when the source is private. */
  repoUrl: string | null;
  /** Path under /public or a remote URL. null renders the fallback panel. */
  imageUrl: string | null;
  /** Alt text for `imageUrl`. Required whenever `imageUrl` is non-null. */
  imageAlt: string | null;
  /** Year shipped, shown as card metadata. */
  year: number;
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
export type SkillGroup =
  | "frontend"
  | "backend"
  | "database"
  | "game-dev"
  | "devops";

export interface Skill {
  /** Display name rendered inside the pill, e.g. "TypeScript". */
  name: string;
  /**
   * Optional `lucide-react` export name, e.g. "Database". Resolved through an
   * explicit icon map in the component — never via dynamic import, so unused
   * icons stay out of the bundle.
   */
  icon?: string;
}

export interface SkillCategory {
  id: string;
  group: SkillGroup;
  /** Card heading, e.g. "Frontend". */
  label: string;
  skills: Skill[];
  /** Ascending sort key for bento placement. */
  order: number;
}

/** A single photo in the Athletics & Discipline bento card. */
export interface DisciplinePhoto {
  src: string;
  alt: string;
  width: number;
  height: number;
}

/** Anchor link rendered in the header nav. */
export interface NavLink {
  label: string;
  /** In-page anchor, e.g. "#projects". Must match a section `id`. */
  href: string;
}

/** Outbound social/contact link rendered in the header and footer. */
export interface SocialLink {
  label: string;
  href: string;
  /** `lucide-react` export name resolved through an explicit icon map. */
  icon: string;
}

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
