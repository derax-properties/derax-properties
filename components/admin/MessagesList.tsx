"use client";

import { useMemo, useState } from "react";
import type { ContactMessage } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { MessageStatusSelect } from "@/components/admin/MessageStatusSelect";

export function MessagesList({
  messages,
  action,
}: {
  messages: ContactMessage[];
  action: (id: string, status: string) => Promise<void>;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return messages;
    const q = search.toLowerCase();
    return messages.filter((m) => `${m.name} ${m.email} ${m.message} ${m.interest}`.toLowerCase().includes(q));
  }, [messages, search]);

  return (
    <div>
      <input
        type="search"
        placeholder="Search name, email, message"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="focus-gold mb-4 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm"
      />

      <div className="flex flex-col gap-4">
        {filtered.map((m) => (
          <div key={m.id} className="rounded-xl bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-ink">{m.name}</p>
                <p className="text-sm text-ink/50">
                  <a href={`mailto:${m.email}`} className="text-gold-dark hover:underline">
                    {m.email}
                  </a>
                  {m.phone && <span> · {m.phone}</span>}
                </p>
                <p className="mt-1 text-xs uppercase tracking-wide text-gold-dark">{m.interest}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-ink/40">{formatDate(m.created_at)}</span>
                <MessageStatusSelect id={m.id} status={m.status} action={action} />
              </div>
            </div>
            <p className="mt-3 text-sm text-ink/70">{m.message}</p>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="rounded-xl bg-white p-8 text-center text-ink/40 shadow-sm">
            {messages.length === 0 ? "No contact messages yet." : "No messages match that search."}
          </div>
        )}
      </div>
    </div>
  );
}
