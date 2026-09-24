"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SellerSubmission, PipelineStage, DeadReason } from "@/lib/types";
import { DEAD_REASONS } from "@/lib/types";
import { getFollowUpStatus, daysOverdue } from "@/lib/followUp";
import { formatDateOnly, formatLeadName } from "@/lib/utils";
import { ZipPopulationBadge } from "./ZipPopulationBadge";
import { PersonIcon, PinIcon, PhoneIcon, DotsIcon } from "./icons";

function FollowUpBadge({ lead }: { lead: SellerSubmission }) {
  const status = getFollowUpStatus(lead);
  if (status === "No Follow-Up" || status === "Completed") return null;
  const tint = status === "Overdue" ? "text-red-500" : status === "Due Today" ? "text-amber-600" : "text-ink/40";
  return (
    <p className={`mt-1.5 text-[11px] font-semibold ${tint}`}>
      {status === "Overdue" && lead.next_follow_up_date
        ? `Overdue ${daysOverdue(lead.next_follow_up_date)}d`
        : `Follow up: ${lead.next_follow_up_date ? formatDateOnly(lead.next_follow_up_date) : ""}`}
    </p>
  );
}

const STAGES: PipelineStage[] = [
  "Pre-Qualified",
  "Contacted",
  "Qualified",
  "Offer Made",
  "Negotiating",
  "Under Contract",
  "Disposition",
  "Closed",
  "Dead / Lost",
];

// What "Advance" moves a lead to from each stage. Stages with no entry here
// (Closed, Dead / Lost) are end states — no automatic next step. Dead / Lost
// is reachable from ANY stage via the separate "Mark Dead / Lost" action
// below, not through this forward chain.
//
// This is now a full, un-skipped chain — Pre-Qualified moves to Contacted,
// Contacted to Qualified, and so on — one click per real step, per the
// owner's request. (An earlier version skipped Contacted and jumped
// Pre-Qualified straight to Qualified; that's no longer what's wanted.)
const NEXT_STAGE: Partial<Record<PipelineStage, PipelineStage>> = {
  "Pre-Qualified": "Contacted",
  Contacted: "Qualified",
  Qualified: "Offer Made",
  "Offer Made": "Negotiating",
  Negotiating: "Under Contract",
  "Under Contract": "Disposition",
  Disposition: "Closed",
};

// Each column's own color — used as a solid bar (white text on top) behind
// the column title, not just a small dot, so every stage is identifiable
// at a glance. The card body underneath stays plain white, unchanged.
const STAGE_ACCENT: Record<PipelineStage, string> = {
  "Pre-Qualified": "bg-sky-500",
  Contacted: "bg-violet-500",
  Qualified: "bg-emerald-500",
  "Offer Made": "bg-amber-500",
  Negotiating: "bg-orange-500",
  "Under Contract": "bg-indigo-500",
  Disposition: "bg-teal-500",
  Closed: "bg-ink/40",
  "Dead / Lost": "bg-red-400",
};

// A column with this many leads or more switches its cards into compact
// mode — name and the always-available action buttons only, everything
// else (address, price, pills, follow-up) hidden — so a busy column reads
// like a scannable list instead of getting taller and taller. Columns
// below this stay exactly as detailed as before, so a quiet column never
// bothers with any of this.
//
// A compact card isn't a dead end, though: hovering it (see hoveredId
// above) pops that one card back up to full size — its actual address and
// everything else — right where the mouse is, then shrinks it back down
// the instant the mouse leaves. So a busy column still reads as a short,
// scannable list, but nothing on it is ever more than a hover away.
const COMPACT_THRESHOLD = 6;

function motivationDot(level: SellerSubmission["motivation_level"]) {
  if (level === "Hot") return "bg-red-500";
  if (level === "Warm") return "bg-amber-500";
  if (level === "Cold") return "bg-sky-500";
  return "bg-ink/15";
}

function MotivationPill({ level }: { level: SellerSubmission["motivation_level"] }) {
  if (!level || level === "Unknown") return null;
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

function TypePill({ type }: { type: SellerSubmission["lead_type"] }) {
  if (!type) return null;
  return (
    <span className="rounded-full bg-forest/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-forest">
      {type}
    </span>
  );
}

/**
 * A Kanban view of the same leads the table shows, grouped by
 * `pipeline_stage`. Leads with no pipeline_stage set yet land in
 * "Pre-Qualified" so nothing silently disappears from the board.
 *
 * Each card gets an "Advance →" button that moves it to the next stage —
 * the same one-click-forward interaction demoed in the pipeline preview
 * mockup, now wired to the real advanceLeadStage server action instead of
 * sample data. Moving a card plays the same slide-out/slide-in transition
 * as that preview (see the crm-kanban-card-* classes in globals.css) so it
 * reads as the lead actually moving, not the board just re-rendering.
 *
 * Dead / Lost is deliberately NOT part of the forward chain above — a lead
 * can die from any stage, so it gets its own "Mark Dead / Lost" action that
 * requires picking a reason first (never a bare stage change), and a
 * Dead / Lost card gets a "Reopen" button instead of an Advance button.
 *
 * Cards are also draggable between columns (native HTML5 drag-and-drop) as
 * a faster alternative to the Advance/Reopen/Mark Dead buttons — those
 * buttons stay exactly as they were so nothing already working is removed,
 * and dragging routes through the same server actions and the same
 * Dead/Lost-requires-a-reason rule: dropping a card on the Dead / Lost
 * column opens the reason prompt instead of moving it immediately, and
 * dragging a Dead / Lost card back out clears its dead reason via
 * onReopen instead of a bare stage change.
 */
export function LeadsKanban({
  leads,
  onAdvance,
  onMarkDead,
  onReopen,
}: {
  leads: SellerSubmission[];
  onAdvance: (id: string, toStage: PipelineStage) => Promise<void>;
  onMarkDead: (id: string, reason: DeadReason | string, note: string | null) => Promise<void>;
  onReopen: (id: string, toStage?: PipelineStage) => Promise<void>;
}) {
  const router = useRouter();
  const [localLeads, setLocalLeads] = useState(leads);
  const [movingOutId, setMovingOutId] = useState<string | null>(null);
  const [justMovedId, setJustMovedId] = useState<string | null>(null);
  const [deadPromptId, setDeadPromptId] = useState<string | null>(null);
  const [deadReason, setDeadReason] = useState<string>(DEAD_REASONS[0]);
  const [deadNote, setDeadNote] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<PipelineStage | null>(null);
  // Which compact card (if any) the mouse is currently resting on, so that
  // one card alone can pop back up to full size — address, price, pills,
  // follow-up — while every other card in a busy column stays shrunk. Only
  // ever meaningful for a compact card (see COMPACT_THRESHOLD below); a
  // normal-size card ignores this entirely since it already shows
  // everything all the time.
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Keep local state in sync whenever the server sends fresh data (e.g.
  // after router.refresh(), or a plain page reload) — otherwise this
  // component's own optimistic copy would go stale.
  useEffect(() => {
    setLocalLeads(leads);
  }, [leads]);

  function moveOptimistically(id: string, toStage: PipelineStage, previousStage: SellerSubmission["pipeline_stage"]) {
    setMovingOutId(id);
    setTimeout(() => {
      setLocalLeads((prev) => prev.map((l) => (l.id === id ? { ...l, pipeline_stage: toStage } : l)));
      setMovingOutId(null);
      setJustMovedId(id);
      setTimeout(() => setJustMovedId(null), 400);
    }, 220);

    return () =>
      setLocalLeads((prev) => prev.map((l) => (l.id === id ? { ...l, pipeline_stage: previousStage } : l)));
  }

  function handleAdvance(lead: SellerSubmission, toStage: PipelineStage) {
    const rollback = moveOptimistically(lead.id, toStage, lead.pipeline_stage);
    onAdvance(lead.id, toStage)
      .then(() => router.refresh())
      .catch(rollback);
  }

  function handleConfirmDead(lead: SellerSubmission) {
    const rollback = moveOptimistically(lead.id, "Dead / Lost", lead.pipeline_stage);
    onMarkDead(lead.id, deadReason, deadNote.trim() || null)
      .then(() => router.refresh())
      .catch(rollback);
    setDeadPromptId(null);
    setDeadNote("");
  }

  function handleReopen(lead: SellerSubmission, toStage: PipelineStage = "Contacted") {
    const rollback = moveOptimistically(lead.id, toStage, lead.pipeline_stage);
    onReopen(lead.id, toStage)
      .then(() => router.refresh())
      .catch(rollback);
  }

  // The single entry point for a card being dropped on a column. Routes to
  // whichever server action actually applies rather than always calling
  // advanceLeadStage, so a drag can never silently skip the Dead/Lost
  // reason requirement or leave a stale dead_reason behind on reopen.
  function handleDrop(leadId: string, toStage: PipelineStage) {
    const lead = localLeads.find((l) => l.id === leadId);
    if (!lead) return;
    const fromStage = lead.pipeline_stage ?? "Pre-Qualified";
    if (toStage === fromStage) return;

    if (toStage === "Dead / Lost") {
      setDeadReason(DEAD_REASONS[0]);
      setDeadNote("");
      setDeadPromptId(lead.id);
      return;
    }

    if (fromStage === "Dead / Lost") {
      handleReopen(lead, toStage);
    } else {
      handleAdvance(lead, toStage);
    }
  }

  const columns = STAGES.map((stage) => ({
    stage,
    items: localLeads.filter((l) => (l.pipeline_stage ?? "Pre-Qualified") === stage),
  }));

  return (
    <div>
      <p className="mb-2 px-1 text-[11px] text-ink/35">
        Drag a card to any column to move it, or use the buttons on the card.
      </p>
      {/*
        Found the actual "Pre-Qualified column hidden behind Qualified"
        bug: sm:grid-cols-2 sets an EXPLICIT 2-column grid-template-columns
        that lg:grid-flow-col / lg:auto-cols-[260px] never clear (those two
        utilities only set grid-auto-flow and grid-auto-columns — neither
        touches grid-template-columns). Since lg (1024px+) still matches
        the sm breakpoint, that leftover 2-column template stayed active
        at desktop width too, so with 9 cards forced into auto-flow:column
        against only 2 real explicit tracks, the browser was squeezing
        the first couple of columns down to a sliver — crushing their
        card text into single-word-per-line ("SELF-", "ENTERED", "MARK",
        "DEAD", "/", "LOST") and pushing that sliver to peek out from
        behind the next column's white card. lg:grid-cols-none clears
        that leftover template so grid-auto-columns:260px is the only
        thing sizing every column, consistently, at desktop width.
      */}
      <div className="grid grid-cols-1 items-start gap-3 overflow-x-auto pb-2 sm:grid-cols-2 lg:grid-cols-none lg:grid-flow-col lg:auto-cols-[260px]">
      {columns.map((col) => {
        const isCompact = col.items.length >= COMPACT_THRESHOLD;
        return (
        <div
          key={col.stage}
          onDragOver={(e) => {
            e.preventDefault();
            if (dragOverStage !== col.stage) setDragOverStage(col.stage);
          }}
          onDragLeave={() => setDragOverStage((s) => (s === col.stage ? null : s))}
          onDrop={(e) => {
            e.preventDefault();
            setDragOverStage(null);
            if (draggingId) handleDrop(draggingId, col.stage);
            setDraggingId(null);
          }}
          className={`crm-water-float min-w-[220px] overflow-hidden rounded-xl bg-white p-2 shadow-sm transition ${
            dragOverStage === col.stage ? "ring-2 ring-gold ring-offset-2" : ""
          }`}
        >
          {/* A solid colored bar behind the title (not just colored text) —
              every stage is identifiable at a glance, card body underneath
              stays plain white. */}
          <div className={`mb-2 flex items-center gap-2 rounded-lg px-2.5 py-1.5 ${STAGE_ACCENT[col.stage]}`}>
            <span className="text-xs font-bold uppercase tracking-wide text-white">{col.stage}</span>
            <span className="ml-auto rounded-full bg-black/15 px-2 py-0.5 text-[11px] font-semibold text-white">
              {col.items.length}
            </span>
          </div>
          {/*
            Independent scroll per column, capped height: combined with
            items-start on the grid above (which stops CSS Grid from
            stretching every column to match the tallest one), a column
            with a lot of leads no longer pushes the whole board taller —
            it scrolls within itself instead, so a short column next to it
            stays short.
          */}
          <div className="flex max-h-[65vh] flex-col gap-2 overflow-y-auto px-1 pb-1">
            {col.items.map((lead) => {
              const nextStage = NEXT_STAGE[col.stage];
              const isDeadColumn = col.stage === "Dead / Lost";
              // Only a compact card ever zooms — a card that's already
              // full-size has nothing more to reveal on hover.
              const isZoomed = isCompact && hoveredId === lead.id;

              // The card's actual content, factored out so it can be
              // rendered twice: once at its normal compact size (which is
              // what reserves the card's real space in the column — this
              // never changes, hover or not), and once, only while zoomed,
              // inside a floating overlay positioned on top of the board.
              //
              // Previously the "zoom" grew the real card in place (more
              // content rendered into normal document flow, then scaled up
              // on top of that) — so hovering one card in a busy column
              // pushed every card below it down, and the column's own
              // scrollbar would appear/disappear as that happened. That's
              // the "dashboard shakes and resizes" Eric reported. Rendering
              // the detailed view in a position:absolute overlay instead
              // means it floats above the cards underneath without ever
              // moving them — the board layout is untouched by hovering.
              const cardBody = (detailed: boolean) => (
                <>
                  <Link href={`/admin/leads/${lead.id}`} className="focus-gold group block hover:opacity-90">
                    {detailed && (
                      <span className="pointer-events-none absolute right-2 top-2 text-ink/20">
                        <DotsIcon className="h-4 w-4" />
                      </span>
                    )}
                    <div className="flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${motivationDot(lead.motivation_level)}`} />
                      <PersonIcon className="h-3.5 w-3.5 shrink-0 text-ink/30" />
                      <span className="truncate font-medium text-ink">
                        {formatLeadName(lead.first_name, lead.last_name)}
                      </span>
                    </div>
                    {/*
                      Compact mode (a busy column, see COMPACT_THRESHOLD)
                      hides everything below the name — address, price,
                      pills, follow-up — so the column reads as a scannable
                      list instead of getting taller with every lead added.
                      Hovering a compact card (isZoomed) brings all of this
                      back for that one card, in the floating overlay below,
                      same as a normal-size card. The move/reopen/dead-lost
                      buttons are NEVER hidden, compact or not — those stay
                      one click away no matter how many leads are in the
                      column.
                    */}
                    {detailed && (
                      <>
                        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-ink/50">
                          <PinIcon className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">
                            {lead.property_address}, {lead.city}, {lead.state}
                          </span>
                          {lead.zip && <ZipPopulationBadge zip={lead.zip} />}
                        </div>
                        {lead.asking_price && (
                          <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-ink">
                            <PhoneIcon className="h-3.5 w-3.5 shrink-0 text-ink/30" />
                            {lead.asking_price}
                          </div>
                        )}
                        {(lead.lead_source || lead.lead_type || lead.motivation_level) && (
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <SourcePill source={lead.lead_source} />
                            <TypePill type={lead.lead_type} />
                            <MotivationPill level={lead.motivation_level} />
                          </div>
                        )}
                        {isDeadColumn && lead.dead_reason && (
                          <p className="mt-1.5 text-[11px] text-red-500/80">Reason: {lead.dead_reason}</p>
                        )}
                        {!isDeadColumn && <FollowUpBadge lead={lead} />}
                      </>
                    )}
                  </Link>
                  {col.stage === "Qualified" && (
                    <Link
                      href={`/admin/leads/${lead.id}#underwriting`}
                      className={`crm-water-hover focus-gold block w-full rounded-full border border-gold bg-gold/10 text-center text-[11px] font-bold text-gold-dark hover:bg-gold/20 ${
                        isCompact ? "mt-1.5 py-1" : "mt-2.5 py-1.5"
                      }`}
                    >
                      Underwrite Deal →
                    </Link>
                  )}
                  {nextStage && (
                    <button
                      type="button"
                      onClick={() => handleAdvance(lead, nextStage)}
                      className={`crm-water-hover focus-gold w-full rounded-full bg-forest text-[11px] font-bold text-white hover:bg-forest/90 ${
                        isCompact ? "mt-1.5 py-1" : "mt-2 py-1.5"
                      }`}
                    >
                      {nextStage === "Closed" ? "Close Deal →" : `Mark ${nextStage} →`}
                    </button>
                  )}
                  {isDeadColumn ? (
                    <button
                      type="button"
                      onClick={() => handleReopen(lead)}
                      className={`crm-water-hover focus-gold w-full rounded-full border border-ink/15 text-[11px] font-bold text-ink/60 hover:bg-ink/5 ${
                        isCompact ? "mt-1.5 py-1" : "mt-2 py-1.5"
                      }`}
                    >
                      ↺ Reopen Lead
                    </button>
                  ) : deadPromptId === lead.id ? (
                    <div className="mt-2 flex flex-col gap-1.5 rounded-lg border border-red-200 bg-red-50 p-2">
                      <select
                        value={deadReason}
                        onChange={(e) => setDeadReason(e.target.value)}
                        className="focus-gold rounded border border-red-200 bg-white px-2 py-1 text-[11px]"
                      >
                        {DEAD_REASONS.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                      <input
                        value={deadNote}
                        onChange={(e) => setDeadNote(e.target.value)}
                        placeholder="Optional note"
                        className="focus-gold rounded border border-red-200 bg-white px-2 py-1 text-[11px]"
                      />
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleConfirmDead(lead)}
                          className="focus-gold flex-1 rounded-full bg-red-500 px-2 py-1 text-[11px] font-bold text-white hover:bg-red-600"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeadPromptId(null)}
                          className="focus-gold rounded-full border border-red-200 px-2 py-1 text-[11px] font-semibold text-red-500"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setDeadReason(DEAD_REASONS[0]);
                        setDeadNote("");
                        setDeadPromptId(lead.id);
                      }}
                      className="focus-gold mt-1.5 w-full text-center text-[10px] font-semibold uppercase tracking-wide text-red-400/70 hover:text-red-500"
                    >
                      Mark Dead / Lost
                    </button>
                  )}
                </>
              );

              return (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={(e) => {
                    setDraggingId(lead.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragEnd={() => {
                    setDraggingId(null);
                    setDragOverStage(null);
                  }}
                  onMouseEnter={() => {
                    if (isCompact) setHoveredId(lead.id);
                  }}
                  onMouseLeave={() => setHoveredId((current) => (current === lead.id ? null : current))}
                  // isolate + an explicit z-index turns this card into its
                  // own self-contained stacking context, so its overlay's
                  // z-20 is only ever compared against ITS OWN content —
                  // never left to an implicit/ambiguous comparison against a
                  // sibling card's stacking level. Zoomed also lifts the
                  // whole card (isolate context and all) above every sibling,
                  // so the overlay can never be caught underneath the next
                  // card in the column, in any browser.
                  //
                  // Deliberately NOT using .crm-water-hover here (every
                  // other card/button in the CRM does) — that class's own
                  // hover effect (globals.css) applies transform: translateY
                  // + rotate + scale straight to THIS wrapper on the
                  // browser's real, native :hover, completely independent of
                  // the isZoomed state above. A transform on this element
                  // shifts the positioning frame everything absolutely
                  // positioned inside it (the overlay) is measured from, so
                  // every real mouse-hover was quietly tilting and sliding
                  // the overlay out of alignment with the card underneath —
                  // the actual cause of the overlap Eric kept seeing even
                  // after the stacking-context fix above. This card has its
                  // own dedicated hover interaction (the zoom) already, so
                  // it drops the generic wobble entirely rather than fight it.
                  className={`relative isolate cursor-grab rounded-lg border border-ink/10 text-sm shadow-sm transition-shadow duration-150 hover:shadow-md active:cursor-grabbing ${
                    isZoomed ? "z-30" : "z-0"
                  } ${isCompact ? "p-2" : "p-3"} ${movingOutId === lead.id ? "crm-kanban-card-out" : ""} ${
                    justMovedId === lead.id ? "crm-kanban-card-in" : ""
                  } ${draggingId === lead.id ? "opacity-40" : ""}`}
                >
                  {/*
                    This always-rendered copy is what actually reserves the
                    card's space in the column, at its normal compact size —
                    that size never changes on hover, so nothing below it
                    ever gets pushed around. While zoomed, it's hidden
                    (invisible, not removed — so the layout doesn't shift by
                    even a pixel) in favor of the floating overlay just below.
                  */}
                  <div className={isZoomed ? "invisible" : ""}>{cardBody(!isCompact)}</div>

                  {isZoomed && (
                    <div
                      // Positioned on top of the board instead of inside its
                      // flow — see the comment on cardBody above. It's free
                      // to grow as tall as the full detail needs without
                      // moving a single other card.
                      className="crm-kanban-zoom-overlay absolute inset-x-0 top-0 z-20 rounded-lg border border-ink/10 bg-white p-3 shadow-xl"
                    >
                      {cardBody(true)}
                    </div>
                  )}
                </div>
              );
            })}
            {col.items.length === 0 && <p className="px-1 py-3 text-xs text-ink/30">No leads here.</p>}
          </div>
        </div>
        );
      })}
      </div>
    </div>
  );
}
