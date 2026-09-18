import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/utils";

type Variant = "primary" | "outline" | "ghost";

const base =
  "focus-gold inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold tracking-wide transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60";

const variants: Record<Variant, string> = {
  primary: "bg-gold text-ink hover:bg-gold-light",
  outline: "border border-gold text-gold hover:bg-gold hover:text-ink",
  ghost: "text-cream hover:text-gold",
};

interface CommonProps {
  variant?: Variant;
  children: ReactNode;
  className?: string;
}

export function ButtonLink({
  href,
  variant = "primary",
  children,
  className,
}: CommonProps & { href: string }) {
  return (
    <Link href={href} className={cx(base, variants[variant], className)}>
      {children}
    </Link>
  );
}

export function Button({
  variant = "primary",
  children,
  className,
  ...rest
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cx(base, variants[variant], className)} {...rest}>
      {children}
    </button>
  );
}
