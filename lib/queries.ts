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

/** The project with this slug, or `null` when none matches. */
export async function getProjectBySlug(slug: string): Promise<Project | null> {
  return projects.find((project) => project.slug === slug) ?? null;
}

/** Projects that have a case study, in display order. */
export async function getCaseStudyProjects(): Promise<Project[]> {
  const all = await getProjects();
  return all.filter((project) => project.caseStudy !== null);
}

/**
 * The case study after `slug` in display order, wrapping to the first. `null`
 * when `slug` is the only case study.
 */
export async function getNextCaseStudy(slug: string): Promise<Project | null> {
  const studies = await getCaseStudyProjects();
  const index = studies.findIndex((project) => project.slug === slug);
  if (index === -1 || studies.length < 2) return null;
  return studies[(index + 1) % studies.length];
}
