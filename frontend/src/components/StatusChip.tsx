import { statusTone } from "../lib/format";

export function StatusChip({ value }: { value: string }) {
  return <span className={`chip chip-${statusTone(value)}`}>{value.replaceAll("_", " ")}</span>;
}
