import type { Metadata } from "next";
import { SellPropertyWizard } from "./SellPropertyWizard";

export const metadata: Metadata = {
  title: "Sell Your Property",
  description:
    "Tell us about your property. Our team will review the details and reach out if we're able to help.",
};

const TRUST_CHIPS = ["Fast, fair cash offers", "Close on your timeline", "Buying nationwide"];

export default function SellYourPropertyPage() {
  return (
    <>
      {/* ------------------------------------------------------------- Hero */}
      <section
        className="relative isolate overflow-hidden px-4 pb-24 pt-14 text-center sm:px-6 sm:pt-16 lg:px-8"
        style={{ background: "linear-gradient(135deg, #22344a 0%, #141f2b 100%)" }}
      >
        <div
          className="pointer-events-none absolute -right-[18%] -top-[20%] -z-10 h-[160%] w-[60%]"
          style={{
            background: "linear-gradient(180deg, #f0a868 0%, #c9701f 100%)",
            clipPath: "polygon(40% 0, 55% 0, 25% 100%, 10% 100%)",
            opacity: 0.9,
          }}
          aria-hidden
        />

        <div className="relative mx-auto max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-orange-300">
            No Obligation &nbsp;•&nbsp; No Account Needed
          </p>
          <h1 className="font-typewriter mt-3 text-3xl uppercase leading-tight text-white text-balance sm:text-4xl">
            Sell Your Property
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/70 sm:text-base">
            Tell us a little about the property and your situation. Our team will review the
            information and reach out if we&apos;re able to help — no pressure, no obligation.
          </p>
          <p className="mt-4 text-xs font-bold uppercase tracking-wide text-orange-300 sm:text-sm">
            Cash &middot; As-Is &middot; No Repairs Needed &middot; We Buy In Your Area
          </p>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            {TRUST_CHIPS.map((label) => (
              <span
                key={label}
                className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white sm:text-sm"
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-orange-300" aria-hidden />
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- Wizard */}
      <section className="bg-cream-soft px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto -mt-14 max-w-3xl">
          <SellPropertyWizard />
        </div>
      </section>
    </>
  );
}
