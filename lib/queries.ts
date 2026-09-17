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
