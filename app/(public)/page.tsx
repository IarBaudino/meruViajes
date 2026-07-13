import { HeroSection } from "@/components/home/hero-section";
import { ExcursionsPreview } from "@/components/home/excursions-preview";
import { AboutSection } from "@/components/home/about-section";
import { InquiryForm } from "@/components/home/inquiry-form";
import { GoogleReviewsSection } from "@/components/home/google-reviews-section";
import { getSiteSettings } from "@/lib/site-settings/get-site-settings";
import { getCachedGoogleReviews } from "@/lib/google/reviews";

/** CMS del hero cambia en admin; no servir HTML estático con imágenes vacías. */
export const revalidate = 60;

export default async function HomePage() {
  const settings = await getSiteSettings();
  const reviewsEnabled = settings.googleReviews?.enabled;
  const reviewsCache = reviewsEnabled ? await getCachedGoogleReviews() : null;

  return (
    <>
      <HeroSection hero={settings.hero} />
      <ExcursionsPreview section={settings.excursionsPreview} />
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
