"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLenis } from "lenis/react";
import { CodeXml, Mail, Menu, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { navLinks } from "@/data/navigation";
import { siteConfig, socialLinks } from "@/data/site";
import { setCommandPaletteOpen, useModifierKeyLabel } from "@/hooks/use-command-palette";
import { cn } from "@/lib/utils";

// lucide-react v1 removed brand icons (no `Github` export), so the "Github"
// key from `data/site.ts` maps to a generic code icon.
const socialIcons = { Github: CodeXml, Mail } as const;

interface NavButtonProps {
  href: string;
  onHome: boolean;
  onNavigate: (href: string) => void;
  className?: string;
  children: React.ReactNode;
}

/** Smooth-scrolls to the section on the home page; links to it everywhere else. */
function NavButton({ href, onHome, onNavigate, className, children }: NavButtonProps) {
  if (onHome) {
    return (
      <Button variant="ghost" size="sm" className={className} onClick={() => onNavigate(href)}>
        {children}
      </Button>
    );
  }
  return (
    <Button asChild variant="ghost" size="sm" className={className}>
      <Link href={`/${href}`}>{children}</Link>
    </Button>
  );
}

/** Two-line name wordmark, like a racing driver's logo. */
function Wordmark() {
  return (
    <span className="flex flex-col font-display text-lg uppercase leading-[0.85] tracking-wide text-fg">
      <span>{siteConfig.wordmark[0]}</span>
      <span>{siteConfig.wordmark[1]}</span>
    </span>
  );
}

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // Section anchors only exist on the home page. Elsewhere, links navigate to
  // `/#anchor` instead of smooth-scrolling.
  const onHome = usePathname() === "/";
  const modifierKey = useModifierKeyLabel();

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
          "flex w-full max-w-4xl items-center justify-between gap-4 rounded-full border py-2 pr-2 pl-5 transition-colors duration-300",
          scrolled
            ? "border-line bg-surface/70 backdrop-blur-xl"
            : "border-transparent bg-transparent",
        )}
      >
        {onHome ? (
          <button
            type="button"
            aria-label="Back to top"
            onClick={() => lenis?.scrollTo(0)}
            className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            <Wordmark />
          </button>
        ) : (
          <Link
            href="/"
            aria-label="Home"
            className="rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            <Wordmark />
          </Link>
        )}

        <ul className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <NavButton href={link.href} onHome={onHome} onNavigate={scrollTo}>
                {link.label}
              </NavButton>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 px-2"
            aria-label="Open command palette"
            aria-keyshortcuts="Control+K Meta+K"
            onClick={() => setCommandPaletteOpen(true)}
          >
            <Search aria-hidden />
            <kbd className="hidden rounded-md border border-line px-1.5 py-0.5 font-mono text-[0.625rem] tracking-normal sm:inline">
              {modifierKey} K
            </kbd>
          </Button>

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
              <NavButton
                href={link.href}
                onHome={onHome}
                onNavigate={scrollTo}
                className="w-full justify-start"
              >
                {link.label}
              </NavButton>
            </li>
          ))}
        </ul>
      ) : null}
    </header>
  );
}
