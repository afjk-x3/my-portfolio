"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLenis } from "lenis/react";
import { CodeXml, Mail, Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { navLinks } from "@/data/navigation";
import { siteConfig, socialLinks } from "@/data/site";
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

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // Section anchors only exist on the home page. Elsewhere, links navigate to
  // `/#anchor` instead of smooth-scrolling.
  const onHome = usePathname() === "/";

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
        {onHome ? (
          <button
            type="button"
            onClick={() => lenis?.scrollTo(0)}
            className="rounded-full px-2 font-mono text-sm font-semibold tracking-[0.2em] text-fg"
          >
            {siteConfig.initials}
          </button>
        ) : (
          <Link
            href="/"
            className="rounded-full px-2 font-mono text-sm font-semibold tracking-[0.2em] text-fg"
          >
            {siteConfig.initials}
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
