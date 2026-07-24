import type { Metadata } from "next";
import { HeroSection } from "@/components/home/hero-section";
import { ExcursionsPreview } from "@/components/home/excursions-preview";
import { PackagesPreview } from "@/components/home/packages-preview";
import { AboutSection } from "@/components/home/about-section";
import { InquiryForm } from "@/components/home/inquiry-form";
import { GoogleReviewsSection } from "@/components/home/google-reviews-section";
import { getSiteSettings } from "@/lib/site-settings/get-site-settings";
import { getCachedGoogleReviews } from "@/lib/google/reviews";
import { JsonLd } from "@/components/seo/json-ld";

/** CMS del hero cambia en admin; no servir HTML estático con imágenes vacías. */
export const revalidate = 60;

const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://meruviajes.tur.ar").replace(
  /\/$/,
  ""
);

export const metadata: Metadata = {
  title: "Meru Viajes y Turismo | Excursiones en Ushuaia",
  description:
    "Excursiones y paquetes en Ushuaia, Tierra del Fuego. Reservá online con Meru Viajes y Turismo.",
  alternates: { canonical: appUrl },
  openGraph: {
    title: "Meru Viajes y Turismo | Ushuaia",
    description:
      "Excursiones y paquetes en el Fin del Mundo. Reservá online con Meru.",
    url: appUrl,
    type: "website",
  },
};

export default async function HomePage() {
  const settings = await getSiteSettings();
  const reviewsEnabled = settings.googleReviews?.enabled;
  const reviewsCache = reviewsEnabled ? await getCachedGoogleReviews() : null;
  const phone =
    settings.footer?.phoneNumber?.replace(/\D/g, "") ||
    settings.footer?.phoneLabel?.replace(/\D/g, "") ||
    undefined;

  const localBusiness = {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    name: "Meru Viajes y Turismo",
    url: appUrl,
    image: `${appUrl}/logo.png`,
    description:
      "Excursiones y turismo en Ushuaia, Tierra del Fuego — Meru Viajes y Turismo.",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Ushuaia",
      addressRegion: "Tierra del Fuego",
      addressCountry: "AR",
    },
    ...(phone
      ? {
          telephone: phone.startsWith("54") ? `+${phone}` : `+54${phone}`,
        }
      : {}),
    ...(reviewsCache?.rating
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: reviewsCache.rating,
            reviewCount: reviewsCache.userRatingsTotal ?? reviewsCache.reviews.length,
          },
        }
      : {}),
  };

  return (
    <>
      <JsonLd data={localBusiness} />
      <HeroSection hero={settings.hero} />
      <ExcursionsPreview section={settings.excursionsPreview} />
      <PackagesPreview section={settings.packagesPreview} />
      <AboutSection about={settings.about} />
      {reviewsEnabled ? (
        <GoogleReviewsSection
          title={settings.googleReviews?.title ?? "Reseñas"}
          cache={reviewsCache}
        />
      ) : null}
      <InquiryForm inquiry={settings.inquiry} />
    </>
  );
}
