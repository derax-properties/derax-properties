import type { ReactNode } from "react";

export function FeatureCard({
  icon,
  title,
  description,
  dark = false,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  dark?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-6 text-center">
      <span
        className={
          dark
            ? "flex h-12 w-12 items-center justify-center rounded-full border border-gold/50 text-gold"
            : "flex h-12 w-12 items-center justify-center rounded-full border border-ink/15 text-gold"
        }
        aria-hidden
      >
        {icon}
      </span>
      <h3 className={dark ? "font-display text-lg text-cream" : "font-display text-lg text-ink"}>
        {title}
      </h3>
      <p className={dark ? "text-sm text-cream/60" : "text-sm text-ink/60"}>{description}</p>
    </div>
  );
}
