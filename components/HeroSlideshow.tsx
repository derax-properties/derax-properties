"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cx } from "@/lib/utils";

/**
 * Auto-playing photo slideshow for the homepage hero, replacing (well,
 * sitting alongside — see app/page.tsx) the flat HouseIllustration SVG with
 * real photos: a distressed property, a sold sign, a renovated flip, and a
 * buyer/seller shaking hands over a signed contract. Starts automatically
 * (no button needed) and needs no interaction.
 *
 * Timing, as requested: advances every 4s, plays for about a minute and a
 * half, then holds on the current photo for a couple of minutes before
 * starting its cycle again — so a visitor who lingers on the page still
 * sees it move again later, but it isn't animating forever in the
 * background. Adjust SLIDE_INTERVAL_MS / PLAY_DURATION_MS / PAUSE_DURATION_MS
 * below to retune.
 */
const SLIDES = [
  { src: "/images/hero/distressed-house.jpg", alt: "A distressed, run-down property before renovation" },
  { src: "/images/hero/sold-sign.jpg", alt: "A \"Sold\" sign in front of a home" },
  { src: "/images/hero/renovated-house.jpg", alt: "A beautifully renovated home" },
  { src: "/images/hero/handshake-contract.jpg", alt: "A buyer and seller shaking hands over a signed agreement" },
  { src: "/images/hero/contract-signing.jpg", alt: "Signing a purchase contract" },
];

const SLIDE_INTERVAL_MS = 4000;
const PLAY_DURATION_MS = 90_000;
const PAUSE_DURATION_MS = 150_000;

export function HeroSlideshow({ className }: { className?: string }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Advance slides every 4s while playing.
  useEffect(() => {
    if (!playing || reducedMotion) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [playing, reducedMotion]);

  // Flip between "playing" and "paused" on the longer cycle.
  useEffect(() => {
    if (reducedMotion) return;
    const delay = playing ? PLAY_DURATION_MS : PAUSE_DURATION_MS;
    const id = setTimeout(() => setPlaying((p) => !p), delay);
    return () => clearTimeout(id);
  }, [playing, reducedMotion]);

  return (
    <div className={cx("relative aspect-[4/3] overflow-hidden", className)}>
      {SLIDES.map((slide, i) => (
        <Image
          key={slide.src}
          src={slide.src}
          alt={slide.alt}
          fill
          sizes="(max-width: 768px) 100vw, 560px"
          priority={i === 0}
          className={cx(
            "object-cover transition-opacity duration-1000 ease-in-out",
            i === index ? "opacity-100" : "opacity-0"
          )}
        />
      ))}
    </div>
  );
}
