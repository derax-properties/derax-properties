import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms of use for the Derax Properties website.",
};

export default function TermsPage() {
  return (
    <section className="bg-cream-soft">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">Terms of Use</h1>
        <p className="mt-2 text-sm text-ink/50">Last updated: {new Date().getFullYear()}</p>

        <div className="mt-8 space-y-6 text-ink/70">
          <p>
            These Terms of Use govern your access to and use of the Derax Properties website. By
            using this site, you agree to these terms.
          </p>

          <h2 className="font-display text-xl font-semibold text-ink">Use of This Website</h2>
          <p>
            This website is provided for informational purposes to connect property owners,
            buyers, and investors with Derax Properties. You agree to provide accurate
            information when submitting a form and not to use this site for any unlawful purpose.
          </p>

          <h2 className="font-display text-xl font-semibold text-ink">No Guarantee of Offer or Purchase</h2>
          <p>
            Submitting a property does not obligate Derax Properties to make an offer or complete
            a purchase, and does not obligate the submitting party to accept any offer that may be
            made. Every property is evaluated individually, and outcomes vary based on the
            specifics of each situation.
          </p>

          <h2 className="font-display text-xl font-semibold text-ink">Property Listings</h2>
          <p>
            Properties displayed on this site, including those labeled as sample or demo
            listings, are for illustrative purposes unless clearly presented as currently
            available inventory. Prices, availability, and details are subject to change without
            notice.
          </p>

          <h2 className="font-display text-xl font-semibold text-ink">No Professional Advice</h2>
          <p>
            Nothing on this website constitutes legal, financial, tax, or real estate brokerage
            advice. You should consult qualified professionals regarding your specific
            circumstances.
          </p>

          <h2 className="font-display text-xl font-semibold text-ink">Limitation of Liability</h2>
          <p>
            Derax Properties is not liable for any indirect, incidental, or consequential damages
            arising from your use of this website.
          </p>

          <h2 className="font-display text-xl font-semibold text-ink">Contact</h2>
          <p>
            Questions about these terms can be sent to{" "}
            <a href="mailto:info@deraxproperties.com" className="text-gold-dark hover:underline">
              info@deraxproperties.com
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  );
}
