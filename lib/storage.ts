import { createAdminSupabaseClient } from "./supabase/admin";

/**
 * Generates a short-lived signed URL for a private storage object (seller
 * photos/documents) so the admin dashboard can display or download it
 * without making the bucket public. URLs expire after `expiresIn` seconds.
 */
export async function getSignedUrl(bucket: string, path: string, expiresIn = 60 * 10) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error || !data) return null;
  return data.signedUrl;
}
