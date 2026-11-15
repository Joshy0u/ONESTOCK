import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Map, RefreshCw, X } from "lucide-react";
import { api } from "../api/client";
import { useApi } from "../hooks/useApi";
import { useApp } from "../context/AppContext";
import { PageHeader } from "../components/PageHeader";
import { StatusChip } from "../components/StatusChip";
import { money, num, qty, statusLabel } from "../lib/format";
// Type-only import: the Three.js scene module (and the `three` package) is only
// loaded at runtime when ENABLE_3D_MAP is true. See the dynamic import below.
import type { NetworkScene, HoverInfo } from "../three/NetworkScene";

/**
 * 3D map switch. Off while we test the full stack end-to-end; the page renders a
 * plain 2D location grid instead. Flip to `true` to bring the Three.js scene back.
 */
const ENABLE_3D_MAP = false;

export function NetworkMapPage() {
  const { locations, inventory, loading: appLoading, error: appError, reload } = useApp();
  const transfers = useApi(() => api.transferPipeline());
  const carriers = useApi(() => api.carriers());

  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<NetworkScene | null>(null);
  const [hover, setHover] = useState<HoverInfo | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [showReorder, setShowReorder] = useState(true);
  const [showTransfers, setShowTransfers] = useState(true);

  useEffect(() => {
    if (!ENABLE_3D_MAP) return;
    const el = containerRef.current;
    if (!el) return;
    let disposed = false;
    let scene: NetworkScene | null = null;
    import("../three/NetworkScene").then(({ NetworkScene: Scene }) => {
      if (disposed) return;
      scene = new Scene(el, { onHover: setHover, onSelectLocation: setSelected });
      sceneRef.current = scene;
    });
    return () => {
      disposed = true;
      scene?.dispose();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!locations.length) return;
    sceneRef.current?.setData({ locations, inventory, transfers: transfers.data ?? [] });
  }, [locations, inventory, transfers.data]);

  useEffect(() => {
    sceneRef.current?.setOptions({ showReorder, showTransfers, focusLocationId: selected });
  }, [showReorder, showTransfers, selected]);

  const focused = selected === null ? null : (locations.find((l) => l.location_id === selected) ?? null);
  const focusedRows = useMemo(
    () =>
      selected === null
        ? []
        : inventory
            .filter((r) => r.location_id === selected)
            .sort((a, b) => a.quantity_on_hand / Math.max(a.reorder_point, 1) - b.quantity_on_hand / Math.max(b.reorder_point, 1))
            .slice(0, 8),
    [inventory, selected],
  );
  const inTransit = (transfers.data ?? []).filter((t) => t.status === "IN_TRANSIT");
  const activeCarriers = new Set((transfers.data ?? []).map((t) => t.carrier).filter(Boolean));

  return (
    <>
      <PageHeader
        crumbs={["Insights", "Network map"]}
        title="Network map"
        status={
          <span className="status-line">
            <span className={`dot ${appError ? "dot--danger" : "dot--ok"}`} />
            {appError ??
              (appLoading
                ? "Loading network…"
                : `${locations.length} locations · ${num(inventory.length)} stock positions · ${inTransit.length} transfer in transit`)}
          </span>
        }
        actions={
          <>
            {ENABLE_3D_MAP ? (
              <>
                <label className="toggle">
                  <input type="checkbox" checked={showReorder} onChange={(e) => setShowReorder(e.target.checked)} /> Reorder points
                </label>
                <label className="toggle">
                  <input type="checkbox" checked={showTransfers} onChange={(e) => setShowTransfers(e.target.checked)} /> Transfers
                </label>
              </>
            ) : null}
            <button
              className="btn btn--secondary"
              type="button"
              onClick={() => {
                reload();
                transfers.reload();
                carriers.reload();
              }}
            >
              <RefreshCw size={16} /> Refresh
            </button>
          </>
        }
      />

      <div className="map-layout">
        {ENABLE_3D_MAP ? (
        <div className="map-stage card">
          <div ref={containerRef} className="map-canvas" />
          {hover ? (
            <div className="map-tooltip" style={{ left: hover.x + 14, top: hover.y + 14 }}>
              <strong>{hover.title}</strong>
              {hover.lines.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>
          ) : null}
          <div className="map-legend">
            <span><i className="swatch" style={{ background: "#4f8f63" }} /> In stock</span>
            <span><i className="swatch" style={{ background: "#d9962b" }} /> Low stock</span>
            <span><i className="swatch" style={{ background: "#c9472d" }} /> Out of stock</span>
            <span><i className="swatch swatch--line" /> Reorder point</span>
            <span><i className="swatch swatch--arc" /> Transfer route</span>
            <span className="muted">Drag to orbit · scroll to zoom · click a platform to focus</span>
          </div>
        </div>
        ) : (
          <div className="card map-flat">
            <div className="map-flat__head">
              <div className="eyebrow">Locations</div>
              <span className="muted small">3D map is turned off for now · click a location to focus it</span>
            </div>
            {appError ? <div className="text-danger">{appError}</div> : null}
            {appLoading && !locations.length ? <div className="muted">Loading locations…</div> : null}
            <div className="map-flat__grid">
              {locations.map((l) => {
                const alerts = l.low_stock + l.out_of_stock;
                const tone = l.out_of_stock ? "danger" : l.low_stock ? "warn" : "ok";
                return (
                  <button
                    key={l.location_id}
                    type="button"
                    className={`map-tile map-tile--${tone}${selected === l.location_id ? " map-tile--active" : ""}`}
                    onClick={() => setSelected(selected === l.location_id ? null : l.location_id)}
                  >
                    <span className="eyebrow">{l.location_type === "DC" ? "Distribution centre" : "Store"}</span>
                    <strong>{l.name}</strong>
                    <span className="muted small">
                      {l.city} {l.state}
                    </span>
                    <span className="map-tile__stats">
                      {num(l.skus_stocked)} SKUs · {num(l.units_on_hand)} units · {money(l.value_on_hand, 0)}
                    </span>
                    <span className={`pill ${alerts ? "pill--warn" : "pill--ok"}`}>{alerts ? `${alerts} alerts` : "healthy"}</span>
                  </button>
                );
              })}
            </div>
            {inTransit.length ? (
              <div className="muted small">
                In transit: {inTransit.map((t) => `${t.from_location} → ${t.to_location}`).join(" · ")}
              </div>
            ) : null}
          </div>
        )}

        <aside className="map-side">
          {focused ? (
            <div className="card map-panel">
              <div className="map-panel__head">
                <div>
                  <div className="eyebrow">{focused.location_type === "DC" ? "Distribution centre" : "Store"}</div>
                  <h3>{focused.name}</h3>
                  <div className="muted small">
                    {focused.address}, {focused.city} {focused.state}
                  </div>
                </div>
                <button className="icon-btn" type="button" onClick={() => setSelected(null)} aria-label="Clear focus">
                  <X size={16} />
                </button>
              </div>
              <dl className="stat-list">
                <div><dt>SKUs stocked</dt><dd>{num(focused.skus_stocked)}</dd></div>
                <div><dt>Units on hand</dt><dd>{num(focused.units_on_hand)}</dd></div>
                <div><dt>Value at cost</dt><dd>{money(focused.value_on_hand, 0)}</dd></div>
                <div><dt>Capacity</dt><dd>{focused.total_storage_space ? `${num(focused.total_storage_space)} ft²` : "—"}</dd></div>
                <div><dt>Low stock</dt><dd className={focused.low_stock ? "text-warn" : ""}>{focused.low_stock}</dd></div>
                <div><dt>Out of stock</dt><dd className={focused.out_of_stock ? "text-danger" : ""}>{focused.out_of_stock}</dd></div>
              </dl>
              <h4>Closest to reorder</h4>
              <ul className="mini-list">
                {focusedRows.map((r) => (
                  <li key={r.inventory_id}>
                    <div className="cell-stack">
                      <span className="cell-title">{r.product}</span>
                      <span className="cell-sub">
                        {qty(r.quantity_on_hand)} {r.unit} · Min {qty(r.reorder_point)}
                      </span>
                    </div>
                    <StatusChip status={r.stock_status} label={statusLabel(r.stock_status)} />
                  </li>
                ))}
              </ul>
              <Link to="/reorder" className="link">
                Open reorder alerts <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="card map-panel">
              <div className="eyebrow">Locations</div>
              <ul className="mini-list">
                {locations.map((l) => (
                  <li key={l.location_id} className="clickable" onClick={() => setSelected(l.location_id)}>
                    <div className="cell-stack">
                      <span className="cell-title">{l.name}</span>
                      <span className="cell-sub">
                        {l.location_type} · {l.skus_stocked} SKUs · {num(l.units_on_hand)} units
                      </span>
                    </div>
                    <span className={`pill ${l.low_stock + l.out_of_stock ? "pill--warn" : "pill--ok"}`}>
                      {l.low_stock + l.out_of_stock ? `${l.low_stock + l.out_of_stock} alerts` : "healthy"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="card map-panel">
            <div className="eyebrow">Transfers &amp; carriers</div>
            <ul className="mini-list">
              {(transfers.data ?? []).map((t) => (
                <li key={t.transfer_order_id}>
                  <div className="cell-stack">
                    <span className="cell-title">
                      {t.from_location} → {t.to_location}
                    </span>
                    <span className="cell-sub">
                      {t.carrier ?? "No carrier"} · {money(t.value_shipped, 0)}
                    </span>
                  </div>
                  <StatusChip status={t.status} label={statusLabel(t.status)} />
                </li>
              ))}
              {transfers.loading ? <li className="muted">Loading transfers…</li> : null}
            </ul>
            <div className="muted small">
              <Map size={14} /> {activeCarriers.size} of {carriers.data?.length ?? "…"} carriers active on current transfers
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
