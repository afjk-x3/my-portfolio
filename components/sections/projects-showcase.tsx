import { ProjectsStack } from "@/components/sections/projects-stack";
import { SectionHeading } from "@/components/ui/section-heading";
import { baybayin } from "@/data/baybayin";
import { getProjects } from "@/lib/queries";

export async function ProjectsShowcase() {
  const projects = await getProjects();

  return (
    <section id="projects" className="relative px-6 pt-8 pb-24">
      <div className="mx-auto max-w-4xl">
        <SectionHeading eyebrow="Selected Work" title="Projects" script={baybayin.projects} />
      </div>
      <ProjectsStack projects={projects} />
    </section>
  );
}
