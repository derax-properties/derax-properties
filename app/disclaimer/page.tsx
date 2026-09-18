import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Disclaimer",
  description: "Important disclaimer regarding Derax Properties and this website.",
};

export default function DisclaimerPage() {
  return (
    <section className="bg-cream-soft">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">Disclaimer</h1>

        <div className="mt-8 space-y-6 text-ink/70">
          <p>
            Derax Properties is a real estate investment and wholesaling company. Unless
            specifically stated otherwise, Derax Properties and its representatives are not
            acting as a licensed real estate broker or agent in any transaction described on this
            website.
          </p>
          <p>
            Any cash offer discussion is preliminary and non-binding until formalized in a signed
            written agreement. We evaluate each property individually, and we cannot guarantee
            that we will be able to make an offer on any specific property, or that any stated
            price expectation will be met.
          </p>
          <p>
            Property listings on this website, including examples labeled as sample or
            demonstration listings, may not reflect currently available inventory. Always verify
            current availability, pricing, and details directly with our team before making
            decisions.
          </p>
          <p>
            This website does not provide legal, tax, or financial advice. Homeowners and
            investors are encouraged to consult with qualified professionals before making
            decisions about a real estate transaction.
          </p>
        </div>
      </div>
    </section>
  );
}
