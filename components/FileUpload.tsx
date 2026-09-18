"use client";

import { useRef } from "react";
import { cx } from "@/lib/utils";

export interface StagedFile {
  file: File;
  id: string;
  progress: number; // 0-100, set once actual upload begins
  status: "pending" | "uploading" | "done" | "error";
}

export function FileUpload({
  label,
  hint,
  accept,
  multiple = true,
  files,
  onFilesChange,
  maxFiles = 12,
}: {
  label: string;
  hint?: string;
  accept: string;
  multiple?: boolean;
  files: StagedFile[];
  onFilesChange: (files: StagedFile[]) => void;
  maxFiles?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handlePick(list: FileList | null) {
    if (!list) return;
    const incoming = Array.from(list).slice(0, Math.max(0, maxFiles - files.length));
    const staged: StagedFile[] = incoming.map((file) => ({
      file,
      id: `${file.name}-${file.size}-${crypto.randomUUID()}`,
      progress: 0,
      status: "pending",
    }));
    onFilesChange([...files, ...staged]);
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeFile(id: string) {
    onFilesChange(files.filter((f) => f.id !== id));
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-ink/80">{label}</p>
      {hint && <p className="text-xs text-ink/45">{hint}</p>}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="focus-gold flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gold/40 bg-cream px-6 py-8 text-center transition-colors hover:border-gold hover:bg-gold/5"
      >
        <span className="font-semibold text-ink">Tap to choose files</span>
        <span className="text-xs text-ink/50">JPG, PNG, HEIC or PDF — up to 15MB each</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(e) => handlePick(e.target.files)}
      />

      {files.length > 0 && (
        <ul className="mt-2 flex flex-col gap-2">
          {files.map((f) => (
            <li
              key={f.id}
              className="flex items-center gap-3 rounded-lg border border-ink/10 bg-white px-3 py-2 text-sm"
            >
              <span className="flex-1 truncate">{f.file.name}</span>
              <span className="text-xs text-ink/40">{(f.file.size / 1024 / 1024).toFixed(1)}MB</span>
              {f.status === "uploading" && (
                <span className="h-1.5 w-16 overflow-hidden rounded-full bg-ink/10">
                  <span
                    className="block h-full bg-gold transition-all"
                    style={{ width: `${f.progress}%` }}
                  />
                </span>
              )}
              {f.status === "done" && <span className="text-xs font-semibold text-emerald-600">Uploaded</span>}
              {f.status === "error" && <span className="text-xs font-semibold text-red-600">Failed</span>}
              <button
                type="button"
                onClick={() => removeFile(f.id)}
                className={cx(
                  "focus-gold rounded-full px-2 text-ink/40 hover:text-red-600",
                  f.status === "uploading" && "pointer-events-none opacity-40"
                )}
                aria-label={`Remove ${f.file.name}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
