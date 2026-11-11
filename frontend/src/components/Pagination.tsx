export function Pagination({
  page,
  pageSize,
  total,
  noun,
  pageSizes = [7, 12, 25, 50],
  onPage,
  onPageSize,
}: {
  page: number;
  pageSize: number;
  total: number;
  noun: string;
  pageSizes?: number[];
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  return (
    <footer className="pagination">
      <span className="muted small">
        Showing {from}–{to} of {total.toLocaleString("en-US")} {noun}
      </span>
      <div className="pagination__controls">
        <label className="select-inline">
          <select value={pageSize} onChange={(e) => onPageSize(Number(e.target.value))}>
            {pageSizes.map((s) => (
              <option key={s} value={s}>
                {s} per page
              </option>
            ))}
          </select>
        </label>
        <button className="btn btn--secondary btn--sm" type="button" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </button>
        <span className="pagination__page">{page}</span>
        <button className="btn btn--secondary btn--sm" type="button" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          Next
        </button>
      </div>
    </footer>
  );
}
