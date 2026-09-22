"use client";

import { useCallback, useEffect, useState } from "react";

export type GalleryPhoto = { id: string; url: string };

/**
 * A lead's photo thumbnails used to open in a new browser tab (leaving the
 * CRM entirely). This replaces that with a lightbox that floats directly
 * over the CRM itself — the page behind it stays visible, just dimmed and
 * blurred, rather than a blank tab — with a soft 3D pop-in on open and
 * arrow buttons (plus ←/→ and Escape) to slide through the rest of the
 * lead's photos without ever leaving the page.
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

  const close = useCallback(() => setOpenIndex(null), []);
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt="" className="aspect-square w-full rounded-lg object-cover" />
          </button>
        ))}
      </div>

      {active && (
        <div className="crm-lightbox-backdrop" onClick={close}>
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

          <div className="crm-lightbox-stage" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img key={active.id} src={active.url} alt="" className="crm-lightbox-image" />
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
        </div>
      )}
    </>
  );
}
