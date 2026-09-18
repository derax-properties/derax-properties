import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. This bypasses Row Level Security entirely,
 * so it must NEVER be imported into client code and must only be used
 * inside Route Handlers / Server Actions that run exclusively on the
 * server (this file has no "use client" and imports the raw service key).
 *
 * Used for: writing file uploads to private storage buckets on the
 * seller's behalf, and for admin dashboard reads/writes once a session
 * has already been verified as an authenticated admin.
 */
export function createAdminSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Supabase service role is not configured. Set SUPABASE_SERVICE_ROLE_KEY in your environment."
    );
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}
