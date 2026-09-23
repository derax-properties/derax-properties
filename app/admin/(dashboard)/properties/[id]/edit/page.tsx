import { notFound } from "next/navigation";
import Image from "next/image";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Property, PropertyPhoto } from "@/lib/types";
import { PropertyForm } from "@/components/admin/PropertyForm";
import { PhotoUploader } from "@/components/admin/PhotoUploader";
import { updateProperty, deleteProperty } from "../../actions";

export const metadata = { title: "Edit Property", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function EditPropertyPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string; saved?: string };
}) {
  const supabase = createServerSupabaseClient();
  const { data: property } = await supabase.from("properties").select("*").eq("id", params.id).single();
  if (!property) notFound();

  const { data: photos } = await supabase
    .from("property_photos")
    .select("*")
    .eq("property_id", params.id)
    .order("sort_order", { ascending: true });

  const updatePropertyWithId = updateProperty.bind(null, params.id);
  const deletePropertyWithId = deleteProperty.bind(null, params.id);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-ink">Edit Property</h1>
        <form action={deletePropertyWithId}>
          <button
            type="submit"
            className="focus-gold rounded-full border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
          >
            Delete Property
          </button>
        </form>
      </div>

      {searchParams.saved && (
        <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          Changes saved.
        </p>
      )}
      {searchParams.error && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {searchParams.error}
        </p>
      )}

      <div className="mt-6 max-w-2xl">
        <PropertyForm action={updatePropertyWithId} property={property as Property} submitLabel="Save Changes" />
      </div>

      <div className="mt-8 max-w-2xl rounded-xl bg-white p-6 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-ink">Additional Photos</h2>
        <p className="mt-1 text-sm text-ink/50">
          Uploaded photos appear in the gallery on the property&apos;s public page.
        </p>
        <div className="mt-4">
          <PhotoUploader propertyId={params.id} />
        </div>
        {photos && photos.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {(photos as PropertyPhoto[]).map((p) => (
              <Image
                key={p.id}
                src={p.url}
                alt=""
                width={0}
                height={0}
                sizes="(max-width: 640px) 33vw, 200px"
                className="aspect-square w-full rounded-lg object-cover"
                style={{ width: "100%", height: "auto" }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
