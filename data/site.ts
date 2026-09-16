import type { SocialLink } from "@/types";

export const siteConfig = {
  name: "Your Name",
  initials: "YN",
  role: "Full Stack Developer",
  description:
    "Full Stack Developer building web applications, games, and the systems behind them.",
  url: "https://example.com",
  email: "you@example.com",
  githubUrl: "https://github.com/your-handle",
  resumePath: "/resume.pdf",
  /**
   * Giant outline word layered behind the hero portrait. The type size is
   * tuned for roughly 9 characters; much longer words bleed off both edges.
   */
  watermark: "DEVELOPER",
  /** Drives the pulsing status dot in the hero telemetry bar. */
  availability: {
    isAvailable: true,
    label: "Available for work",
  },
  /** IANA zone for the telemetry clock. Asia/Manila is GMT+8 with no DST. */
  timeZone: "Asia/Manila",
  timeZoneLabel: "GMT+8",
} as const;

export const socialLinks: SocialLink[] = [
  { label: "GitHub", href: siteConfig.githubUrl, icon: "Github" },
  { label: "Email", href: `mailto:${siteConfig.email}`, icon: "Mail" },
];
