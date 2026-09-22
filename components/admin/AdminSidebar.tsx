"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PersonIcon, LogoutIcon } from "./icons";

export type SidebarLink = { href: string; label: string; icon: ReactNode };

/**
 * The CRM's left rail: a narrow icon-only strip by default (so the board
 * gets the screen space back while the admin is actually working), which
 * expands to show labels the moment a mouse approaches it, or on a first
 * tap when there's no such thing as "approaching" — touch.
 *
 * Rendered as a fixed-width placeholder (COLLAPSED_WIDTH) holding an
 * absolutely-positioned panel on top of it, so expanding never reflows the
 * page underneath — the rail just grows over the content like a flyout,
 * the same way a dock or a VS Code-style activity bar does, and collapses
 * back the moment the pointer leaves (desktop) or the admin taps elsewhere
 * (touch, via the outside-pointerdown listener below).
 *
 * Every label keeps the "own floating glass chip" treatment from the
 * earlier sidebar redesign (see .crm-float-chip in globals.css) — this
 * only changes how much of the rail is visible at once, not that effect.
 */
export function AdminSidebar({
  links,
  userEmail,
  roleLabel,
  signOutAction,
}: {
  links: SidebarLink[];
  userEmail: string | null;
  roleLabel: string | null;
  signOutAction: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(false);
  const railRef = useRef<HTMLDivElement>(null);

  // Touch (and anything else without real hover): tap anywhere outside the
  // open rail collapses it again, mirroring how a mobile drawer dismisses.
  useEffect(() => {
    if (!expanded) return;
    function handlePointerDown(e: PointerEvent) {
      if (railRef.current && !railRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [expanded]);

  // On desktop, onMouseEnter below has already expanded the rail well
  // before a click can land, so this never fires there. On touch, there's
  // no hover to expand it first, so the first tap on a collapsed link just
  // reveals the rail instead of navigating — the same "tap to reveal, tap
  // again to go" pattern iOS uses for collapsed nav rails.
  function revealBeforeNavigating(e: React.MouseEvent) {
    if (!expanded) {
      e.preventDefault();
      setExpanded(true);
    }
  }

  return (
    <div style={{ width: 68 }} className="relative shrink-0">
      <div
        ref={railRef}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        className={`crm-sidebar absolute inset-y-0 left-0 z-30 flex flex-col justify-between gap-6 overflow-hidden py-6 text-cream transition-[width] duration-300 ease-out ${
          expanded ? "w-56 px-4" : "w-[68px] px-2"
        }`}
      >
        <div>
          <Link
            href="/admin"
            onClick={revealBeforeNavigating}
            className="crm-float-chip crm-brand-chip flex items-center gap-2 rounded-xl px-2.5 py-3"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/derax-mark.png" alt="" className="crm-logo-mark h-9 w-9 shrink-0" />
            {expanded && (
              <span className="flex flex-col whitespace-nowrap leading-none">
                <span className="crm-logo-text-3d crm-logo-text-3d--cream font-display text-lg font-extrabold">DERAX</span>
                <span className="crm-logo-text-3d crm-logo-text-3d--gold text-[9px] font-bold tracking-[0.35em]">CRM</span>
              </span>
            )}
          </Link>

          <nav className="mt-4 flex flex-col gap-2">
            {links.map((link) => {
              const isActive = link.href === "/admin" ? pathname === "/admin" : pathname?.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={revealBeforeNavigating}
                  title={link.label}
                  className={`crm-float-chip focus-gold flex items-center gap-3 whitespace-nowrap rounded-lg px-2.5 py-2.5 text-sm font-bold ${
                    isActive ? "crm-accent-bg text-white" : "text-cream hover:text-gold"
                  }`}
                >
                  <span className="shrink-0">{link.icon}</span>
                  {expanded && <span>{link.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-col gap-2">
          <div className="crm-float-chip flex items-center gap-2 rounded-xl px-2.5 py-2.5">
            <PersonIcon className="h-4 w-4 shrink-0 text-cream/80" />
            {expanded && (
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-cream">{userEmail}</p>
                {roleLabel && (
                  <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-gold">{roleLabel}</p>
                )}
              </div>
            )}
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              title="Sign Out"
              className="crm-float-chip focus-gold flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm font-bold text-gold hover:text-gold-light"
            >
              <LogoutIcon className="h-4 w-4 shrink-0" />
              {expanded && <span className="whitespace-nowrap">Sign Out</span>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
