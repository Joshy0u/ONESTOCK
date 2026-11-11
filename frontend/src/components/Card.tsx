import type { ReactNode } from "react";

export function Card({
  title,
  count,
  subtitle,
  actions,
  tone = "white",
  className = "",
  children,
}: {
  title?: string;
  count?: number;
  subtitle?: string;
  actions?: ReactNode;
  tone?: "white" | "beige";
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={`card card--${tone} ${className}`.trim()}>
      {title ? (
        <header className="card__head">
          <div>
            <h3 className="card__title">
              {title}
              {count != null ? <span className="pill pill--neutral">{count.toLocaleString("en-US")} rows</span> : null}
            </h3>
            {subtitle ? <p className="card__subtitle">{subtitle}</p> : null}
          </div>
          {actions ? <div className="card__actions">{actions}</div> : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}
