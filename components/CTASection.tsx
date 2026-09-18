import { ButtonLink } from "./Button";

export function CTASection() {
  return (
    <section className="bg-ink">
      <div className="mx-auto flex max-w-content flex-col items-center gap-6 px-4 py-14 text-center sm:px-6 md:flex-row md:justify-between md:text-left lg:px-8">
        <div className="flex items-center gap-4">
          <span
            className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-full border border-gold/50 text-gold sm:flex"
            aria-hidden
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
              <path
                d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4h4v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <div>
            <h2 className="font-display text-2xl font-semibold text-cream sm:text-3xl text-balance">
              Ready to Find Your Next Real Estate Opportunity?
            </h2>
            <p className="mt-2 max-w-xl text-sm text-cream/60 sm:text-base">
              Let&apos;s work together and turn distressed properties into profitable deals.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/contact">Get in Touch →</ButtonLink>
          <ButtonLink href="/sell-your-property" variant="outline">
            Sell Your Property →
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
