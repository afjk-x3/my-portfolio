import { SiteHeader } from "@/components/layout/site-header";
import { Hero } from "@/components/sections/hero";
import { ProjectsShowcase } from "@/components/sections/projects-showcase";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <ProjectsShowcase />
      </main>
    </>
  );
}
