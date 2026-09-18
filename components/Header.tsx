"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cx } from "@/lib/utils";

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
    <header className="sticky top-0 z-50 border-b border-white/10 bg-ink/95 backdrop-blur supports-[backdrop-filter]:bg-ink/90">
      <div className="mx-auto flex max-w-content items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="focus-gold group flex items-center gap-3"
          onClick={() => setOpen(false)}
        >
          <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full sm:h-14 sm:w-14">
            <span
              className="absolute inset-0 -z-10 rounded-full bg-gold/40 blur-md transition-opacity group-hover:bg-gold/60"
              aria-hidden
            />
            <Image
              src="/logo.png"
              alt="Derax Properties"
              width={112}
              height={112}
              priority
              className="h-full w-full rounded-full object-cover ring-2 ring-gold shadow-[0_0_18px_rgba(201,162,75,0.65)]"
            />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-xl font-bold tracking-wide text-cream sm:text-2xl">
              DERAX
            </span>
            <span className="text-[10px] font-semibold tracking-[0.35em] text-gold sm:text-xs">
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
                  "focus-gold relative pb-1 text-sm font-medium tracking-wide text-cream/90 transition-colors hover:text-gold",
                  isActive && "text-gold"
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
            href="/contact"
            className="focus-gold inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-gold-light"
          >
            Get in Touch
            <span aria-hidden>→</span>
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
              "block h-0.5 w-6 rounded-full bg-cream transition-transform",
              open && "translate-y-2 rotate-45"
            )}
          />
          <span
            className={cx("block h-0.5 w-6 rounded-full bg-cream transition-opacity", open && "opacity-0")}
          />
          <span
            className={cx(
              "block h-0.5 w-6 rounded-full bg-cream transition-transform",
              open && "-translate-y-2 -rotate-45"
            )}
          />
        </button>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="border-t border-white/10 bg-ink px-4 pb-6 pt-2 lg:hidden"
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
                      "focus-gold block rounded-md px-2 py-3 text-base font-medium text-cream/90 hover:text-gold",
                      isActive && "text-gold"
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link
            href="/contact"
            onClick={() => setOpen(false)}
            className="focus-gold mt-4 flex items-center justify-center gap-2 rounded-full bg-gold px-5 py-3 text-sm font-semibold text-ink"
          >
            Get in Touch <span aria-hidden>→</span>
          </Link>
        </nav>
      )}
    </header>
  );
}
