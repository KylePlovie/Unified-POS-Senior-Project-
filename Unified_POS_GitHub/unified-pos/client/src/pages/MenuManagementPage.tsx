import { useState, useEffect } from "react";
import { menu as menuApi } from "../services/api";
import type { MenuItem, BarLocation } from "../types";
import { formatCurrency, formatBarLocation } from "../utils/formatting";

interface Props { onBack: () => void; }

const BARS: BarLocation[] = ["I_BAR", "SERVICE_BAR", "QUICKIE_BAR"];
const DEFAULT_CATEGORIES = ["Beer - Draft", "Beer - Bottle", "Cocktail", "Shot", "Wine", "Non-Alcoholic"];

export default function MenuManagementPage({ onBack }: Props) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ mode: "create" | "edit"; item?: MenuItem } | null>(null);
  const [form, setForm] = useState({ name: "", category: "", customCategory: "", price: "", availableBars: [...BARS] as BarLocation[] });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [filterCat, setFilterCat] = useState<string>("ALL");

  useEffect(() => { menuApi.listAll().then(setItems).finally(() => setLoading(false)); }, []);

  const categories = [...new Set(items.map(i => i.category))];
  const filteredItems = filterCat === "ALL" ? items : items.filter(i => i.category === filterCat);

  const openCreate = () => {
    setForm({ name: "", category: DEFAULT_CATEGORIES[0], customCategory: "", price: "", availableBars: [...BARS] });
    setModal({ mode: "create" }); setError("");
  };

  const openEdit = (item: MenuItem) => {
    const bars = item.availableAt.split(",") as BarLocation[];
    setForm({ name: item.name, category: item.category, customCategory: "", price: item.price.toString(), availableBars: bars });
    setModal({ mode: "edit", item }); setError("");
  };

  const toggleBar = (bar: BarLocation) => {
    setForm(f => {
      const has = f.availableBars.includes(bar);
      if (has && f.availableBars.length === 1) return f; // must have at least 1
      return { ...f, availableBars: has ? f.availableBars.filter(b => b !== bar) : [...f.availableBars, bar] };
    });
  };

  const handleSubmit = async () => {
    const cat = form.customCategory.trim() || form.category;
    if (!form.name.trim()) { setError("Name is required"); return; }
    if (!cat) { setError("Category is required"); return; }
    const price = parseFloat(form.price);
    if (isNaN(price) || price < 0) { setError("Enter a valid price"); return; }
    setSubmitting(true); setError("");
    try {
      const data = { name: form.name.trim(), category: cat, price, availableAt: form.availableBars.join(",") };
      if (modal?.mode === "create") { await menuApi.create(data); }
      else if (modal?.item) { await menuApi.update(modal.item.id, data); }
      setModal(null);
      setItems(await menuApi.listAll());
    } catch (err: any) { setError(err.message || "Failed to save"); }
    finally { setSubmitting(false); }
  };

  const handleRemove = async (item: MenuItem) => {
    if (!confirm(`Remove "${item.name}" from the menu?`)) return;
    try { await menuApi.remove(item.id); setItems(await menuApi.listAll()); }
    catch (err: any) { alert(err.message || "Failed to remove"); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-md)" }}>
          <button className="btn-ghost" onClick={onBack} style={{ minHeight: 36, padding: "4px 12px" }}>← Back</button>
          <h1 style={{ fontSize: "var(--font-size-lg)", fontWeight: 600 }}>Menu Management</h1>
        </div>
        <button className="btn-primary" onClick={openCreate}>+ Add Item</button>
      </div>

      {/* Category filter */}
      <div style={{ display: "flex", gap: "var(--space-xs)", padding: "var(--space-sm) var(--space-lg)", borderBottom: "1px solid var(--border-color)", background: "var(--bg-secondary)", overflowX: "auto" }}>
        <button onClick={() => setFilterCat("ALL")}
          style={{ background: filterCat === "ALL" ? "var(--accent-blue)" : "transparent", color: filterCat === "ALL" ? "white" : "var(--text-secondary)", border: "1px solid transparent", borderRadius: "var(--radius-md)", padding: "var(--space-sm) var(--space-md)", fontSize: "var(--font-size-sm)", fontWeight: 500, minHeight: 36, whiteSpace: "nowrap" }}>
          All ({items.length})
        </button>
        {categories.map(cat => {
          const count = items.filter(i => i.category === cat).length;
          return (
            <button key={cat} onClick={() => setFilterCat(cat)}
              style={{ background: filterCat === cat ? "var(--accent-blue)" : "transparent", color: filterCat === cat ? "white" : "var(--text-secondary)", border: "1px solid transparent", borderRadius: "var(--radius-md)", padding: "var(--space-sm) var(--space-md)", fontSize: "var(--font-size-sm)", fontWeight: 500, minHeight: 36, whiteSpace: "nowrap" }}>
              {cat} ({count})
            </button>
          );
        })}
      </div>

      <div className="page-content">
        {loading ? <p style={{ color: "var(--text-muted)", textAlign: "center" }}>Loading menu...</p> : (
          <div style={{ maxWidth: 800 }}>
            {filteredItems.map(item => {
              const bars = item.availableAt.split(",") as BarLocation[];
              const allBars = bars.length === 3;
              return (
                <div key={item.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-sm)", padding: "var(--space-md)", opacity: item.active ? 1 : 0.5 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>
                      {item.name}
                      {!item.active && <span style={{ marginLeft: 8, fontSize: "var(--font-size-sm)", color: "var(--accent-red)" }}>(Removed)</span>}
                    </div>
                    <div style={{ fontSize: "var(--font-size-sm)", color: "var(--text-secondary)", display: "flex", gap: "var(--space-md)", marginTop: 2 }}>
                      <span>{item.category}</span>
                      <span style={{ color: "var(--accent-green)", fontWeight: 600 }}>{formatCurrency(item.price)}</span>
                      <span style={{ color: allBars ? "var(--text-muted)" : "var(--accent-amber)" }}>
                        {allBars ? "All bars" : bars.map(b => formatBarLocation(b)).join(", ")}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "var(--space-sm)" }}>
                    <button className="btn-ghost" onClick={() => openEdit(item)} style={{ fontSize: "var(--font-size-sm)", minHeight: 32, padding: "4px 12px" }}>Edit</button>
                    {item.active && (
                      <button className="btn-danger" onClick={() => handleRemove(item)} style={{ fontSize: "var(--font-size-sm)", minHeight: 32, padding: "4px 12px" }}>Remove</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <h2 className="modal-title">{modal.mode === "create" ? "Add Menu Item" : `Edit ${modal.item?.name}`}</h2>

            <div className="form-group">
              <label className="form-label">Name</label>
              <input type="text" placeholder="e.g. Blue Moon Draft" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ width: "100%", marginBottom: "var(--space-sm)" }}>
                {DEFAULT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                <option value="__custom">Custom category...</option>
              </select>
              {form.category === "__custom" && (
                <input type="text" placeholder="e.g. Specialty" value={form.customCategory} onChange={e => setForm(f => ({ ...f, customCategory: e.target.value }))} />
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Price ($)</label>
              <input type="number" step="0.25" min="0" placeholder="0.00" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
            </div>

            <div className="form-group">
              <label className="form-label">Available at</label>
              <div style={{ display: "flex", gap: "var(--space-xs)" }}>
                {BARS.map(bar => {
                  const active = form.availableBars.includes(bar);
                  return (
                    <button key={bar} onClick={() => toggleBar(bar)} type="button"
                      style={{ flex: 1, background: active ? "var(--accent-blue)" : "var(--bg-card)", color: active ? "white" : "var(--text-secondary)", border: `1px solid ${active ? "var(--accent-blue)" : "var(--border-color)"}`, borderRadius: "var(--radius-md)", padding: "var(--space-sm)", fontSize: "var(--font-size-sm)", fontWeight: 500, minHeight: "var(--touch-target)" }}>
                      {formatBarLocation(bar)}
                    </button>
                  );
                })}
              </div>
              <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 4 }}>
                Items not available at a bar will trigger a cross-bar request when ordered there.
              </p>
            </div>

            {error && <p className="form-error">{error}</p>}

            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setModal(null)} disabled={submitting}>Cancel</button>
              <button className="btn-primary" onClick={handleSubmit} disabled={submitting} style={{ minWidth: 100 }}>
                {submitting ? "Saving..." : modal.mode === "create" ? "Add Item" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
