"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getMediaUploadTarget, confirmMediaUpload } from "@/app/admin/(dashboard)/leads/[id]/mediaActions";

const MAX_FILES = 10;
const ACCEPT = "image/jpeg,image/png,image/webp,image/heic,video/mp4,video/quicktime,video/webm,video/x-m4v";

interface QueuedFile {
  id: string;
  file: File;
  kind: "photo" | "video";
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

/**
 * Lets the owner attach photos and videos to a lead that already exists —
 * for the common case of a lead that came in before any media was
 * available, then getting pictures (or a walkthrough video) days later.
 * Up to 10 files at once, mixed photos and videos in the same batch.
 *
 * Each file goes straight from the browser to Supabase Storage using a
 * short-lived signed upload URL (see mediaActions.ts) rather than through
 * this component POSTing the file to a server action — that's what makes
 * video actually work here instead of hitting a server-side payload limit.
 * Only after that direct upload succeeds does a second, tiny server call
 * record the row so it shows up in the Photos/Videos panels below.
 */
export function LeadMediaUploader({ leadId }: { leadId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  function handlePick(list: FileList | null) {
    if (!list) return;
    const incoming = Array.from(list).slice(0, MAX_FILES);
    const staged: QueuedFile[] = incoming.map((file) => ({
      id: `${file.name}-${file.size}-${crypto.randomUUID()}`,
      file,
      kind: file.type.startsWith("video/") ? "video" : "photo",
      status: "pending",
    }));
    setQueue(staged);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleUpload() {
    if (queue.length === 0) return;
    setIsUploading(true);
    const supabase = createClient();

    for (const item of queue) {
      setQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, status: "uploading" } : q)));

      const target = await getMediaUploadTarget(leadId, item.file.name, item.file.type, item.kind);
      if ("error" in target) {
        setQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, status: "error", error: target.error } : q)));
        continue;
      }

      const { error: uploadError } = await supabase.storage
        .from(target.bucket)
        .uploadToSignedUrl(target.path, target.token, item.file);

      if (uploadError) {
        setQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, status: "error", error: uploadError.message } : q))
        );
        continue;
      }

      const confirmed = await confirmMediaUpload(leadId, item.kind, target.path, item.file.size);
      if ("error" in confirmed) {
        setQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, status: "error", error: confirmed.error } : q)));
        continue;
      }

      setQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, status: "done" } : q)));
    }

    setIsUploading(false);
    router.refresh();
  }

  const doneCount = queue.filter((q) => q.status === "done").length;
  const hasPending = queue.some((q) => q.status === "pending" || q.status === "error");

  return (
    <div className="mt-3 rounded-lg border border-dashed border-gold/40 bg-cream/50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-ink">Add Photos & Videos</p>
          <p className="text-xs text-ink/45">Up to {MAX_FILES} files at once — JPG, PNG, HEIC, WEBP, or MP4/MOV/WEBM video (200MB max per video).</p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="focus-gold rounded-full border border-gold bg-gold/10 px-4 py-1.5 text-xs font-bold text-gold-dark hover:bg-gold/20"
        >
          Choose Files
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="sr-only"
        onChange={(e) => handlePick(e.target.files)}
      />

      {queue.length > 0 && (
        <div className="mt-3 flex flex-col gap-1.5">
          {queue.map((q) => (
            <div key={q.id} className="flex items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-xs">
              <span className="rounded bg-ink/5 px-1.5 py-0.5 font-semibold uppercase tracking-wide text-ink/40">
                {q.kind}
              </span>
              <span className="flex-1 truncate text-ink/70">{q.file.name}</span>
              <span className="text-ink/40">{(q.file.size / 1024 / 1024).toFixed(1)}MB</span>
              {q.status === "pending" && <span className="text-ink/30">Waiting</span>}
              {q.status === "uploading" && <span className="font-semibold text-gold-dark">Uploading…</span>}
              {q.status === "done" && <span className="font-semibold text-emerald-600">Uploaded</span>}
              {q.status === "error" && <span className="font-semibold text-red-600" title={q.error}>Failed</span>}
            </div>
          ))}

          <div className="mt-1 flex items-center gap-3">
            {hasPending && (
              <button
                type="button"
                onClick={handleUpload}
                disabled={isUploading}
                className="focus-gold rounded-full bg-gold px-5 py-1.5 text-xs font-bold text-ink hover:bg-gold-light disabled:opacity-50"
              >
                {isUploading ? "Uploading…" : `Upload ${queue.length} File${queue.length === 1 ? "" : "s"}`}
              </button>
            )}
            {doneCount > 0 && !isUploading && (
              <button
                type="button"
                onClick={() => setQueue([])}
                className="focus-gold text-xs font-semibold text-ink/40 hover:text-ink/60"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
