"use client";

import { useState } from "react";
import type { SellerSubmission } from "@/lib/types";
import { LeadsTable } from "./LeadsTable";
import { LeadsKanban } from "./LeadsKanban";

export function LeadsView({ leads, initialSearch = "" }: { leads: SellerSubmission[]; initialSearch?: string }) {
  const [view, setView] = useState<"table" | "board">(initialSearch ? "table" : "board");

  return (
    <div>
      <div className="mb-4 inline-flex rounded-full border border-ink/15 bg-white p-1 text-sm">
        <button
          onClick={() => setView("board")}
          className={`rounded-full px-4 py-1.5 font-semibold ${view === "board" ? "bg-gold text-ink" : "text-ink/50"}`}
        >
          Board
        </button>
        <button
          onClick={() => setView("table")}
          className={`rounded-full px-4 py-1.5 font-semibold ${view === "table" ? "bg-gold text-ink" : "text-ink/50"}`}
        >
          Table
        </button>
      </div>
      {view === "board" ? <LeadsKanban leads={leads} /> : <LeadsTable leads={leads} initialSearch={initialSearch} />}
    </div>
  );
}
