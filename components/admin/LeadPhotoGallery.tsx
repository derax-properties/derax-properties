"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

export type GalleryPhoto = { id: string; url: string };

/**
 * A lead's photo thumbnails used to open in a new browser tab (leaving the
 * CRM entirely). This replaces that with a lightbox that floats directly
 * over the CRM itself — the page behind it stays visible, just dimmed and
 * blurred, rather than a blank tab — with a soft 3D pop-in on open and
 * arrow buttons (plus ←/→ and Escape) to slide through the rest of the
 * lead's photos without ever leaving the page.
 *
 * It opens at this medium "floating over the CRM" size by default, but a
 * toggle button at the top of the photo switches to a full-screen size
 * (the photo fills as much of the screen as it can) without closing or
 * losing your place in the gallery — the arrows/keys still slide through
 * the same photos either way. This is a plain CSS size swap rather than
 * the browser's native Fullscreen API, specifically so it behaves the same
 * on an iPhone as it does on desktop Chrome (iOS Safari's support for that
 * API on arbitrary elements is unreliable).
 *
 * Each gallery instance is self-contained and only ever cycles through the
 * list of photos it was given — the small top preview on the lead-detail
 * page passes just its first few, the full "Photos & Videos" panel passes
 * all of them, matching how the grids already worked before this.
 */
export function LeadPhotoGallery({
  photos,
  gridClassName,
}: {
  photos: GalleryPhoto[];
  gridClassName: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  // The lightbox is portaled straight to document.body (see the render
  // below), so it needs to know the DOM is actually ready to receive it.
  // On the server, and for the very first client render before hydration
  // settles, document.body isn't a safe portal target yet — this flips to
  // true right after mount, which is exactly when it's safe.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const close = useCallback(() => {
    setOpenIndex(null);
    setIsFullScreen(false);
  }, []);
  const showPrev = useCallback(
    () => setOpenIndex((i) => (i === null ? null : (i - 1 + photos.length) % photos.length)),
    [photos.length]
  );
  const showNext = useCallback(
    () => setOpenIndex((i) => (i === null ? null : (i + 1) % photos.length)),
    [photos.length]
  );

  useEffect(() => {
    if (openIndex === null) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") showPrev();
      if (e.key === "ArrowRight") showNext();
    }
    document.addEventListener("keydown", handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [openIndex, close, showPrev, showNext]);

  if (photos.length === 0) return null;

  const active = openIndex !== null ? photos[openIndex] : null;

  return (
    <>
      <div className={gridClassName}>
        {photos.map((p, i) => (
          <button key={p.id} type="button" onClick={() => setOpenIndex(i)} className="crm-water-hover block">
            {/*
              Thumbnails were previously a plain <img> pointing straight at the
              full-resolution original in storage — a multi-megabyte phone
              photo downloading (and visibly painting in stripe by stripe) just
              to show a small square preview. next/image requests a properly
              sized, compressed version instead (built into Next.js/Vercel,
              already configured in next.config.js — no new service or cost),
              so this grid now loads fast. width={0}/height={0} + sizes is
              next/image's documented pattern for "responsive, real aspect
              ratio unknown ahead of time" — the aspect-square/object-cover
              classes below control the actual box exactly as before.
            */}
            <Image
              src={p.url}
              alt=""
              width={0}
              height={0}
              sizes="(max-width: 640px) 33vw, 200px"
              className="aspect-square w-full rounded-lg object-cover"
              style={{ width: "100%", height: "auto" }}
              unoptimized={false}
            />
          </button>
        ))}
      </div>

      {active && mounted &&
        createPortal(
          <div
            className={`crm-lightbox-backdrop ${isFullScreen ? "crm-lightbox-backdrop--full" : ""}`}
            onClick={close}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsFullScreen((f) => !f);
              }}
              aria-label={isFullScreen ? "Exit full screen" : "View full screen"}
              title={isFullScreen ? "Exit full screen" : "View full screen"}
              className="crm-lightbox-fullscreen-toggle"
            >
              {isFullScreen ? "⤡" : "⤢"}
            </button>

            <button type="button" onClick={close} aria-label="Close photo" className="crm-lightbox-close">
              ✕
            </button>

            {photos.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  showPrev();
                }}
                aria-label="Previous photo"
                className="crm-lightbox-arrow crm-lightbox-arrow--prev"
              >
                ‹
              </button>
            )}

            <div
              className={`crm-lightbox-stage ${isFullScreen ? "crm-lightbox-stage--full" : ""}`}
              onClick={(e) => e.stopPropagation()}
            >
              {/*
                This full-size view was the slow one Eric flagged: a raw <img>
                to the original file, painting in visibly over ~10 seconds on
                a big phone photo. Same next/image fix as the thumbnails above
                — the existing crm-lightbox-image / --full CSS classes already
                define max-width/max-height/width:auto, so this renders at the
                exact same size as before, just fetched as a resized,
                compressed version instead of the raw original.
              */}
              <Image
                key={active.id}
                src={active.url}
                alt=""
                width={0}
                height={0}
                sizes="(max-width: 640px) 100vw, 1000px"
                className={`crm-lightbox-image ${isFullScreen ? "crm-lightbox-image--full" : ""}`}
                style={{ width: "auto", height: "auto" }}
                unoptimized={false}
                priority
              />
              {photos.length > 1 && (
                <p className="crm-lightbox-counter">
                  {(openIndex ?? 0) + 1} / {photos.length}
                </p>
              )}
            </div>

            {photos.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  showNext();
                }}
                aria-label="Next photo"
                className="crm-lightbox-arrow crm-lightbox-arrow--next"
              >
                ›
              </button>
            )}
          </div>,
          document.body
        )}
    </>
  );
}
