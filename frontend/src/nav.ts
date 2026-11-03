import type { Persona } from "./types";

export const NAV = [
  { to: "/", label: "Overview", roles: ["hq", "dc", "store"] as Persona[] },
  { to: "/inventory", label: "Inventory", roles: ["hq", "dc", "store"] as Persona[] },
  { to: "/reorder", label: "Reorder Alerts", roles: ["purchasing", "store", "dc"] as Persona[] },
  { to: "/purchase-orders", label: "Purchase Orders", roles: ["purchasing", "dc"] as Persona[] },
  { to: "/transfers", label: "Transfers", roles: ["dc", "store"] as Persona[] },
  { to: "/sales", label: "Sales & Forecast", roles: ["hq", "store"] as Persona[] },
  { to: "/suppliers", label: "Suppliers", roles: ["purchasing"] as Persona[] },
  { to: "/finance", label: "Finance", roles: ["hq"] as Persona[] },
];
