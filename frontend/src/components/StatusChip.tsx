import { statusTone } from "../lib/format";

export function StatusChip({ status, label }: { status: string; label?: string }) {
  const tone = statusTone(status);
  return (
    <span className={`chip chip--${tone}`}>
      <span className="chip__dot" />
      {label ?? status}
    </span>
  );
}
