import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { CashBuyer } from "@/lib/types";
import { createBuyer } from "./actions";
import { BuyersTable } from "@/components/admin/BuyersTable";
import { PageHeader } from "@/components/admin/PageHeader";
import { GroupIcon } from "@/components/admin/icons";

export const metadata = { title: "Cash Buyers — DERAX CRM", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function BuyersPage() {
  const supabase = createServerSupabaseClient();
  const { data: buyers } = await supabase
    .from("cash_buyers")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader
        icon={<GroupIcon className="h-5 w-5" />}
        title="Cash Buyers"
        subtitle="Your buyers list, their ZIP coverage, and investment criteria — used for buyer matching on every lead."
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow-sm lg:col-span-2">
          <BuyersTable buyers={(buyers as CashBuyer[]) ?? []} />
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-ink">Add a buyer</h2>
          <form action={createBuyer} className="mt-3 flex flex-col gap-3">
            <input name="full_name" placeholder="Full name" required className="focus-gold rounded-lg border border-ink/15 px-3 py-2 text-sm" />
            <input name="company_name" placeholder="Company (optional)" className="focus-gold rounded-lg border border-ink/15 px-3 py-2 text-sm" />
            <input name="phone" placeholder="Phone" className="focus-gold rounded-lg border border-ink/15 px-3 py-2 text-sm" />
            <input name="email" type="email" placeholder="Email" className="focus-gold rounded-lg border border-ink/15 px-3 py-2 text-sm" />
            <select name="buyer_type" className="focus-gold rounded-lg border border-ink/15 px-3 py-2 text-sm">
              <option value="">Buyer Type</option>
              <option>Fix & Flip</option>
              <option>Buy & Hold</option>
              <option>Wholesaler</option>
              <option>Developer</option>
              <option>Other</option>
            </select>
            <label className="flex items-center gap-2 text-sm text-ink/70">
              <input type="checkbox" name="proof_of_funds_on_file" className="h-4 w-4" />
              Proof of funds on file
            </label>
            <textarea name="notes" placeholder="Notes" rows={3} className="focus-gold rounded-lg border border-ink/15 px-3 py-2 text-sm" />
            <button type="submit" className="focus-gold rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-ink hover:bg-gold-light">
              Add Buyer
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
