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

export default async function HomePage() {
  const properties = await getFeaturedProperties();

  return (
    <>
      {/* ---------------------------------------------------------------- Hero */}
      <section className="relative isolate flex min-h-screen items-center overflow-hidden">
        <HeroSlideshow showDots />

        <p className="font-hand absolute right-4 top-4 z-10 rounded-xl border border-amber-400/30 bg-[#110a05]/50 px-3 py-2 text-xl leading-tight text-amber-200 backdrop-blur-md sm:right-8 sm:top-8 sm:text-2xl">
          Better Deals.
          <br />
          Brighter Futures.
        </p>

        <div className="absolute left-[64%] top-1/2 z-10 hidden w-[26rem] -translate-y-1/2 flex-col items-center rounded-2xl border border-amber-300/40 bg-[#110a05]/60 px-10 py-12 text-center shadow-2xl backdrop-blur-md xl:flex">
          <DeraxMark className="h-28 w-28" />
          <p className="mt-6 font-display text-2xl font-bold leading-snug text-white tracking-wide">
            DERAX REAL ESTATE LLC
          </p>
          <p className="mt-3 text-lg font-semibold tracking-wide text-amber-200/90">
            The Partner for Convenience
          </p>
        </div>

        <div className="relative z-10 mx-auto w-full max-w-content px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="max-w-3xl rounded-[20px] border border-amber-400/25 bg-[#110a05]/65 p-8 shadow-2xl backdrop-blur-md backdrop-saturate-150 sm:p-10 md:p-14">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300 sm:text-sm sm:tracking-[0.35em]">
              Real Estate Opportunities
            </p>

            <div
              className="mt-5 inline-block rounded-[22px] px-7 py-5 shadow-[0_25px_45px_-15px_rgba(0,0,0,0.6)] sm:px-9 sm:py-6"
              style={{
                background: "linear-gradient(180deg, #1d4536 0%, #123024 100%)",
                border: "1px solid rgba(201,162,75,0.4)",
              }}
            >
              <h1
                className="font-retro text-4xl italic leading-[1.05] text-[#fbf0dc] text-balance sm:text-5xl md:text-[3.4rem]"
                style={{
                  WebkitTextStroke: "1.5px #163a30",
                  textShadow:
                    "3px 4px 0 #163a30, 6px 8px 0 #c99a2e, 9px 11px 0 #df8569, 11px 14px 14px rgba(0,0,0,0.3)",
                }}
              >
                Distressed Properties
                <span className="mt-1 block text-[0.66em]">Real Solutions.</span>
              </h1>
            </div>

            <div
              className="mt-6 inline-block max-w-xl rounded-2xl border border-[rgba(173,216,255,0.3)] px-6 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),inset_0_-5px_12px_rgba(0,0,0,0.4),0_16px_32px_-10px_rgba(0,0,0,0.55),0_2px_0_#081426]"
              style={{ background: "linear-gradient(180deg, #274b7a 0%, #16305a 55%, #0b1b36 100%)" }}
            >
              <p className="font-condensed text-lg font-semibold tracking-wide text-[#cfe8ff] sm:text-xl">
                We Buy Houses for Cash — As-Is, On a Timeline We Schedule Together
              </p>
            </div>

            <p className="font-condensed mt-4 max-w-xl text-base text-white/85 sm:text-lg md:leading-relaxed">
              We buy houses for cash, as-is, with no need for repairs or renovations, and we
              close according to a timeline we schedule together with you.
            </p>
            <p className="font-condensed mt-4 max-w-xl text-base text-white/85 sm:text-lg md:leading-relaxed">
              At DERAX REAL ESTATE LLC, we turn the challenges of selling a distressed property
              into a simple and convenient process. No repairs, no complicated process, and no
              need to wait for a traditional buyer.
            </p>
            <p className="font-condensed mt-4 max-w-xl text-base text-white/85 sm:text-lg md:leading-relaxed">
              Our goal is to make selling your property simple, straightforward, and convenient
              from start to finish.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row md:mt-10">
              <ButtonLink
                href="/sell-your-property"
                className="transition hover:brightness-110 active:brightness-95"
                style={{
                  background: "linear-gradient(180deg, #fdba74 0%, #f97316 55%, #c2410c 100%)",
                  boxShadow:
                    "inset 0 1px 0 rgba(255,255,255,0.6), inset 0 -4px 10px rgba(0,0,0,0.2), 0 14px 28px -8px rgba(154,52,18,0.6), 0 2px 0 #9a3412",
                  border: "1px solid #9a3412",
                  color: "#431407",
                }}
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
