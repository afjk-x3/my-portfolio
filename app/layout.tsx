import type { Metadata } from "next";
import { Anton, Geist, Geist_Mono, Noto_Sans_Tagalog, UnifrakturCook } from "next/font/google";

import { Backdrop } from "@/components/layout/backdrop";
import { CommandPalette } from "@/components/command-palette/command-palette";
import { SmoothScrollProvider } from "@/components/providers/smooth-scroll-provider";
import { siteConfig } from "@/data/site";
import { getCaseStudyProjects } from "@/lib/queries";
import { PROJECT_CATEGORY_LABELS } from "@/types";
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

// Baybayin script for the decorative accents in `data/baybayin.ts`. Only the
// Tagalog subset is loaded, so Latin text never falls back to this face.
const notoTagalog = Noto_Sans_Tagalog({
  variable: "--font-noto-tagalog",
  subsets: ["tagalog"],
  weight: "400",
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

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Only what the palette needs, so the full case study text stays on the server.
  const paletteProjects = (await getCaseStudyProjects()).map((project) => ({
    slug: project.slug,
    title: project.title,
    category: PROJECT_CATEGORY_LABELS[project.category],
    techStack: project.techStack,
  }));

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${anton.variable} ${unifraktur.variable} ${notoTagalog.variable} h-full antialiased`}
      // The preloader's inline gate script adds an attribute to <html> before
      // React hydrates.
      suppressHydrationWarning
    >
      <body className="min-h-full bg-bg font-sans text-fg">
        <Backdrop />
        <SmoothScrollProvider>
          {children}
          <CommandPalette projects={paletteProjects} />
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
