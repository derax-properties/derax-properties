"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

type CollapsibleContextValue = { setExpanded: (value: boolean) => void };
const CollapsibleContext = createContext<CollapsibleContextValue | null>(null);

/**
 * A section that opens into its full, detailed content on click and folds
 * back down to a compact summary — built for panels like the Lead Detail
 * page's Underwriting Snapshot, which has a lot of fields (ARV, repairs,
 * comps, a full repair-cost breakdown) but is only actually being worked on
 * some of the time. Collapsed, it takes a few lines; expanded, it's the
 * exact same content that used to always be on screen — nothing was
 * removed, it's just hidden until you ask for it.
 *
 * `children` and `summary` can be, and here are, ordinary Server Component
 * JSX (forms bound to server actions, computed values, etc.) — this
 * wrapper never inspects or clones them, it just decides which one to
 * render, so nothing about how the underlying section works has to change.
 *
 * Always starts collapsed on the very first paint, on both the server and
 * the client — reading `window.location.hash` directly in useState's
 * initializer (an earlier version of this file did that) gives the server
 * one answer (no `window`, so always "closed") and the browser a possibly
 * different one, which is a classic source of React getting confused about
 * what's actually on screen. Instead, a plain effect flips it open *after*
 * mount if a link elsewhere (the Kanban board's "Underwrite Deal →"
 * button, which jumps to `#underwriting`) asked for it — and immediately
 * clears that hash from the URL so it can't force the panel open again.
 */
export function CollapsiblePanel({
  title,
  subtitle,
  anchorId,
  summary,
  children,
}: {
  title: string;
  subtitle?: ReactNode;
  anchorId?: string;
  summary: ReactNode;
  children: ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!anchorId || typeof window === "undefined") return;
    if (window.location.hash === `#${anchorId}`) {
      setExpanded(true);
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
    // Only ever needs to run once, right after mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <CollapsibleContext.Provider value={{ setExpanded }}>
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
        className="focus-gold flex w-full items-start justify-between gap-3 rounded-lg text-left"
      >
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
          {subtitle && <p className="mt-1 text-xs text-ink/40">{subtitle}</p>}
        </div>
        <span className="mt-0.5 flex shrink-0 items-center gap-1 rounded-full border border-ink/10 px-2.5 py-1 text-[11px] font-semibold text-ink/50">
          {expanded ? "Hide details" : "Details"}
          <span
            className="inline-block transition-transform duration-150 ease-out"
            style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
            aria-hidden
          >
            ▾
          </span>
        </span>
      </button>

      <div className="mt-3">{expanded ? children : summary}</div>
    </CollapsibleContext.Provider>
  );
}

/**
 * A submit button for a <form> inside a CollapsiblePanel that folds the
 * panel back to its summary once that submission actually finishes.
 *
 * An earlier version of this collapsed the instant the button was clicked,
 * to feel faster — but that's genuinely broken, not just a style choice:
 * clicking a submit button collapsing the panel immediately unmounts the
 * <form> (React swaps to rendering `summary` right away), and if that
 * happens before the browser has dispatched the actual submission, the
 * save never goes through at all — which is exactly the "I enter a value,
 * hit save, and it just disappears" bug this replaces. The form has to
 * stay mounted for the whole save, so this waits for useFormStatus's
 * `pending` to go from true back to false (the save actually completing)
 * before collapsing — and shows "Saving…" in the meantime so the wait
 * (normally well under a second) still reads as immediate feedback rather
 * than the button doing nothing.
 */
export function SaveAndCollapseButton({
  className,
  children,
  savingLabel = "Saving…",
}: {
  className?: string;
  children: ReactNode;
  savingLabel?: string;
}) {
  const ctx = useContext(CollapsibleContext);
  const { pending } = useFormStatus();
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending) {
      ctx?.setExpanded(false);
    }
    wasPending.current = pending;
  }, [pending, ctx]);

  return (
    <button type="submit" disabled={pending} className={className} aria-busy={pending}>
      {pending ? savingLabel : children}
    </button>
  );
}
