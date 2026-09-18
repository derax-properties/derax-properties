import type { Metadata } from "next";
import { ServiceCard } from "@/components/ServiceCard";
import { CTASection } from "@/components/CTASection";
import { HouseIcon, HandshakeIcon, TrendUpIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Property acquisition, wholesaling, and investment opportunities from Derax Properties.",
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
            We Make Real Estate Simple, Profitable &amp; Stress-Free.
          </h1>
          <p className="mt-5 max-w-xl text-cream/60">
            Whether you&apos;re an investor looking for your next deal, a homeowner needing a
            fast solution, or a buyer searching for a great property, Derax Properties is your
            trusted partner in real estate.
          </p>
        </div>
      </section>

      <section className="bg-cream-soft">
        <div className="mx-auto flex max-w-content flex-col gap-5 px-4 py-16 sm:px-6 lg:px-8">
          <ServiceCard
            icon={<HouseIcon className="h-8 w-8" />}
            title="Property Acquisition"
            description="We find and negotiate distressed, pre-foreclosure, tax delinquent, and off-market properties."
          />
          <ServiceCard
            icon={<HandshakeIcon className="h-8 w-8" />}
            title="Wholesaling"
            description="We connect motivated sellers with serious cash buyers for win-win deals."
          />
          <ServiceCard
            icon={<TrendUpIcon className="h-8 w-8" />}
            title="Investment Opportunities"
            description="Gain access to high-potential properties with strong returns and long-term value."
          />
        </div>
      </section>

      <CTASection />
    </>
  );
}
