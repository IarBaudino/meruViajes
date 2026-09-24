import type { Metadata } from "next";
import { Suspense } from "react";
import { HeroSection } from "@/components/home/hero-section";
import { ExcursionsPreview } from "@/components/home/excursions-preview";
import { PackagesPreview } from "@/components/home/packages-preview";
import { GroupTripsPreview } from "@/components/home/group-trips-preview";
import { AboutSection } from "@/components/home/about-section";
import { InquiryForm } from "@/components/home/inquiry-form";
import { GoogleReviewsSection } from "@/components/home/google-reviews-section";
import { brand, getAppUrl } from "@/config/brand";
import { getSiteSettings } from "@/lib/site-settings/get-site-settings";
import { getCachedGoogleReviews } from "@/lib/google/reviews";
import { JsonLd } from "@/components/seo/json-ld";

/** CMS del hero cambia en admin; no servir HTML estático con imágenes vacías. */
export const revalidate = 60;

const appUrl = getAppUrl();

export const metadata: Metadata = {
  title: brand.seo.titleDefault,
  description: brand.seo.description,
  alternates: { canonical: appUrl },
  openGraph: {
    title: brand.seo.titleDefault,
    description: brand.seo.description,
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
  const code = brand.countryCallingCode;

  const localBusiness = {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    name: brand.agencyName,
    url: appUrl,
    image: `${appUrl}${brand.logo.src}`,
    description: brand.seo.description,
    address: {
      "@type": "PostalAddress",
      addressLocality: brand.location.city,
      addressRegion: brand.location.region,
      addressCountry: brand.location.countryCode,
    },
    ...(phone
      ? {
          telephone: phone.startsWith(code) ? `+${phone}` : `+${code}${phone}`,
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
      <GroupTripsPreview section={settings.groupTripsPreview} />
      <AboutSection about={settings.about} />
      {reviewsEnabled ? (
        <GoogleReviewsSection
          title={settings.googleReviews?.title ?? "Reseñas"}
          cache={reviewsCache}
        />
      ) : null}
      <Suspense fallback={null}>
        <InquiryForm inquiry={settings.inquiry} />
      </Suspense>
    </>
  );
}
