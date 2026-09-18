import { ButtonLink } from "@/components/Button";
import { FeatureCard } from "@/components/FeatureCard";
import { ServiceCard } from "@/components/ServiceCard";
import { PropertyCard } from "@/components/PropertyCard";
import { CTASection } from "@/components/CTASection";
import {
  HouseIcon,
  CoinsIcon,
  ShieldCheckIcon,
  HandshakeIcon,
  TargetIcon,
  UsersIcon,
  TrendUpIcon,
} from "@/components/icons";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Property } from "@/lib/types";

async function getFeaturedProperties(): Promise<Property[]> {
  try {
    const supabase = createServerSupabaseClient();
    const { data } = await supabase
      .from("properties")
      .select("*")
      .eq("status", "Available")
      .order("created_at", { ascending: false })
      .limit(4);
    return (data as Property[]) ?? [];
  } catch {
    // Supabase not configured yet (e.g. first local run before .env is set) —
    // render the page without featured properties instead of crashing.
    return [];
  }
}

export default async function HomePage() {
  const properties = await getFeaturedProperties();

  return (
    <>
      {/* ---------------------------------------------------------------- Hero */}
      <section className="relative overflow-hidden bg-ink">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 78% 30%, rgba(201,162,75,0.20), transparent 55%), linear-gradient(115deg, #0c0b09 0%, #241d13 40%, #4a3416 72%, #7a5522 100%)",
          }}
          aria-hidden
        />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "repeating-linear-gradient(100deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 90px)",
          }}
          aria-hidden
        />

        <div className="relative mx-auto grid max-w-content gap-10 px-4 py-20 sm:px-6 md:grid-cols-2 md:items-center md:py-28 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">
              Real Opportunities. Lasting Value.
            </p>
            <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-cream text-balance sm:text-5xl lg:text-6xl">
              We Find Distressed Properties.
              <br />
              <span className="text-gold">You Build Wealth.</span>
            </h1>
            <p className="mt-6 max-w-lg text-base text-cream/70 sm:text-lg">
              Derax Properties specializes in acquiring and wholesaling unwanted, distressed,
              and off-market properties — giving investors, homeowners, and buyers the right
              opportunities at the right price.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/properties">View Available Properties →</ButtonLink>
              <ButtonLink href="/sell-your-property" variant="outline">
                Sell Your Property →
              </ButtonLink>
            </div>
          </div>

          <div className="relative hidden md:block">
            <div className="ml-auto aspect-[4/3] w-full max-w-sm rounded-2xl border border-gold/20 bg-gradient-to-br from-white/5 to-transparent p-6 backdrop-blur-sm">
              <div className="flex h-full flex-col justify-end">
                <p className="font-hand text-3xl leading-tight text-gold sm:text-4xl">
                  Distressed Today.
                  <br />
                  Valuable Tomorrow.
                </p>
                <span className="mt-2 h-px w-40 bg-gold/60" aria-hidden />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- Trust strip */}
      <section className="border-b border-ink/5 bg-cream-soft">
        <div className="mx-auto grid max-w-content grid-cols-1 divide-y divide-ink/10 px-4 sm:grid-cols-2 sm:divide-x sm:divide-y-0 sm:px-6 lg:grid-cols-4 lg:px-8">
          <FeatureCard
            icon={<HouseIcon className="h-6 w-6" />}
            title="Off-Market Deals"
            description="Access to properties before they hit the market."
          />
          <FeatureCard
            icon={<CoinsIcon className="h-6 w-6" />}
            title="Investor Friendly"
            description="Flexible solutions for serious investors."
          />
          <FeatureCard
            icon={<ShieldCheckIcon className="h-6 w-6" />}
            title="Transparent Process"
            description="No hidden fees. No surprises."
          />
          <FeatureCard
            icon={<HandshakeIcon className="h-6 w-6" />}
            title="Nationwide Focus"
            description="Multiple markets. More opportunities."
          />
        </div>
      </section>

      {/* ------------------------------------------------------------ Services */}
      <section className="bg-cream-soft">
        <div className="mx-auto grid max-w-content gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-dark">
              Our Services
            </p>
            <h2 className="mt-4 font-display text-3xl font-semibold text-ink text-balance sm:text-4xl">
              We Make Real Estate Simple, Profitable &amp; Stress-Free.
            </h2>
            <p className="mt-5 max-w-md text-ink/60">
              Whether you&apos;re an investor looking for your next deal, a homeowner needing a
              fast solution, or a buyer searching for a great property, Derax Properties is your
              trusted partner in real estate.
            </p>
            <div className="mt-8">
              <ButtonLink href="/about" variant="outline" className="!text-gold-dark !border-gold-dark hover:!bg-gold-dark hover:!text-cream">
                Learn More About Us →
              </ButtonLink>
            </div>
          </div>

          <div className="flex flex-col gap-4">
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
        </div>
      </section>

      {/* ------------------------------------------------------- Why Choose Us */}
      <section className="relative overflow-hidden bg-ink">
        <div
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 20%, rgba(201,162,75,0.12), transparent 45%), radial-gradient(circle at 85% 80%, rgba(201,162,75,0.10), transparent 50%)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-content px-4 py-20 text-center sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">
            Why Choose Derax Properties
          </p>
          <h2 className="mx-auto mt-4 max-w-2xl font-display text-3xl font-semibold text-cream text-balance sm:text-4xl">
            More Than Just Properties — We Build Partnerships.
          </h2>

          <div className="mx-auto mt-14 grid max-w-4xl grid-cols-1 divide-y divide-white/10 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
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

      {/* ---------------------------------------------------- Featured properties */}
      <section className="bg-cream-soft">
        <div className="mx-auto max-w-content px-4 py-20 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-dark">
                Featured Properties
              </p>
              <h2 className="mt-4 font-display text-3xl font-semibold text-ink text-balance sm:text-4xl">
                Exclusive Deals. Real Opportunities.
              </h2>
            </div>
            <ButtonLink href="/properties" variant="ghost" className="!text-gold-dark !px-0 hover:!text-gold">
              View All Properties →
            </ButtonLink>
          </div>

          {properties.length > 0 ? (
            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {properties.map((property, i) => (
                <PropertyCard key={property.id} property={property} seed={i} />
              ))}
            </div>
          ) : (
            <div className="mt-10 rounded-2xl border border-dashed border-ink/15 bg-white p-10 text-center text-ink/50">
              New opportunities are added regularly. Check back soon, or{" "}
              <a href="/properties" className="font-semibold text-gold-dark underline">
                view all properties
              </a>
              .
            </div>
          )}
          <p className="mt-4 text-xs text-ink/40">
            Sample listings shown for illustration until properties are added in the admin
            dashboard.
          </p>
        </div>
      </section>

      {/* --------------------------------------------------- Sell property strip */}
      <section className="bg-cream">
        <div className="mx-auto flex max-w-content flex-col items-center gap-6 px-4 py-16 text-center sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-semibold text-ink text-balance sm:text-4xl">
            Thinking About Selling Your Property?
          </h2>
          <p className="max-w-xl text-ink/60">
            Tell us about your property. We&apos;ll review the details and see if we can make
            you a cash offer.
          </p>
          <p className="text-sm font-semibold uppercase tracking-wide text-gold-dark">
            Cash. As-Is. No Repairs Needed. We Buy in Your Area.
          </p>
          <ButtonLink href="/sell-your-property">Submit Your Property →</ButtonLink>
        </div>
      </section>

      <CTASection />
    </>
  );
}
