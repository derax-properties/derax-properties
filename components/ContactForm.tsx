"use client";

import { useState, type FormEvent } from "react";
import { FormInput, FormTextarea } from "./FormInput";
import { FormSelect } from "./FormSelect";
import { Button } from "./Button";

const INTERESTS = [
  "Selling a Property",
  "Buying a Property",
  "Investment Opportunities",
  "Partnership",
  "General Question",
];

type Status = "idle" | "submitting" | "success" | "error";

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [values, setValues] = useState({
    name: "",
    email: "",
    phone: "",
    interest: "",
    message: "",
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setErrorMessage("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "Please check the form and try again.");
      }
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-gold/30 bg-white p-8 text-center shadow-card">
        <h2 className="font-display text-2xl font-semibold text-ink">Message sent</h2>
        <p className="mt-2 text-ink/60">
          Thank you for reaching out. Our team will get back to you shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-2xl bg-white p-6 shadow-card sm:p-8" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormInput
          id="name"
          label="Name"
          required
          value={values.name}
          onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
        />
        <FormInput
          id="email"
          type="email"
          label="Email"
          required
          value={values.email}
          onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <FormInput
          id="phone"
          type="tel"
          label="Phone"
          value={values.phone}
          onChange={(e) => setValues((v) => ({ ...v, phone: e.target.value }))}
        />
        <FormSelect
          id="interest"
          label="I'm interested in"
          required
          options={INTERESTS}
          value={values.interest}
          onChange={(e) => setValues((v) => ({ ...v, interest: e.target.value }))}
        />
      </div>
      <FormTextarea
        id="message"
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
        {status === "submitting" ? "Sending…" : "Send Message →"}
      </Button>
    </form>
  );
}
