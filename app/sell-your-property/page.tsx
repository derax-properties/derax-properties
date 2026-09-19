import type { Metadata } from "next";

const PODIO_WEBFORM_URL = "https://podio.com/webforms/30844013/2624806";

export const metadata: Metadata = {
  title: "Sell Your Property",
  description:
    "Tell us about your property. Our team will review the details and reach out if we're able to help.",
};

export default function SellYourPropertyPage() {
  return (
    <section className="bg-cream-soft">
      <div className="mx-auto max-w-content px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-dark">
            No Obligation. No Account Needed.
          </p>
          <h1 className="mt-4 font-display text-3xl font-semibold text-ink text-balance sm:text-4xl">
            Sell Your Property
          </h1>
          <p className="mt-4 text-ink/60">
            Tell us a little about the property and your situation. Our team will review the
            information and contact you if we&apos;re able to help.
          </p>
          <p className="mt-3 text-sm font-semibold uppercase tracking-wide text-gold-dark">
            Cash. As-Is. No Repairs Needed. We Buy in Your Area.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-2xl overflow-hidden rounded-2xl bg-white shadow-card">
          <iframe
            src={PODIO_WEBFORM_URL}
            title="Sell Your Property"
            className="h-[1400px] w-full border-0"
            loading="lazy"
          />
        </div>
        <p className="mx-auto mt-4 max-w-2xl text-center text-xs text-ink/40">
          Having trouble with the form above?{" "}
          <a
            href={PODIO_WEBFORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-gold-dark underline"
          >
            Open it in a new tab
          </a>
          .
        </p>
      </div>
    </section>
  );
}
