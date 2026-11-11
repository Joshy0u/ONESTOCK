export function money(value: number, digits = 2) {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function num(value: number) {
  return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

/** Quantities: whole numbers stay whole, fractions keep up to two decimals. */
export function qty(value: number) {
  return Number.isInteger(value) ? value.toLocaleString("en-US") : value.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export function pct(value: number | null | undefined) {
  if (value == null) return "—";
  return `${value.toLocaleString("en-US", { maximumFractionDigits: 1 })}%`;
}

export function shortDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function dateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function timeOfDay(d: Date) {
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

/** "PARTIALLY_RECEIVED" -> "Partially received" */
export function statusLabel(code: string) {
  const words = code.toLowerCase().split("_");
  return words.map((w, i) => (i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w)).join(" ");
}

export type Tone = "ok" | "warn" | "danger" | "neutral";

const EXACT_TONES: Record<string, Tone> = {
  IN_STOCK: "ok",
  LOW_STOCK: "warn",
  OUT_OF_STOCK: "danger",
  RECEIVED: "ok",
  COMPLETED: "ok",
  SUBMITTED: "warn",
  PARTIALLY_RECEIVED: "warn",
  IN_TRANSIT: "warn",
  DRAFT: "neutral",
  CANCELLED: "neutral",
  Low: "ok",
  Reliable: "ok",
  Watch: "warn",
  "Act now": "danger",
  "Fully matched": "ok",
  "Partial - matched so far": "warn",
  "Not received yet": "neutral",
  MISMATCH: "danger",
  Cancelled: "neutral",
  "Arrived on time": "ok",
  "Arrived late": "danger",
  "On the way": "warn",
  Overdue: "danger",
  "No shipment record": "neutral",
  CLASS_A: "ok",
  CLASS_B: "warn",
  CLASS_C: "neutral",
};

/** Maps any status-like string from the API to a chip tone. */
export function statusTone(status: string): Tone {
  if (status in EXACT_TONES) return EXACT_TONES[status];
  const s = status.toLowerCase();
  if (/(mismatch|out of|cancel|late|high|act now|overdue|critical|urgent)/.test(s)) return "danger";
  if (/(fully|on time|reliable|received|complete|healthy|ok\b|none needed|no action)/.test(s)) return "ok";
  if (/(low|partial|submitted|transit|watch|medium|not received|draft|order|transfer|create|buy|replenish|expedite)/.test(s)) return "warn";
  return "neutral";
}
