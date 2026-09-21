import type { ReactNode } from "react";

/**
 * Consistent page header for every CRM admin page: an accent-tinted icon
 * badge next to the title, matching the stat-tile / topbar visual language
 * so no page feels like a leftover from before the redesign.
 */
export function PageHeader({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="crm-accent-soft-bg flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
          {icon}
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-ink/50">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}
