import { useState } from "react";
import { useAuth } from "./hooks/useAuth";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import TabDetailPage from "./pages/TabDetailPage";
import ManagerPage from "./pages/ManagerPage";
import ReportsPage from "./pages/ReportsPage";
import RequestsPage from "./pages/RequestsPage";
import MenuManagementPage from "./pages/MenuManagementPage";

type View =
  | { page: "dashboard" }
  | { page: "tab"; tabId: string }
  | { page: "manager" }
  | { page: "reports" }
  | { page: "requests" }
  | { page: "menu-mgmt" };

export default function App() {
  const { user } = useAuth();
  const [view, setView] = useState<View>({ page: "dashboard" });

  if (!user) return <LoginPage />;

  switch (view.page) {
    case "tab":
      return <TabDetailPage tabId={view.tabId} onBack={() => setView({ page: "dashboard" })} />;
    case "manager":
      return <ManagerPage onBack={() => setView({ page: "dashboard" })} />;
    case "reports":
      return <ReportsPage onBack={() => setView({ page: "dashboard" })} />;
    case "requests":
      return <RequestsPage onBack={() => setView({ page: "dashboard" })} />;
    case "menu-mgmt":
      return <MenuManagementPage onBack={() => setView({ page: "dashboard" })} />;
    default:
      return (
        <DashboardPage
          onOpenTab={(id) => setView({ page: "tab", tabId: id })}
          onOpenManager={() => setView({ page: "manager" })}
          onOpenReports={() => setView({ page: "reports" })}
          onOpenRequests={() => setView({ page: "requests" })}
          onOpenMenuMgmt={() => setView({ page: "menu-mgmt" })}
        />
      );
  }
}
