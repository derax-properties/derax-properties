import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { CashBuyer, BuyerZipCode, BuyerInvestmentCriteria } from "@/lib/types";
import {
  updateBuyer,
  addBuyerZips,
  removeBuyerZip,
  addBuyerCriteria,
  updateBuyerCriteria,
  removeBuyerCriteria,
} from "../actions";
import { BuyerCriteriaList } from "@/components/admin/BuyerCriteriaList";
import { PageHeader } from "@/components/admin/PageHeader";
import { GroupIcon } from "@/components/admin/icons";

export const metadata = { title: "Buyer Detail — DERAX CRM", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function BuyerDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();

  const { data: buyer } = await supabase.from("cash_buyers").select("*").eq("id", params.id).single();
  if (!buyer) notFound();
  const b = buyer as CashBuyer;

  const { data: zips } = await supabase
    .from("buyer_zip_codes")
    .select("*")
    .eq("buyer_id", params.id)
    .order("zip");
  const { data: criteria } = await supabase
    .from("buyer_investment_criteria")
    .select("*")
    .eq("buyer_id", params.id)
    .order("created_at", { ascending: false });

  const updateBuyerWithId = updateBuyer.bind(null, params.id);
  const addZipsWithId = addBuyerZips.bind(null, params.id);
  const addCriteriaWithId = addBuyerCriteria.bind(null, params.id);
  const updateCriteriaWithId = updateBuyerCriteria.bind(null, params.id);
  const removeCriteriaWithId = removeBuyerCriteria.bind(null, params.id);

  return (
    <div>
      <PageHeader icon={<GroupIcon className="h-5 w-5" />} title={b.full_name} subtitle={b.company_name ?? undefined} />

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-ink">Buyer Info</h2>
          <form action={updateBuyerWithId} className="mt-3 flex flex-col gap-3">
            <input name="full_name" defaultValue={b.full_name} className="focus-gold rounded-lg border border-ink/15 px-3 py-2 text-sm" />
            <input name="company_name" defaultValue={b.company_name ?? ""} placeholder="Company" className="focus-gold rounded-lg border border-ink/15 px-3 py-2 text-sm" />
            <input name="phone" defaultValue={b.phone ?? ""} placeholder="Phone" className="focus-gold rounded-lg border border-ink/15 px-3 py-2 text-sm" />
            <input name="email" defaultValue={b.email ?? ""} placeholder="Email" className="focus-gold rounded-lg border border-ink/15 px-3 py-2 text-sm" />
            <select name="buyer_type" defaultValue={b.buyer_type ?? ""} className="focus-gold rounded-lg border border-ink/15 px-3 py-2 text-sm">
              <option value="">Buyer Type</option>
              <option>Fix & Flip</option>
              <option>Buy & Hold</option>
              <option>Wholesaler</option>
              <option>Developer</option>
              <option>Other</option>
            </select>
            <select name="status" defaultValue={b.status} className="focus-gold rounded-lg border border-ink/15 px-3 py-2 text-sm">
              <option>Active</option>
              <option>Inactive</option>
              <option>Do Not Contact</option>
            </select>
            <label className="flex items-center gap-2 text-sm text-ink/70">
              <input type="checkbox" name="proof_of_funds_on_file" defaultChecked={b.proof_of_funds_on_file} className="h-4 w-4" />
              Proof of funds on file
            </label>
            <textarea name="notes" defaultValue={b.notes ?? ""} rows={3} className="focus-gold rounded-lg border border-ink/15 px-3 py-2 text-sm" />
            <button type="submit" className="focus-gold rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-ink hover:bg-gold-light">
              Save
            </button>
          </form>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-ink">ZIP Coverage</h2>
          <p className="mt-1 text-xs text-ink/40">Paste ZIP codes separated by commas, spaces, or new lines.</p>
          <form action={addZipsWithId} className="mt-3 flex flex-col gap-2">
            <textarea name="zips" rows={3} placeholder="30310, 30311, 30315…" className="focus-gold rounded-lg border border-ink/15 px-3 py-2 text-sm" />
            <button type="submit" className="focus-gold self-start rounded-full border border-gold px-4 py-1.5 text-xs font-semibold text-gold-dark hover:bg-gold hover:text-ink">
              Add ZIPs
            </button>
          </form>
          <div className="mt-4 flex flex-wrap gap-2">
            {((zips as BuyerZipCode[]) ?? []).map((z) => (
              <form key={z.id} action={removeBuyerZip.bind(null, params.id, z.id)}>
                <button
                  type="submit"
                  title="Remove"
                  className="rounded-full bg-cream px-3 py-1 text-xs font-semibold text-ink/70 hover:bg-red-100 hover:text-red-700"
                >
                  {z.zip} ×
                </button>
              </form>
            ))}
            {(!zips || zips.length === 0) && <p className="text-xs text-ink/30">No ZIP codes yet.</p>}
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-ink">Investment Criteria</h2>
          <form action={addCriteriaWithId} className="mt-3 flex flex-col gap-2">
            <select name="property_type" className="focus-gold rounded-lg border border-ink/15 px-3 py-2 text-sm">
              <option value="">Any Property Type</option>
              <option>Single Family</option>
              <option>Multi-Family</option>
              <option>Condo</option>
              <option>Townhouse</option>
              <option>Mobile/Manufactured</option>
              <option>Land</option>
              <option>Other</option>
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input name="min_price" type="number" placeholder="Min price" className="focus-gold rounded-lg border border-ink/15 px-3 py-2 text-sm" />
              <input name="max_price" type="number" placeholder="Max price" className="focus-gold rounded-lg border border-ink/15 px-3 py-2 text-sm" />
              <input name="min_bedrooms" type="number" placeholder="Min beds" className="focus-gold rounded-lg border border-ink/15 px-3 py-2 text-sm" />
              <input name="min_bathrooms" type="number" step="0.5" placeholder="Min baths" className="focus-gold rounded-lg border border-ink/15 px-3 py-2 text-sm" />
              <input name="min_sqft" type="number" placeholder="Min sqft" className="focus-gold rounded-lg border border-ink/15 px-3 py-2 text-sm" />
              <input name="max_repair_budget" type="number" placeholder="Max repair budget" className="focus-gold rounded-lg border border-ink/15 px-3 py-2 text-sm" />
            </div>
            <select name="preferred_strategy" className="focus-gold rounded-lg border border-ink/15 px-3 py-2 text-sm">
              <option value="">Preferred Strategy</option>
              <option>Fix & Flip</option>
              <option>Buy & Hold</option>
              <option>Wholesale</option>
              <option>Development</option>
              <option>Land</option>
            </select>
            <button type="submit" className="focus-gold self-start rounded-full border border-gold px-4 py-1.5 text-xs font-semibold text-gold-dark hover:bg-gold hover:text-ink">
              Add Criteria
            </button>
          </form>
          <BuyerCriteriaList
            criteria={(criteria as BuyerInvestmentCriteria[]) ?? []}
            onUpdate={updateCriteriaWithId}
            onRemove={removeCriteriaWithId}
          />
        </div>
      </div>
    </div>
  );
}
