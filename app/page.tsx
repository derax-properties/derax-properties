import { ButtonLink } from "@/components/Button";
import { FeatureCard } from "@/components/FeatureCard";
import { PropertyCard } from "@/components/PropertyCard";
import { CTASection } from "@/components/CTASection";
import { HeroSlideshow } from "@/components/HeroSlideshow";
import { DeraxMark } from "@/components/DeraxMark";
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
    title: "We Buy Houses",
    description: "In most cases, we purchase your property directly — cash, no middleman.",
  },
  {
    icon: <HandshakeIcon className="h-7 w-7" />,
    title: "Fast, Fair Offers",
    description: "A straightforward, no-obligation offer, often within days.",
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

/** Orange "3D" gradient button style matching the new navy/orange hero. */
const ORANGE_3D_STYLE: React.CSSProperties = {
  background: "linear-gradient(180deg, #f0a868 0%, #de7f2e 55%, #c9701f 100%)",
  boxShadow:
    "inset 0 1px 0 rgba(255,255,255,0.55), inset 0 -4px 10px rgba(0,0,0,0.2), 0 14px 28px -8px rgba(124,45,18,0.6), 0 2px 0 #7c2d12",
  border: "1px solid #7c2d12",
  color: "#2b1206",
};

export default async function HomePage() {
  const properties = await getFeaturedProperties();

  const heroEyebrow = (
    <p className="text-center text-xs font-semibold uppercase tracking-[0.3em] text-orange-300 sm:text-sm sm:tracking-[0.35em]">
      Real Estate Opportunities
    </p>
  );

  const heroTitle = (
    <h1 className="font-typewriter mt-3 text-center text-3xl uppercase leading-[1.2] text-white text-balance sm:text-4xl xl:text-[2.75rem]">
      <span className="hero-title-word hero-title-w1">Distressed</span>{" "}
      <span className="hero-title-word hero-title-w2">Properties</span>
      <span className="block text-orange-300">
        <span className="hero-title-word hero-title-w3">Real</span>{" "}
        <span className="hero-title-word hero-title-w4">Solutions.</span>
      </span>
    </h1>
  );

  const heroBullets = (
    <ul className="mx-auto mt-6 flex max-w-sm flex-col items-center gap-2.5">
      <li className="text-sm font-semibold text-white sm:text-base">Sell your house fast, as-is</li>
      <li className="text-sm font-semibold text-white sm:text-base">Get a fair cash offer</li>
      <li className="text-sm font-semibold text-white sm:text-base">Close on your own timeline</li>
    </ul>
  );

  const heroButtons = (
    <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
      <ButtonLink
        href="/sell-your-property"
        className="transition hover:brightness-110 active:brightness-95"
        style={ORANGE_3D_STYLE}
      >
        Submit Your Property →
      </ButtonLink>
      <ButtonLink
        href="/properties"
        variant="outline"
        className="!border-white/50 !bg-white/10 !text-white hover:!bg-white/20"
      >
        View Properties
      </ButtonLink>
    </div>
  );

  return (
    <>
      {/* ---------------------------------------------------------------- Hero */}
      <section className="relative isolate flex min-h-screen items-center overflow-hidden">
        <HeroSlideshow showDots />

        {/* Top-left brand mark, overlaid on the hero photo (matches the approved mockup) */}
        <div className="absolute left-4 top-4 z-30 flex items-center gap-3 sm:left-8 sm:top-8">
          <DeraxMark className="h-11 w-11 shrink-0 drop-shadow-md sm:h-12 sm:w-12" />
          <div className="flex flex-col leading-tight">
            <span className="font-display text-base font-bold tracking-wide text-white drop-shadow-md sm:text-lg">
              DERAX REAL ESTATE LLC
            </span>
            <span className="text-[10px] font-semibold tracking-[0.3em] text-orange-300 drop-shadow-md">
              LLC
            </span>
          </div>
        </div>

        <p className="font-hand absolute right-4 top-4 z-30 rounded-xl border border-amber-400/30 bg-[#110a05]/50 px-3 py-2 text-xl leading-tight text-amber-200 backdrop-blur-md sm:right-8 sm:top-8 sm:text-2xl">
          Better Deals.
          <br />
          Brighter Futures.
        </p>

        {/* Desktop: diagonal navy panel on the right, orange edge accent */}
        <div
          className="absolute inset-y-0 right-0 z-10 hidden w-[56%] lg:block"
          style={{
            background: "linear-gradient(90deg, #f0a868 0%, #c9701f 100%)",
            clipPath: "polygon(15% 0, 100% 0, 100% 100%, 0% 100%, 0% 30%)",
          }}
          aria-hidden
        />
        <div
          className="absolute inset-y-0 right-0 z-10 hidden w-[55%] lg:block"
          style={{
            background: "linear-gradient(135deg, #22344a 0%, #141f2b 100%)",
            clipPath: "polygon(17% 0, 100% 0, 100% 100%, 0% 100%, 0% 30%)",
          }}
          aria-hidden
        />
        <div className="absolute inset-y-0 right-0 z-20 hidden w-[55%] flex-col items-center justify-center px-12 py-10 lg:flex xl:px-16">
          {heroEyebrow}
          {heroTitle}
          {heroBullets}
          {heroButtons}
        </div>

        {/* Mobile / tablet: single stacked navy card, same colors, no diagonal cut */}
        <div className="relative z-10 mx-auto w-full max-w-content px-4 py-16 sm:px-6 sm:py-20 lg:hidden">
          <div
            className="mx-auto flex max-w-xl flex-col items-center rounded-[20px] border border-orange-400/25 p-8 text-center shadow-2xl backdrop-blur-md backdrop-saturate-150 sm:p-10"
            style={{ background: "linear-gradient(135deg, rgba(34,52,74,0.9) 0%, rgba(20,31,43,0.92) 100%)" }}
          >
            {heroEyebrow}
            {heroTitle}
            {heroBullets}
            {heroButtons}
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- Trust strip */}
      <section className="bg-[#1c0f08]">
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
