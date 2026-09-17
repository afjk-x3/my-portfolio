import type { DisciplinePhoto, SkillCategory } from "@/types";

export const skillCategories: SkillCategory[] = [
  {
    id: "skills-frontend",
    group: "frontend",
    label: "Frontend",
    order: 1,
    skills: [
      { name: "React" },
      { name: "Next.js" },
      { name: "TypeScript" },
      { name: "Tailwind CSS" },
    ],
  },
  {
    id: "skills-backend",
    group: "backend",
    label: "Backend",
    order: 2,
    skills: [{ name: "Node.js" }, { name: "Express" }, { name: "REST APIs" }],
  },
  {
    id: "skills-database",
    group: "database",
    label: "Databases",
    order: 3,
    skills: [{ name: "PostgreSQL" }, { name: "Supabase" }, { name: "MySQL" }],
  },
  {
    id: "skills-devops",
    group: "devops",
    label: "DevOps & Tools",
    order: 4,
    skills: [{ name: "Git" }, { name: "Vercel" }, { name: "Docker" }],
  },
];

export const disciplinePhotos: DisciplinePhoto[] = [
  {
    src: "/images/about/arnis-stance.jpg",
    alt: "Competing in Arnis, holding a ready stance before an exchange",
    width: 3024,
    height: 4032,
  },
  {
    src: "/images/about/arnis-action.jpg",
    alt: "Mid-exchange during an Arnis competition bout",
    width: 3024,
    height: 4032,
  },
];
