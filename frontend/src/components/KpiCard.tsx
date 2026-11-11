import type { ReactNode } from "react";

export function KpiCard({
  icon,
  label,
  value,
  sub,
  aside,
  tone = "default",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sub?: string;
  aside?: ReactNode;
  tone?: "default" | "warn" | "danger";
}) {
  return (
    <article className={`kpi kpi--${tone}`}>
      <div className="kpi__top">
        <span className="kpi__label">{label}</span>
        <span className="kpi__icon">{icon}</span>
      </div>
      <div className="kpi__value">{value}</div>
      <div className="kpi__foot">
        <span>{sub}</span>
        {aside ? <span className="kpi__aside">{aside}</span> : null}
      </div>
    </article>
  );
}
