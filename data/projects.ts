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
    // Example write-up showing every section. Replace with the real story.
    caseStudy: {
      role: "Full-stack developer",
      timeframe: "Jan–Apr 2025",
      team: "Solo",
      problem:
        "Shared households tracked money in group chats and spreadsheets. Nobody knew the real balance until the end of the month, and settling up started arguments.",
      approach: [
        {
          title: "Model the money first",
          body: "Designed the schema around households, members, and transactions before writing any UI, so every balance is derived rather than stored.",
        },
        {
          title: "Server components by default",
          body: "Lists and reports render on the server. Only the transaction form and live balance are client components.",
        },
        {
          title: "Optimistic updates",
          body: "New transactions appear instantly and reconcile with the server response, so the app feels local even on slow connections.",
        },
      ],
      highlights: [
        {
          title: "Race-free balances",
          body: "Two members adding expenses at the same moment used to double-count. Moving the balance calculation into a single SQL view removed the race entirely.",
        },
        {
          title: "Monthly reports in one query",
          body: "Replaced a loop of per-category queries with one grouped query, cutting report load time from seconds to milliseconds.",
        },
      ],
      results: [
        { value: "12", label: "Households using it" },
        { value: "<200ms", label: "Report load time" },
        { value: "0", label: "Spreadsheets left" },
      ],
      gallery: [],
      lessons:
        "Derive, don't store. Every bug that reached users came from a value that was saved when it could have been calculated.",
    },
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
    // Example of a partial write-up: sections with no content are hidden.
    caseStudy: {
      role: "Solo developer",
      timeframe: "Jun–Aug 2024",
      team: "Solo",
      problem:
        "Arcade racers either feel floaty or punish every mistake. The goal was drifting that is easy to start and hard to master.",
      approach: [
        {
          title: "Physics before graphics",
          body: "Built the drift model with grey boxes and tuned it for two weeks before drawing a single sprite.",
        },
      ],
      highlights: [],
      results: [],
      gallery: [],
      lessons: "",
    },
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
    caseStudy: null,
  },
];
