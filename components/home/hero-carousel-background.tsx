"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const INTERVAL_MS = 6000;
const FADE_SECONDS = 1.2;

type HeroCarouselBackgroundProps = {
  images: string[];
};

export function HeroCarouselBackground({ images }: HeroCarouselBackgroundProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const id = setInterval(() => {
      setIndex((current) => (current + 1) % images.length);
    }, INTERVAL_MS);
    return () => clearInterval(id);
  }, [images.length]);

  if (images.length === 0) return null;

  return (
    <div className="absolute inset-0 z-0" aria-hidden>
      {images.map((src, i) => (
        <motion.div
          key={src}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url("${src}")` }}
          initial={{ opacity: i === 0 ? 1 : 0 }}
          animate={{ opacity: i === index ? 1 : 0 }}
          transition={{ duration: FADE_SECONDS, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}
