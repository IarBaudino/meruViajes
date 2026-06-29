"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SiteSettings } from "@/types/site-settings";
import { HeroCarouselBackground } from "@/components/home/hero-carousel-background";

const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors px-7 py-3.5 text-lg";

type HeroSectionProps = {
  hero: SiteSettings["hero"];
};

export function HeroSection({ hero }: HeroSectionProps) {
  const backgroundImages = hero.backgroundImages ?? [];

  return (
    <section
      className="relative flex min-h-[85vh] items-center justify-center overflow-hidden bg-meru-charcoal"
      aria-label="Presentación"
    >
      {backgroundImages.length > 0 ? (
        <HeroCarouselBackground images={backgroundImages} />
      ) : null}
      <div
        className="absolute inset-0 opacity-90"
        style={{
          background:
            "linear-gradient(160deg, rgba(60,60,59,0.97) 0%, rgba(0,102,51,0.55) 45%, rgba(0,77,39,0.75) 100%)",
        }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-20 text-center sm:px-6">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-4 font-sans text-sm font-medium uppercase tracking-[0.28em] text-meru-sand/90"
        >
          {hero.eyebrow}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl font-normal leading-[1.08] text-meru-sand sm:text-5xl md:text-6xl md:leading-[1.06]"
        >
          {hero.title}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="font-accent mt-6 text-2xl tracking-wide text-meru-sand sm:text-3xl"
        >
          {hero.subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Link
            href={hero.ctaPrimaryHref}
            className={cn(
              btnBase,
              "bg-meru-secondary text-white shadow-md hover:bg-meru-secondary-hover"
            )}
          >
            {hero.ctaPrimaryLabel}
          </Link>
          <Link
            href={hero.ctaSecondaryHref}
            className={cn(
              btnBase,
              "border-2 border-meru-sand/90 text-meru-sand hover:bg-white/10"
            )}
          >
            {hero.ctaSecondaryLabel}
          </Link>
        </motion.div>
      </div>

      <a
        href="#excursiones"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-meru-sand/75 transition-colors hover:text-meru-sand"
        aria-label="Ir a excursiones"
      >
        <ChevronDown className="h-8 w-8 animate-bounce" />
      </a>
    </section>
  );
}
