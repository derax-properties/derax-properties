"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SellerSubmission, PipelineStage } from "@/lib/types";
import { PersonIcon, PinIcon, PhoneIcon, DotsIcon } from "./icons";

const STAGES: PipelineStage[] = [
  "New Lead",
  "Contacted",
  "Qualified",
  "Offer Made",
  "Under Contract",
  "Closed",
  "Dead",
];

// What "Advance" moves a lead to from each stage. Stages with no entry here
// (Closed, Dead) are end states — no automatic next step, matching the
// pipeline preview's rule that only forward-progress stages get a button.
const NEXT_STAGE: Partial<Record<PipelineStage, PipelineStage>> = {
  "New Lead": "Contacted",
  Contacted: "Qualified",
  Qualified: "Offer Made",
  "Offer Made": "Under Contract",
  "Under Contract": "Closed",
};

const STAGE_ACCENT: Record<PipelineStage, string> = {
  "New Lead": "bg-sky-500",
  Contacted: "bg-violet-500",
  Qualified: "bg-emerald-500",
  "Offer Made": "bg-amber-500",
  "Under Contract": "bg-indigo-500",
  Closed: "bg-ink/40",
  Dead: "bg-red-400",
};

function motivationDot(level: SellerSubmission["motivation_level"]) {
  if (level === "Hot") return "bg-red-500";
  if (level === "Warm") return "bg-amber-500";
  if (level === "Cold") return "bg-sky-500";
  return "bg-ink/15";
}

function MotivationPill({ level }: { level: SellerSubmission["motivation_level"] }) {
  if (!level) return null;
  const tint = level === "Hot" ? "bg-red-100 text-red-700" : level === "Warm" ? "bg-amber-100 text-amber-700" : "bg-sky-100 text-sky-700";
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${tint}`}>{level}</span>;
}

function SourcePill({ source }: { source: SellerSubmission["lead_source"] }) {
  if (!source) return null;
  return (
    <span className="rounded-full border border-ink/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink/50">
      {source}
    </span>
  );
}

/**
 * A Kanban view of the same leads the table shows, grouped by
 * `pipeline_stage`. Leads with no pipeline_stage set yet land in "New Lead"
 * so nothing silently disappears from the board.
 *
 * Each card gets an "Advance →" button that moves it to the next stage —
 * the same one-click-forward interaction demoed in the pipeline preview
 * mockup, now wired to the real advanceLeadStage server action instead of
 * sample data. Moving a card plays the same slide-out/slide-in transition
 * as that preview (see the crm-kanban-card-* classes in globals.css) so it
 * reads as the lead actually moving, not the board just re-rendering.
 */
export function LeadsKanban({
  leads,
  onAdvance,
}: {
  leads: SellerSubmission[];
  onAdvance: (id: string, toStage: PipelineStage) => Promise<void>;
}) {
  const router = useRouter();
  const [localLeads, setLocalLeads] = useState(leads);
  const [movingOutId, setMovingOutId] = useState<string | null>(null);
  const [justMovedId, setJustMovedId] = useState<string | null>(null);

  // Keep local state in sync whenever the server sends fresh data (e.g.
  // after router.refresh(), or a plain page reload) — otherwise this
  // component's own optimistic copy would go stale.
  useEffect(() => {
    setLocalLeads(leads);
  }, [leads]);

  function handleAdvance(lead: SellerSubmission, toStage: PipelineStage) {
    setMovingOutId(lead.id);
    // Matches the 220ms slide-out used in the pipeline preview before the
    // card actually changes column.
    setTimeout(() => {
      setLocalLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, pipeline_stage: toStage } : l)));
      setMovingOutId(null);
      setJustMovedId(lead.id);
      setTimeout(() => setJustMovedId(null), 400);
    }, 220);

    onAdvance(lead.id, toStage)
      .then(() => router.refresh())
      .catch(() => {
        // Roll back the optimistic move if the write actually failed —
        // never leave the board showing a stage the database doesn't have.
        setLocalLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, pipeline_stage: lead.pipeline_stage } : l)));
      });
  }

  const columns = STAGES.map((stage) => ({
    stage,
    items: localLeads.filter((l) => (l.pipeline_stage ?? "New Lead") === stage),
  }));

  return (
    <div className="grid grid-cols-1 gap-3 overflow-x-auto pb-2 sm:grid-cols-2 lg:grid-flow-col lg:auto-cols-[260px]">
      {columns.map((col) => (
        <div key={col.stage} className="rounded-xl bg-white p-3 shadow-sm">
          <div className="mb-2 flex items-center gap-2 px-1">
            <span className={`h-2 w-2 rounded-full ${STAGE_ACCENT[col.stage]}`} />
            <span className="text-xs font-bold uppercase tracking-wide text-ink/60">{col.stage}</span>
            <span className="ml-auto rounded-full bg-ink/5 px-2 py-0.5 text-[11px] font-semibold text-ink/50">
              {col.items.length}
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {col.items.map((lead) => {
              const nextStage = NEXT_STAGE[col.stage];
              return (
                <div
                  key={lead.id}
                  className={`relative rounded-lg border border-ink/10 p-3 text-sm shadow-sm ${
                    movingOutId === lead.id ? "crm-kanban-card-out" : ""
                  } ${justMovedId === lead.id ? "crm-kanban-card-in" : ""}`}
                >
                  <Link
                    href={`/admin/leads/${lead.id}`}
                    className="focus-gold group block hover:opacity-90"
                  >
                    <span className="pointer-events-none absolute right-2 top-2 text-ink/20">
                      <DotsIcon className="h-4 w-4" />
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${motivationDot(lead.motivation_level)}`} />
                      <PersonIcon className="h-3.5 w-3.5 shrink-0 text-ink/30" />
                      <span className="truncate font-medium text-ink">
                        {lead.first_name} {lead.last_name}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-ink/50">
                      <PinIcon className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">
                        {lead.property_address}, {lead.city}, {lead.state}
                      </span>
                    </div>
                    {lead.asking_price && (
                      <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-ink">
                        <PhoneIcon className="h-3.5 w-3.5 shrink-0 text-ink/30" />
                        {lead.asking_price}
                      </div>
                    )}
                    {(lead.lead_source || lead.motivation_level) && (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <SourcePill source={lead.lead_source} />
                        <MotivationPill level={lead.motivation_level} />
                      </div>
                    )}
                  </Link>
                  {col.stage === "Qualified" && (
                    <Link
                      href={`/admin/leads/${lead.id}#underwriting`}
                      className="focus-gold mt-2.5 block w-full rounded-full border border-gold bg-gold/10 px-3 py-1.5 text-center text-[11px] font-bold text-gold-dark hover:bg-gold/20"
                    >
                      Go to Underwriting →
                    </Link>
                  )}
                  {nextStage && (
                    <button
                      type="button"
                      onClick={() => handleAdvance(lead, nextStage)}
                      className="focus-gold mt-2 w-full rounded-full bg-forest px-3 py-1.5 text-[11px] font-bold text-white hover:bg-forest/90"
                    >
                      {nextStage === "Closed" ? "Close Deal →" : `Mark ${nextStage} →`}
                    </button>
                  )}
                </div>
              );
            })}
            {col.items.length === 0 && <p className="px-1 py-3 text-xs text-ink/30">No leads here.</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
