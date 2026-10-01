"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cx } from "@/lib/utils";

/**
 * Full-bleed, auto-playing photo slideshow for the homepage hero: a
 * distressed property, a sold sign, a renovated flip, and a buyer/seller
 * shaking hands over a signed contract, crossfading behind the hero copy.
 * Starts automatically (no button needed) and needs no interaction.
 *
 * Timing, as requested: advances every 4s, plays for about a minute and a
 * half, then holds on the current photo for a couple of minutes before
 * starting its cycle again — so a visitor who lingers on the page still
 * sees it move again later, but it isn't animating forever in the
 * background. Adjust SLIDE_INTERVAL_MS / PLAY_DURATION_MS / PAUSE_DURATION_MS
 * below to retune.
 *
 * The photos are shown at full brightness/color (no dark veil) — the hero
 * copy sits in its own frosted-glass panel (see app/page.tsx) rather than
 * relying on the photo being dimmed, so the photo stays fully visible no
 * matter which slide is up.
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

export function HeroSlideshow({
  className,
  showDots = false,
}: {
  className?: string;
  /** Show a small slide-position indicator in the bottom-left corner. */
  showDots?: boolean;
}) {
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
    <div className={cx("absolute inset-0 overflow-hidden", className)}>
      {SLIDES.map((slide, i) => (
        <Image
          key={slide.src}
          src={slide.src}
          alt={slide.alt}
          fill
          sizes="100vw"
          priority={i === 0}
          className={cx(
            "object-cover transition-opacity duration-1000 ease-in-out",
            i === index ? "opacity-100" : "opacity-0"
          )}
        />
      ))}

      {showDots && (
        <div className="absolute bottom-6 left-6 z-10 flex gap-1.5 sm:bottom-7 sm:left-8">
          {SLIDES.map((slide, i) => (
            <span
              key={slide.src}
              className={cx(
                "h-1.5 w-1.5 rounded-full transition-colors",
                i === index ? "bg-amber-400" : "bg-white/35"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
