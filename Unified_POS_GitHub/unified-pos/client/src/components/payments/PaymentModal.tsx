import { useState } from "react";
import type { Tab, PaymentType } from "../../types";
import { payments as paymentsApi } from "../../services/api";
import { formatCurrency } from "../../utils/formatting";

interface Props {
  tab: Tab; subtotal: number; totalPaid: number;
  onClose: () => void; onPaymentComplete: () => void; onTabClosed: () => void;
}

export default function PaymentModal({ tab, subtotal, totalPaid, onClose, onPaymentComplete, onTabClosed }: Props) {
  const balanceDue = Math.max(0, subtotal - totalPaid);
  const [paymentType, setPaymentType] = useState<PaymentType>("CARD");
  const [amount, setAmount] = useState(balanceDue.toFixed(2));
  const [tip, setTip] = useState("0.00");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<any>(null);

  const tipPresets = [0, 15, 18, 20, 25];

  const handleTipPreset = (pct: number) => {
    if (pct === 0) { setTip("0.00"); return; }
    setTip((subtotal * pct / 100).toFixed(2));
  };

  const handleSubmit = async () => {
    const amt = parseFloat(amount);
    const tipAmt = parseFloat(tip) || 0;
    if (isNaN(amt) || amt <= 0) { setError("Enter a valid amount"); return; }
    setSubmitting(true); setError("");
    try {
      const result = await paymentsApi.apply({ tabId: tab.id, paymentType, amount: amt, tip: tipAmt });
      if (result.tabClosed) {
        const rec = await paymentsApi.receipt(tab.id);
        setReceipt(rec);
      } else {
        onPaymentComplete();
      }
    } catch (err: any) { setError(err.message || "Payment failed"); }
    finally { setSubmitting(false); }
  };

  // Receipt view
  if (receipt) {
    return (
      <div className="modal-overlay" onClick={onTabClosed}>
        <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 360 }}>
          <div style={{ textAlign: "center", marginBottom: "var(--space-lg)" }}>
            <h2 style={{ fontSize: "var(--font-size-xl)", fontWeight: 700, marginBottom: 4 }}>Receipt</h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "var(--font-size-sm)" }}>{receipt.customer} — Served by {receipt.server}</p>
          </div>

          <div style={{ borderTop: "1px dashed var(--border-color)", borderBottom: "1px dashed var(--border-color)", padding: "var(--space-md) 0", marginBottom: "var(--space-md)" }}>
            {receipt.items.map((item: any, i: number) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: "var(--font-size-sm)" }}>
                <span>{item.qty}x {item.description}</span>
                <span>{formatCurrency(item.total)}</span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: "var(--font-size-sm)", color: "var(--text-secondary)" }}>
            <span>Subtotal</span><span>{formatCurrency(receipt.subtotal)}</span>
          </div>
          {receipt.tips > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: "var(--font-size-sm)", color: "var(--text-secondary)" }}>
              <span>Tips</span><span>{formatCurrency(receipt.tips)}</span>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "var(--space-sm)", fontSize: "var(--font-size-lg)", fontWeight: 700 }}>
            <span>Total</span><span>{formatCurrency(receipt.total)}</span>
          </div>

          <div className="modal-actions" style={{ marginTop: "var(--space-xl)" }}>
            <button className="btn-primary" onClick={onTabClosed} style={{ width: "100%" }}>Done</button>
          </div>
        </div>
      </div>
    );
  }

  // Payment form
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">Payment</h2>

        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-md)", padding: "var(--space-md)", background: "var(--bg-card)", borderRadius: "var(--radius-md)" }}>
          <span style={{ color: "var(--text-secondary)" }}>Balance Due</span>
          <span style={{ fontSize: "var(--font-size-xl)", fontWeight: 700, color: balanceDue > 0 ? "var(--accent-amber)" : "var(--accent-green)" }}>
            {formatCurrency(balanceDue)}
          </span>
        </div>

        {/* Payment type */}
        <div className="form-group">
          <label className="form-label">Payment Type</label>
          <div style={{ display: "flex", gap: "var(--space-xs)" }}>
            {(["CARD", "CASH"] as PaymentType[]).map(t => (
              <button key={t} onClick={() => setPaymentType(t)}
                style={{ flex: 1, background: paymentType === t ? "var(--accent-blue)" : "var(--bg-card)", color: paymentType === t ? "white" : "var(--text-secondary)", border: `1px solid ${paymentType === t ? "var(--accent-blue)" : "var(--border-color)"}`, borderRadius: "var(--radius-md)", padding: "var(--space-sm)", fontSize: "var(--font-size-base)", fontWeight: 600, minHeight: "var(--touch-target)" }}>
                {t === "CARD" ? "💳 Card" : "💵 Cash"}
              </button>
            ))}
          </div>
        </div>

        {/* Amount */}
        <div className="form-group">
          <label className="form-label">Amount</label>
          <input type="number" step="0.01" min="0" value={amount} onChange={e => setAmount(e.target.value)} />
        </div>

        {/* Tip */}
        <div className="form-group">
          <label className="form-label">Tip</label>
          <div style={{ display: "flex", gap: "var(--space-xs)", marginBottom: "var(--space-sm)" }}>
            {tipPresets.map(pct => (
              <button key={pct} onClick={() => handleTipPreset(pct)}
                style={{ flex: 1, background: "var(--bg-card)", color: "var(--text-secondary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-sm)", padding: "4px", fontSize: "var(--font-size-sm)", minHeight: 32 }}>
                {pct === 0 ? "None" : `${pct}%`}
              </button>
            ))}
          </div>
          <input type="number" step="0.01" min="0" value={tip} onChange={e => setTip(e.target.value)} />
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="modal-actions">
          <button className="btn-ghost" onClick={onClose} disabled={submitting}>Cancel</button>
          <button className="btn-success" onClick={handleSubmit} disabled={submitting} style={{ minWidth: 120 }}>
            {submitting ? "Processing..." : `Pay ${formatCurrency(parseFloat(amount) || 0)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
