import { CodeXml, Download } from "lucide-react";

import { HeroVisual } from "@/components/sections/hero-visual";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/data/site";

export function Hero() {
  return (
    <section
      id="hero"
      className="relative flex min-h-screen items-center overflow-hidden px-6 pt-32 pb-20"
    >
      <div aria-hidden className="grid-backdrop absolute inset-0" />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center gap-12 lg:flex-row lg:justify-between">
        <div className="flex flex-col items-center gap-8 text-center lg:items-start lg:text-left">
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-muted">
            {siteConfig.name}
          </span>

          <h1 className="text-balance text-5xl font-semibold leading-[0.95] tracking-tighter text-fg sm:text-7xl lg:text-8xl">
            Full Stack
            <span className="block text-accent">Developer</span>
          </h1>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <a href={siteConfig.githubUrl} target="_blank" rel="noopener noreferrer">
                <CodeXml aria-hidden />
                GitHub
              </a>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href={siteConfig.resumePath} download>
                <Download aria-hidden />
                Resume
              </a>
            </Button>
          </div>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}
