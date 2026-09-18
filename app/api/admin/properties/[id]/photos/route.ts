import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE_BYTES } from "@/lib/validation";

export const runtime = "nodejs";

async function requireAdmin() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("admin_profiles").select("id").eq("id", user.id).single();
  return profile ? user : null;
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: "File is larger than 15MB." }, { status: 413 });
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Unsupported file type." }, { status: 415 });
  }

  try {
    const supabase = createAdminSupabaseClient();
    const bucket = process.env.SUPABASE_PROPERTY_PHOTOS_BUCKET || "property-photos";
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `${params.id}/${Date.now()}-${safeName}`;

    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(storagePath, Buffer.from(arrayBuffer), { contentType: file.type });
    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(storagePath);

    const { error: insertError } = await supabase
      .from("property_photos")
      .insert({ property_id: params.id, url: publicUrlData.publicUrl, sort_order: Date.now() });
    if (insertError) throw insertError;

    return NextResponse.json({ success: true, url: publicUrlData.publicUrl });
  } catch (error) {
    console.error("[api/admin/properties/photos] Failed:", error);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
