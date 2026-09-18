import type { Property } from "@/lib/types";

const PROPERTY_TYPES = [
  "Single Family",
  "Multi-Family",
  "Condo",
  "Townhouse",
  "Mobile/Manufactured",
  "Land",
  "Other",
];
const STRATEGIES = ["Fix & Flip", "Buy & Hold", "Wholesale", "Development", "Land"];
const STATUSES = ["Available", "Under Contract", "Sold", "Coming Soon"];

export function PropertyForm({
  action,
  property,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  property?: Property;
  submitLabel: string;
}) {
  return (
    <form action={action} className="flex flex-col gap-5 rounded-xl bg-white p-6 shadow-sm">
      <Field label="Title" name="title" defaultValue={property?.title} required />

      <div className="grid gap-5 sm:grid-cols-3">
        <Field label="Address (optional)" name="address_line" defaultValue={property?.address_line ?? ""} />
        <Field label="City" name="city" defaultValue={property?.city} required />
        <Field label="State" name="state" defaultValue={property?.state} required maxLength={2} />
      </div>

      <div className="grid gap-5 sm:grid-cols-4">
        <Field label="ZIP" name="zip" defaultValue={property?.zip ?? ""} />
        <Field label="Price" name="price" type="number" defaultValue={property?.price} required />
        <Field label="Bedrooms" name="bedrooms" type="number" defaultValue={property?.bedrooms ?? ""} />
        <Field label="Bathrooms" name="bathrooms" type="number" step="0.5" defaultValue={property?.bathrooms ?? ""} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Square Feet" name="square_feet" type="number" defaultValue={property?.square_feet ?? ""} />
        <Field label="Year Built" name="year_built" type="number" defaultValue={property?.year_built ?? ""} />
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <SelectField label="Property Type" name="property_type" options={PROPERTY_TYPES} defaultValue={property?.property_type} required />
        <SelectField label="Strategy" name="strategy" options={STRATEGIES} defaultValue={property?.strategy} required />
        <SelectField label="Status" name="status" options={STATUSES} defaultValue={property?.status ?? "Coming Soon"} required />
      </div>

      <Field label="Badge (e.g. Fix & Flip)" name="badge" defaultValue={property?.badge ?? ""} />
      <Field
        label="Cover Image URL"
        name="cover_image_url"
        defaultValue={property?.cover_image_url ?? ""}
        hint="Paste a Supabase Storage public URL, or leave blank to use a placeholder."
      />

      <TextareaField label="Description" name="description" defaultValue={property?.description} rows={6} required />
      <TextareaField
        label="Highlights (one per line)"
        name="highlights"
        defaultValue={(property?.highlights ?? []).join("\n")}
        rows={4}
      />

      <button
        type="submit"
        className="focus-gold self-start rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-ink hover:bg-gold-light"
      >
        {submitLabel}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
  type = "text",
  step,
  maxLength,
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string | number | null;
  required?: boolean;
  type?: string;
  step?: string;
  maxLength?: number;
  hint?: string;
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
        step={step}
        maxLength={maxLength}
        required={required}
        defaultValue={defaultValue ?? ""}
        className="focus-gold w-full rounded-lg border border-ink/15 px-4 py-2.5 text-sm"
      />
      {hint && <p className="text-xs text-ink/40">{hint}</p>}
    </div>
  );
}

function SelectField({
  label,
  name,
  options,
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  options: string[];
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium text-ink/80">
        {label} {required && <span className="text-gold-dark">*</span>}
      </label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue ?? ""}
        required={required}
        className="focus-gold w-full rounded-lg border border-ink/15 px-4 py-2.5 text-sm"
      >
        <option value="" disabled>
          Select…
        </option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextareaField({
  label,
  name,
  defaultValue,
  rows,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  rows?: number;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium text-ink/80">
        {label} {required && <span className="text-gold-dark">*</span>}
      </label>
      <textarea
        id={name}
        name={name}
        rows={rows}
        required={required}
        defaultValue={defaultValue ?? ""}
        className="focus-gold w-full rounded-lg border border-ink/15 px-4 py-2.5 text-sm"
      />
    </div>
  );
}
