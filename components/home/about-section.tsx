import { Eye, Heart, Target } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { SiteSettings } from "@/types/site-settings";

const VALUE_ICONS = [Target, Eye, Heart];

type AboutSectionProps = {
  about: SiteSettings["about"];
};

export function AboutSection({ about }: AboutSectionProps) {
  return (
    <section id="sobre-nosotros" className="scroll-mt-24 bg-meru-sand py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl text-meru-charcoal sm:text-4xl">{about.title}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg italic text-meru-charcoal-muted">
            &ldquo;{about.quote}&rdquo;
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {about.values.map(({ title, text }, index) => {
            const Icon = VALUE_ICONS[index] ?? Target;
            return (
              <Card key={title} className="transition-shadow hover:shadow-[var(--shadow-elevated)]">
                <CardContent className="pt-8">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-meru-ice">
                    <Icon className="h-6 w-6 text-meru-primary" aria-hidden />
                  </div>
                  <h3 className="text-lg text-meru-charcoal">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-meru-charcoal-muted">{text}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="mx-auto mt-12 max-w-3xl text-center leading-relaxed text-meru-charcoal-muted">
          {about.closingText}
        </p>
      </div>
    </section>
  );
}
