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
 * `anchorId` lets a link elsewhere in the CRM (like the Kanban board's
 * "Underwrite Deal →" button, which jumps to `#underwriting`) land with
 * the panel already open instead of showing the collapsed summary at the
 * spot the user specifically asked to jump to.
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
  const [expanded, setExpanded] = useState(() => {
    if (typeof window === "undefined" || !anchorId) return false;
    return window.location.hash === `#${anchorId}`;
  });

  return (
    <CollapsibleContext.Provider value={{ setExpanded }}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="focus-gold flex w-full items-start justify-between gap-3 rounded-lg text-left"
      >
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
          {subtitle && <p className="mt-1 text-xs text-ink/40">{subtitle}</p>}
        </div>
        <span
          className={`crm-water-hover mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-ink/10 text-ink/50 transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
          aria-hidden
        >
          ▾
        </span>
      </button>

      {expanded ? <div className="mt-3">{children}</div> : <div className="mt-3">{summary}</div>}
    </CollapsibleContext.Provider>
  );
}

/**
 * Drop this inside a <form action={someServerAction}> that lives inside a
 * CollapsiblePanel to have the panel fold itself back to the summary once
 * that form's submission finishes — e.g. the "Save Underwriting" form, so
 * clicking Save both saves and collapses in one action, per how this was
 * asked for. Renders nothing itself; useFormStatus only works inside the
 * <form> it reports on, which is why this has to be a separate component
 * placed there rather than logic inside CollapsiblePanel itself.
 */
export function CollapseOnSave() {
  const ctx = useContext(CollapsibleContext);
  const { pending } = useFormStatus();
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending) {
      ctx?.setExpanded(false);
    }
    wasPending.current = pending;
  }, [pending, ctx]);

  return null;
}
