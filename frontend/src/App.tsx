import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { OverviewPage } from "./pages/OverviewPage";
import { InventoryPage } from "./pages/InventoryPage";
import { ReorderAlertsPage } from "./pages/ReorderAlertsPage";
import { PurchaseOrdersPage } from "./pages/PurchaseOrdersPage";
import { NetworkMapPage } from "./pages/NetworkMapPage";
import { ReportsPage } from "./pages/ReportsPage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<OverviewPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/reorder" element={<ReorderAlertsPage />} />
        <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
        <Route path="/network" element={<NetworkMapPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
