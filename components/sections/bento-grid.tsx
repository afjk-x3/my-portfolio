import { DisciplineCard } from "@/components/sections/discipline-card";
import { TechStackCard } from "@/components/sections/tech-stack-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { getSkillCategories } from "@/lib/queries";

export async function BentoGrid() {
  const categories = await getSkillCategories();

  return (
    <section id="stack" className="relative px-6 py-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-12">
        <SectionHeading eyebrow="Toolkit" title="Stack & Discipline" />

        {/* From lg up: the discipline photo on the left half, the stack cards in a 2×2 grid on the right. */}
        <div className="grid auto-rows-[minmax(11rem,auto)] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DisciplineCard className="aspect-4/5 sm:col-span-2 sm:aspect-4/3 lg:row-span-2 lg:aspect-auto lg:min-h-[36rem]" />

          {categories.map((category) => (
            <TechStackCard key={category.id} category={category} />
          ))}
        </div>
      </div>
    </section>
  );
}
