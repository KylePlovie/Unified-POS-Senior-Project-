import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { User } from "../types";
import { auth as authApi, setCurrentUser } from "../services/api";

interface AuthContextType { user: User | null; login: (pin: string) => Promise<void>; logout: () => void; isManager: boolean; }
const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const login = useCallback(async (pin: string) => { const u = await authApi.login(pin); setCurrentUser(u.id); setUser(u); }, []);
  const logout = useCallback(() => { setCurrentUser(null); setUser(null); }, []);
  return <AuthContext.Provider value={{ user, login, logout, isManager: user?.role === "MANAGER" || user?.role === "ADMIN" }}>{children}</AuthContext.Provider>;
}

export function useAuth() { const ctx = useContext(AuthContext); if (!ctx) throw new Error("useAuth must be used inside AuthProvider"); return ctx; }
