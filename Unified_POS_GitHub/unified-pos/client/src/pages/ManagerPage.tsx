import { useState, useEffect } from "react";
import { manager as managerApi, tabs as tabsApi, users as usersApi } from "../services/api";
import type { Tab, AuditLog, LineItem } from "../types";
import type { UserFull } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { formatBarLocation, formatCurrency, formatDate } from "../utils/formatting";

interface Props { onBack: () => void; }
type ManagerView = "actions" | "audit" | "staff";

const ROLE_LABELS: Record<string, string> = { ADMIN: "Administrator", MANAGER: "Manager", BARTENDER: "Bartender", SERVER: "Server" };
const ROLE_COLORS: Record<string, string> = { ADMIN: "var(--accent-red)", MANAGER: "var(--accent-purple)", BARTENDER: "var(--accent-blue)", SERVER: "var(--accent-green)" };

export default function ManagerPage({ onBack }: Props) {
  const { user: currentUser } = useAuth();
  const [view, setView] = useState<ManagerView>("actions");
  const [openTabs, setOpenTabs] = useState<Tab[]>([]);
  const [selectedTab, setSelectedTab] = useState<Tab | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [staffList, setStaffList] = useState<UserFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionModal, setActionModal] = useState<{ type: "void" | "comp"; item: LineItem } | null>(null);
  const [staffModal, setStaffModal] = useState<{ mode: "create" | "edit"; user?: UserFull } | null>(null);
  const [reason, setReason] = useState("");
  const [staffForm, setStaffForm] = useState({ name: "", pin: "", role: "SERVER" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    if (view === "actions") {
      tabsApi.list("OPEN").then(setOpenTabs).finally(() => setLoading(false));
    } else if (view === "audit") {
      managerApi.auditLog(100).then(setAuditLogs).finally(() => setLoading(false));
    } else {
      usersApi.listAll().then(setStaffList).finally(() => setLoading(false));
    }
  }, [view]);

  const handleSelectTab = async (tab: Tab) => { const full = await tabsApi.get(tab.id); setSelectedTab(full); };

  const handleAction = async () => {
    if (!actionModal || !reason.trim()) { setError("Reason is required"); return; }
    setSubmitting(true); setError("");
    try {
      if (actionModal.type === "void") await managerApi.voidItem(actionModal.item.id, reason);
      else await managerApi.compItem(actionModal.item.id, reason);
      setActionModal(null); setReason("");
      if (selectedTab) { const updated = await tabsApi.get(selectedTab.id); setSelectedTab(updated); }
    } catch (err: any) { setError(err.message || "Action failed"); }
    finally { setSubmitting(false); }
  };

  const openCreateModal = () => {
    setStaffForm({ name: "", pin: "", role: "SERVER" });
    setStaffModal({ mode: "create" });
    setError("");
  };

  const openEditModal = (u: UserFull) => {
    setStaffForm({ name: u.name, pin: u.pin, role: u.role });
    setStaffModal({ mode: "edit", user: u });
    setError("");
  };

  const handleStaffSubmit = async () => {
    if (!staffForm.name.trim()) { setError("Name is required"); return; }
    if (staffForm.pin.length !== 4) { setError("PIN must be 4 digits"); return; }
    setSubmitting(true); setError("");
    try {
      if (staffModal?.mode === "create") {
        await usersApi.create(staffForm);
      } else if (staffModal?.user) {
        await usersApi.update(staffModal.user.id, staffForm);
      }
      setStaffModal(null);
      const updated = await usersApi.listAll();
      setStaffList(updated);
    } catch (err: any) { setError(err.message || "Failed to save user"); }
    finally { setSubmitting(false); }
  };

  const handleDeactivate = async (u: UserFull) => {
    if (!confirm(`Deactivate ${u.name}? They won't be able to log in.`)) return;
    try { await usersApi.deactivate(u.id); setStaffList(await usersApi.listAll()); }
    catch (err: any) { alert(err.message || "Failed to deactivate user"); }
  };

  const handleReactivate = async (u: UserFull) => {
    try { await usersApi.reactivate(u.id); setStaffList(await usersApi.listAll()); }
    catch (err: any) { alert(err.message || "Failed to reactivate user"); }
  };

  const tabBtn = (v: ManagerView, label: string) => (
    <button onClick={() => setView(v)}
      style={{ background: view === v ? "var(--accent-blue)" : "transparent", color: view === v ? "white" : "var(--text-secondary)", border: "1px solid transparent", borderRadius: "var(--radius-md)", padding: "var(--space-sm) var(--space-md)", fontSize: "var(--font-size-sm)", fontWeight: 500, minHeight: 36 }}>
      {label}
    </button>
  );

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)" }}>
          <button className="btn-ghost" onClick={onBack} style={{ minHeight: 36, padding: "4px 12px" }}>← Back</button>
          <h1 style={{ fontSize: "var(--font-size-lg)", fontWeight: 600 }}>Manager Panel</h1>
        </div>
        <div style={{ display: "flex", gap: "var(--space-xs)" }}>
          {tabBtn("actions", "Void / Comp")}
          {tabBtn("staff", "Staff")}
          {tabBtn("audit", "Audit Log")}
        </div>
      </div>

      <div className="page-content">
        {loading ? <p style={{ color: "var(--text-muted)", textAlign: "center" }}>Loading...</p>

        /* ---- VOID / COMP ---- */
        : view === "actions" ? (
          <div style={{ display: "flex", gap: "var(--space-lg)", height: "100%" }}>
            <div style={{ width: 280, flexShrink: 0, overflowY: "auto" }}>
              <h3 style={{ fontSize: "var(--font-size-sm)", color: "var(--text-muted)", marginBottom: "var(--space-sm)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Open Tabs</h3>
              {openTabs.map(tab => (
                <div key={tab.id} onClick={() => handleSelectTab(tab)} className="card"
                  style={{ cursor: "pointer", marginBottom: "var(--space-sm)", padding: "var(--space-md)", borderColor: selectedTab?.id === tab.id ? "var(--accent-blue)" : "var(--border-color)" }}>
                  <div style={{ fontWeight: 600 }}>{tab.customerName || `Lane ${tab.laneNumber}`}</div>
                  <div style={{ fontSize: "var(--font-size-sm)", color: "var(--text-secondary)" }}>{formatBarLocation(tab.barLocation)} · {tab.lineItems?.length || 0} items</div>
                </div>
              ))}
            </div>
            <div style={{ flex: 1 }}>
              {!selectedTab ? <p style={{ color: "var(--text-muted)", textAlign: "center", marginTop: "var(--space-xl)" }}>Select a tab to manage items</p> : (
                <>
                  <h3 style={{ fontSize: "var(--font-size-lg)", fontWeight: 600, marginBottom: "var(--space-md)" }}>{selectedTab.customerName || `Lane ${selectedTab.laneNumber}`}</h3>
                  {selectedTab.lineItems?.map(li => (
                    <div key={li.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-sm)", padding: "var(--space-md)" }}>
                      <div>
                        <div style={{ fontWeight: 500 }}>{li.quantity}x {li.description}</div>
                        <div style={{ fontSize: "var(--font-size-sm)", color: "var(--text-secondary)" }}>
                          <span className={`badge badge-${li.status.toLowerCase()}`}>{li.status}</span>
                          {li.voidReason && <span style={{ marginLeft: 8, color: "var(--accent-red)" }}>Reason: {li.voidReason}</span>}
                          {li.compReason && <span style={{ marginLeft: 8, color: "var(--accent-purple)" }}>Reason: {li.compReason}</span>}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "var(--space-sm)", alignItems: "center" }}>
                        <span style={{ fontWeight: 600 }}>{formatCurrency(li.unitPrice * li.quantity)}</span>
                        {li.status !== "VOIDED" && li.status !== "COMPED" && (
                          <>
                            <button className="btn-danger" onClick={() => { setActionModal({ type: "void", item: li }); setReason(""); setError(""); }}
                              style={{ fontSize: "var(--font-size-sm)", minHeight: 32, padding: "4px 12px" }}>Void</button>
                            <button style={{ background: "var(--accent-purple)", color: "white", fontSize: "var(--font-size-sm)", minHeight: 32, padding: "4px 12px", borderRadius: "var(--radius-md)" }}
                              onClick={() => { setActionModal({ type: "comp", item: li }); setReason(""); setError(""); }}>Comp</button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

        /* ---- STAFF MANAGEMENT ---- */
        ) : view === "staff" ? (
          <div style={{ maxWidth: 700 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-lg)" }}>
              <h3 style={{ fontSize: "var(--font-size-lg)", fontWeight: 600 }}>Staff Management</h3>
              <button className="btn-primary" onClick={openCreateModal}>+ Add Staff</button>
            </div>
            {staffList.map(u => (
              <div key={u.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-sm)", padding: "var(--space-md)", opacity: u.active ? 1 : 0.5 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--bg-hover)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, fontSize: "var(--font-size-sm)", color: "var(--text-primary)" }}>
                    {u.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>
                      {u.name}
                      {!u.active && <span style={{ marginLeft: 8, fontSize: "var(--font-size-sm)", color: "var(--accent-red)" }}>(Inactive)</span>}
                    </div>
                    <div style={{ fontSize: "var(--font-size-sm)", display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
                      <span style={{ color: ROLE_COLORS[u.role] || "var(--text-secondary)", fontWeight: 500 }}>{ROLE_LABELS[u.role] || u.role}</span>
                      <span style={{ color: "var(--text-muted)" }}>PIN: {u.pin}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "var(--space-sm)" }}>
                  {u.role !== "ADMIN" && (
                    <>
                      <button className="btn-ghost" onClick={() => openEditModal(u)}
                        style={{ fontSize: "var(--font-size-sm)", minHeight: 32, padding: "4px 12px" }}>Edit</button>
                      {u.active ? (
                        <button className="btn-danger" onClick={() => handleDeactivate(u)}
                          style={{ fontSize: "var(--font-size-sm)", minHeight: 32, padding: "4px 12px" }}>Deactivate</button>
                      ) : (
                        <button className="btn-success" onClick={() => handleReactivate(u)}
                          style={{ fontSize: "var(--font-size-sm)", minHeight: 32, padding: "4px 12px" }}>Reactivate</button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

        /* ---- AUDIT LOG ---- */
        ) : (
          <div style={{ maxWidth: 800 }}>
            <h3 style={{ fontSize: "var(--font-size-lg)", fontWeight: 600, marginBottom: "var(--space-md)" }}>Audit Log</h3>
            {auditLogs.length === 0 ? <p style={{ color: "var(--text-muted)" }}>No audit entries yet.</p> : (
              auditLogs.map(log => (
                <div key={log.id} className="card" style={{ marginBottom: "var(--space-sm)", padding: "var(--space-md)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span className={`badge ${log.actionType === "VOID" ? "badge-voided" : log.actionType === "COMP" ? "badge-comped" : log.actionType === "TRANSFER" ? "badge-sent" : "badge-closed"}`}>
                      {log.actionType}
                    </span>
                    <span style={{ fontSize: "var(--font-size-sm)", color: "var(--text-muted)" }}>{formatDate(log.timestamp)}</span>
                  </div>
                  <div style={{ fontSize: "var(--font-size-sm)" }}>{log.description}</div>
                  <div style={{ fontSize: "var(--font-size-sm)", color: "var(--text-secondary)", marginTop: 2 }}>By: {log.performedBy.name}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Void/Comp modal */}
      {actionModal && (
        <div className="modal-overlay" onClick={() => setActionModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">{actionModal.type === "void" ? "Void" : "Comp"} Item</h2>
            <p style={{ marginBottom: "var(--space-md)", color: "var(--text-secondary)" }}>
              {actionModal.item.quantity}x {actionModal.item.description} — {formatCurrency(actionModal.item.unitPrice * actionModal.item.quantity)}
            </p>
            <div className="form-group">
              <label className="form-label">Reason</label>
              <input type="text" placeholder={actionModal.type === "void" ? "e.g. Wrong item ordered" : "e.g. Customer complaint"} value={reason} onChange={e => setReason(e.target.value)} autoFocus />
            </div>
            {error && <p className="form-error">{error}</p>}
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setActionModal(null)} disabled={submitting}>Cancel</button>
              <button className={actionModal.type === "void" ? "btn-danger" : "btn-primary"} onClick={handleAction} disabled={submitting}
                style={{ minWidth: 100, background: actionModal.type === "comp" ? "var(--accent-purple)" : undefined }}>
                {submitting ? "..." : actionModal.type === "void" ? "Void Item" : "Comp Item"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Create/Edit modal */}
      {staffModal && (
        <div className="modal-overlay" onClick={() => setStaffModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">{staffModal.mode === "create" ? "Add Staff Member" : `Edit ${staffModal.user?.name}`}</h2>

            <div className="form-group">
              <label className="form-label">Name</label>
              <input type="text" placeholder="e.g. John Smith" value={staffForm.name} onChange={e => setStaffForm(f => ({ ...f, name: e.target.value }))} autoFocus />
            </div>

            <div className="form-group">
              <label className="form-label">PIN (4 digits)</label>
              <input type="text" maxLength={4} placeholder="e.g. 1234" value={staffForm.pin}
                onChange={e => { const v = e.target.value.replace(/\D/g, "").slice(0, 4); setStaffForm(f => ({ ...f, pin: v })); }} />
            </div>

            <div className="form-group">
              <label className="form-label">Role</label>
              <div style={{ display: "flex", gap: "var(--space-xs)" }}>
                {(["SERVER", "BARTENDER", "MANAGER"] as const).map(r => (
                  <button key={r} onClick={() => setStaffForm(f => ({ ...f, role: r }))} type="button"
                    style={{ flex: 1, background: staffForm.role === r ? ROLE_COLORS[r] : "var(--bg-card)", color: staffForm.role === r ? "white" : "var(--text-secondary)", border: `1px solid ${staffForm.role === r ? ROLE_COLORS[r] : "var(--border-color)"}`, borderRadius: "var(--radius-md)", padding: "var(--space-sm)", fontSize: "var(--font-size-sm)", fontWeight: 500, minHeight: "var(--touch-target)" }}>
                    {ROLE_LABELS[r]}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="form-error">{error}</p>}

            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setStaffModal(null)} disabled={submitting}>Cancel</button>
              <button className="btn-primary" onClick={handleStaffSubmit} disabled={submitting} style={{ minWidth: 100 }}>
                {submitting ? "Saving..." : staffModal.mode === "create" ? "Add Staff" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
