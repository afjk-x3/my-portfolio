"use client";

import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Command } from "cmdk";
import { useLenis } from "lenis/react";
import {
  ArrowUp,
  Check,
  Clipboard,
  CodeXml,
  CornerDownLeft,
  Download,
  FileText,
  Hash,
  RotateCcw,
  Search,
  Zap,
} from "lucide-react";

import { STORAGE_KEY as PRELOADER_STORAGE_KEY } from "@/components/ui/preloader";
import { navLinks } from "@/data/navigation";
import { siteConfig } from "@/data/site";
import { setCommandPaletteOpen, useCommandPaletteOpen } from "@/hooks/use-command-palette";
import { INK_STRIKE_EVENT } from "@/hooks/use-ink-trail";

/** The slice of a project the palette needs. Built on the server in the root layout. */
export interface PaletteProject {
  slug: string;
  title: string;
  /** Human-readable category, e.g. "Full-Stack". */
  category: string;
  techStack: string[];
}

/** Characters typed before the hidden commands start matching. */
const SECRET_MIN_QUERY = 2;

interface PaletteItemProps {
  value: string;
  keywords?: string[];
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  hint?: string;
  onSelect: () => void;
  children: ReactNode;
}

function PaletteItem({ value, keywords, icon: Icon, hint, onSelect, children }: PaletteItemProps) {
  return (
    <Command.Item
      value={value}
      keywords={keywords}
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-fg/80 transition-colors data-[selected=true]:bg-accent/10 data-[selected=true]:text-accent"
    >
      <Icon aria-hidden className="size-4 shrink-0" />
      <span className="flex-1 truncate">{children}</span>
      {hint ? (
        <span className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-muted">
          {hint}
        </span>
      ) : null}
    </Command.Item>
  );
}

/**
 * Site-wide command palette, opened with Ctrl+K / ⌘K or any button that calls
 * `setCommandPaletteOpen(true)`. Jumps to sections, opens case studies (search
 * by name or tech), runs quick actions, and hides two easter eggs that only
 * match once something is typed.
 */
export function CommandPalette({ projects }: { projects: PaletteProject[] }) {
  const open = useCommandPaletteOpen();
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const onHome = usePathname() === "/";
  const lenis = useLenis();
  // An action picked in the palette runs only after the palette has closed and
  // Lenis has restarted; restarting Lenis cancels any scroll already in flight.
  const pendingAction = useRef<(() => void) | null>(null);

  // Ctrl+K / ⌘K toggles the palette from anywhere, except during the preloader.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "k" || !(event.metaKey || event.ctrlKey)) return;
      if (document.documentElement.hasAttribute("data-preloader-active")) return;
      event.preventDefault();
      setCommandPaletteOpen(!open);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Lenis would keep scrolling the page under the dialog, so it is stopped while
  // the palette is open. The cleanup restarts it before the closed-state effect
  // runs the pending action.
  useEffect(() => {
    if (!open) {
      const action = pendingAction.current;
      pendingAction.current = null;
      action?.();
      return;
    }
    lenis?.stop();
    return () => lenis?.start();
  }, [lenis, open]);

  function onOpenChange(next: boolean) {
    setCommandPaletteOpen(next);
    if (!next) {
      setSearch("");
      setCopied(false);
    }
  }

  /** Closes the palette, then runs `action` once it has closed. */
  function run(action: () => void) {
    pendingAction.current = action;
    onOpenChange(false);
  }

  function scrollToTarget(target: string | number, onComplete?: () => void) {
    if (lenis) {
      lenis.scrollTo(target, { offset: typeof target === "string" ? -96 : 0, onComplete });
      return;
    }
    if (typeof target === "string") document.querySelector(target)?.scrollIntoView();
    else window.scrollTo(0, target);
    onComplete?.();
  }

  function goToSection(href: string) {
    if (onHome) scrollToTarget(href);
    else router.push(`/${href}`);
  }

  function downloadResume() {
    const link = document.createElement("a");
    link.href = siteConfig.resumePath;
    link.download = "";
    link.click();
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(siteConfig.email);
      setCopied(true);
      window.setTimeout(() => onOpenChange(false), 900);
    } catch {
      // Clipboard blocked (e.g. insecure context): fall back to the mail app.
      run(() => window.location.assign(`mailto:${siteConfig.email}`));
    }
  }

  function replayIntro() {
    try {
      sessionStorage.removeItem(PRELOADER_STORAGE_KEY);
    } catch {
      // Storage blocked: the preloader cannot run either way.
    }
    // A full page load, not router.push: the preloader's gate script only runs
    // while the HTML is being parsed.
    window.location.assign(window.location.origin);
  }

  function strike() {
    scrollToTarget(0, () => window.dispatchEvent(new Event(INK_STRIKE_EVENT)));
  }

  const showSecrets = search.trim().length >= SECRET_MIN_QUERY;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-95 bg-bg/70 backdrop-blur-sm" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed top-[12vh] left-1/2 z-96 w-[min(40rem,calc(100%-2rem))] -translate-x-1/2 overflow-hidden rounded-card border border-line bg-surface shadow-[0_0_80px_-30px_var(--color-accent)] focus:outline-none"
        >
          <Dialog.Title className="sr-only">Command palette</Dialog.Title>

          <Command label="Command palette" loop className="flex flex-col">
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search aria-hidden className="size-4 shrink-0 text-muted" />
              <Command.Input
                value={search}
                onValueChange={setSearch}
                placeholder="Jump to a section, search projects, run a command…"
                className="h-14 flex-1 bg-transparent text-sm text-fg placeholder:text-muted focus:outline-none"
              />
              <kbd className="rounded-md border border-line px-1.5 py-0.5 font-mono text-[0.625rem] text-muted">
                ESC
              </kbd>
            </div>

            <Command.List
              data-lenis-prevent
              className="max-h-[min(24rem,60vh)] overflow-y-auto overscroll-contain p-2 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-2 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[0.625rem] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.25em] [&_[cmdk-group-heading]]:text-muted"
            >
              <Command.Empty className="px-3 py-10 text-center font-mono text-xs uppercase tracking-[0.2em] text-muted">
                No match <span className="text-line-strong">{"//"}</span> try another word
              </Command.Empty>

              <Command.Group heading="Navigate">
                <PaletteItem
                  value="Top"
                  keywords={["home", "hero", "start"]}
                  icon={ArrowUp}
                  onSelect={() => run(() => (onHome ? scrollToTarget(0) : router.push("/")))}
                >
                  Top
                </PaletteItem>
                {navLinks.map((link) => (
                  <PaletteItem
                    key={link.href}
                    value={link.label}
                    icon={Hash}
                    onSelect={() => run(() => goToSection(link.href))}
                  >
                    {link.label}
                  </PaletteItem>
                ))}
              </Command.Group>

              {projects.length > 0 ? (
                <Command.Group heading="Case studies">
                  {projects.map((project) => (
                    <PaletteItem
                      key={project.slug}
                      value={`Case study ${project.title}`}
                      keywords={[project.category, ...project.techStack]}
                      icon={FileText}
                      hint={project.category}
                      onSelect={() => run(() => router.push(`/projects/${project.slug}`))}
                    >
                      {project.title}
                    </PaletteItem>
                  ))}
                </Command.Group>
              ) : null}

              <Command.Group heading="Actions">
                <PaletteItem
                  value="Download résumé"
                  keywords={["resume", "cv", "pdf"]}
                  icon={Download}
                  onSelect={() => run(downloadResume)}
                >
                  Download résumé
                </PaletteItem>
                <PaletteItem
                  value="Copy email"
                  keywords={["mail", "contact", siteConfig.email]}
                  icon={copied ? Check : Clipboard}
                  hint={copied ? "Copied" : siteConfig.email}
                  onSelect={copyEmail}
                >
                  {copied ? "Email copied" : "Copy email"}
                </PaletteItem>
                <PaletteItem
                  value="Open GitHub"
                  keywords={["code", "repositories", "source"]}
                  icon={CodeXml}
                  onSelect={() =>
                    run(() => window.open(siteConfig.githubUrl, "_blank", "noopener,noreferrer"))
                  }
                >
                  Open GitHub
                </PaletteItem>
              </Command.Group>

              {showSecrets ? (
                <Command.Group heading="Secrets">
                  <PaletteItem
                    value="Replay intro"
                    keywords={["preloader", "intro", "loading", "again"]}
                    icon={RotateCcw}
                    onSelect={() => run(replayIntro)}
                  >
                    Replay intro
                  </PaletteItem>
                  {onHome ? (
                    <PaletteItem
                      value="Strike"
                      keywords={["arnis", "slash", "reveal", "headgear"]}
                      icon={Zap}
                      onSelect={() => run(strike)}
                    >
                      Strike
                    </PaletteItem>
                  ) : null}
                </Command.Group>
              ) : null}
            </Command.List>

            <div className="flex items-center gap-4 border-t border-line px-4 py-2.5 font-mono text-[0.625rem] uppercase tracking-[0.2em] text-muted">
              <span>↑↓ Navigate</span>
              <span className="flex items-center gap-1">
                <CornerDownLeft aria-hidden className="size-3" /> Select
              </span>
              <span className="ml-auto text-accent">
                {siteConfig.initials} {"//"} CMD
              </span>
            </div>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
