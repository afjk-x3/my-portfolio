import { CodeXml, Mail } from "lucide-react";

import { StrikeLine } from "@/components/ui/strike-line";
import { siteConfig, socialLinks } from "@/data/site";

// lucide-react v1 removed brand icons (no `Github` export), so the "Github"
// key from `data/site.ts` maps to a generic code icon — same as the header.
const socialIcons = { Github: CodeXml, Mail } as const;

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden px-6 pt-4 pb-10">
      <div aria-hidden className="bg-weave pointer-events-none absolute inset-0 opacity-[0.04]" />

      <StrikeLine angle={12} at={0.5} className="mb-6 px-0" />

      <div className="relative mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
        <p className="font-mono text-xs text-muted">
          © {new Date().getFullYear()} {siteConfig.name}
        </p>

        <ul className="flex items-center gap-5">
          {socialLinks.map((link) => {
            const Icon = socialIcons[link.icon as keyof typeof socialIcons];
            return (
              <li key={link.href}>
                <a
                  href={link.href}
                  aria-label={link.label}
                  target={link.href.startsWith("http") ? "_blank" : undefined}
                  rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="text-muted transition-colors hover:text-fg"
                >
                  <Icon aria-hidden className="size-4" />
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </footer>
  );
}
