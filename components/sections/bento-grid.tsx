import { DisciplineCard } from "@/components/sections/discipline-card";
import { TechStackCard } from "@/components/sections/tech-stack-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { baybayin } from "@/data/baybayin";
import { getSkillCategories } from "@/lib/queries";

export async function BentoGrid() {
  const categories = await getSkillCategories();

  return (
    <section id="stack" className="relative px-6 py-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-12">
        <SectionHeading eyebrow="Toolkit" title="Stack & Discipline" script={baybayin.stack} />

        <div className="grid auto-rows-[minmax(11rem,auto)] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <DisciplineCard className="min-h-80 sm:col-span-2 lg:col-span-3 lg:row-span-2" />

          {categories.map((category, index) => (
            <TechStackCard
              key={category.id}
              category={category}
              className={index === 0 ? "lg:col-span-3" : "lg:col-span-1"}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
