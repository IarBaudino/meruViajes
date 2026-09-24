"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { HeroMediaItem } from "@/types/site-settings";

const IMAGE_INTERVAL_MS = 6000;
const FADE_SECONDS = 1.2;

type Props = {
  media: HeroMediaItem[];
};

export function HeroCarouselBackground({ media }: Props) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [media]);

  useEffect(() => {
    if (media.length <= 1) return;
    const current = media[index];
    if (current?.type === "video") return;

    const id = window.setInterval(() => {
      setIndex((currentIndex) => (currentIndex + 1) % media.length);
    }, IMAGE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [index, media]);

  if (media.length === 0) return null;

  function goNext() {
    setIndex((currentIndex) => (currentIndex + 1) % media.length);
  }

  return (
    <div className="absolute inset-0 z-0" aria-hidden>
      {media.map((item, i) => (
        <motion.div
          key={`${item.type}-${item.url}-${i}`}
          className="absolute inset-0 overflow-hidden bg-meru-charcoal"
          initial={{ opacity: i === 0 ? 1 : 0 }}
          animate={{ opacity: i === index ? 1 : 0 }}
          transition={{ duration: FADE_SECONDS, ease: "easeInOut" }}
        >
          {item.type === "video" ? (
            i === index ? (
              <video
                key={`${item.url}-active`}
                className="h-full w-full object-cover"
                src={item.url}
                muted
                playsInline
                autoPlay
                loop={media.length === 1}
                onEnded={media.length > 1 ? goNext : undefined}
              />
            ) : (
              <div className="h-full w-full bg-meru-charcoal" />
            )
          ) : (
            <div
              className="h-full w-full bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url("${item.url}")` }}
            />
          )}
        </motion.div>
      ))}
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(180deg, rgba(20,20,18,0.55) 0%, rgba(20,20,18,0.42) 45%, rgba(20,20,18,0.72) 100%)",
        }}
      />
    </div>
  );
}
