"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { SearchIcon, BellIcon } from "./icons";

function initials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * The CRM's global topbar: search, notifications, and the signed-in
 * profile. `hotCount` is a real number computed server-side (leads marked
 * "Hot" plus overdue follow-ups) and passed in as a prop — this component
 * itself does no data fetching, just renders what the page already loaded.
 */
export function Topbar({ fullName, role, notificationCount }: { fullName: string | null; role: string | null; notificationCount: number }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

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

      <Link href="/admin/leads" className="crm-water-hover focus-gold relative shrink-0 rounded-full p-2 text-ink/50 hover:bg-ink/5" title="Leads needing attention">
        <BellIcon className="h-5 w-5" />
        {notificationCount > 0 && (
          <span className="crm-accent-bg absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white">
            {notificationCount > 99 ? "99+" : notificationCount}
          </span>
        )}
      </Link>

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
