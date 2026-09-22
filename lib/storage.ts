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

/**
 * Batched version of getSignedUrl — one Supabase Storage request that signs
 * every path at once (`createSignedUrls`), instead of one HTTP round trip
 * per file. A lead with, say, 12 photos previously fired 12 separate signed-
 * URL requests (run concurrently, but each still a full round trip); this
 * fires exactly one per bucket. Returns a path → URL map (null for a path
 * that failed to sign) so callers can look up each row's URL by its own
 * storage_path, same as before.
 */
export async function getSignedUrls(
  bucket: string,
  paths: string[],
  expiresIn = 60 * 10
): Promise<Map<string, string | null>> {
  const result = new Map<string, string | null>();
  if (paths.length === 0) return result;

  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase.storage.from(bucket).createSignedUrls(paths, expiresIn);
  if (error || !data) {
    for (const p of paths) result.set(p, null);
    return result;
  }

  for (const row of data) {
    if (row.path) result.set(row.path, row.signedUrl ?? null);
  }
  return result;
}
