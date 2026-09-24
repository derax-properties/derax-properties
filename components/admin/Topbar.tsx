"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SearchIcon, BellIcon, PinIcon } from "./icons";
import { VoiceCommand } from "./VoiceCommand";
import { formatLeadName } from "@/lib/utils";

function initials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

type NotificationLead = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  property_address: string | null;
  city: string | null;
  state: string | null;
  motivation_level: string | null;
};

/**
 * The CRM's global topbar: search, notifications, and the signed-in
 * profile. `notificationLeads` is the real list of leads needing attention
 * (Hot, not yet Closed/Not a Fit), computed server-side and passed in as a
 * prop — this component itself does no data fetching, just renders what
 * the page already loaded.
 *
 * The bell still shows a tooltip on hover (so approaching the mouse keeps
 * giving a quick hint), but clicking it opens a scrollable dropdown
 * listing each lead by name/address — clicking a lead in that list jumps
 * straight to that lead's detail page. Same open/close pattern as the
 * Wallpaper popover in ThemePicker.tsx: a ref'd wrapper + a pointerdown
 * listener that closes it when you click outside.
 */
export function Topbar({
  fullName,
  role,
  notificationLeads,
}: {
  fullName: string | null;
  role: string | null;
  notificationLeads: NotificationLead[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const notificationCount = notificationLeads.length;

  useEffect(() => {
    if (!notifOpen) return;
    function handlePointerDown(e: PointerEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [notifOpen]);

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/admin/leads?search=${encodeURIComponent(trimmed)}` : "/admin/leads");
  }

  return (
    <header className="flex items-center gap-4 border-b border-ink/10 bg-white/70 px-4 py-3 backdrop-blur sm:px-8">
      <form onSubmit={onSearch} className="crm-water-hover flex flex-1 items-center gap-2 rounded-full border border-ink/10 bg-white px-4 py-2">
        <SearchIcon className="h-4 w-4 shrink-0 text-ink/30" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          type="search"
          placeholder="Search leads, addresses, or phone numbers…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-ink/30"
        />
      </form>

      <VoiceCommand />

      <div className="relative shrink-0" ref={notifRef}>
        <button
          type="button"
          onClick={() => setNotifOpen((v) => !v)}
          aria-expanded={notifOpen}
          aria-label="Leads needing attention"
          title="Leads needing attention"
          className="crm-water-hover focus-gold relative rounded-full p-2 text-ink/50 hover:bg-ink/5"
        >
          <BellIcon className="h-5 w-5" />
          {notificationCount > 0 && (
            <span className="crm-accent-bg absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white">
              {notificationCount > 99 ? "99+" : notificationCount}
            </span>
          )}
        </button>

        {notifOpen && (
          <div className="absolute right-0 top-full z-30 mt-2 w-80 rounded-xl border border-ink/10 bg-white p-3 shadow-card">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/40">Needs attention</p>
              {notificationCount > 0 && (
                <span className="text-[11px] font-semibold text-ink/40">{notificationCount}</span>
              )}
            </div>

            {notificationCount === 0 ? (
              <p className="py-4 text-center text-xs text-ink/40">You&apos;re all caught up — no hot leads waiting.</p>
            ) : (
              <div className="max-h-80 space-y-1 overflow-y-auto pr-1">
                {notificationLeads.map((lead) => (
                  <Link
                    key={lead.id}
                    href={`/admin/leads/${lead.id}`}
                    onClick={() => setNotifOpen(false)}
                    className="focus-gold block rounded-lg px-2 py-2 text-sm hover:bg-ink/5"
                  >
                    <p className="truncate font-medium text-ink">{formatLeadName(lead.first_name, lead.last_name)}</p>
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-ink/50">
                      <PinIcon className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">
                        {[lead.property_address, lead.city, lead.state].filter(Boolean).join(", ")}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/*
              Styled as a real button (border + background), not a plain
              text link, and always clickable regardless of how many leads
              are in the list above — it goes to the full Leads page either
              way, per Eric's request that it read and behave like a button
              you can always press.
            */}
            <Link
              href="/admin/leads"
              onClick={() => setNotifOpen(false)}
              className="focus-gold crm-water-hover mt-2 block rounded-lg border border-ink/10 bg-ink/5 px-2 py-2 text-center text-xs font-semibold text-ink hover:bg-ink/10"
            >
              View all leads
            </Link>
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2.5">
        <span className="crm-water-hover crm-accent-bg flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white">{initials(fullName)}</span>
        <div className="hidden leading-tight sm:block">
          <p className="text-sm font-semibold text-ink">{fullName ?? "—"}</p>
          <p className="text-[11px] uppercase tracking-wide text-ink/40">{role === "va" ? "Virtual Assistant" : role ?? ""}</p>
        </div>
      </div>
    </header>
  );
}
