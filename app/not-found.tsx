import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center gap-8 overflow-hidden px-6 text-center">
      <div aria-hidden className="bg-weave pointer-events-none absolute inset-0 opacity-[0.04]" />

      <span className="relative font-mono text-xs uppercase tracking-[0.3em] text-accent">
        404 <span className="text-line-strong">{"//"}</span> Did not finish
      </span>
      <h1 className="relative font-display text-[clamp(6rem,30vw,18rem)] uppercase leading-[0.8] text-outline-accent">
        DNF
      </h1>
      <p className="relative max-w-md text-muted">
        This page left the track. The link may be old, or the project may no longer be listed.
      </p>
      <Button asChild className="relative">
        <Link href="/">
          <ArrowLeft aria-hidden />
          Back to the start
        </Link>
      </Button>
    </main>
  );
}
