import Link from "next/link";
import { getHomeFeaturedPackages } from "@/features/packages/lib/get-packages";
import { Button } from "@/components/ui/button";
import { PackageCard } from "@/features/packages/components/package-card";
import type { SiteSettings } from "@/types/site-settings";

type Props = {
  section: SiteSettings["packagesPreview"];
};

export async function PackagesPreview({ section }: Props) {
  const preview = await getHomeFeaturedPackages(6);
  if (preview.length === 0) return null;

  return (
    <section id="paquetes" className="scroll-mt-24 bg-meru-sand/60 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl text-meru-charcoal">{section.title}</h2>
          <p className="mx-auto mt-4 max-w-2xl text-meru-muted">{section.description}</p>
        </div>

        <ul className="mt-12 grid list-none gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {preview.map((pkg) => (
            <li key={pkg.id}>
              <PackageCard package={pkg} />
            </li>
          ))}
        </ul>

        <div className="mt-10 text-center">
          <Link href="/paquetes">
            <Button variant="primary">Ver todos los paquetes</Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
