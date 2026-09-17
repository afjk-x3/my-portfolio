import type { Project } from "@/types";

export const projects: Project[] = [
  {
    id: "project-ledger",
    slug: "ledger",
    title: "Ledger",
    category: "full-stack",
    summary: "Real-time expense tracking with shared household budgets.",
    description:
      "A full-stack budgeting application with authenticated multi-user households, live balance updates, and monthly reporting. Built around server components with optimistic client updates on the transaction list.",
    techStack: ["Next.js", "TypeScript", "PostgreSQL", "Tailwind CSS"],
    liveUrl: "https://example.com",
    repoUrl: "https://github.com/your-handle/ledger",
    imageUrl: null,
    imageAlt: null,
    year: 2025,
    order: 1,
  },
  {
    id: "project-driftline",
    slug: "driftline",
    title: "Driftline",
    category: "game-dev",
    summary: "A top-down arcade racer with procedurally generated circuits.",
    description:
      "A 2D racing game featuring a custom drift physics model, lap ghosting, and a seeded track generator. Includes a replay system that records and plays back input frames rather than transforms.",
    techStack: ["Unity", "C#", "Shader Graph"],
    liveUrl: null,
    repoUrl: "https://github.com/your-handle/driftline",
    imageUrl: null,
    imageAlt: null,
    year: 2024,
    order: 2,
  },
  {
    id: "project-fleetdesk",
    slug: "fleetdesk",
    title: "FleetDesk",
    category: "internship",
    summary: "Internal dispatch dashboard built during on-the-job training.",
    description:
      "An operations dashboard for coordinating vehicle dispatch and driver assignments, delivered during an OJT placement. Replaced a spreadsheet workflow used daily by the dispatch team.",
    techStack: ["React", "Node.js", "Express", "MySQL"],
    liveUrl: null,
    repoUrl: null,
    imageUrl: null,
    imageAlt: null,
    year: 2024,
    order: 3,
  },
];
