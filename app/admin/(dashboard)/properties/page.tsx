import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Property } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { formatCurrency } from "@/lib/utils";

export const metadata = { title: "Properties", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminPropertiesPage() {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase.from("properties").select("*").order("created_at", { ascending: false });
  const properties = (data as Property[]) ?? [];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Properties</h1>
          <p className="mt-1 text-sm text-ink/50">
            Only listings marked &quot;Available&quot; appear on the public site.
          </p>
        </div>
        <Link
          href="/admin/properties/new"
          className="focus-gold rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-ink hover:bg-gold-light"
        >
          + Add Property
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink/40">
              <th className="p-3">Title</th>
              <th className="p-3">Location</th>
              <th className="p-3">Price</th>
              <th className="p-3">Strategy</th>
              <th className="p-3">Status</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {properties.map((p) => (
              <tr key={p.id} className="border-b border-ink/5 last:border-0">
                <td className="p-3 font-medium text-ink">{p.title}</td>
                <td className="p-3">
                  {p.city}, {p.state}
                </td>
                <td className="p-3">{formatCurrency(p.price)}</td>
                <td className="p-3">{p.strategy}</td>
                <td className="p-3">
                  <StatusBadge status={p.status} />
                </td>
                <td className="p-3 text-right">
                  <Link href={`/admin/properties/${p.id}/edit`} className="focus-gold font-semibold text-gold-dark hover:underline">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {properties.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-ink/40">
                  No properties yet. Add your first listing to show it on the site.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
