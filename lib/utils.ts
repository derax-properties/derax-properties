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

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

/**
 * Generates a human-friendly reference number in the format DP-YYYY-XXXXXX.
 * This is a client/server-safe fallback used before the database default
 * (see supabase/schema.sql) assigns the permanent value.
 */
export function generateReferenceNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `DP-${year}-${random}`;
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
