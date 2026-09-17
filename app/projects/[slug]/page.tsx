import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CaseStudyBody } from "@/components/case-study/case-study-body";
import { CaseStudyHeader } from "@/components/case-study/case-study-header";
import { NextLap } from "@/components/case-study/next-lap";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { siteConfig } from "@/data/site";
import { getCaseStudyProjects, getNextCaseStudy, getProjectBySlug } from "@/lib/queries";

// Only projects with a case study get a page; any other slug is a 404.
export const dynamicParams = false;

export async function generateStaticParams() {
  const projects = await getCaseStudyProjects();
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return {};

  const title = `${project.title} — ${siteConfig.name}`;
  return {
    title,
    description: project.summary,
    openGraph: { title, description: project.summary, type: "article" },
  };
}

export default async function CaseStudyPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project?.caseStudy) notFound();

  const next = await getNextCaseStudy(project.slug);

  return (
    <>
      {/* Diagonal neon wipe that uncovers the page on arrival. CSS only. */}
      <div
        aria-hidden
        className="animate-strike-wipe pointer-events-none fixed inset-y-0 -left-1/4 z-90 w-[150%] border-l-2 border-accent bg-bg"
      />
      <SiteHeader />
      <main>
        <CaseStudyHeader project={project} caseStudy={project.caseStudy} />
        <CaseStudyBody caseStudy={project.caseStudy} />
        <NextLap next={next} />
      </main>
      <SiteFooter />
    </>
  );
}
