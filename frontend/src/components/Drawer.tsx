import type { ReactNode } from "react";

export function Drawer({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="drawer-scrim" onClick={onClose} role="presentation">
      <aside className="drawer" onClick={(event) => event.stopPropagation()}>
        <div className="page-head">
          <h2>{title}</h2>
          <button className="btn btn-ghost" onClick={onClose} type="button">
            Close
          </button>
        </div>
        {children}
      </aside>
    </div>
  );
}
