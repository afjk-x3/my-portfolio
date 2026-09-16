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
        "flex flex-col gap-4 rounded-card border border-line bg-surface p-6 transition-colors hover:border-accent/40",
        className,
      )}
    >
      <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-muted">
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
