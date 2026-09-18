import type { Metadata } from "next";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PropertiesBrowser } from "@/components/PropertiesBrowser";
import type { Property } from "@/lib/types";

export const metadata: Metadata = {
  title: "Available Properties",
  description: "Browse distressed, off-market, and investment properties from Derax Properties.",
};

export const revalidate = 60;

async function getProperties(): Promise<Property[]> {
  try {
    const supabase = createServerSupabaseClient();
    const { data } = await supabase
      .from("properties")
      .select("*")
      .eq("status", "Available")
      .order("created_at", { ascending: false });
    return (data as Property[]) ?? [];
  } catch {
    return [];
  }
}

export default async function PropertiesPage() {
  const properties = await getProperties();

  return (
    <section className="bg-cream-soft">
      <div className="mx-auto max-w-content px-4 py-16 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-dark">
          Featured Properties
        </p>
        <h1 className="mt-4 font-display text-3xl font-semibold text-ink text-balance sm:text-4xl">
          Available Properties
        </h1>
        <p className="mt-3 max-w-xl text-ink/60">
          Every property below has been added by our team. Use the filters to find opportunities
          in your target market and strategy.
        </p>

        <div className="mt-10">
          <PropertiesBrowser properties={properties} />
        </div>
      </div>
    </section>
  );
}
