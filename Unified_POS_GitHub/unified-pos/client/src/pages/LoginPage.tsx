import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";

export default function LoginPage() {
  const { login } = useAuth();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDigit = (d: string) => { if (pin.length < 4) { setPin((p) => p + d); setError(""); } };
  const handleClear = () => { setPin(""); setError(""); };

  useEffect(() => {
    if (pin.length === 4 && !loading) {
      setLoading(true);
      login(pin).catch((err: any) => { setError(err.message || "Invalid PIN"); setPin(""); }).finally(() => setLoading(false));
    }
  }, [pin]);

  return (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", padding: "var(--space-xl)" }}>
        <h1 style={{ fontSize: "var(--font-size-2xl)", fontWeight: 700, marginBottom: 4 }}>Unified POS</h1>
        <p style={{ color: "var(--text-secondary)", marginBottom: "var(--space-xl)" }}>Enter your PIN to clock in</p>
        <div style={{ display: "flex", gap: "var(--space-md)", justifyContent: "center", marginBottom: "var(--space-lg)" }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid var(--text-muted)", background: i < pin.length ? "var(--accent-blue)" : "transparent", borderColor: i < pin.length ? "var(--accent-blue)" : "var(--text-muted)", transition: "all 0.15s" }} />
          ))}
        </div>
        {error && <p style={{ color: "var(--accent-red)", marginBottom: "var(--space-md)", fontSize: "var(--font-size-sm)" }}>{error}</p>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "var(--space-sm)", maxWidth: 280, margin: "0 auto" }}>
          {["1","2","3","4","5","6","7","8","9","","0","←"].map(key =>
            key === "" ? <div key="empty" /> : (
              <button key={key} onClick={() => key === "←" ? handleClear() : handleDigit(key)} disabled={loading}
                style={{ fontSize: "var(--font-size-xl)", fontWeight: 600, background: "var(--bg-card)", color: "var(--text-primary)", border: "1px solid var(--border-color)", minHeight: 64, borderRadius: "var(--radius-md)" }}>
                {key}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
