import { HeroSection } from "@/components/home/hero-section";
import { ExcursionsPreview } from "@/components/home/excursions-preview";
import { AboutSection } from "@/components/home/about-section";
import { InquiryForm } from "@/components/home/inquiry-form";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <ExcursionsPreview />
      <AboutSection />
      <InquiryForm />
    </>
  );
}
