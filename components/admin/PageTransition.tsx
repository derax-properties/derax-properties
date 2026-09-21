"use client";

import { usePathname } from "next/navigation";

/**
 * A lightweight, dependency-free page-slide effect: each time the route
 * changes, this remounts its subtree (via the `key`) which re-triggers the
 * CSS animation defined in globals.css (.crm-page-slide). No animation
 * library is added — this only needs React + CSS, so it works without an
 * `npm install` on top of what's already installed.
 *
 * This animates the incoming page only (there's no outgoing-page exit
 * animation, since the old page is already gone by the time Next.js swaps
 * in the new one) — a "slide + fade in" on arrival, similar to how an
 * iOS screen settles into place after a push transition.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="crm-page-slide">
      {children}
    </div>
  );
}
