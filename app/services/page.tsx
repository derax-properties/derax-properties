import type { Metadata } from "next";
import { ServiceCard } from "@/components/ServiceCard";
import { CTASection } from "@/components/CTASection";
import { HouseIcon, CoinsIcon, TrendUpIcon, HandshakeIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Derax Properties buys houses directly — cash offers, fast closings, and investment opportunities nationwide.",
};

export default function ServicesPage() {
  return (
    <>
      <section className="bg-ink">
        <div className="mx-auto max-w-content px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">
            Our Services
          </p>
          <h1 className="mt-4 max-w-2xl font-display text-3xl font-semibold text-cream text-balance sm:text-4xl lg:text-5xl">
            We Buy Houses Directly. No Middleman, No Hassle.
          </h1>
          <p className="mt-5 max-w-xl text-cream/60">
            Whether you need a fast, guaranteed sale on your property or you&apos;re an investor
            looking for your next deal, Derax Properties buys directly and closes on your
            timeline.
          </p>
        </div>
      </section>

      <section className="bg-cream-soft">
        <div className="mx-auto flex max-w-content flex-col gap-5 px-4 py-16 sm:px-6 lg:px-8">
          <ServiceCard
            icon={<HouseIcon className="h-8 w-8" />}
            title="We Buy Houses"
            description="In most cases, we purchase your property directly with cash — no bank financing to wait on, no showings, no middleman between you and the sale."
          />
          <ServiceCard
            icon={<CoinsIcon className="h-8 w-8" />}
            title="Fast, Fair Cash Offers"
            description="We evaluate distressed, pre-foreclosure, tax-delinquent, and off-market properties quickly and present a straightforward, no-obligation offer — often within days."
          />
          <ServiceCard
            icon={<TrendUpIcon className="h-8 w-8" />}
            title="Investment Opportunities"
            description="Gain access to high-potential properties with strong returns and long-term value."
          />
          <ServiceCard
            icon={<HandshakeIcon className="h-8 w-8" />}
            title="Flexible Closing Options"
            description="Every property is different. In select situations where it puts more money in your pocket or gets you a faster close, we work with a trusted network of investors to structure the right solution — always with your outcome as the priority."
          />
        </div>
      </section>

      <CTASection />
    </>
  );
}
