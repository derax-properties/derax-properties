"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

/**
 * Reusable destructive-action button (lead / cash buyer / title company
 * deletion). Deliberately NOT a plain <form action={serverAction}> —
 * deleting is irreversible, so this always confirms with the user first via
 * window.confirm, and only calls the server action if they accept.
 *
 * `action` is a server action bound to its target id (e.g.
 * deleteLead.bind(null, lead.id)) that just deletes and revalidates — it
 * does NOT redirect itself. Navigation after a successful delete (when
 * `redirectTo` is given) is done client-side via router.push, which is a
 * soft navigation rather than a full page reload.
 */
export function DeleteButton({
  action,
  confirmMessage,
  label = "Delete",
  pendingLabel = "Deleting…",
  redirectTo,
  className,
}: {
  action: () => Promise<void>;
  confirmMessage: string;
  label?: string;
  pendingLabel?: string;
  redirectTo?: string;
  className?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (typeof window !== "undefined" && !window.confirm(confirmMessage)) return;
        startTransition(async () => {
          await action();
          if (redirectTo) router.push(redirectTo);
        });
      }}
      className={
        className ??
        "focus-gold rounded-full border border-red-300 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
      }
    >
      {isPending ? pendingLabel : label}
    </button>
  );
}
