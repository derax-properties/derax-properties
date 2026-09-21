export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatDateOnly(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

/**
 * "3 months ago" style relative time for a comp's sale date (or anything
 * else date-only). Deliberately coarse — this is for a quick read of how
 * stale a comp is while underwriting, not a precise duration.
 */
export function formatRelativeTime(value: string): string {
  const then = new Date(value + (value.length <= 10 ? "T00:00:00Z" : ""));
  const now = new Date();
  const diffMs = now.getTime() - then.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 30) return `${diffDays} days ago`;
  const diffMonths = Math.round(diffDays / 30.44);
  if (diffMonths < 12) return diffMonths === 1 ? "1 month ago" : `${diffMonths} months ago`;
  const diffYears = Math.round(diffMonths / 12);
  return diffYears === 1 ? "1 year ago" : `${diffYears} years ago`;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

/**
 * Generates a human-friendly reference number in the format DRX-XXXXXX.
 * This is a client/server-safe fallback used before the database default
 * (see supabase/migrations/0001_crm_foundation.sql) assigns the permanent
 * value.
 */
export function generateReferenceNumber(): string {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `DRX-${random}`;
}

export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isValidUSPhone(value: string): boolean {
  const digits = onlyDigits(value);
  return digits.length === 10 || (digits.length === 11 && digits.startsWith("1"));
}

export function isValidZip(value: string): boolean {
  return /^\d{5}(-\d{4})?$/.test(value.trim());
}
