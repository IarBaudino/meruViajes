"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { SeasonalPhoto } from "@/types";
import { cn } from "@/lib/utils";

const seasonLabel: Record<SeasonalPhoto["season"], string> = {
  verano: "Verano",
  invierno: "Invierno",
  primavera: "Primavera",
  otono: "Otoño",
};

type Props = {
  photos: string[];
  title: string;
  seasonalPhotos?: SeasonalPhoto[];
};

export function ExcursionGallery({ photos, title, seasonalPhotos = [] }: Props) {
  const [index, setIndex] = useState(0);
  const displayPhotos =
    seasonalPhotos.length > 0 ? seasonalPhotos.map((s) => s.url) : photos;
  const current = displayPhotos[index] ?? photos[0];
  const hasSeasonal = seasonalPhotos.length > 0;

  function prev() {
    setIndex((i) => (i === 0 ? displayPhotos.length - 1 : i - 1));
  }

  function next() {
    setIndex((i) => (i === displayPhotos.length - 1 ? 0 : i + 1));
  }

  if (!current) return null;

  const seasonalCaption =
    hasSeasonal && seasonalPhotos[index]
      ? `${seasonLabel[seasonalPhotos[index]!.season]}${seasonalPhotos[index]!.label ? ` · ${seasonalPhotos[index]!.label}` : ""}`
      : null;

  return (
    <div className="space-y-4">
      <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-slate-200 shadow-[var(--shadow-card)]">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0"
          >
            <Image
              src={current}
              alt={
                seasonalCaption
                  ? `${title} — ${seasonalCaption}`
                  : `${title} — imagen ${index + 1} de ${displayPhotos.length}`
              }
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 960px, 100vw"
              priority
            />
          </motion.div>
        </AnimatePresence>
        {displayPhotos.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-meru-primary shadow-md hover:bg-white"
              aria-label="Imagen anterior"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-meru-primary shadow-md hover:bg-white"
              aria-label="Imagen siguiente"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
        {seasonalCaption && (
          <p className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3 text-sm text-white">
            Ushuaia en distintas estaciones · {seasonalCaption}
          </p>
        )}
      </div>

      {!hasSeasonal && photos.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((src, i) => (
            <li key={src}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                className={cn(
                  "relative h-16 w-24 shrink-0 overflow-hidden rounded-lg ring-2 ring-transparent transition-all",
                  i === index && "ring-meru-secondary"
                )}
                aria-label={`Ver miniatura ${i + 1}`}
                aria-current={i === index}
              >
                <Image src={src} alt="" fill className="object-cover" sizes="96px" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
