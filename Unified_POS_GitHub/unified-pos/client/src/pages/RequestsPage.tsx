import { useState, useEffect, useCallback } from "react";
import { barRequests } from "../services/api";
import type { BarRequest, BarLocation } from "../types";
import { formatBarLocation, formatTime } from "../utils/formatting";

interface Props { onBack: () => void; }

const BARS: BarLocation[] = ["I_BAR", "SERVICE_BAR", "QUICKIE_BAR"];

export default function RequestsPage({ onBack }: Props) {
  const [activeBar, setActiveBar] = useState<BarLocation | "ALL">("ALL");
  const [requests, setRequests] = useState<BarRequest[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [reqs, c] = await Promise.all([
        barRequests.list(activeBar === "ALL" ? undefined : activeBar, showHistory ? "FULFILLED" : "PENDING"),
        barRequests.counts(),
      ]);
      setRequests(reqs);
      setCounts(c);
    } catch (err) { console.error("Failed to load requests:", err); }
    finally { setLoading(false); }
  }, [activeBar, showHistory]);

  useEffect(() => { fetchData(); const i = setInterval(fetchData, 5000); return () => clearInterval(i); }, [fetchData]);

  const handleFulfill = async (id: string) => {
    try { await barRequests.fulfill(id); fetchData(); }
    catch (err: any) { alert(err.message || "Failed to fulfill request"); }
  };

  const handleCancel = async (id: string) => {
    try { await barRequests.cancel(id); fetchData(); }
    catch (err: any) { alert(err.message || "Failed to cancel request"); }
  };

  const totalPending = Object.values(counts).reduce((s, c) => s + c, 0);

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)" }}>
          <button className="btn-ghost" onClick={onBack} style={{ minHeight: 36, padding: "4px 12px" }}>← Back</button>
          <h1 style={{ fontSize: "var(--font-size-lg)", fontWeight: 600 }}>
            Bar Requests
            {totalPending > 0 && <span style={{ marginLeft: 8, background: "var(--accent-red)", color: "white", borderRadius: 999, padding: "2px 8px", fontSize: "var(--font-size-sm)" }}>{totalPending}</span>}
          </h1>
        </div>
        <button className="btn-ghost" onClick={() => setShowHistory(!showHistory)} style={{ minHeight: 36 }}>
          {showHistory ? "Show Pending" : "Show History"}
        </button>
      </div>

      {/* Bar filter */}
      <div style={{ display: "flex", gap: "var(--space-xs)", padding: "var(--space-sm) var(--space-lg)", borderBottom: "1px solid var(--border-color)", background: "var(--bg-secondary)" }}>
        <button onClick={() => setActiveBar("ALL")}
          style={{ background: activeBar === "ALL" ? "var(--accent-blue)" : "transparent", color: activeBar === "ALL" ? "white" : "var(--text-secondary)", border: "1px solid transparent", borderRadius: "var(--radius-md)", padding: "var(--space-sm) var(--space-md)", fontSize: "var(--font-size-sm)", fontWeight: 500, minHeight: 36 }}>
          All Bars
        </button>
        {BARS.map(bar => (
          <button key={bar} onClick={() => setActiveBar(bar)}
            style={{ background: activeBar === bar ? "var(--accent-blue)" : "transparent", color: activeBar === bar ? "white" : "var(--text-secondary)", border: "1px solid transparent", borderRadius: "var(--radius-md)", padding: "var(--space-sm) var(--space-md)", fontSize: "var(--font-size-sm)", fontWeight: 500, minHeight: 36, position: "relative" }}>
            {formatBarLocation(bar)}
            {(counts[bar] || 0) > 0 && !showHistory && (
              <span style={{ position: "absolute", top: -4, right: -4, background: "var(--accent-red)", color: "white", borderRadius: 999, width: 18, height: 18, fontSize: "0.65rem", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                {counts[bar]}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="page-content">
        {loading ? <p style={{ color: "var(--text-muted)", textAlign: "center" }}>Loading requests...</p>
        : requests.length === 0 ? (
          <p style={{ color: "var(--text-muted)", textAlign: "center", marginTop: "var(--space-xl)" }}>
            {showHistory ? "No fulfilled requests yet." : "No pending requests. All caught up!"}
          </p>
        ) : (
          <div style={{ maxWidth: 700 }}>
            {requests.map(req => (
              <div key={req.id} className="card" style={{ marginBottom: "var(--space-sm)", padding: "var(--space-md)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: "var(--font-size-base)", marginBottom: 4 }}>{req.itemDescription}</div>
                    <div style={{ fontSize: "var(--font-size-sm)", color: "var(--text-secondary)", display: "flex", gap: "var(--space-md)", flexWrap: "wrap" }}>
                      <span>
                        <span style={{ color: "var(--accent-amber)" }}>{formatBarLocation(req.fromBar)}</span>
                        {" → "}
                        <span style={{ color: "var(--accent-blue)", fontWeight: 500 }}>{formatBarLocation(req.toBar)}</span>
                      </span>
                      <span>by {req.requestedBy.name}</span>
                      <span>{formatTime(req.createdAt)}</span>
                    </div>
                    {req.notes && <div style={{ fontSize: "var(--font-size-sm)", color: "var(--text-muted)", marginTop: 4, fontStyle: "italic" }}>{req.notes}</div>}
                    {req.fulfilledBy && <div style={{ fontSize: "var(--font-size-sm)", color: "var(--accent-green)", marginTop: 4 }}>Fulfilled by {req.fulfilledBy.name} at {formatTime(req.fulfilledAt!)}</div>}
                  </div>
                  {req.status === "PENDING" && (
                    <div style={{ display: "flex", gap: "var(--space-sm)", flexShrink: 0, marginLeft: "var(--space-md)" }}>
                      <button className="btn-success" onClick={() => handleFulfill(req.id)} style={{ fontSize: "var(--font-size-sm)", minHeight: 36, padding: "4px 16px" }}>
                        Fulfill
                      </button>
                      <button className="btn-ghost" onClick={() => handleCancel(req.id)} style={{ fontSize: "var(--font-size-sm)", minHeight: 36, padding: "4px 12px" }}>
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
