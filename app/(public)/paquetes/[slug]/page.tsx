import { notFound } from "next/navigation";
import Image from "next/image";
import {
  getActivePackages,
  getPackageBySlug,
} from "@/features/packages/lib/get-packages";
import { getServiceByIdAdmin } from "@/features/excursions/lib/get-services";
import { AddPackageToCartButton } from "@/features/packages/components/add-package-to-cart-button";
import { formatCurrencyARS } from "@/lib/format";
import Link from "next/link";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const packages = await getActivePackages();
  return packages.map((pkg) => ({ slug: pkg.slug }));
}

export default async function PackageDetailPage({ params }: Props) {
  const { slug } = await params;
  const pkg = await getPackageBySlug(slug);
  if (!pkg) notFound();

  const included = (
    await Promise.all(pkg.serviceIds.map((id) => getServiceByIdAdmin(id)))
  ).filter(Boolean);

  const cover = pkg.photos[0];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-sm text-meru-muted">
        <Link href="/paquetes" className="hover:text-meru-secondary">
          Paquetes
        </Link>{" "}
        / {pkg.title}
      </p>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          {cover ? (
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-meru-ice">
              <Image
                src={cover}
                alt={pkg.title}
                fill
                className="object-cover"
                sizes="(max-width:1024px) 100vw, 60vw"
                priority
              />
            </div>
          ) : null}
          <h1 className="mt-6 text-3xl text-meru-charcoal sm:text-4xl">{pkg.title}</h1>
          <p className="mt-4 whitespace-pre-line text-meru-muted leading-relaxed">
            {pkg.description}
          </p>

          <section className="mt-10">
            <h2 className="text-xl text-meru-charcoal">Incluye</h2>
            <ul className="mt-4 space-y-2">
              {included.map((service) =>
                service ? (
                  <li key={service.id}>
                    <Link
                      href={`/excursiones/${service.slug}`}
                      className="text-meru-secondary hover:underline"
                    >
                      {service.title}
                    </Link>
                  </li>
                ) : null
              )}
            </ul>
          </section>
        </div>

        <aside className="h-fit rounded-2xl border border-meru-border bg-white p-6 shadow-sm">
          <p className="text-sm text-meru-muted">Precio del paquete</p>
          <p className="mt-1 text-3xl font-semibold text-meru-primary">
            {formatCurrencyARS(pkg.price)}
          </p>
          <p className="mt-2 text-sm text-meru-muted">
            {pkg.stock > 0
              ? `${pkg.stock} cupo${pkg.stock === 1 ? "" : "s"} disponible${pkg.stock === 1 ? "" : "s"}`
              : "Sin cupos por el momento"}
          </p>
          <div className="mt-6">
            <AddPackageToCartButton package={pkg} />
          </div>
        </aside>
      </div>
    </div>
  );
}
