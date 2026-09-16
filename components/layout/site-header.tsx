"use client";

import { useState } from "react";
import { useLenis } from "lenis/react";
import { CodeXml, Mail, Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { navLinks } from "@/data/navigation";
import { siteConfig, socialLinks } from "@/data/site";
import { cn } from "@/lib/utils";

// lucide-react v1 removed brand icons (no `Github` export), so the "Github"
// key from `data/site.ts` maps to a generic code icon.
const socialIcons = { Github: CodeXml, Mail } as const;

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const lenis = useLenis(({ scroll }) => {
    setScrolled(scroll > 32);
  });

  function scrollTo(href: string) {
    setMenuOpen(false);
    if (lenis) {
      lenis.scrollTo(href, { offset: -96 });
      return;
    }
    document.querySelector(href)?.scrollIntoView();
  }

  return (
    <header className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <nav
        aria-label="Primary"
        className={cn(
          "flex w-full max-w-3xl items-center justify-between gap-4 rounded-full border px-4 py-2 transition-colors duration-300",
          scrolled
            ? "border-line bg-surface/70 backdrop-blur-xl"
            : "border-transparent bg-transparent",
        )}
      >
        <button
          type="button"
          onClick={() => lenis?.scrollTo(0)}
          className="rounded-full px-2 font-mono text-sm font-semibold tracking-[0.2em] text-fg"
        >
          {siteConfig.initials}
        </button>

        <ul className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Button variant="ghost" size="sm" onClick={() => scrollTo(link.href)}>
                {link.label}
              </Button>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-1">
          {socialLinks.map((link) => {
            const Icon = socialIcons[link.icon as keyof typeof socialIcons];
            return (
              <Button key={link.href} asChild variant="ghost" size="sm" className="px-2">
                <a
                  href={link.href}
                  aria-label={link.label}
                  target={link.href.startsWith("http") ? "_blank" : undefined}
                  rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                >
                  <Icon aria-hidden />
                </a>
              </Button>
            );
          })}

          <Button
            variant="ghost"
            size="sm"
            className="px-2 md:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X aria-hidden /> : <Menu aria-hidden />}
          </Button>
        </div>
      </nav>

      {menuOpen ? (
        <ul className="absolute top-16 w-[calc(100%-2rem)] max-w-3xl space-y-1 rounded-3xl border border-line bg-surface/95 p-3 backdrop-blur-xl md:hidden">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => scrollTo(link.href)}
              >
                {link.label}
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </header>
  );
}
