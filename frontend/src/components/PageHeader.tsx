import type { ReactNode } from "react";

export function PageHeader({
  crumbs,
  title,
  status,
  actions,
}: {
  crumbs: string[];
  title: string;
  status?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        <div className="crumbs">
          {crumbs.map((c, i) => (
            <span key={c}>
              {i > 0 ? <span className="crumbs__sep">/</span> : null}
              {c}
            </span>
          ))}
        </div>
        <h1 className="page-title">{title}</h1>
        {status ? <div className="page-status">{status}</div> : null}
      </div>
      {actions ? <div className="page-actions">{actions}</div> : null}
    </div>
  );
}
