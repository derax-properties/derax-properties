import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Property } from "@/lib/types";
import { PropertiesTable } from "@/components/admin/PropertiesTable";
import { PageHeader } from "@/components/admin/PageHeader";
import { HouseIcon } from "@/components/admin/icons";

export const metadata = { title: "Properties", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminPropertiesPage() {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase.from("properties").select("*").order("created_at", { ascending: false });
  const properties = (data as Property[]) ?? [];

  return (
    <div>
      <PageHeader
        icon={<HouseIcon className="h-5 w-5" />}
        title="Properties"
        subtitle='Only listings marked "Available" appear on the public site.'
        action={
          <Link
            href="/admin/properties/new"
            className="focus-gold rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-ink hover:bg-gold-light"
          >
            + Add Property
          </Link>
        }
      />

      <div className="mt-6">
        <PropertiesTable properties={properties} />
      </div>
    </div>
  );
}
