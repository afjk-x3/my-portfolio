import { ProjectsStandings } from "@/components/sections/projects-standings";
import { SectionHeading } from "@/components/ui/section-heading";
import { getProjects } from "@/lib/queries";

export async function ProjectsShowcase() {
  const projects = await getProjects();

  return (
    <section id="projects" className="relative px-6 pt-24 pb-24">
      <div className="mx-auto flex max-w-4xl flex-col gap-10">
        <SectionHeading eyebrow="Selected Work" title="Projects" />
        <ProjectsStandings projects={projects} />
      </div>
    </section>
  );
}
