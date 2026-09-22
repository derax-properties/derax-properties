import Link from "next/link";
import { PageHeader } from "@/components/admin/PageHeader";
import { GroupIcon } from "@/components/admin/icons";
import { LeadPhotosField } from "@/components/admin/LeadPhotosField";
import { PropertyAddressField } from "@/components/PropertyAddressField";
import { LEAD_TYPES } from "@/lib/types";
import { createLeadManually } from "./actions";

const PROPERTY_TYPES = ["Single Family", "Multi-Family", "Condo", "Townhouse", "Mobile/Manufactured", "Land", "Other"];

export const metadata = { title: "Add Lead", robots: { index: false, follow: false } };

export default function NewLeadPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div>
      <PageHeader
        icon={<GroupIcon className="h-5 w-5" />}
        title="Add Lead"
        subtitle="Enter a seller lead directly — for calls, walk-ins, or anything that didn't come through the website or a VA."
      />

      {searchParams.error && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">
          {searchParams.error}
        </p>
      )}

      <form
        action={createLeadManually}
        encType="multipart/form-data"
        className="mt-6 flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-card"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="First Name" name="first_name" />
          <Field label="Last Name" name="last_name" />
          <Field label="Phone" name="phone" type="tel" />
          <Field label="Email" name="email" type="email" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink/80">Preferred Contact</label>
            <select name="preferred_contact" className="focus-gold rounded-lg border border-ink/15 px-3 py-2 text-sm" defaultValue="Phone">
              <option value="Phone">Phone</option>
              <option value="Text">Text</option>
              <option value="Email">Email</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink/80">Best Time to Reach</label>
            <input name="best_contact_time" className="focus-gold rounded-lg border border-ink/15 px-3 py-2 text-sm" placeholder="e.g. weekday evenings" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink/80">Are they the property owner?</label>
          <select name="owner_status" className="focus-gold rounded-lg border border-ink/15 px-3 py-2 text-sm" defaultValue="Yes">
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>

        <hr className="border-ink/10" />

        <PropertyAddressField required />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink/80">Property Type</label>
            <select name="property_type" className="focus-gold rounded-lg border border-ink/15 px-3 py-2 text-sm" defaultValue="Single Family">
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-ink/80">Situation</label>
            <select name="lead_type" className="focus-gold rounded-lg border border-ink/15 px-3 py-2 text-sm" defaultValue="">
              <option value="">Not sure yet</option>
              {LEAD_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Current Value ($)" name="current_value" type="number" placeholder="As-is value, not ARV" />
          <Field label="Mortgage Payoff Balance ($)" name="mortgage_balance" type="number" placeholder="0 if free and clear" />
        </div>
        <p className="-mt-2 text-xs text-ink/40">
          Optional at intake — equity % is calculated automatically from these two once both are entered (here or later on the lead page).
        </p>

        <hr className="border-ink/10" />

        <Field label="Why are they selling?" name="selling_reason" placeholder="e.g. relocating, inherited, behind on payments" />
        <Field label="Timeline" name="timeline" placeholder="e.g. ASAP, 30-60 days, just exploring" />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-ink/80">Notes</label>
          <textarea name="notes" rows={4} className="focus-gold rounded-lg border border-ink/15 px-3 py-2 text-sm" placeholder="Anything relevant from the call or visit" />
        </div>

        <hr className="border-ink/10" />

        <LeadPhotosField />

        <div className="mt-2 flex items-center gap-3">
          <button type="submit" className="focus-gold rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-ink hover:bg-gold-light">
            Save Lead
          </button>
          <Link href="/admin/leads" className="focus-gold text-sm font-semibold text-ink/50 hover:underline">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium text-ink/80">
        {label} {required && <span className="text-gold-dark">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="focus-gold rounded-lg border border-ink/15 px-3 py-2 text-sm"
      />
    </div>
  );
}
