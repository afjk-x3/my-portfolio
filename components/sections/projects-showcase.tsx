import { ProjectsStack } from "@/components/sections/projects-stack";
import { SectionHeading } from "@/components/ui/section-heading";
import { getProjects } from "@/lib/queries";

export async function ProjectsShowcase() {
  const projects = await getProjects();

  return (
    <section id="projects" className="relative px-6 py-24">
      <div className="mx-auto max-w-4xl">
        <SectionHeading eyebrow="Selected Work" title="Projects" />
      </div>
      <ProjectsStack projects={projects} />
    </section>
  );
}
