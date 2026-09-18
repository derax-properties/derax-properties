import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Derax Properties about selling, buying, or investing.",
};

const PHONE = process.env.NEXT_PUBLIC_COMPANY_PHONE ?? "(XXX) XXX-XXXX";
const EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "info@deraxproperties.com";
const ADDRESS = process.env.NEXT_PUBLIC_COMPANY_ADDRESS ?? "";

export default function ContactPage() {
  return (
    <section className="bg-cream-soft">
      <div className="mx-auto grid max-w-content gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-dark">
            Contact
          </p>
          <h1 className="mt-4 font-display text-3xl font-semibold text-ink text-balance sm:text-4xl">
            Let&apos;s Talk Real Estate.
          </h1>
          <p className="mt-5 max-w-md text-ink/60">
            Whether you&apos;re selling, buying, or looking to invest, we&apos;d like to hear
            from you. Send a message and our team will follow up.
          </p>

          <dl className="mt-10 space-y-4 text-sm">
            <div>
              <dt className="font-semibold text-ink">Email</dt>
              <dd>
                <a href={`mailto:${EMAIL}`} className="text-gold-dark hover:underline">
                  {EMAIL}
                </a>
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-ink">Phone</dt>
              <dd>
                <a href={`tel:${PHONE.replace(/\D/g, "")}`} className="text-gold-dark hover:underline">
                  {PHONE}
                </a>{" "}
                <span className="text-ink/50">(call, text, or WhatsApp)</span>
              </dd>
            </div>
            {ADDRESS && (
              <div>
                <dt className="font-semibold text-ink">Mailing Address</dt>
                <dd className="text-ink/60">{ADDRESS}</dd>
              </div>
            )}
            <div>
              <dt className="font-semibold text-ink">Service Area</dt>
              <dd className="text-ink/60">Nationwide</dd>
            </div>
          </dl>
        </div>

        <ContactForm />
      </div>
    </section>
  );
}
