import { ArrowUpRight, CodeXml, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { siteConfig } from "@/data/site";

export function Contact() {
  return (
    <section id="contact" className="relative overflow-hidden px-6 py-32">
      <div
        aria-hidden
        className="glow absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2"
      />

      <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-8 text-center">
        <SectionHeading
          eyebrow="Contact"
          title="Let's build something."
          className="items-center"
        />

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <a href={`mailto:${siteConfig.email}`}>
              <Mail aria-hidden />
              {siteConfig.email}
            </a>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href={siteConfig.githubUrl} target="_blank" rel="noopener noreferrer">
              <CodeXml aria-hidden />
              GitHub
              <ArrowUpRight aria-hidden />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
