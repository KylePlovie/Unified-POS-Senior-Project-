import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from "react";

interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
}

interface ToastContextType {
  toast: (message: string, type?: "success" | "error" | "info") => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
    const id = nextId++;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const colors = {
    success: { bg: "rgba(34,197,94,0.15)", border: "var(--accent-green)", text: "var(--accent-green)" },
    error: { bg: "rgba(239,68,68,0.15)", border: "var(--accent-red)", text: "var(--accent-red)" },
    info: { bg: "rgba(59,130,246,0.15)", border: "var(--accent-blue)", text: "var(--accent-blue)" },
  };

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      {/* Toast container */}
      <div style={{
        position: "fixed", bottom: 20, right: 20, zIndex: 200,
        display: "flex", flexDirection: "column", gap: 8, pointerEvents: "none",
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: colors[t.type].bg, border: `1px solid ${colors[t.type].border}`,
            color: colors[t.type].text, padding: "10px 16px", borderRadius: "var(--radius-md)",
            fontSize: "var(--font-size-sm)", fontWeight: 500, backdropFilter: "blur(8px)",
            animation: "slideIn 0.2s ease-out", pointerEvents: "auto", maxWidth: 360,
          }}>
            {t.type === "success" && "✓ "}{t.type === "error" && "✕ "}{t.message}
          </div>
        ))}
      </div>
      <style>{`@keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
