import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { BentoGrid } from "@/components/sections/bento-grid";
import { Contact } from "@/components/sections/contact";
import { Hero } from "@/components/sections/hero";
import { ProjectsShowcase } from "@/components/sections/projects-showcase";
import { Preloader } from "@/components/ui/preloader";
import { StrikeLine } from "@/components/ui/strike-line";

export default function Home() {
  return (
    <>
      {/* First, so its gate script runs before any page content is parsed. */}
      <Preloader />
      <SiteHeader />
      <main>
        <Hero />
        <StrikeLine angle={1} className="py-6" />
        <ProjectsShowcase />
        <StrikeLine angle={2} className="py-6" />
        <BentoGrid />
        <StrikeLine angle={3} className="py-6" />
        <Contact />
      </main>
      <SiteFooter />
    </>
  );
}
