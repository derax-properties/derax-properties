import type { Metadata } from "next";
import { HouseIllustration } from "@/components/HouseIllustration";

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

        <div className="mx-auto mt-10 max-w-2xl overflow-hidden rounded-2xl bg-white shadow-card sm:grid sm:grid-cols-2 sm:items-center">
          <HouseIllustration className="hidden h-full w-full sm:block" />
          <div className="p-8 text-center sm:p-10">
            <p className="font-display text-xl font-semibold text-forest">
              Submit Your Property Details
            </p>
            <p className="mt-3 text-sm text-ink/60">
              Click below to open our secure property submission form. It only takes a couple
              of minutes, and your information goes directly to our team.
            </p>
            <a
              href={PODIO_WEBFORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="focus-gold mt-6 inline-flex w-full items-center justify-center rounded-full bg-forest px-6 py-3.5 text-sm font-semibold text-cream transition-colors hover:bg-forest-light sm:w-auto"
            >
              Submit Your Property →
            </a>
            <p className="mt-3 text-xs text-ink/40">Opens in a new tab.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
