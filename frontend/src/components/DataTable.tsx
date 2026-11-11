import { useState, type ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  align?: "left" | "right" | "center";
  width?: string;
  /** Called when the header is clicked; the table shows a sort arrow when `sorted` is set. */
  onSort?: () => void;
  sorted?: "asc" | "desc";
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  error = null,
  emptyText = "No rows.",
  selectable = false,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  loading?: boolean;
  error?: string | null;
  emptyText?: string;
  selectable?: boolean;
}) {
  const [selected, setSelected] = useState<Set<string | number>>(new Set());
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(rowKey(r)));

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(rows.map(rowKey)));
  };
  const toggle = (key: string | number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            {selectable ? (
              <th className="table__check">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all rows" />
              </th>
            ) : null}
            {columns.map((c) => (
              <th
                key={c.key}
                style={{ textAlign: c.align ?? "left", width: c.width }}
                className={c.onSort ? "sortable" : undefined}
                onClick={c.onSort}
              >
                {c.header}
                {c.sorted ? <span className="sort-arrow">{c.sorted === "asc" ? "↓" : "↑"}</span> : null}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {error ? (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)} className="table__state table__state--error">
                {error}
              </td>
            </tr>
          ) : loading && rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)} className="table__state">
                Loading…
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (selectable ? 1 : 0)} className="table__state">
                {emptyText}
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const key = rowKey(row);
              return (
                <tr key={key} className={selected.has(key) ? "row--selected" : undefined}>
                  {selectable ? (
                    <td className="table__check">
                      <input type="checkbox" checked={selected.has(key)} onChange={() => toggle(key)} aria-label="Select row" />
                    </td>
                  ) : null}
                  {columns.map((c) => (
                    <td key={c.key} style={{ textAlign: c.align ?? "left" }}>
                      {c.render(row)}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
