import type { ReactNode } from "react";
import Image from "next/image";

import { StrikeLine } from "@/components/ui/strike-line";
import type { CaseStudy } from "@/types";

/** Strike angles used for the dividers, in order. All have on-screen lines. */
const DIVIDER_STRIKES = [1, 2, 12, 3, 4, 8];

interface Block {
  id: string;
  title: string;
  content: ReactNode;
}

function buildBlocks(caseStudy: CaseStudy): Block[] {
  const blocks: (Block | null)[] = [
    caseStudy.problem
      ? {
          id: "problem",
          title: "Problem",
          content: (
            <p className="max-w-3xl text-xl leading-relaxed text-fg/90 sm:text-2xl">
              {caseStudy.problem}
            </p>
          ),
        }
      : null,
    caseStudy.approach.length > 0
      ? {
          id: "approach",
          title: "Approach",
          content: (
            <ol className="grid gap-4 md:grid-cols-2">
              {caseStudy.approach.map((step, index) => (
                <li
                  key={step.title}
                  className="flex flex-col gap-3 rounded-card border border-line bg-surface p-6"
                >
                  <span className="font-mono text-xs tracking-[0.25em] text-accent">
                    SECTOR {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-xl font-semibold tracking-tight text-fg">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-muted">{step.body}</p>
                </li>
              ))}
            </ol>
          ),
        }
      : null,
    caseStudy.highlights.length > 0
      ? {
          id: "highlights",
          title: "Highlights",
          content: (
            <ul className="flex flex-col gap-8">
              {caseStudy.highlights.map((highlight) => (
                <li key={highlight.title} className="flex max-w-3xl flex-col gap-2 border-l-2 border-accent pl-6">
                  <h3 className="text-xl font-semibold tracking-tight text-fg">{highlight.title}</h3>
                  <p className="leading-relaxed text-muted">{highlight.body}</p>
                </li>
              ))}
            </ul>
          ),
        }
      : null,
    caseStudy.results.length > 0
      ? {
          id: "results",
          title: "Results",
          content: (
            <dl className="grid gap-8 sm:grid-cols-3">
              {caseStudy.results.map((result) => (
                <div key={result.label} className="flex flex-col gap-2">
                  <dt className="font-mono text-xs uppercase tracking-[0.25em] text-muted">
                    {result.label}
                  </dt>
                  <dd className="font-display text-6xl leading-none text-accent sm:text-7xl">
                    {result.value}
                  </dd>
                </div>
              ))}
            </dl>
          ),
        }
      : null,
    caseStudy.gallery.length > 0
      ? {
          id: "gallery",
          title: "Gallery",
          content: (
            <div className="grid gap-6 md:grid-cols-2">
              {caseStudy.gallery.map((image) => (
                <figure key={image.src} className="flex flex-col gap-3">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    width={image.width}
                    height={image.height}
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="w-full rounded-card border border-line"
                  />
                  <figcaption className="font-mono text-xs text-muted">{image.caption}</figcaption>
                </figure>
              ))}
            </div>
          ),
        }
      : null,
    caseStudy.lessons
      ? {
          id: "lessons",
          title: "Lessons",
          content: (
            <p className="max-w-3xl text-xl leading-relaxed text-fg/90 sm:text-2xl">
              {caseStudy.lessons}
            </p>
          ),
        }
      : null,
  ];
  return blocks.filter((block): block is Block => block !== null);
}

/**
 * The numbered case study sections. Sections with no content are left out and
 * the remaining ones are numbered consecutively.
 */
export function CaseStudyBody({ caseStudy }: { caseStudy: CaseStudy }) {
  const blocks = buildBlocks(caseStudy);

  return (
    <div className="flex flex-col gap-16 pb-24">
      {blocks.map((block, index) => (
        <section key={block.id} aria-labelledby={`case-${block.id}`} className="flex flex-col gap-16">
          <StrikeLine angle={DIVIDER_STRIKES[index % DIVIDER_STRIKES.length]} />
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6">
            <h2
              id={`case-${block.id}`}
              className="flex items-baseline gap-4 font-display text-4xl uppercase text-fg sm:text-5xl"
            >
              <span className="font-mono text-sm tracking-[0.25em] text-accent">
                {String(index + 1).padStart(2, "0")}
              </span>
              {block.title}
            </h2>
            {block.content}
          </div>
        </section>
      ))}
    </div>
  );
}
