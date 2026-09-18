import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSignedUrl } from "@/lib/storage";
import type { SellerSubmission } from "@/lib/types";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/utils";
import { updateLead } from "./actions";

export const metadata = { title: "Lead Detail", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const STATUSES = [
  "New",
  "Contacted",
  "Qualified",
  "Offer Made",
  "Under Contract",
  "Closed",
  "Not a Fit",
  "Follow Up",
];

const ISSUE_LABELS: Array<[keyof SellerSubmission, string]> = [
  ["foundation_issue", "Foundation"],
  ["plumbing_issue", "Plumbing"],
  ["electrical_issue", "Electrical"],
  ["water_damage", "Water damage"],
  ["fire_damage", "Fire damage"],
  ["mold", "Mold"],
  ["structural_issue", "Structural"],
];

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient();

  const { data: lead } = await supabase
    .from("seller_submissions")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!lead) notFound();

  const { data: photoRows } = await supabase
    .from("seller_property_photos")
    .select("*")
    .eq("submission_id", params.id);
  const { data: docRows } = await supabase
    .from("seller_documents")
    .select("*")
    .eq("submission_id", params.id);
  const { data: admins } = await supabase.from("admin_profiles").select("id, full_name");

  const photoBucket = process.env.SUPABASE_SELLER_PHOTOS_BUCKET || "seller-photos";
  const docBucket = process.env.SUPABASE_SELLER_DOCS_BUCKET || "seller-documents";

  const photos = await Promise.all(
    (photoRows ?? []).map(async (p) => ({ ...p, url: await getSignedUrl(photoBucket, p.storage_path) }))
  );
  const documents = await Promise.all(
    (docRows ?? []).map(async (d) => ({ ...d, url: await getSignedUrl(docBucket, d.storage_path) }))
  );

  const updateLeadWithId = updateLead.bind(null, params.id);
  const l = lead as SellerSubmission;
  const reportedIssues = ISSUE_LABELS.filter(([key]) => l[key]).map(([, label]) => label);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gold-dark">
            {l.reference_number}
          </p>
          <h1 className="font-display text-2xl font-semibold text-ink">{l.property_address}</h1>
          <p className="text-sm text-ink/50">
            {l.city}, {l.state} {l.zip} · Submitted {formatDate(l.created_at)}
          </p>
        </div>
        <StatusBadge status={l.status} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Panel title="Seller">
            <Row label="Name" value={`${l.first_name} ${l.last_name}`} />
            <Row
              label="Phone"
              value={
                <div className="flex flex-wrap gap-3">
                  <span>{l.phone}</span>
                  <a href={`tel:${l.phone.replace(/\D/g, "")}`} className="text-gold-dark hover:underline">
                    Call
                  </a>
                  <a href={`sms:${l.phone.replace(/\D/g, "")}`} className="text-gold-dark hover:underline">
                    Text
                  </a>
                </div>
              }
            />
            {l.email && (
              <Row
                label="Email"
                value={
                  <a href={`mailto:${l.email}`} className="text-gold-dark hover:underline">
                    {l.email}
                  </a>
                }
              />
            )}
            <Row label="Preferred Contact" value={l.preferred_contact} />
            <Row label="Owner?" value={l.owner_status} />
            {l.owner_relationship && <Row label="Relationship" value={l.owner_relationship} />}
          </Panel>

          <Panel title="Property">
            <Row label="Type" value={l.property_type} />
            <Row
              label="Beds / Baths / Sq Ft"
              value={`${l.bedrooms ?? "—"} / ${l.bathrooms ?? "—"} / ${l.square_feet ?? "—"}`}
            />
            <Row label="Year Built" value={l.year_built ?? "—"} />
            <Row label="County" value={l.county ?? "—"} />
          </Panel>

          <Panel title="Condition">
            <Row label="Overall" value={l.condition} />
            <Row label="Roof" value={l.roof_condition ?? "—"} />
            <Row label="HVAC" value={l.hvac_condition ?? "—"} />
            <Row label="Reported Issues" value={reportedIssues.join(", ") || "None reported"} />
            {l.additional_details && <Row label="Additional Details" value={l.additional_details} />}
          </Panel>

          <Panel title="Selling Situation">
            <Row label="Reason" value={l.selling_reason} />
            <Row label="Timeline" value={l.timeline} />
            <Row label="Asking Price" value={l.asking_price ?? "Not specified"} />
            <Row label="Best Time to Contact" value={l.best_contact_time ?? "—"} />
          </Panel>

          {photos.length > 0 && (
            <Panel title="Photos">
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {photos.map((p) =>
                  p.url ? (
                    <a key={p.id} href={p.url} target="_blank" rel="noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.url} alt="" className="aspect-square w-full rounded-lg object-cover" />
                    </a>
                  ) : null
                )}
              </div>
            </Panel>
          )}

          {documents.length > 0 && (
            <Panel title="Documents">
              <ul className="flex flex-col gap-2">
                {documents.map((d) => (
                  <li key={d.id}>
                    {d.url ? (
                      <a href={d.url} target="_blank" rel="noreferrer" className="text-gold-dark hover:underline">
                        {d.storage_path.split("/").pop()}
                      </a>
                    ) : (
                      <span className="text-ink/40">{d.storage_path.split("/").pop()} (link expired)</span>
                    )}
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <Panel title="Manage Lead">
            <form action={updateLeadWithId} className="flex flex-col gap-4">
              <div>
                <label htmlFor="status" className="text-sm font-medium text-ink/70">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  defaultValue={l.status}
                  className="focus-gold mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="assigned_to" className="text-sm font-medium text-ink/70">
                  Assigned To
                </label>
                <select
                  id="assigned_to"
                  name="assigned_to"
                  defaultValue={l.assigned_to ?? ""}
                  className="focus-gold mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
                >
                  <option value="">Unassigned</option>
                  {(admins ?? []).map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.full_name ?? a.id}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="notes" className="text-sm font-medium text-ink/70">
                  Internal Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  defaultValue={l.notes ?? ""}
                  rows={5}
                  className="focus-gold mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
                />
              </div>
              <button
                type="submit"
                className="focus-gold rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-ink hover:bg-gold-light"
              >
                Save Changes
              </button>
            </form>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
      <div className="mt-3 flex flex-col gap-2">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-ink/5 pb-2 last:border-0 sm:flex-row sm:justify-between">
      <span className="text-sm font-medium text-ink/50">{label}</span>
      <span className="text-sm text-ink">{value}</span>
    </div>
  );
}
