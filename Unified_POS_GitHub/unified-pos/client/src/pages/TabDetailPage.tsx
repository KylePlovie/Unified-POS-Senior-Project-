import { useState, useEffect, useCallback } from "react";
import { tabs as tabsApi } from "../services/api";
import type { Tab } from "../types";
import TabDetail from "../components/tabs/TabDetail";

interface Props { tabId: string; onBack: () => void; }

export default function TabDetailPage({ tabId, onBack }: Props) {
  const [tab, setTab] = useState<Tab | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchTab = useCallback(async () => {
    try { const data = await tabsApi.get(tabId); setTab(data); setError(""); }
    catch (err: any) { setError(err.message || "Failed to load tab"); }
    finally { setLoading(false); }
  }, [tabId]);

  useEffect(() => { fetchTab(); }, [fetchTab]);

  if (loading) return <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}><p style={{ color: "var(--text-muted)" }}>Loading tab...</p></div>;
  if (error || !tab) return <div className="page" style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "var(--space-md)" }}><p style={{ color: "var(--accent-red)" }}>{error || "Tab not found"}</p><button className="btn-ghost" onClick={onBack}>← Back</button></div>;

  return <div className="page"><TabDetail tab={tab} onTabUpdated={fetchTab} onClose={onBack} /></div>;
}
