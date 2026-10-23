import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { BentoGrid } from "@/components/sections/bento-grid";
import { Contact } from "@/components/sections/contact";
import { Hero } from "@/components/sections/hero";
import { ProjectsShowcase } from "@/components/sections/projects-showcase";
import { Preloader } from "@/components/ui/preloader";

export default function Home() {
  return (
    <>
      {/* First, so its gate script runs before any page content is parsed. */}
      <Preloader />
      <SiteHeader />
      <main>
        <Hero />
        <ProjectsShowcase />
        <BentoGrid />
        <Contact />
      </main>
      <SiteFooter />
    </>
  );
}
