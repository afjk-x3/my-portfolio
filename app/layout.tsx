import type { Metadata } from "next";
import { Anton, Geist, Geist_Mono, UnifrakturCook } from "next/font/google";

import { Backdrop } from "@/components/layout/backdrop";
import { CommandPalette } from "@/components/command-palette/command-palette";
import { SmoothScrollProvider } from "@/components/providers/smooth-scroll-provider";
import { siteConfig } from "@/data/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Condensed display face for the hero watermark and headline. Anton ships a
// single static weight, so `weight` is required.
const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: "400",
});

// Blackletter face for the preloader monogram. `display: "block"` hides the
// letter until the font arrives instead of flashing a fallback serif "G"; the
// file is preloaded, so the wait is short.
const unifraktur = UnifrakturCook({
  variable: "--font-unifraktur",
  subsets: ["latin"],
  weight: "700",
  display: "block",
});

export const metadata: Metadata = {
  title: `${siteConfig.name} — ${siteConfig.role}`,
  description: siteConfig.description,
  openGraph: {
    title: `${siteConfig.name} — ${siteConfig.role}`,
    description: siteConfig.description,
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${anton.variable} ${unifraktur.variable} h-full antialiased`}
      // The preloader's inline gate script adds an attribute to <html> before
      // React hydrates.
      suppressHydrationWarning
    >
      <body className="min-h-full bg-bg font-sans text-fg" suppressHydrationWarning>
        {/* First Tab stop on every page: jumps past the header to the content. */}
        <a
          href="#main"
          className="sr-only rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-ink focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Skip to content
        </a>
        <Backdrop />
        <SmoothScrollProvider>
          {children}
          <CommandPalette />
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
