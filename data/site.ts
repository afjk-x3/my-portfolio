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
} as const;

export const socialLinks: SocialLink[] = [
  { label: "GitHub", href: siteConfig.githubUrl, icon: "Github" },
  { label: "Email", href: `mailto:${siteConfig.email}`, icon: "Mail" },
];
