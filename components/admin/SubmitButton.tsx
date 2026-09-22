"use client";

import { useFormStatus } from "react-dom";

/**
 * A plain submit button that shows `pendingLabel` the instant it's clicked,
 * for the length of the actual request — instead of just sitting there
 * looking unresponsive while a server action runs. useFormStatus only
 * reports the status of the nearest enclosing <form>, so this has to be
 * its own small component rendered inside that form rather than logic in
 * the parent.
 */
export function SubmitButton({
  children,
  pendingLabel,
  className,
}: {
  children: React.ReactNode;
  pendingLabel: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={className}>
      {pending ? pendingLabel : children}
    </button>
  );
}
