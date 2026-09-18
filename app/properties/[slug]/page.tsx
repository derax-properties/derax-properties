import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Property, PropertyPhoto } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { PropertyGallery } from "@/components/PropertyGallery";
import { InvestorInquiryForm } from "@/components/InvestorInquiryForm";
import { StatusBadge } from "@/components/StatusBadge";

async function getProperty(slug: string) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: property } = await supabase
      .from("properties")
      .select("*")
      .eq("slug", slug)
      .single();

    if (!property) return null;

    const { data: photos } = await supabase
      .from("property_photos")
      .select("*")
      .eq("property_id", property.id)
      .order("sort_order", { ascending: true });

    return { property: property as Property, photos: (photos as PropertyPhoto[]) ?? [] };
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const result = await getProperty(params.slug);
  if (!result) return { title: "Property Not Found" };
  const { property } = result;
  return {
    title: `${property.title} — ${property.city}, ${property.state}`,
    description: property.description.slice(0, 155),
  };
}

const DETAIL_ROWS: Array<[label: string, key: keyof Property, format?: (v: any) => string]> = [
  ["Price", "price", (v) => formatCurrency(v)],
  ["Bedrooms", "bedrooms"],
  ["Bathrooms", "bathrooms"],
  ["Square Footage", "square_feet"],
  ["Year Built", "year_built"],
  ["Property Type", "property_type"],
  ["Investment Strategy", "strategy"],
];

export default async function PropertyDetailPage({ params }: { params: { slug: string } }) {
  const result = await getProperty(params.slug);
  if (!result) notFound();
  const { property, photos } = result;

  return (
    <section className="bg-cream-soft">
      <div className="mx-auto max-w-content px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={property.status} />
          {property.badge && (
            <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-gold-dark">
              {property.badge}
            </span>
          )}
        </div>
        <h1 className="mt-3 font-display text-3xl font-semibold text-ink text-balance sm:text-4xl">
          {property.title}
        </h1>
        <p className="mt-1 text-ink/60">
          {property.address_line ? `${property.address_line}, ` : ""}
          {property.city}, {property.state} {property.zip ?? ""}
        </p>

        <div className="mt-8 grid gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <PropertyGallery
              title={property.title}
              coverImageUrl={property.cover_image_url}
              photos={photos}
            />

            <div className="mt-8 grid grid-cols-2 gap-4 rounded-2xl bg-white p-6 shadow-card sm:grid-cols-3">
              {DETAIL_ROWS.map(([label, key, format]) => {
                const raw = property[key];
                if (raw === null || raw === undefined || raw === "") return null;
                return (
                  <div key={label}>
                    <dt className="text-xs uppercase tracking-wide text-ink/40">{label}</dt>
                    <dd className="mt-1 font-semibold text-ink">
                      {format ? format(raw) : String(raw)}
                    </dd>
                  </div>
                );
              })}
            </div>

            <div className="mt-8">
              <h2 className="font-display text-2xl font-semibold text-ink">Description</h2>
              <p className="mt-3 whitespace-pre-line leading-relaxed text-ink/70">
                {property.description}
              </p>
            </div>

            {property.highlights && property.highlights.length > 0 && (
              <div className="mt-8">
                <h2 className="font-display text-2xl font-semibold text-ink">Highlights</h2>
                <ul className="mt-3 space-y-2">
                  {property.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2 text-ink/70">
                      <span className="mt-1 text-gold" aria-hidden>
                        ●
                      </span>
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="lg:sticky lg:top-24 lg:self-start">
            <InvestorInquiryForm propertyId={property.id} propertyTitle={property.title} />
          </div>
        </div>
      </div>
    </section>
  );
}
