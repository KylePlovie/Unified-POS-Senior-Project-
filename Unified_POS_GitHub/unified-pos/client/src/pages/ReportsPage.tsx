import { useState, useEffect } from "react";
import { reports as reportsApi } from "../services/api";
import type { SalesReport } from "../types";
import { formatBarLocation, formatCurrency } from "../utils/formatting";
import { BAR_COLORS } from "../utils/formatting";

interface Props { onBack: () => void; }

export default function ReportsPage({ onBack }: Props) {
  const [sales, setSales] = useState<SalesReport | null>(null);
  const [tabSummary, setTabSummary] = useState<{ openTabs: number; closedToday: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([reportsApi.sales(), reportsApi.tabSummary()])
      .then(([s, t]) => { setSales(s); setTabSummary(t); })
      .finally(() => setLoading(false));
  }, []);

  const maxBarRevenue = sales ? Math.max(...Object.values(sales.byBar).map(b => b.revenue), 1) : 1;
  const maxCatRevenue = sales ? Math.max(...Object.values(sales.byCategory).map(c => c.revenue), 1) : 1;

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)" }}>
          <button className="btn-ghost" onClick={onBack} style={{ minHeight: 36, padding: "4px 12px" }}>← Back</button>
          <h1 style={{ fontSize: "var(--font-size-lg)", fontWeight: 600 }}>Reports</h1>
        </div>
      </div>

      <div className="page-content">
        {loading ? <p style={{ color: "var(--text-muted)", textAlign: "center" }}>Loading reports...</p> : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "var(--space-lg)", maxWidth: 1000 }}>
            {/* Summary cards */}
            <div className="card" style={{ display: "flex", justifyContent: "space-around", textAlign: "center" }}>
              <div>
                <div style={{ fontSize: "var(--font-size-2xl)", fontWeight: 700, color: "var(--accent-green)" }}>{formatCurrency(sales?.totalRevenue || 0)}</div>
                <div style={{ fontSize: "var(--font-size-sm)", color: "var(--text-secondary)" }}>Total Revenue</div>
              </div>
              <div>
                <div style={{ fontSize: "var(--font-size-2xl)", fontWeight: 700, color: "var(--accent-blue)" }}>{sales?.totalItems || 0}</div>
                <div style={{ fontSize: "var(--font-size-sm)", color: "var(--text-secondary)" }}>Items Sold</div>
              </div>
              <div>
                <div style={{ fontSize: "var(--font-size-2xl)", fontWeight: 700, color: "var(--accent-amber)" }}>{tabSummary?.openTabs || 0}</div>
                <div style={{ fontSize: "var(--font-size-sm)", color: "var(--text-secondary)" }}>Open Tabs</div>
              </div>
              <div>
                <div style={{ fontSize: "var(--font-size-2xl)", fontWeight: 700 }}>{tabSummary?.closedToday || 0}</div>
                <div style={{ fontSize: "var(--font-size-sm)", color: "var(--text-secondary)" }}>Closed Today</div>
              </div>
            </div>

            {/* Sales by Bar */}
            <div className="card">
              <h3 style={{ fontSize: "var(--font-size-base)", fontWeight: 600, marginBottom: "var(--space-md)" }}>Sales by Bar</h3>
              {sales && Object.entries(sales.byBar).map(([bar, data]) => (
                <div key={bar} style={{ marginBottom: "var(--space-md)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: "var(--font-size-sm)" }}>
                    <span>{formatBarLocation(bar)}</span>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(data.revenue)} ({data.count} items)</span>
                  </div>
                  <div style={{ height: 8, background: "var(--bg-primary)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(data.revenue / maxBarRevenue) * 100}%`, background: BAR_COLORS[bar as keyof typeof BAR_COLORS] || "var(--accent-blue)", borderRadius: 4, transition: "width 0.3s" }} />
                  </div>
                </div>
              ))}
              {sales && Object.keys(sales.byBar).length === 0 && <p style={{ color: "var(--text-muted)", fontSize: "var(--font-size-sm)" }}>No sales data yet</p>}
            </div>

            {/* Sales by Category */}
            <div className="card">
              <h3 style={{ fontSize: "var(--font-size-base)", fontWeight: 600, marginBottom: "var(--space-md)" }}>Sales by Category</h3>
              {sales && Object.entries(sales.byCategory).sort((a, b) => b[1].revenue - a[1].revenue).map(([cat, data]) => (
                <div key={cat} style={{ marginBottom: "var(--space-md)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: "var(--font-size-sm)" }}>
                    <span>{cat}</span>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(data.revenue)} ({data.count})</span>
                  </div>
                  <div style={{ height: 8, background: "var(--bg-primary)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${(data.revenue / maxCatRevenue) * 100}%`, background: "var(--accent-purple)", borderRadius: 4, transition: "width 0.3s" }} />
                  </div>
                </div>
              ))}
              {sales && Object.keys(sales.byCategory).length === 0 && <p style={{ color: "var(--text-muted)", fontSize: "var(--font-size-sm)" }}>No sales data yet</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
