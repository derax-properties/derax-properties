"use client";

import { useState } from "react";
import type { PropertyPhoto } from "@/lib/types";
import { PropertyImage } from "./PropertyImagePlaceholder";

export function PropertyGallery({
  title,
  coverImageUrl,
  photos,
}: {
  title: string;
  coverImageUrl: string | null;
  photos: PropertyPhoto[];
}) {
  const images = photos.length > 0 ? photos.map((p) => p.url) : coverImageUrl ? [coverImageUrl] : [];
  const [active, setActive] = useState(0);

  return (
    <div>
      <PropertyImage
        src={images[active] ?? null}
        alt={title}
        className="aspect-[16/10] w-full rounded-2xl"
      />
      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {images.map((url, i) => (
            <button
              key={url + i}
              onClick={() => setActive(i)}
              className={`focus-gold overflow-hidden rounded-lg border-2 ${
                i === active ? "border-gold" : "border-transparent"
              }`}
              aria-label={`View photo ${i + 1}`}
              aria-current={i === active}
            >
              <PropertyImage src={url} alt="" className="aspect-square w-full" seed={i} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
