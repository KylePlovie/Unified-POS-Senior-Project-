import { useState, useEffect } from "react";
import type { MenuItem, BarLocation } from "../../types";
import { loadMenu, getCategories, getItemsByCategory, isAvailableAt, isMenuLoaded, searchMenu, getPopularItems } from "../../services/menu";
import { formatCurrency } from "../../utils/formatting";

interface Props { tabId: string; tabBarLocation: BarLocation; onAddItem: (item: MenuItem, qty: number) => Promise<void>; disabled?: boolean; }

const POPULAR_TAB = "__popular";
const SEARCH_TAB = "__search";

export default function OrderEntry({ tabId, tabBarLocation, onAddItem, disabled }: Props) {
  const [menuLoaded, setMenuLoaded] = useState(isMenuLoaded());
  const [activeCat, setActiveCat] = useState(POPULAR_TAB);
  const [adding, setAdding] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!isMenuLoaded()) {
      loadMenu().then(() => { setMenuLoaded(true); });
    }
  }, []);

  const categories = menuLoaded ? getCategories() : [];
  const popularItems = getPopularItems();
  const hasPopular = popularItems.length > 0;

  // Determine which items to show
  let items: MenuItem[] = [];
  if (searchQuery.trim()) {
    items = searchMenu(searchQuery);
  } else if (activeCat === POPULAR_TAB) {
    items = hasPopular ? popularItems : (categories.length > 0 ? getItemsByCategory(categories[0]) : []);
  } else {
    items = getItemsByCategory(activeCat);
  }

  const handleAdd = async (item: MenuItem) => {
    if (disabled || adding) return;
    setAdding(item.id);
    try { await onAddItem(item, 1); }
    catch (err) { console.error("Failed to add item:", err); }
    finally { setAdding(null); }
  };

  const handleCatClick = (cat: string) => {
    setActiveCat(cat);
    setSearchQuery("");
  };

  if (!menuLoaded) {
    return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, color: "var(--text-muted)" }}>Loading menu...</div>;
  }

  const isSearching = searchQuery.trim().length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      {/* Search bar */}
      <div style={{ padding: "var(--space-sm) var(--space-md)", borderBottom: "1px solid var(--border-color)", background: "var(--bg-secondary)", flexShrink: 0 }}>
        <div style={{ position: "relative" }}>
          <input
            type="text"
            placeholder="Search drinks..."
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); if (e.target.value.trim()) setActiveCat(SEARCH_TAB); }}
            style={{ width: "100%", paddingLeft: 36, minHeight: 36, fontSize: "var(--font-size-sm)" }}
          />
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: "var(--font-size-sm)", pointerEvents: "none" }}>
            🔍
          </span>
          {searchQuery && (
            <button onClick={() => { setSearchQuery(""); setActiveCat(hasPopular ? POPULAR_TAB : categories[0] || ""); }}
              style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", minHeight: "auto", padding: 4, fontSize: "var(--font-size-sm)" }}>
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Category tabs */}
      {!isSearching && (
        <div style={{ display: "flex", gap: "var(--space-xs)", padding: "var(--space-sm)", overflowX: "auto", borderBottom: "1px solid var(--border-color)", background: "var(--bg-secondary)", flexShrink: 0 }}>
          {hasPopular && (
            <button onClick={() => handleCatClick(POPULAR_TAB)}
              style={{ background: activeCat === POPULAR_TAB ? "var(--accent-purple)" : "transparent", color: activeCat === POPULAR_TAB ? "white" : "var(--text-secondary)", border: "1px solid transparent", borderRadius: "var(--radius-md)", padding: "var(--space-sm) var(--space-md)", fontSize: "var(--font-size-sm)", fontWeight: 500, whiteSpace: "nowrap", minHeight: 36 }}>
              ★ Popular
            </button>
          )}
          {categories.map(cat => (
            <button key={cat} onClick={() => handleCatClick(cat)}
              style={{ background: activeCat === cat ? "var(--accent-blue)" : "transparent", color: activeCat === cat ? "white" : "var(--text-secondary)", border: "1px solid transparent", borderRadius: "var(--radius-md)", padding: "var(--space-sm) var(--space-md)", fontSize: "var(--font-size-sm)", fontWeight: 500, whiteSpace: "nowrap", minHeight: 36 }}>
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Search results label */}
      {isSearching && (
        <div style={{ padding: "var(--space-sm) var(--space-md)", fontSize: "var(--font-size-sm)", color: "var(--text-muted)", borderBottom: "1px solid var(--border-color)", background: "var(--bg-secondary)", flexShrink: 0 }}>
          {items.length} result{items.length !== 1 ? "s" : ""} for "{searchQuery}"
        </div>
      )}

      {/* Popular label */}
      {!isSearching && activeCat === POPULAR_TAB && hasPopular && (
        <div style={{ padding: "var(--space-sm) var(--space-md)", fontSize: "var(--font-size-sm)", color: "var(--text-muted)", borderBottom: "1px solid var(--border-color)", background: "var(--bg-secondary)", flexShrink: 0 }}>
          Frequently ordered this shift
        </div>
      )}

      {/* Item grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--space-sm)", padding: "var(--space-md)", overflowY: "auto", flex: 1, alignContent: "start" }}>
        {items.length === 0 ? (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", color: "var(--text-muted)", padding: "var(--space-xl)", fontSize: "var(--font-size-sm)" }}>
            {isSearching ? "No drinks match your search." : !hasPopular ? "Start ordering to build your popular items list." : "No items in this category."}
          </div>
        ) : items.map(item => {
          const available = isAvailableAt(item, tabBarLocation);
          return (
            <button key={item.id} onClick={() => handleAdd(item)} disabled={disabled || adding !== null}
              style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 6,
                background: adding === item.id ? "rgba(34,197,94,0.1)" : "var(--bg-card)",
                border: `1px solid ${adding === item.id ? "var(--accent-green)" : !available ? "rgba(245,158,11,0.4)" : "var(--border-color)"}`,
                borderRadius: "var(--radius-md)", padding: "var(--space-sm) var(--space-md)", minHeight: 44, maxHeight: 52,
                cursor: disabled ? "not-allowed" : "pointer", transition: "all 0.15s" }}>
              <span style={{ fontWeight: 600, fontSize: "var(--font-size-sm)", color: "var(--text-primary)", lineHeight: 1.2, textAlign: "left", flex: 1 }}>{item.name}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                {!available && (
                  <span style={{ fontSize: "0.6rem", color: "var(--accent-amber)", textTransform: "uppercase", letterSpacing: "0.03em" }}>
                    Request
                  </span>
                )}
                <span style={{ fontSize: "var(--font-size-sm)", color: "var(--accent-green)", fontWeight: 600 }}>{formatCurrency(item.price)}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
