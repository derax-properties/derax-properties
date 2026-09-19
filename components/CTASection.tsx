import Image from "next/image";
import { ButtonLink } from "./Button";
import { Skyline } from "./Skyline";

export function CTASection() {
  return (
    <section className="relative overflow-hidden bg-forest-dark">
      <Skyline className="pointer-events-none absolute inset-x-0 bottom-0 h-24 w-full text-gold sm:h-32" />

      <div className="relative mx-auto flex max-w-content flex-col items-center gap-8 px-4 py-14 text-center sm:px-6 md:flex-row md:items-center md:justify-between md:gap-6 md:text-left lg:px-8">
        <div className="flex flex-col items-center gap-4 md:flex-row">
          <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full">
            <span className="absolute inset-0 -z-10 rounded-full bg-gold/30 blur-md" aria-hidden />
            <Image
              src="/logo.png"
              alt="Derax Properties"
              width={96}
              height={96}
              className="h-full w-full rounded-full object-cover ring-2 ring-gold"
            />
          </span>
          <div>
            <h2 className="font-display text-2xl font-semibold text-cream sm:text-3xl text-balance">
              Ready to Unlock Your Property&apos;s Potential?
            </h2>
            <p className="mt-2 max-w-xl text-sm text-cream/60 sm:text-base">
              Let&apos;s work together to turn distressed properties into profitable deals.
            </p>
          </div>
        </div>
        <ButtonLink href="/sell-your-property" className="shrink-0">
          Submit Your Property →
        </ButtonLink>
      </div>
    </section>
  );
}
