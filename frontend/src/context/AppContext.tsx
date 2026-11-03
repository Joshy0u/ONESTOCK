import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { loadCatalog } from "../api/client";
import type { Catalog, Persona } from "../types";

type AppContextValue = {
  persona: Persona;
  setPersona: (persona: Persona) => void;
  locationId: number | "all";
  setLocationId: (id: number | "all") => void;
  catalog: Catalog | null;
  loading: boolean;
  error: string | null;
  toast: string | null;
  notify: (message: string) => void;
};

const AppContext = createContext<AppContextValue | null>(null);

const personaDefaultLocation: Record<Persona, number | "all"> = {
  hq: "all",
  purchasing: "all",
  dc: 1,
  store: 3,
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [persona, setPersonaState] = useState<Persona>("store");
  const [locationId, setLocationId] = useState<number | "all">(3);
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    loadCatalog()
      .then((data) => setCatalog(data))
      .catch(() => setError("Could not load catalog."))
      .finally(() => setLoading(false));
  }, []);

  function setPersona(next: Persona) {
    setPersonaState(next);
    setLocationId(personaDefaultLocation[next]);
  }

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2800);
  }

  const value = useMemo(
    () => ({ persona, setPersona, locationId, setLocationId, catalog, loading, error, toast, notify }),
    [persona, locationId, catalog, loading, error, toast],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
