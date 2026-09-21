"use client";

import { useMemo, useState } from "react";
import { FormInput, FormTextarea } from "@/components/FormInput";
import { FormSelect, RadioGroup, CheckboxRow } from "@/components/FormSelect";
import { FileUpload, type StagedFile } from "@/components/FileUpload";
import { Button } from "@/components/Button";
import { AddressAutocomplete, type ParsedAddress } from "@/components/AddressAutocomplete";
import { sellerSubmissionSchema } from "@/lib/validation";

const STEPS = ["Property", "Condition", "Seller", "Situation", "Photos", "Review"];

const PROPERTY_TYPES = [
  "Single Family",
  "Multi-Family",
  "Condo",
  "Townhouse",
  "Mobile/Manufactured",
  "Land",
  "Other",
];

const CONDITIONS = [
  "Move-in Ready",
  "Minor Repairs",
  "Moderate Repairs",
  "Major Repairs",
  "Full Rehab",
  "Not Sure",
];

type IssueKey =
  | "foundation_issue"
  | "plumbing_issue"
  | "electrical_issue"
  | "water_damage"
  | "fire_damage"
  | "mold"
  | "structural_issue";

const ISSUE_FIELDS: Array<[key: IssueKey, label: string]> = [
  ["foundation_issue", "Foundation issues"],
  ["plumbing_issue", "Plumbing issues"],
  ["electrical_issue", "Electrical issues"],
  ["water_damage", "Water damage"],
  ["fire_damage", "Fire damage"],
  ["mold", "Mold"],
  ["structural_issue", "Structural issues"],
];

const SELLING_REASONS = [
  "Need to sell quickly",
  "Moving",
  "Inherited property",
  "Vacant property",
  "Tired landlord",
  "Behind on taxes",
  "Facing foreclosure",
  "Divorce",
  "Property needs too many repairs",
  "Relocating",
  "Financial reasons",
  "Other",
];

const TIMELINES = ["ASAP", "Within 30 days", "1–3 months", "3–6 months", "Just exploring my options"];

const initialValues = {
  // Populated automatically when the seller picks a suggestion from the
  // single address field below — never typed separately. See
  // components/AddressAutocomplete.tsx and plan doc sections 57-61.
  property_address: "",
  city: "",
  state: "",
  zip: "",
  county: "",
  formatted_address: "",
  latitude: "",
  longitude: "",
  place_id: "",
  address_country: "US",
  address_confidence: "" as "" | "high" | "medium" | "low",
  property_type: "",
  bedrooms: "",
  bathrooms: "",
  square_feet: "",
  year_built: "",

  condition: "",
  roof_condition: "",
  hvac_condition: "",
  foundation_issue: false,
  plumbing_issue: false,
  electrical_issue: false,
  water_damage: false,
  fire_damage: false,
  mold: false,
  structural_issue: false,
  additional_details: "",

  first_name: "",
  last_name: "",
  phone: "",
  email: "",
  preferred_contact: "",
  owner_status: "",
  owner_relationship: "",

  selling_reason: "",
  timeline: "",
  asking_price: "",
  best_contact_time: "",

  consent: false,
};

type Values = typeof initialValues;

function useStepValidation(values: Values) {
  return useMemo(() => {
    const errors: Partial<Record<keyof Values, string>> = {};

    const requireStep1 = () => {
      // The address field only ever holds a value once a suggestion has
      // been selected and parsed (see AddressAutocomplete), so one check
      // here covers street/city/state/zip together.
      if (!values.formatted_address.trim() || !values.zip.trim()) {
        errors.property_address = "We couldn't confirm this address. Please check the address and try again.";
      }
      if (!values.property_type) errors.property_type = "Select a property type.";
    };

    const requireStep2 = () => {
      if (!values.condition) errors.condition = "Select the property's condition.";
    };

    const requireStep3 = () => {
      if (!values.first_name.trim()) errors.first_name = "First name is required.";
      if (!values.last_name.trim()) errors.last_name = "Last name is required.";
      if (!values.phone.trim() || values.phone.replace(/\D/g, "").length < 10)
        errors.phone = "Enter a valid phone number.";
      if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email))
        errors.email = "Enter a valid email address.";
      if (!values.preferred_contact) errors.preferred_contact = "Select a preferred contact method.";
      if (!values.owner_status) errors.owner_status = "Let us know if you're the owner.";
      if (values.owner_status === "No" && !values.owner_relationship.trim())
        errors.owner_relationship = "Tell us your relationship to the owner.";
    };

    const requireStep4 = () => {
      if (!values.selling_reason) errors.selling_reason = "Select a reason.";
      if (!values.timeline) errors.timeline = "Select a timeline.";
    };

    const requireStep6 = () => {
      if (!values.consent) errors.consent = "Please confirm you agree to be contacted.";
    };

    return { errors, requireStep1, requireStep2, requireStep3, requireStep4, requireStep6 };
  }, [values]);
}

type SubmitState = "idle" | "creating" | "uploading" | "success" | "error";

export function SellPropertyWizard() {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Values>(initialValues);
  const [touchedErrors, setTouchedErrors] = useState<Partial<Record<keyof Values, string>>>({});
  const [photos, setPhotos] = useState<StagedFile[]>([]);
  const [documents, setDocuments] = useState<StagedFile[]>([]);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submitError, setSubmitError] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");

  const validation = useStepValidation(values);

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function toggleIssue(key: IssueKey, value: boolean) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function validateCurrentStep(): boolean {
    const { errors, requireStep1, requireStep2, requireStep3, requireStep4, requireStep6 } =
      validation;
    Object.keys(errors).forEach((k) => delete errors[k as keyof Values]);

    if (step === 0) requireStep1();
    if (step === 1) requireStep2();
    if (step === 2) requireStep3();
    if (step === 3) requireStep4();
    if (step === 5) requireStep6();

    setTouchedErrors({ ...errors });
    return Object.keys(errors).length === 0;
  }

  function goNext() {
    if (!validateCurrentStep()) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit() {
    if (!validateCurrentStep()) return;

    const parsed = sellerSubmissionSchema.safeParse({
      ...values,
      bedrooms: values.bedrooms === "" ? NaN : Number(values.bedrooms),
      bathrooms: values.bathrooms === "" ? NaN : Number(values.bathrooms),
      square_feet: values.square_feet === "" ? NaN : Number(values.square_feet),
      year_built: values.year_built === "" ? NaN : Number(values.year_built),
      consent: values.consent === true ? true : undefined,
    });

    if (!parsed.success) {
      setSubmitError("Please review the earlier steps — some required information is missing.");
      return;
    }

    setSubmitState("creating");
    setSubmitError("");

    try {
      const res = await fetch("/api/seller-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "We couldn't save your submission.");

      const submissionId: string = json.id;
      setReferenceNumber(json.reference_number);

      const allFiles = [
        ...photos.map((f) => ({ ...f, kind: "photo" as const })),
        ...documents.map((f) => ({ ...f, kind: "document" as const })),
      ];

      if (allFiles.length > 0) {
        setSubmitState("uploading");
        await Promise.all(
          allFiles.map(async (staged) => {
            const formData = new FormData();
            formData.append("file", staged.file);
            formData.append("kind", staged.kind);
            try {
              await fetch(`/api/seller-submissions/${submissionId}/uploads`, {
                method: "POST",
                body: formData,
              });
            } catch {
              // A failed photo/document upload does not invalidate the
              // submission itself — the lead is already saved.
            }
          })
        );
      }

      setSubmitState("success");
    } catch (err) {
      setSubmitState("error");
      setSubmitError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (submitState === "success") {
    return (
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-card sm:p-10">
        <h2 className="font-display text-3xl font-semibold text-ink">Thank You!</h2>
        <p className="mt-4 text-ink/70">
          We&apos;ve received your property information. Our team will review the details and
          contact you if we need additional information or if the property fits our buying
          criteria.
        </p>
        <p className="mt-6 rounded-lg bg-cream px-4 py-3 font-mono text-sm text-ink/80">
          Reference Number: <strong>{referenceNumber}</strong>
        </p>
        <p className="mt-6 text-xs text-ink/40">
          Submitting a property does not guarantee an offer or purchase. We evaluate every
          property individually.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Progress */}
      <div className="mb-8">
        <p className="text-sm font-semibold text-gold-dark">
          Step {step + 1} of {STEPS.length} — {STEPS[step]}
        </p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
          <div
            className="h-full rounded-full bg-gold transition-all"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
        {step === 0 && (
          <div className="flex flex-col gap-5">
            <AddressAutocomplete
              id="property_address"
              label="What's the property address?"
              required
              error={touchedErrors.property_address}
              selected={
                values.formatted_address
                  ? {
                      formatted_address: values.formatted_address,
                      street: values.property_address || null,
                      city: values.city || null,
                      state: values.state || null,
                      zip: values.zip || null,
                      county: values.county || null,
                      country: values.address_country,
                      lat: Number(values.latitude) || 0,
                      lng: Number(values.longitude) || 0,
                      place_id: values.place_id,
                      confidence: (values.address_confidence || "high") as "high" | "medium" | "low",
                    }
                  : null
              }
              onSelect={(address: ParsedAddress) => {
                set("property_address", address.street ?? address.formatted_address);
                set("city", address.city ?? "");
                set("state", address.state ?? "");
                set("zip", address.zip ?? "");
                set("county", address.county ?? "");
                set("formatted_address", address.formatted_address);
                set("latitude", String(address.lat));
                set("longitude", String(address.lng));
                set("place_id", address.place_id);
                set("address_country", address.country || "US");
                set("address_confidence", address.confidence);
              }}
              onClear={() => {
                set("property_address", "");
                set("city", "");
                set("state", "");
                set("zip", "");
                set("county", "");
                set("formatted_address", "");
                set("latitude", "");
                set("longitude", "");
                set("place_id", "");
                set("address_confidence", "");
              }}
            />
            <FormSelect
              id="property_type"
              label="Property Type"
              required
              options={PROPERTY_TYPES}
              value={values.property_type}
              error={touchedErrors.property_type}
              onChange={(e) => set("property_type", e.target.value)}
            />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <FormInput
                id="bedrooms"
                type="number"
                min={0}
                label="Bedrooms"
                value={values.bedrooms}
                onChange={(e) => set("bedrooms", e.target.value)}
              />
              <FormInput
                id="bathrooms"
                type="number"
                min={0}
                step="0.5"
                label="Bathrooms"
                value={values.bathrooms}
                onChange={(e) => set("bathrooms", e.target.value)}
              />
              <FormInput
                id="square_feet"
                type="number"
                min={0}
                label="Approx. Sq. Ft."
                value={values.square_feet}
                onChange={(e) => set("square_feet", e.target.value)}
              />
              <FormInput
                id="year_built"
                type="number"
                label="Year Built"
                value={values.year_built}
                onChange={(e) => set("year_built", e.target.value)}
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-6">
            <RadioGroup
              label="How would you describe the property's condition?"
              name="condition"
              required
              options={CONDITIONS}
              value={values.condition}
              error={touchedErrors.condition}
              onChange={(v) => set("condition", v)}
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <FormInput
                id="roof_condition"
                label="Roof Condition"
                placeholder="e.g. Good, needs replacement"
                value={values.roof_condition}
                onChange={(e) => set("roof_condition", e.target.value)}
              />
              <FormInput
                id="hvac_condition"
                label="HVAC Condition"
                placeholder="e.g. Working, not working"
                value={values.hvac_condition}
                onChange={(e) => set("hvac_condition", e.target.value)}
              />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-ink/80">
                Does the property have any of the following?
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {ISSUE_FIELDS.map(([key, label]) => (
                  <CheckboxRow
                    key={key}
                    label={label}
                    checked={values[key]}
                    onChange={(checked) => toggleIssue(key, checked)}
                  />
                ))}
              </div>
            </div>
            <FormTextarea
              id="additional_details"
              label="Additional Property Details"
              placeholder="Anything else we should know about the property?"
              value={values.additional_details}
              onChange={(e) => set("additional_details", e.target.value)}
            />
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormInput
                id="first_name"
                label="First Name"
                required
                value={values.first_name}
                error={touchedErrors.first_name}
                onChange={(e) => set("first_name", e.target.value)}
              />
              <FormInput
                id="last_name"
                label="Last Name"
                required
                value={values.last_name}
                error={touchedErrors.last_name}
                onChange={(e) => set("last_name", e.target.value)}
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormInput
                id="phone"
                type="tel"
                label="Phone Number"
                required
                value={values.phone}
                error={touchedErrors.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
              <FormInput
                id="email"
                type="email"
                label="Email Address"
                value={values.email}
                error={touchedErrors.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </div>
            <RadioGroup
              label="Preferred Contact Method"
              name="preferred_contact"
              required
              options={["Phone", "Text", "Email"]}
              value={values.preferred_contact}
              error={touchedErrors.preferred_contact}
              onChange={(v) => set("preferred_contact", v)}
            />
            <RadioGroup
              label="Are you the owner?"
              name="owner_status"
              required
              options={["Yes", "No"]}
              value={values.owner_status}
              error={touchedErrors.owner_status}
              onChange={(v) => set("owner_status", v)}
            />
            {values.owner_status === "No" && (
              <FormInput
                id="owner_relationship"
                label="Relationship to Owner"
                required
                value={values.owner_relationship}
                error={touchedErrors.owner_relationship}
                onChange={(e) => set("owner_relationship", e.target.value)}
              />
            )}
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-6">
            <FormSelect
              id="selling_reason"
              label="Why are you considering selling?"
              required
              options={SELLING_REASONS}
              value={values.selling_reason}
              error={touchedErrors.selling_reason}
              onChange={(e) => set("selling_reason", e.target.value)}
            />
            <FormSelect
              id="timeline"
              label="How soon would you like to sell?"
              required
              options={TIMELINES}
              value={values.timeline}
              error={touchedErrors.timeline}
              onChange={(e) => set("timeline", e.target.value)}
            />
            <FormInput
              id="asking_price"
              label="What price would you like to receive?"
              hint="Optional — a ballpark figure is fine."
              placeholder="e.g. $95,000"
              value={values.asking_price}
              onChange={(e) => set("asking_price", e.target.value)}
            />
            <FormInput
              id="best_contact_time"
              label="Best time to contact you"
              placeholder="e.g. Weekday evenings"
              value={values.best_contact_time}
              onChange={(e) => set("best_contact_time", e.target.value)}
            />
          </div>
        )}

        {step === 4 && (
          <div className="flex flex-col gap-8">
            <FileUpload
              label="Property Photos"
              hint="Add a few photos of the exterior, interior, and any areas needing repair."
              accept="image/*"
              files={photos}
              onFilesChange={setPhotos}
            />
            <FileUpload
              label="Documents (optional)"
              hint="Inspection reports, tax documents, repair estimates, or anything else relevant."
              accept="image/*,application/pdf"
              files={documents}
              onFilesChange={setDocuments}
            />
          </div>
        )}

        {step === 5 && (
          <div className="flex flex-col gap-6">
            <ReviewSection title="Property">
              <ReviewRow label="Address" value={values.formatted_address || values.property_address} />
              <ReviewRow label="Property Type" value={values.property_type} />
              <ReviewRow
                label="Beds / Baths / Sq Ft"
                value={`${values.bedrooms || "—"} / ${values.bathrooms || "—"} / ${values.square_feet || "—"}`}
              />
            </ReviewSection>
            <ReviewSection title="Condition">
              <ReviewRow label="Overall Condition" value={values.condition} />
              <ReviewRow
                label="Reported Issues"
                value={
                  ISSUE_FIELDS.filter(([key]) => values[key]).map(([, label]) => label).join(", ") ||
                  "None reported"
                }
              />
            </ReviewSection>
            <ReviewSection title="Seller">
              <ReviewRow label="Name" value={`${values.first_name} ${values.last_name}`} />
              <ReviewRow label="Phone" value={values.phone} />
              <ReviewRow label="Preferred Contact" value={values.preferred_contact} />
            </ReviewSection>
            <ReviewSection title="Situation">
              <ReviewRow label="Reason" value={values.selling_reason} />
              <ReviewRow label="Timeline" value={values.timeline} />
            </ReviewSection>
            <ReviewSection title="Attachments">
              <ReviewRow label="Photos" value={`${photos.length} selected`} />
              <ReviewRow label="Documents" value={`${documents.length} selected`} />
            </ReviewSection>

            <CheckboxRow
              label="By submitting this form, I agree that Derax Properties may contact me regarding my property using the information provided, including by phone, text, or email. Message and data rates may apply."
              checked={values.consent}
              onChange={(v) => set("consent", v)}
            />
            {touchedErrors.consent && (
              <p className="text-xs font-medium text-red-600" role="alert">
                {touchedErrors.consent}
              </p>
            )}

            <p className="text-xs text-ink/40">
              Submitting this form does not guarantee that Derax Properties will make an offer on
              your property, or a specific price. We review every submission individually.
            </p>

            {submitError && (
              <p className="text-sm font-medium text-red-600" role="alert">
                {submitError}
              </p>
            )}
          </div>
        )}

        <div className="mt-8 flex items-center justify-between gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={goBack}
            disabled={step === 0 || submitState === "creating" || submitState === "uploading"}
          >
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={goNext}>
              Continue
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={submitState === "creating" || submitState === "uploading"}
            >
              {submitState === "creating"
                ? "Submitting…"
                : submitState === "uploading"
                ? "Uploading files…"
                : "Submit Property for Review →"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-ink/10 pb-4 last:border-0">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-gold-dark">{title}</h3>
      <div className="mt-2 flex flex-col gap-1">{children}</div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-sm text-ink/70">
      <span className="font-medium text-ink">{label}:</span> {value || "—"}
    </p>
  );
}
