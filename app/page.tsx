import { ButtonLink } from "@/components/Button";
import { FeatureCard } from "@/components/FeatureCard";
import { PropertyCard } from "@/components/PropertyCard";
import { CTASection } from "@/components/CTASection";
import { HouseIllustration } from "@/components/HouseIllustration";
import {
  HouseIcon,
  UsersIcon,
  ShieldCheckIcon,
  MapPinIcon,
  CoinsIcon,
  HandshakeIcon,
  TrendUpIcon,
  SupportIcon,
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

const SERVICES = [
  {
    icon: <CoinsIcon className="h-7 w-7" />,
    title: "Property Acquisition",
    description: "We find and negotiate distressed properties.",
  },
  {
    icon: <HandshakeIcon className="h-7 w-7" />,
    title: "Wholesaling",
    description: "We connect motivated sellers with cash buyers.",
  },
  {
    icon: <TrendUpIcon className="h-7 w-7" />,
    title: "Investment Opportunities",
    description: "High-potential properties with strong returns.",
  },
  {
    icon: <SupportIcon className="h-7 w-7" />,
    title: "End-to-End Support",
    description: "Guidance from contract to closing.",
  },
];

export default async function HomePage() {
  const properties = await getFeaturedProperties();

  return (
    <>
      {/* ---------------------------------------------------------------- Hero */}
      <section className="bg-cream-soft">
        <div className="mx-auto grid max-w-content gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:items-center md:py-24 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-dark">
              Real Estate Opportunities
            </p>
            <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-forest text-balance sm:text-5xl">
              Distressed Properties.
              <br />
              Real Solutions.
            </h1>
            <p className="mt-6 max-w-lg text-base text-ink/60 sm:text-lg">
              We help homeowners, investors, and buyers unlock value through off-market and
              distressed property opportunities across the U.S.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/sell-your-property" className="!bg-forest !text-cream hover:!bg-forest-light">
                Submit Your Property →
              </ButtonLink>
              <ButtonLink
                href="/properties"
                variant="outline"
                className="!border-forest !text-forest hover:!bg-forest hover:!text-cream"
              >
                View Properties
              </ButtonLink>
            </div>
          </div>

          <div className="relative">
            <HouseIllustration className="w-full rounded-2xl shadow-card" />
            <p className="font-hand absolute right-4 top-4 text-2xl leading-tight text-gold-dark sm:right-6 sm:top-6 sm:text-3xl">
              Better Deals.
              <br />
              Brighter Futures.
            </p>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- Trust strip */}
      <section className="bg-forest">
        <div className="mx-auto grid max-w-content grid-cols-1 divide-y divide-white/10 px-4 sm:grid-cols-2 sm:divide-x sm:divide-y-0 sm:px-6 lg:grid-cols-4 lg:px-8">
          <FeatureCard
            dark
            icon={<HouseIcon className="h-6 w-6" />}
            title="Off-Market Access"
            description="Find properties before they hit the market."
          />
          <FeatureCard
            dark
            icon={<UsersIcon className="h-6 w-6" />}
            title="Investor Solutions"
            description="Flexible options for serious buyers."
          />
          <FeatureCard
            dark
            icon={<ShieldCheckIcon className="h-6 w-6" />}
            title="Trusted & Transparent"
            description="No hidden fees. No surprises."
          />
          <FeatureCard
            dark
            icon={<MapPinIcon className="h-6 w-6" />}
            title="Nationwide Coverage"
            description="Multiple markets. More opportunities."
          />
        </div>
      </section>

      {/* ------------------------------------------------------------ Services */}
      <section className="bg-cream-soft">
        <div className="mx-auto max-w-content px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-6 lg:divide-x lg:divide-ink/10">
            <div className="lg:col-span-2 lg:pr-8">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-dark">
                How We Help
              </p>
              <h2 className="mt-4 font-display text-3xl font-semibold text-forest text-balance">
                Our Services
              </h2>
              <p className="mt-4 max-w-sm text-sm text-ink/60">
                From distressed properties to investment opportunities, we make the process
                simple, transparent, and profitable.
              </p>
              <div className="mt-6">
                <ButtonLink
                  href="/services"
                  variant="ghost"
                  className="!text-gold-dark !px-0 hover:!text-gold"
                >
                  Learn More →
                </ButtonLink>
              </div>
            </div>

            {SERVICES.map((service) => (
              <div key={service.title} className="flex flex-col items-start gap-3 lg:px-6">
                <span
                  className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/50 text-gold-dark"
                  aria-hidden
                >
                  {service.icon}
                </span>
                <h3 className="font-display text-base font-semibold text-forest">
                  {service.title}
                </h3>
                <p className="text-sm text-ink/60">{service.description}</p>
              </div>
            ))}
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
              <h2 className="mt-4 font-display text-3xl font-semibold text-forest text-balance sm:text-4xl">
                Great Deals. Real Potential.
              </h2>
            </div>
            <ButtonLink
              href="/properties"
              variant="ghost"
              className="!text-gold-dark !px-0 hover:!text-gold"
            >
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

      <CTASection />
    </>
  );
}
