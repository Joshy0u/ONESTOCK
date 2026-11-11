import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  Bell,
  Boxes,
  ChevronDown,
  ChevronsUpDown,
  ClipboardList,
  Hexagon,
  Layers,
  LayoutGrid,
  Map,
  Package,
  Search,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { timeOfDay } from "../lib/format";

const OPERATIONS = [
  { to: "/", label: "Overview", icon: LayoutGrid },
  { to: "/inventory", label: "Inventory", icon: Package },
  { to: "/reorder", label: "Reorder alerts", icon: Layers, badge: true },
  { to: "/purchase-orders", label: "Purchase orders and Receiving", icon: ClipboardList },
];

const INSIGHTS = [
  { to: "/network", label: "Network map", icon: Map },
  { to: "/reports", label: "Reports", icon: Boxes },
];

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

export function AppShell() {
  const { scope, setScope, locations, scopedInventory } = useApp();
  const now = useClock();
  const alerts = scopedInventory.filter((r) => r.stock_status !== "IN_STOCK").length;

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand__mark">
            <Hexagon size={18} />
          </span>
          <span className="brand__word">onestock</span>
        </div>
        <div className="topbar__right">
          <button className="icon-btn" type="button" aria-label="Search">
            <Search size={18} />
          </button>
          <button className="icon-btn" type="button" aria-label="Notifications">
            <Bell size={18} />
            {alerts > 0 ? <span className="icon-btn__dot" /> : null}
          </button>
          <span className="topbar__divider" />
          <div className="user">
            <span className="avatar">JJ</span>
            <span className="user__text">
              <strong>Joshua John</strong>
              <small>Inventory lead</small>
            </span>
            <ChevronDown size={16} className="muted" />
          </div>
        </div>
      </header>

      <aside className="sidebar">
        <div className="sidebar__section">
          <div className="eyebrow">Workspace</div>
          <label className="workspace">
            <select value={String(scope)} onChange={(e) => setScope(e.target.value === "all" ? "all" : Number(e.target.value))}>
              <option value="all">All locations</option>
              {locations.map((l) => (
                <option key={l.location_id} value={l.location_id}>
                  {l.name}
                </option>
              ))}
            </select>
            <ChevronsUpDown size={14} />
          </label>
        </div>

        <nav className="sidebar__section">
          <div className="eyebrow">Operations</div>
          {OPERATIONS.map(({ to, label, icon: Icon, badge }) => (
            <NavLink key={to} to={to} end={to === "/"} className={({ isActive }) => `nav-item${isActive ? " nav-item--active" : ""}`}>
              <Icon size={18} />
              <span>{label}</span>
              {badge && alerts > 0 ? <span className="nav-item__badge">{alerts}</span> : null}
            </NavLink>
          ))}
        </nav>

        <nav className="sidebar__section">
          <div className="eyebrow">Insights</div>
          {INSIGHTS.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={({ isActive }) => `nav-item${isActive ? " nav-item--active" : ""}`}>
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <span className="brand__mark brand__mark--soft">o.</span>
          <p>
            A place for everything.
            <br />
            Everything in its place.
          </p>
          <div className="eyebrow">Local time · {timeOfDay(now)}</div>
        </div>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
