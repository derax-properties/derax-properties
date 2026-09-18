import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  ALLOWED_DOCUMENT_TYPES,
  ALLOWED_IMAGE_TYPES,
  MAX_FILE_SIZE_BYTES,
} from "@/lib/validation";

export const runtime = "nodejs";

/**
 * Accepts a single file upload for an existing seller submission.
 * multipart/form-data fields:
 *   - file: the File
 *   - kind: "photo" | "document"
 *
 * Files are written to a private Supabase Storage bucket under the
 * submission's id, and a row is added to seller_property_photos or
 * seller_documents so the admin dashboard can list and open them.
 * Only the service-role key (server-side only) can write to these
 * buckets — see supabase/policies.sql.
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const submissionId = params.id;

  const formData = await request.formData();
  const file = formData.get("file");
  const kind = formData.get("kind");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (kind !== "photo" && kind !== "document") {
    return NextResponse.json({ error: "Invalid upload kind." }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: "File is larger than 15MB." }, { status: 413 });
  }

  const allowed = kind === "photo" ? ALLOWED_IMAGE_TYPES : ALLOWED_DOCUMENT_TYPES;
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "That file type is not supported." }, { status: 415 });
  }

  try {
    const supabase = createAdminSupabaseClient();

    // Confirm the submission exists before accepting an upload for it.
    const { data: submission, error: submissionError } = await supabase
      .from("seller_submissions")
      .select("id")
      .eq("id", submissionId)
      .single();

    if (submissionError || !submission) {
      return NextResponse.json({ error: "Submission not found." }, { status: 404 });
    }

    const bucket =
      kind === "photo"
        ? process.env.SUPABASE_SELLER_PHOTOS_BUCKET || "seller-photos"
        : process.env.SUPABASE_SELLER_DOCS_BUCKET || "seller-documents";

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${submissionId}/${Date.now()}-${safeName}`;

    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(storagePath, Buffer.from(arrayBuffer), {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const table = kind === "photo" ? "seller_property_photos" : "seller_documents";
    const insertPayload =
      kind === "photo"
        ? { submission_id: submissionId, storage_path: storagePath }
        : { submission_id: submissionId, storage_path: storagePath, document_type: file.type };

    const { error: insertError } = await supabase.from(table).insert(insertPayload);
    if (insertError) throw insertError;

    return NextResponse.json({ success: true, path: storagePath });
  } catch (error) {
    console.error("[api/seller-submissions/uploads] Failed:", error);
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
}
