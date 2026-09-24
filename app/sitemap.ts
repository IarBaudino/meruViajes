import type { MetadataRoute } from "next";
import { getActiveServices } from "@/features/excursions/lib/get-services";
import { getActivePackages } from "@/features/packages/lib/get-packages";

const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://meruviajes.tur.ar").replace(
  /\/$/,
  ""
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [services, packages] = await Promise.all([
    getActiveServices().catch(() => []),
    getActivePackages().catch(() => []),
  ]);

  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: appUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${appUrl}/excursiones`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${appUrl}/paquetes`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.85,
    },
  ];

  const excursionRoutes: MetadataRoute.Sitemap = services.map((service) => ({
    url: `${appUrl}/excursiones/${service.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const packageRoutes: MetadataRoute.Sitemap = packages.map((pkg) => ({
    url: `${appUrl}/paquetes/${pkg.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.75,
  }));

  return [...staticRoutes, ...excursionRoutes, ...packageRoutes];
}
