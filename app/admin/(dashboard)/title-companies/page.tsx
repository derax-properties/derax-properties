import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { TitleCompany } from "@/lib/types";
import { createTitleCompany, updateTitleCompanyStatus, updateTitleCompany, deleteTitleCompany } from "./actions";
import { TitleCompaniesTable } from "@/components/admin/TitleCompaniesTable";
import { PageHeader } from "@/components/admin/PageHeader";
import { BuildingIcon } from "@/components/admin/icons";

export const metadata = { title: "Title Companies — DERAX CRM", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function TitleCompaniesPage() {
  const supabase = createServerSupabaseClient();
  const { data: companies } = await supabase
    .from("title_companies")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader icon={<BuildingIcon className="h-5 w-5" />} title="Title Companies" subtitle="Used to assign closings on the Deals tab." />

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow-sm lg:col-span-2">
          <TitleCompaniesTable
            companies={(companies as TitleCompany[]) ?? []}
            onToggleStatus={updateTitleCompanyStatus}
            onEdit={updateTitleCompany}
            onDelete={deleteTitleCompany}
          />
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-ink">Add a title company</h2>
          <form action={createTitleCompany} className="mt-3 flex flex-col gap-3">
            <input name="company_name" placeholder="Company name" required className="focus-gold rounded-lg border border-ink/15 px-3 py-2 text-sm" />
            <input name="contact_name" placeholder="Contact name" className="focus-gold rounded-lg border border-ink/15 px-3 py-2 text-sm" />
            <input name="phone" placeholder="Phone" className="focus-gold rounded-lg border border-ink/15 px-3 py-2 text-sm" />
            <input name="email" type="email" placeholder="Email" className="focus-gold rounded-lg border border-ink/15 px-3 py-2 text-sm" />
            <input name="states_covered" placeholder="States covered (e.g. GA, FL)" className="focus-gold rounded-lg border border-ink/15 px-3 py-2 text-sm" />
            <textarea name="notes" placeholder="Notes" rows={3} className="focus-gold rounded-lg border border-ink/15 px-3 py-2 text-sm" />
            <button type="submit" className="focus-gold rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-ink hover:bg-gold-light">
              Add Title Company
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
