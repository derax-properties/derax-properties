"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

function readPropertyForm(formData: FormData) {
  return {
    title: String(formData.get("title") ?? ""),
    address_line: String(formData.get("address_line") ?? "") || null,
    city: String(formData.get("city") ?? ""),
    state: String(formData.get("state") ?? "").toUpperCase(),
    zip: String(formData.get("zip") ?? "") || null,
    price: Number(formData.get("price") ?? 0),
    bedrooms: formData.get("bedrooms") ? Number(formData.get("bedrooms")) : null,
    bathrooms: formData.get("bathrooms") ? Number(formData.get("bathrooms")) : null,
    square_feet: formData.get("square_feet") ? Number(formData.get("square_feet")) : null,
    year_built: formData.get("year_built") ? Number(formData.get("year_built")) : null,
    property_type: String(formData.get("property_type") ?? ""),
    strategy: String(formData.get("strategy") ?? ""),
    status: String(formData.get("status") ?? "Coming Soon"),
    badge: String(formData.get("badge") ?? "") || null,
    description: String(formData.get("description") ?? ""),
    highlights: String(formData.get("highlights") ?? "")
      .split("\n")
      .map((h) => h.trim())
      .filter(Boolean),
    cover_image_url: String(formData.get("cover_image_url") ?? "") || null,
  };
}

export async function createProperty(formData: FormData) {
  const values = readPropertyForm(formData);
  const slug = `${slugify(values.title)}-${Math.random().toString(36).slice(2, 7)}`;

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("properties")
    .insert({ ...values, slug })
    .select()
    .single();

  if (error) {
    redirect(`/admin/properties/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/properties");
  revalidatePath("/properties");
  revalidatePath("/");
  redirect(`/admin/properties/${data.id}/edit`);
}

export async function updateProperty(id: string, formData: FormData) {
  const values = readPropertyForm(formData);

  const supabase = createServerSupabaseClient();
  const { error } = await supabase.from("properties").update(values).eq("id", id);

  if (error) {
    redirect(`/admin/properties/${id}/edit?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/properties");
  revalidatePath("/properties");
  revalidatePath("/");
  redirect(`/admin/properties/${id}/edit?saved=1`);
}

export async function deleteProperty(id: string) {
  const supabase = createServerSupabaseClient();
  await supabase.from("properties").delete().eq("id", id);
  revalidatePath("/admin/properties");
  revalidatePath("/properties");
  revalidatePath("/");
  redirect("/admin/properties");
}
