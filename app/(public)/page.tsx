import { HeroSection } from "@/components/home/hero-section";
import { ExcursionsPreview } from "@/components/home/excursions-preview";
import { AboutSection } from "@/components/home/about-section";
import { InquiryForm } from "@/components/home/inquiry-form";
import { getSiteSettings } from "@/lib/site-settings/get-site-settings";

export default async function HomePage() {
  const settings = await getSiteSettings();

  return (
    <>
      <HeroSection hero={settings.hero} />
      <ExcursionsPreview section={settings.excursionsPreview} />
      <AboutSection about={settings.about} />
      <InquiryForm inquiry={settings.inquiry} />
    </>
  );
}
