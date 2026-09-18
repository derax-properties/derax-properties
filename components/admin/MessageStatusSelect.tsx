"use client";

import { useTransition } from "react";

const STATUSES = ["New", "Responded", "Closed"];

export function MessageStatusSelect({
  id,
  status,
  action,
}: {
  id: string;
  status: string;
  action: (id: string, status: string) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <select
      defaultValue={status}
      disabled={isPending}
      onChange={(e) => startTransition(() => action(id, e.target.value))}
      className="focus-gold rounded-lg border border-ink/15 px-2 py-1 text-sm"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
