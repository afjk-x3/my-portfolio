import { CodeXml, Mail } from "lucide-react";

import { siteConfig, socialLinks } from "@/data/site";

// lucide-react v1 removed brand icons (no `Github` export), so the "Github"
// key from `data/site.ts` maps to a generic code icon — same as the header.
const socialIcons = { Github: CodeXml, Mail } as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-line px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
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
