import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SkillCategory } from "@/types";

export interface TechStackCardProps {
  category: SkillCategory;
  className?: string;
}

export function TechStackCard({ category, className }: TechStackCardProps) {
  return (
    <article
      className={cn(
        "group flex flex-col gap-4 rounded-card border border-line bg-surface p-6 transition-[border-color,box-shadow] duration-300 hover:border-accent/50 hover:shadow-[0_0_40px_-16px_var(--color-accent)]",
        className,
      )}
    >
      <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-muted transition-colors group-hover:text-accent">
        {category.label}
      </h3>
      <ul className="flex flex-wrap gap-2">
        {category.skills.map((skill) => (
          <li key={skill.name}>
            <Badge className="text-fg">{skill.name}</Badge>
          </li>
        ))}
      </ul>
    </article>
  );
}
