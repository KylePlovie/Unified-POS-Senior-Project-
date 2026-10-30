import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import { tabs as tabsApi, barRequests } from "../services/api";
import type { Tab, BarLocation } from "../types";
import { formatBarLocation, formatCurrency, formatTime } from "../utils/formatting";
import NewTabModal from "../components/tabs/NewTabModal";

const BAR_FILTERS: (BarLocation | "ALL")[] = ["ALL", "I_BAR", "SERVICE_BAR", "QUICKIE_BAR"];

interface Props {
  onOpenTab: (id: string) => void; onOpenManager: () => void; onOpenReports: () => void;
  onOpenRequests: () => void; onOpenMenuMgmt: () => void;
}

export default function DashboardPage({ onOpenTab, onOpenManager, onOpenReports, onOpenRequests, onOpenMenuMgmt }: Props) {
  const { user, logout, isManager } = useAuth();
  const [openTabs, setOpenTabs] = useState<Tab[]>([]);
  const [filter, setFilter] = useState<BarLocation | "ALL">("ALL");
  const [loading, setLoading] = useState(true);
  const [showNewTab, setShowNewTab] = useState(false);
  const [requestCount, setRequestCount] = useState(0);

  const fetchTabs = useCallback(async () => {
    try {
      const [data, counts] = await Promise.all([
        tabsApi.list("OPEN", filter === "ALL" ? undefined : filter),
        barRequests.counts(),
      ]);
      setOpenTabs(data);
      setRequestCount(Object.values(counts).reduce((s, c) => s + c, 0));
    }
    catch (err) { console.error("Failed to load tabs:", err); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { fetchTabs(); const i = setInterval(fetchTabs, 10000); return () => clearInterval(i); }, [fetchTabs]);

  const handleCreateTab = async (data: { customerName?: string; laneNumber?: number; barLocation: BarLocation }) => {
    const newTab = await tabsApi.create(data); setShowNewTab(false); onOpenTab(newTab.id);
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: "var(--font-size-lg)", fontWeight: 600 }}>Open Tabs</h1>
          <span style={{ color: "var(--text-secondary)", fontSize: "var(--font-size-sm)" }}>{user?.name} — {user?.role}</span>
        </div>
        <div style={{ display: "flex", gap: "var(--space-sm)", flexWrap: "wrap" }}>
          <button className="btn-primary" onClick={() => setShowNewTab(true)}>+ New Tab</button>
          <button className="btn-ghost" onClick={onOpenRequests} style={{ position: "relative" }}>
            Requests
            {requestCount > 0 && (
              <span style={{ position: "absolute", top: -4, right: -4, background: "var(--accent-red)", color: "white", borderRadius: 999, width: 20, height: 20, fontSize: "0.65rem", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                {requestCount}
              </span>
            )}
          </button>
          {isManager && <button className="btn-ghost" onClick={onOpenManager}>Manager</button>}
          {isManager && <button className="btn-ghost" onClick={onOpenMenuMgmt}>Menu</button>}
          <button className="btn-ghost" onClick={onOpenReports}>Reports</button>
          <button className="btn-ghost" onClick={logout}>Clock Out</button>
        </div>
      </div>

      <div style={{ display: "flex", gap: "var(--space-xs)", padding: "var(--space-sm) var(--space-lg)", borderBottom: "1px solid var(--border-color)", background: "var(--bg-secondary)", overflowX: "auto" }}>
        {BAR_FILTERS.map(bar => (
          <button key={bar} onClick={() => setFilter(bar)}
            style={{ background: filter === bar ? "var(--accent-blue)" : "transparent", color: filter === bar ? "white" : "var(--text-secondary)", border: "1px solid transparent", borderRadius: "var(--radius-md)", padding: "var(--space-sm) var(--space-md)", fontSize: "var(--font-size-sm)", fontWeight: 500, whiteSpace: "nowrap", minHeight: 36 }}>
            {bar === "ALL" ? "All Bars" : formatBarLocation(bar)}
          </button>
        ))}
      </div>

      <div className="page-content">
        {loading ? <p style={{ color: "var(--text-muted)", textAlign: "center", marginTop: "var(--space-xl)" }}>Loading tabs...</p>
        : openTabs.length === 0 ? <p style={{ color: "var(--text-muted)", textAlign: "center", marginTop: "var(--space-xl)" }}>No open tabs. Tap "+ New Tab" to get started.</p>
        : (
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
            {openTabs.map(tab => (
              <div key={tab.id} className="card" onClick={() => onOpenTab(tab.id)} style={{ cursor: "pointer", transition: "border-color 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = "var(--accent-blue)")} onMouseLeave={e => (e.currentTarget.style.borderColor = "var(--border-color)")}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-sm)" }}>
                  <span style={{ fontWeight: 600, fontSize: "var(--font-size-lg)" }}>{tab.customerName || `Lane ${tab.laneNumber}`}</span>
                  <span className="badge badge-open">Open</span>
                </div>
                <div style={{ color: "var(--text-secondary)", fontSize: "var(--font-size-sm)", marginBottom: "var(--space-md)" }}>{formatBarLocation(tab.barLocation)}</div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--font-size-sm)", color: "var(--text-secondary)", paddingTop: "var(--space-sm)", borderTop: "1px solid var(--border-color)" }}>
                  <span>{tab.lineItems?.length || 0} items</span>
                  <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{formatCurrency(tab.subtotal || 0)}</span>
                </div>
                <div style={{ marginTop: "var(--space-sm)", color: "var(--text-muted)", fontSize: "var(--font-size-sm)" }}>
                  Opened {formatTime(tab.createdAt)} by {tab.createdBy?.name}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showNewTab && <NewTabModal onSubmit={handleCreateTab} onClose={() => setShowNewTab(false)} />}
    </div>
  );
}
