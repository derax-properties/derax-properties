"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getCurrentAdminProfile, isOwnerOrAdmin } from "@/lib/supabase/profile";
import {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  MAX_FILE_SIZE_BYTES,
  MAX_VIDEO_SIZE_BYTES,
} from "@/lib/validation";

type MediaKind = "photo" | "video";

/**
 * Step 1 of adding a photo/video to an existing lead: mint a signed
 * Storage upload URL and hand it to the browser, which then uploads the
 * file directly to Supabase Storage (see LeadMediaUploader.tsx) instead of
 * sending it through this server action's own request body. That's not
 * just style — a server action's body goes through the same Vercel
 * function payload limit as an API route, which a multi-file batch of
 * photos (or any real video file) would blow past. The signed URL is
 * minted with the service-role client so the browser's own anon-key
 * client can use it without needing broad storage write access.
 */
export async function getMediaUploadTarget(
  leadId: string,
  fileName: string,
  fileType: string,
  kind: MediaKind
): Promise<{ signedUrl: string; token: string; path: string; bucket: string } | { error: string }> {
  const profile = await getCurrentAdminProfile();
  if (!profile || !isOwnerOrAdmin(profile)) return { error: "Not authorized." };

  const allowed = kind === "photo" ? ALLOWED_IMAGE_TYPES : ALLOWED_VIDEO_TYPES;
  if (!allowed.includes(fileType)) return { error: `That file type isn't supported for a ${kind}.` };

  const supabase = createServerSupabaseClient();
  const { data: lead } = await supabase.from("seller_submissions").select("id").eq("id", leadId).maybeSingle();
  if (!lead) return { error: "Lead not found." };

  const adminSupabase = createAdminSupabaseClient();
  const bucket =
    kind === "photo"
      ? process.env.SUPABASE_SELLER_PHOTOS_BUCKET || "seller-photos"
      : process.env.SUPABASE_SELLER_VIDEOS_BUCKET || "seller-videos";

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${leadId}/${Date.now()}-${safeName}`;

  const { data, error } = await adminSupabase.storage.from(bucket).createSignedUploadUrl(path);
  if (error || !data) return { error: error?.message ?? "Could not prepare the upload." };

  return { signedUrl: data.signedUrl, token: data.token, path, bucket };
}

/**
 * Step 2, called only after the browser's direct-to-storage upload (step 1)
 * has actually succeeded: record the row so the lead page's Photos/Videos
 * panels can find it. Uses the admin's own session client, not the
 * service-role client — the "Admins can insert seller photos/videos" RLS
 * policies already allow this for an authenticated admin, so there's no
 * need to reach for the broader service-role key here.
 */
export async function confirmMediaUpload(leadId: string, kind: MediaKind, storagePath: string, fileSize: number) {
  const profile = await getCurrentAdminProfile();
  if (!profile || !isOwnerOrAdmin(profile)) return { error: "Not authorized." };

  const maxSize = kind === "photo" ? MAX_FILE_SIZE_BYTES : MAX_VIDEO_SIZE_BYTES;
  if (fileSize > maxSize) return { error: "File is larger than allowed." };

  const supabase = createServerSupabaseClient();
  const table = kind === "photo" ? "seller_property_photos" : "seller_property_videos";
  const { error } = await supabase.from(table).insert({ submission_id: leadId, storage_path: storagePath });
  if (error) return { error: error.message };

  await supabase.from("activity_log").insert({
    seller_submission_id: leadId,
    actor_id: profile.id,
    actor_type: "user",
    action: kind === "photo" ? "Added a photo" : "Added a video",
  });

  revalidatePath(`/admin/leads/${leadId}`);
  return { success: true as const };
}
