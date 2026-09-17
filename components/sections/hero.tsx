import { CodeXml, Download } from "lucide-react";

import { HeroBackdropReveal } from "@/components/sections/hero-backdrop-reveal";
import { HeroVisual } from "@/components/sections/hero-visual";
import { InkRevealSection } from "@/components/sections/ink-reveal";
import { TelemetryBar } from "@/components/sections/telemetry-bar";
import { Button } from "@/components/ui/button";
import { baybayin } from "@/data/baybayin";
import { siteConfig } from "@/data/site";

export function Hero() {
  return (
    <InkRevealSection
      id="hero"
      className="relative flex flex-col overflow-hidden px-6 pt-24 pb-10 lg:min-h-svh"
    >
      {/* Hidden layer behind everything: weave and strike slashes. */}
      <HeroBackdropReveal />

      <div className="relative z-20 mx-auto w-full max-w-7xl">
        <TelemetryBar />
      </div>

      <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col">
        <HeroVisual watermark={siteConfig.watermark} />

        {/*
         * Below lg the copy flows under the portrait. From lg up it is pinned
         * across the bottom of the stage, overlapping the faded portrait edge.
         */}
        <div className="relative z-20 -mt-16 flex flex-col items-center gap-6 text-center lg:absolute lg:inset-x-0 lg:bottom-0 lg:mt-0 lg:flex-row lg:items-end lg:justify-between lg:text-left">
          <div className="flex flex-col gap-3">
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-muted">
              {siteConfig.name}
            </span>
            <h1 className="font-display text-6xl uppercase leading-[0.85] text-fg sm:text-7xl lg:text-8xl">
              Full Stack
              <span className="block text-accent">Developer</span>
            </h1>
            <p className="flex flex-col items-center gap-1 whitespace-nowrap sm:flex-row sm:items-baseline sm:gap-3 lg:justify-start">
              <span aria-hidden className="font-baybayin text-lg text-muted">
                {baybayin.motto.text}
              </span>
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-muted">
                Diligence &amp; discipline
              </span>
            </p>
          </div>

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
      </div>
    </InkRevealSection>
  );
}
