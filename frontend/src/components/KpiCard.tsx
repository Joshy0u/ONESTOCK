export function KpiCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <article className="kpi">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {hint ? <div className="hint">{hint}</div> : null}
    </article>
  );
}
