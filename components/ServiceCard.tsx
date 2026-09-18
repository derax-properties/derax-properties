import type { ReactNode } from "react";
import { CircleArrowIcon } from "./icons";

export function ServiceCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl bg-ink p-4 text-cream transition-colors hover:bg-ink-charcoal sm:p-5">
      <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-white/5 text-gold sm:h-20 sm:w-20">
        {icon}
      </span>
      <div className="flex-1">
        <h3 className="font-display text-lg text-cream">{title}</h3>
        <p className="mt-1 text-sm text-cream/60">{description}</p>
      </div>
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold text-gold"
        aria-hidden
      >
        <CircleArrowIcon className="h-5 w-5" />
      </span>
    </div>
  );
}
