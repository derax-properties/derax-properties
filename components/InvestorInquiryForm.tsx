"use client";

import { useState, type FormEvent } from "react";
import { FormInput, FormTextarea } from "./FormInput";
import { FormSelect } from "./FormSelect";
import { Button } from "./Button";

const INVESTOR_TYPES = [
  "First-Time Investor",
  "Experienced Investor",
  "Cash Buyer",
  "Owner-Occupant Buyer",
  "Real Estate Agent",
  "Other",
];

type Status = "idle" | "submitting" | "success" | "error";

export function InvestorInquiryForm({
  propertyId,
  propertyTitle,
}: {
  propertyId: string;
  propertyTitle: string;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [values, setValues] = useState({
    name: "",
    phone: "",
    email: "",
    company: "",
    investor_type: "",
    message: `I'm interested in ${propertyTitle}. Please send me more information.`,
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    try {
      const res = await fetch("/api/investor-inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, property_id: propertyId, property_title: propertyTitle }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Please check the form and try again.");
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-gold/30 bg-white p-6 text-center shadow-card">
        <h3 className="font-display text-xl font-semibold text-ink">Inquiry sent</h3>
        <p className="mt-2 text-sm text-ink/60">
          Thank you for your interest. Our team will follow up with you shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-card" noValidate>
      <h3 className="font-display text-xl font-semibold text-ink">I&apos;m Interested</h3>
      <FormInput
        id="inv-name"
        label="Name"
        required
        value={values.name}
        onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormInput
          id="inv-phone"
          type="tel"
          label="Phone"
          required
          value={values.phone}
          onChange={(e) => setValues((v) => ({ ...v, phone: e.target.value }))}
        />
        <FormInput
          id="inv-email"
          type="email"
          label="Email"
          required
          value={values.email}
          onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormInput
          id="inv-company"
          label="Company"
          value={values.company}
          onChange={(e) => setValues((v) => ({ ...v, company: e.target.value }))}
        />
        <FormSelect
          id="inv-type"
          label="Investor Type"
          options={INVESTOR_TYPES}
          value={values.investor_type}
          onChange={(e) => setValues((v) => ({ ...v, investor_type: e.target.value }))}
        />
      </div>
      <FormTextarea
        id="inv-message"
        label="Message"
        required
        value={values.message}
        onChange={(e) => setValues((v) => ({ ...v, message: e.target.value }))}
      />

      {status === "error" && (
        <p className="text-sm font-medium text-red-600" role="alert">
          {errorMessage}
        </p>
      )}

      <Button type="submit" disabled={status === "submitting"}>
        {status === "submitting" ? "Sending…" : "Send Inquiry →"}
      </Button>
    </form>
  );
}
