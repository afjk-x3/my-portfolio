import { SiteHeader } from "@/components/layout/site-header";
import { BentoGrid } from "@/components/sections/bento-grid";
import { Hero } from "@/components/sections/hero";
import { ProjectsShowcase } from "@/components/sections/projects-showcase";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <ProjectsShowcase />
        <BentoGrid />
      </main>
    </>
  );
}
