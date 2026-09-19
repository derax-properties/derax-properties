import type { MetadataRoute } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.deraxrealestate.com";

const STATIC_ROUTES = [
  "",
  "/about",
  "/services",
  "/properties",
  "/sell-your-property",
  "/contact",
  "/privacy-policy",
  "/terms",
  "/disclaimer",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
  }));

  try {
    const supabase = createServerSupabaseClient();
    const { data } = await supabase.from("properties").select("slug, created_at").eq("status", "Available");

    const propertyEntries: MetadataRoute.Sitemap = (data ?? []).map((p) => ({
      url: `${siteUrl}/properties/${p.slug}`,
      lastModified: new Date(p.created_at),
    }));

    return [...staticEntries, ...propertyEntries];
  } catch {
    return staticEntries;
  }
}
