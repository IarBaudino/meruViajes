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
  const backgroundMedia =
    hero.backgroundMedia && hero.backgroundMedia.length > 0
      ? hero.backgroundMedia
      : (hero.backgroundImages ?? []).map((url) => ({
          type: "image" as const,
          url,
        }));

  const hasMedia = backgroundMedia.length > 0;
  const onPhoto = hasMedia;

  return (
    <section
      className="relative flex min-h-[85vh] items-center justify-center overflow-hidden bg-brand-sand"
      aria-label="Presentación"
    >
      {hasMedia ? (
        <HeroCarouselBackground media={backgroundMedia} />
      ) : null}

      <div
        className={cn(
          "relative z-10 mx-auto max-w-5xl px-4 py-20 text-center sm:px-6",
          onPhoto && "[text-shadow:0_2px_24px_rgba(0,0,0,0.45)]"
        )}
      >
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className={cn(
            "mb-4 font-sans text-sm font-medium uppercase tracking-[0.28em]",
            onPhoto ? "text-brand-sand/90" : "text-brand-muted"
          )}
        >
          {hero.eyebrow}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className={cn(
            "text-5xl font-normal leading-[1.08] md:leading-[1.06]",
            onPhoto ? "text-brand-sand" : "text-brand-charcoal"
          )}
        >
          {hero.title}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className={cn(
            "font-accent mt-6 text-2xl tracking-normal md:text-3xl",
            onPhoto ? "text-brand-sand" : "text-brand-muted"
          )}
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
              "border-2 border-brand-charcoal bg-white text-brand-charcoal shadow-md hover:bg-brand-sand"
            )}
          >
            {hero.ctaPrimaryLabel}
          </Link>
          <Link
            href={hero.ctaSecondaryHref}
            className={cn(
              btnBase,
              onPhoto
                ? "border-2 border-brand-sand/90 text-brand-sand hover:bg-white/10"
                : "border-2 border-brand-charcoal text-brand-charcoal hover:bg-white/70"
            )}
          >
            {hero.ctaSecondaryLabel}
          </Link>
        </motion.div>
      </div>

      <a
        href="#excursiones"
        className={cn(
          "absolute bottom-8 left-1/2 -translate-x-1/2 transition-colors",
          onPhoto
            ? "text-brand-sand/75 hover:text-brand-sand"
            : "text-brand-muted hover:text-brand-charcoal"
        )}
        aria-label="Ir a excursiones"
      >
        <ChevronDown className="h-8 w-8 animate-bounce" />
      </a>
    </section>
  );
}
