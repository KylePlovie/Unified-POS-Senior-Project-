import { useState } from "react";
import type { BarLocation } from "../../types";
import { formatBarLocation } from "../../utils/formatting";

interface Props { onSubmit: (data: { customerName?: string; laneNumber?: number; barLocation: BarLocation }) => Promise<void>; onClose: () => void; }
const BARS: BarLocation[] = ["I_BAR", "SERVICE_BAR", "QUICKIE_BAR"];

export default function NewTabModal({ onSubmit, onClose }: Props) {
  const [name, setName] = useState(""); const [lane, setLane] = useState(""); const [bar, setBar] = useState<BarLocation>("I_BAR");
  const [submitting, setSubmitting] = useState(false); const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!name.trim() && !lane.trim()) { setError("Enter a customer name or lane number"); return; }
    setSubmitting(true); setError("");
    try { await onSubmit({ customerName: name.trim() || undefined, laneNumber: lane ? parseInt(lane, 10) : undefined, barLocation: bar }); }
    catch (err: any) { setError(err.message || "Failed to create tab"); setSubmitting(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">New Tab</h2>
        <div className="form-group"><label className="form-label">Customer Name</label><input type="text" placeholder="e.g. John's Party" value={name} onChange={e => setName(e.target.value)} autoFocus /></div>
        <div className="form-group"><label className="form-label">Lane Number (optional)</label><input type="number" placeholder="e.g. 7" min={1} max={40} value={lane} onChange={e => setLane(e.target.value)} /></div>
        <div className="form-group">
          <label className="form-label">Bar Location</label>
          <div style={{ display: "flex", gap: "var(--space-xs)" }}>
            {BARS.map(b => (
              <button key={b} onClick={() => setBar(b)} type="button"
                style={{ flex: 1, background: bar === b ? "var(--accent-blue)" : "var(--bg-card)", color: bar === b ? "white" : "var(--text-secondary)", border: `1px solid ${bar === b ? "var(--accent-blue)" : "var(--border-color)"}`, borderRadius: "var(--radius-md)", padding: "var(--space-sm)", fontSize: "var(--font-size-sm)", fontWeight: 500, minHeight: "var(--touch-target)" }}>
                {formatBarLocation(b)}
              </button>
            ))}
          </div>
        </div>
        {error && <p className="form-error">{error}</p>}
        <div className="modal-actions">
          <button className="btn-ghost" onClick={onClose} disabled={submitting}>Cancel</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={submitting}>{submitting ? "Opening..." : "Open Tab"}</button>
        </div>
      </div>
    </div>
  );
}
