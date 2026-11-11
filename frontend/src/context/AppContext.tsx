import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "../api/client";
import type { ActivityItem, InventoryPosition, LocationSummary, OverviewKpis } from "../types";

export type Scope = number | "all";

interface AppContextValue {
  scope: Scope;
  setScope: (scope: Scope) => void;
  locations: LocationSummary[];
  overview: OverviewKpis | null;
  inventory: InventoryPosition[];
  /** Inventory filtered to the selected scope (all locations or one). */
  scopedInventory: InventoryPosition[];
  activity: ActivityItem[];
  loading: boolean;
  error: string | null;
  syncedAt: Date;
  reload: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [scope, setScope] = useState<Scope>("all");
  const [locations, setLocations] = useState<LocationSummary[]>([]);
  const [overview, setOverview] = useState<OverviewKpis | null>(null);
  const [inventory, setInventory] = useState<InventoryPosition[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncedAt, setSyncedAt] = useState(() => new Date());
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([api.locations(), api.overview(), api.inventory(), api.recentActivity(12)])
      .then(([locs, kpis, inv, feed]) => {
        if (!alive) return;
        setLocations(locs);
        setOverview(kpis);
        setInventory(inv);
        setActivity(feed);
        setError(null);
        setSyncedAt(new Date());
      })
      .catch((err: unknown) => {
        if (!alive) return;
        setError(err instanceof Error ? err.message : "Could not reach the OneStock API.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  const scopedInventory = useMemo(
    () => (scope === "all" ? inventory : inventory.filter((row) => row.location_id === scope)),
    [inventory, scope],
  );

  const value = useMemo<AppContextValue>(
    () => ({ scope, setScope, locations, overview, inventory, scopedInventory, activity, loading, error, syncedAt, reload }),
    [scope, locations, overview, inventory, scopedInventory, activity, loading, error, syncedAt, reload],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
