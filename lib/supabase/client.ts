"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client. Uses only the public URL + anon key, both
 * of which are safe to expose to the client. Row Level Security policies
 * (see supabase/policies.sql) control exactly what an anonymous visitor
 * can read or write with this client — e.g. it can INSERT a seller
 * submission but cannot SELECT other people's submissions.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
