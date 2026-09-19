"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cx } from "@/lib/utils";
import { DeraxMark } from "@/components/DeraxMark";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/properties", label: "Properties" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (pathname?.startsWith("/admin")) return null;

  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-cream-soft/95 backdrop-blur supports-[backdrop-filter]:bg-cream-soft/90">
      <div className="mx-auto flex max-w-content items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="focus-gold group flex items-center gap-3"
          onClick={() => setOpen(false)}
        >
          <DeraxMark className="h-10 w-10 shrink-0 sm:h-11 sm:w-11" />
          <span className="flex flex-col leading-none">
            <span className="font-display text-xl font-bold tracking-wide text-forest sm:text-2xl">
              DERAX
            </span>
            <span className="text-[10px] font-semibold tracking-[0.35em] text-gold-dark sm:text-xs">
              PROPERTIES
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cx(
                  "focus-gold relative pb-1 text-sm font-medium tracking-wide text-ink/80 transition-colors hover:text-forest",
                  isActive && "text-forest"
                )}
              >
                {link.label}
                {isActive && (
                  <span className="absolute -bottom-0.5 left-0 h-[2px] w-full rounded-full bg-gold" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="hidden lg:block">
          <Link
            href="/sell-your-property"
            className="focus-gold inline-flex items-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-cream transition-colors hover:bg-forest-light"
          >
            Submit Your Property
          </Link>
        </div>

        <button
          type="button"
          className="focus-gold inline-flex flex-col items-center justify-center gap-1.5 rounded-md p-2 lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <span
            className={cx(
              "block h-0.5 w-6 rounded-full bg-forest transition-transform",
              open && "translate-y-2 rotate-45"
            )}
          />
          <span
            className={cx("block h-0.5 w-6 rounded-full bg-forest transition-opacity", open && "opacity-0")}
          />
          <span
            className={cx(
              "block h-0.5 w-6 rounded-full bg-forest transition-transform",
              open && "-translate-y-2 -rotate-45"
            )}
          />
        </button>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="border-t border-ink/10 bg-cream-soft px-4 pb-6 pt-2 lg:hidden"
        >
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={cx(
                      "focus-gold block rounded-md px-2 py-3 text-base font-medium text-ink/80 hover:text-forest",
                      isActive && "text-forest"
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link
            href="/sell-your-property"
            onClick={() => setOpen(false)}
            className="focus-gold mt-4 flex items-center justify-center gap-2 rounded-full bg-forest px-5 py-3 text-sm font-semibold text-cream"
          >
            Submit Your Property
          </Link>
        </nav>
      )}
    </header>
  );
}
