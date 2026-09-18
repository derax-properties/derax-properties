"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function PhotoUploader({ propertyId }: { propertyId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError("");

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch(`/api/admin/properties/${propertyId}/photos`, {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error ?? "Upload failed.");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed.");
      }
    }

    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="focus-gold self-start rounded-full border border-gold px-4 py-2 text-sm font-semibold text-gold-dark hover:bg-gold hover:text-ink disabled:opacity-50"
      >
        {uploading ? "Uploading…" : "+ Upload Photos"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
