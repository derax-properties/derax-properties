"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/services", label: "Services" },
  { href: "/properties", label: "Properties" },
  { href: "/sell-your-property", label: "Sell Your Property" },
  { href: "/contact", label: "Contact" },
];

const LEGAL = [
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Use" },
  { href: "/disclaimer", label: "Disclaimer" },
];

const PHONE = process.env.NEXT_PUBLIC_COMPANY_PHONE ?? "(XXX) XXX-XXXX";
const EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "info@deraxproperties.com";
const ADDRESS = process.env.NEXT_PUBLIC_COMPANY_ADDRESS ?? "";

const SOCIALS = [
  { label: "Facebook", href: "#" },
  { label: "Instagram", href: "#" },
  { label: "LinkedIn", href: "#" },
  { label: "YouTube", href: "#" },
];

export function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  return (
    <footer className="bg-ink text-cream/80">
      <div className="mx-auto max-w-content px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full">
                <span className="absolute inset-0 -z-10 rounded-full bg-gold/40 blur-md" aria-hidden />
                <Image
                  src="/logo.png"
                  alt="Derax Properties"
                  width={96}
                  height={96}
                  className="h-full w-full rounded-full object-cover ring-2 ring-gold shadow-[0_0_16px_rgba(201,162,75,0.6)]"
                />
              </span>
              <div className="flex flex-col leading-none">
                <span className="font-display text-xl font-bold text-cream">DERAX</span>
                <span className="text-[10px] font-semibold tracking-[0.35em] text-gold">
                  PROPERTIES
                </span>
              </div>
            </div>
            <p className="mt-4 max-w-xs text-sm text-cream/60">
              Real opportunities. Lasting value. Distressed and off-market real estate
              solutions, nationwide.
            </p>
            <div className="mt-5 flex gap-3">
              {SOCIALS.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="focus-gold flex h-9 w-9 items-center justify-center rounded-full border border-gold/40 text-gold transition-colors hover:bg-gold hover:text-ink"
                >
                  <SocialIcon label={s.label} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              Navigate
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="focus-gold hover:text-gold">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              Contact
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a href={`mailto:${EMAIL}`} className="focus-gold hover:text-gold">
                  {EMAIL}
                </a>
              </li>
              <li>
                <a href={`tel:${PHONE.replace(/\D/g, "")}`} className="focus-gold hover:text-gold">
                  {PHONE}
                </a>
                <span className="block text-xs text-cream/50">Call, text, or WhatsApp</span>
              </li>
              {ADDRESS && <li className="text-cream/60">{ADDRESS}</li>}
              <li className="text-cream/60">Nationwide</li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Legal</h3>
            <ul className="mt-4 space-y-2 text-sm">
              {LEGAL.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="focus-gold hover:text-gold">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-cream/50 sm:flex-row">
          <p>© {new Date().getFullYear()} Derax Properties. All rights reserved.</p>
          <p>Derax Properties is not a licensed real estate brokerage unless stated otherwise.</p>
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({ label }: { label: string }) {
  const common = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "currentColor" } as const;
  switch (label) {
    case "Facebook":
      return (
        <svg {...common} aria-hidden>
          <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.9h2.54V9.85c0-2.5 1.49-3.89 3.78-3.89 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.9h-2.34V22c4.78-.8 8.44-4.94 8.44-9.94Z" />
        </svg>
      );
    case "Instagram":
      return (
        <svg {...common} aria-hidden>
          <path d="M12 2.2c2.7 0 3 .01 4.12.06 1.11.05 1.87.23 2.53.49.68.27 1.26.62 1.83 1.19.57.57.92 1.15 1.19 1.83.26.66.44 1.42.49 2.53.05 1.12.06 1.42.06 4.12s-.01 3-.06 4.12c-.05 1.11-.23 1.87-.49 2.53a5.1 5.1 0 0 1-1.19 1.83 5.1 5.1 0 0 1-1.83 1.19c-.66.26-1.42.44-2.53.49-1.12.05-1.42.06-4.12.06s-3-.01-4.12-.06c-1.11-.05-1.87-.23-2.53-.49a5.1 5.1 0 0 1-1.83-1.19 5.1 5.1 0 0 1-1.19-1.83c-.26-.66-.44-1.42-.49-2.53C2.21 15 2.2 14.7 2.2 12s.01-3 .06-4.12c.05-1.11.23-1.87.49-2.53.27-.68.62-1.26 1.19-1.83A5.1 5.1 0 0 1 5.77 2.33c.66-.26 1.42-.44 2.53-.49C9.42 1.79 9.72 1.78 12 1.78Zm0 1.98c-2.66 0-2.97.01-4.02.06-.97.05-1.5.21-1.85.35-.46.18-.8.4-1.15.75-.35.35-.57.69-.75 1.15-.14.35-.3.88-.35 1.85-.05 1.05-.06 1.36-.06 4.02s.01 2.97.06 4.02c.05.97.21 1.5.35 1.85.18.46.4.8.75 1.15.35.35.69.57 1.15.75.35.14.88.3 1.85.35 1.05.05 1.36.06 4.02.06s2.97-.01 4.02-.06c.97-.05 1.5-.21 1.85-.35.46-.18.8-.4 1.15-.75.35-.35.57-.69.75-1.15.14-.35.3-.88.35-1.85.05-1.05.06-1.36.06-4.02s-.01-2.97-.06-4.02c-.05-.97-.21-1.5-.35-1.85a3.1 3.1 0 0 0-.75-1.15 3.1 3.1 0 0 0-1.15-.75c-.35-.14-.88-.3-1.85-.35-1.05-.05-1.36-.06-4.02-.06Zm0 3.37a4.47 4.47 0 1 1 0 8.94 4.47 4.47 0 0 1 0-8.94Zm0 7.37a2.9 2.9 0 1 0 0-5.8 2.9 2.9 0 0 0 0 5.8Zm5.7-7.55a1.05 1.05 0 1 1-2.1 0 1.05 1.05 0 0 1 2.1 0Z" />
        </svg>
      );
    case "LinkedIn":
      return (
        <svg {...common} aria-hidden>
          <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.83v1.64h.05c.53-1 1.84-2.05 3.78-2.05C21.4 8.59 22 11 22 14.03V21h-4v-6.17c0-1.47-.03-3.36-2.05-3.36-2.05 0-2.37 1.6-2.37 3.25V21h-4V9Z" />
        </svg>
      );
    default:
      return (
        <svg {...common} aria-hidden>
          <path d="M21.6 7.2c-.24-1.03-1.03-1.83-2.03-2.07C17.8 4.7 12 4.7 12 4.7s-5.8 0-7.57.43c-1 .24-1.79 1.04-2.03 2.07C2 9 2 12 2 12s0 3 .4 4.8c.24 1.03 1.03 1.83 2.03 2.07 1.77.43 7.57.43 7.57.43s5.8 0 7.57-.43c1-.24 1.79-1.04 2.03-2.07.4-1.8.4-4.8.4-4.8s0-3-.4-4.8ZM10 15.2V8.8l6 3.2-6 3.2Z" />
        </svg>
      );
  }
}
