"use client";

import { useState } from "react";

/**
 * Plain native multi-file input (name="photos") so it submits as part of
 * the surrounding server-action <form> with zero extra wiring — no
 * separate client-side upload step needed. This client component only
 * adds a local thumbnail preview on top of that native input; the actual
 * upload happens server-side in createLeadManually once the form posts.
 */
export function LeadPhotosField() {
  const [previews, setPreviews] = useState<string[]>([]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    previews.forEach((url) => URL.revokeObjectURL(url));
    const files = Array.from(e.target.files ?? []);
    setPreviews(files.map((f) => URL.createObjectURL(f)));
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-ink/80">Photos</label>
      <input
        type="file"
        name="photos"
        multiple
        accept="image/jpeg,image/png,image/webp,image/heic"
        onChange={handleChange}
        className="focus-gold block w-full text-sm text-ink/70 file:mr-4 file:rounded-full file:border-0 file:bg-gold file:px-4 file:py-2 file:text-sm file:font-semibold file:text-ink hover:file:bg-gold-light"
      />
      <p className="text-xs text-ink/45">JPG, PNG, HEIC or WEBP — up to 15MB each. Optional — you can add more later from the lead page.</p>

      {previews.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-2">
          {previews.map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={url} alt="" className="h-16 w-16 rounded-lg object-cover" />
          ))}
        </div>
      )}
    </div>
  );
}
