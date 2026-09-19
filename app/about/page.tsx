import type { Metadata } from "next";
import { FeatureCard } from "@/components/FeatureCard";
import { CTASection } from "@/components/CTASection";
import { TargetIcon, ShieldCheckIcon, UsersIcon, TrendUpIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "About",
  description:
    "Derax Properties is a real estate investment company focused on straightforward solutions for property owners and real access to opportunities for investors.",
};

export default function AboutPage() {
  return (
    <>
      <section className="bg-ink">
        <div className="mx-auto max-w-content px-4 py-16 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">About Us</p>
          <h1 className="mt-4 max-w-2xl font-display text-3xl font-semibold text-cream text-balance sm:text-4xl lg:text-5xl">
            More Than Just Properties — We Build Partnerships.
          </h1>
        </div>
      </section>

      <section className="bg-cream-soft">
        <div className="mx-auto max-w-3xl px-4 py-16 text-ink/70 sm:px-6 lg:px-8">
          <p className="text-lg leading-relaxed">
            Derax Properties is a real estate investment company focused on creating
            straightforward solutions for property owners and pursuing real estate investment
            opportunities.
          </p>
          <p className="mt-6 leading-relaxed">
            We work directly with homeowners, investors, buyers, and real estate professionals to
            identify and evaluate properties that may require a different approach — including
            distressed, off-market, pre-foreclosure, tax-delinquent, vacant, or otherwise unwanted
            properties.
          </p>
          <p className="mt-6 leading-relaxed">
            We evaluate each property individually and may acquire properties directly, enter
            into purchase agreements, or assign contractual interests when appropriate. Our
            approach is based on transparency, honest communication, and long-term relationships.
            We work to make the process as simple and straightforward as possible for everyone
            involved.
          </p>
        </div>
      </section>

      <section className="bg-ink">
        <div className="mx-auto max-w-content px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 divide-y divide-white/10 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
            <FeatureCard
              dark
              icon={<TargetIcon className="h-6 w-6" />}
              title="Profitable Deals"
              description="Quality properties with real investment potential."
            />
            <FeatureCard
              dark
              icon={<ShieldCheckIcon className="h-6 w-6" />}
              title="Integrity"
              description="Honest communication and transparent terms."
            />
            <FeatureCard
              dark
              icon={<UsersIcon className="h-6 w-6" />}
              title="Client Focused"
              description="Your goals are our priority."
            />
            <FeatureCard
              dark
              icon={<TrendUpIcon className="h-6 w-6" />}
              title="Long-Term Vision"
              description="Building wealth for a better tomorrow."
            />
          </div>
        </div>
      </section>

      <CTASection />
    </>
  );
}
