import { useState } from "react";
import type { Tab, MenuItem } from "../../types";
import { orders as ordersApi, barRequests } from "../../services/api";
import { resolveRouteTo, needsCrossBarRequest, getAvailableBars, trackOrder } from "../../services/menu";
import { formatBarLocation, formatCurrency } from "../../utils/formatting";
import { useToast } from "../common/Toast";
import OrderEntry from "../orders/OrderEntry";
import PaymentModal from "../payments/PaymentModal";

interface Props { tab: Tab; onTabUpdated: () => void; onClose: () => void; }

export default function TabDetail({ tab, onTabUpdated, onClose }: Props) {
  const [sendingItems, setSendingItems] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const { toast } = useToast();

  const activeItems = tab.lineItems?.filter(li => li.status !== "VOIDED") || [];
  const subtotal = activeItems.reduce((sum, li) => sum + li.unitPrice * li.quantity, 0);
  const pendingItems = activeItems.filter(li => li.status === "PENDING");

  const handleAddItem = async (item: MenuItem, qty: number) => {
    setError("");
    try {
      const routeTo = resolveRouteTo(item, tab.barLocation);
      const lineItem = await ordersApi.addItem({ tabId: tab.id, description: item.name, category: item.category, quantity: qty, unitPrice: item.price, routeTo });

      // Track for popular items
      trackOrder(item.id);

      // If this drink isn't available at the tab's bar, create a cross-bar request
      if (needsCrossBarRequest(item, tab.barLocation)) {
        const sourceBar = getAvailableBars(item)[0];
        await barRequests.create({
          fromBar: tab.barLocation,
          toBar: sourceBar,
          itemDescription: `${qty}x ${item.name}`,
          quantity: qty,
          notes: `For tab: ${tab.customerName || `Lane ${tab.laneNumber}`}`,
          lineItemId: lineItem.id,
          tabId: tab.id,
        });
        toast(`Request sent to ${formatBarLocation(sourceBar)} for ${item.name}`, "info");
      } else {
        toast(`Added ${item.name}`, "success");
      }

      onTabUpdated();
    } catch (err: any) { setError(err.message || "Failed to add item"); toast(err.message || "Failed to add item", "error"); }
  };

  const handleSendItem = async (itemId: string) => {
    setSendingItems(prev => new Set(prev).add(itemId));
    try { await ordersApi.sendItem(itemId); onTabUpdated(); toast("Sent to bar", "success"); }
    catch (err: any) { setError(err.message || "Failed to send item"); toast(err.message || "Failed to send", "error"); }
    finally { setSendingItems(prev => { const n = new Set(prev); n.delete(itemId); return n; }); }
  };

  const handleSendAll = async () => { setError(""); for (const item of pendingItems) await handleSendItem(item.id); };

  const badge = (status: string) => {
    const m: Record<string, string> = { PENDING: "badge-pending", SENT: "badge-sent", PRINTED: "badge-printed", VOIDED: "badge-voided", COMPED: "badge-comped" };
    return m[status] || "";
  };

  return (
    <>
      <div style={{ display: "flex", flex: 1, overflow: "hidden", height: "100%" }}>
        {/* Left: Menu */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", borderRight: "1px solid var(--border-color)" }}>
          <div style={{ padding: "var(--space-md) var(--space-lg)", borderBottom: "1px solid var(--border-color)", background: "var(--bg-secondary)" }}><h2 style={{ fontSize: "var(--font-size-lg)", fontWeight: 600 }}>Menu</h2></div>
          <OrderEntry tabId={tab.id} tabBarLocation={tab.barLocation} onAddItem={handleAddItem} />
        </div>

        {/* Right: Tab sidebar */}
        <div style={{ width: 360, minWidth: 320, display: "flex", flexDirection: "column", background: "var(--bg-secondary)", overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "var(--space-md) var(--space-lg)", borderBottom: "1px solid var(--border-color)" }}>
            <div>
              <h2 style={{ fontSize: "var(--font-size-lg)", fontWeight: 600 }}>{tab.customerName || `Lane ${tab.laneNumber}`}</h2>
              <span style={{ fontSize: "var(--font-size-sm)", color: "var(--text-secondary)" }}>{formatBarLocation(tab.barLocation)}</span>
            </div>
            <button className="btn-ghost" onClick={onClose} style={{ minHeight: 36, padding: "4px 12px" }}>✕</button>
          </div>

          {error && <div style={{ padding: "var(--space-sm) var(--space-lg)", background: "rgba(239,68,68,0.1)", color: "var(--accent-red)", fontSize: "var(--font-size-sm)", borderBottom: "1px solid var(--border-color)" }}>{error}</div>}

          <div style={{ flex: 1, overflowY: "auto", padding: "var(--space-sm) 0" }}>
            {activeItems.length === 0 ? (
              <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "var(--space-xl)", fontSize: "var(--font-size-sm)" }}>No items yet. Tap a drink to add it.</p>
            ) : activeItems.map(li => (
              <div key={li.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--space-sm) var(--space-lg)", borderBottom: "1px solid rgba(71,85,105,0.4)", gap: "var(--space-sm)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: "var(--font-size-sm)", fontWeight: 500 }}>
                    {li.quantity > 1 && <span style={{ color: "var(--text-secondary)" }}>{li.quantity}x </span>}{li.description}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
                    <span className={`badge ${badge(li.status)}`}>{li.status}</span>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>→ {formatBarLocation(li.routeTo)}</span>
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", flexShrink: 0 }}>
                  <span style={{ fontSize: "var(--font-size-sm)", fontWeight: 600, minWidth: 50, textAlign: "right" }}>{formatCurrency(li.unitPrice * li.quantity)}</span>
                  {li.status === "PENDING" && (
                    <button onClick={() => handleSendItem(li.id)} disabled={sendingItems.has(li.id)}
                      style={{ background: "var(--accent-blue)", color: "white", fontSize: "0.75rem", fontWeight: 600, padding: "4px 10px", borderRadius: "var(--radius-sm)", minHeight: 28 }}>
                      {sendingItems.has(li.id) ? "..." : "Send"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ borderTop: "1px solid var(--border-color)", padding: "var(--space-md) var(--space-lg)", background: "var(--bg-primary)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-sm)", color: "var(--text-secondary)" }}>
              <span>Subtotal</span>
              <span style={{ fontSize: "var(--font-size-lg)", fontWeight: 700, color: "var(--text-primary)" }}>{formatCurrency(subtotal)}</span>
            </div>
            {pendingItems.length > 0 && (
              <button className="btn-primary" onClick={handleSendAll} style={{ width: "100%", minHeight: "var(--button-height)", fontWeight: 600, marginBottom: "var(--space-sm)" }}>
                Send All ({pendingItems.length}) to Bar
              </button>
            )}
            {activeItems.length > 0 && tab.status === "OPEN" && (
              <button className="btn-success" onClick={() => setShowPayment(true)} style={{ width: "100%", minHeight: "var(--button-height)", fontWeight: 600 }}>
                Pay / Close Tab
              </button>
            )}
          </div>
        </div>
      </div>

      {showPayment && (
        <PaymentModal
          tab={tab}
          subtotal={subtotal}
          totalPaid={tab.totalPaid || 0}
          onClose={() => setShowPayment(false)}
          onPaymentComplete={() => { setShowPayment(false); onTabUpdated(); }}
          onTabClosed={() => { setShowPayment(false); onClose(); }}
        />
      )}
    </>
  );
}
