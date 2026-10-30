import type { BarLocation } from "../types";

export const BAR_LABELS: Record<BarLocation, string> = { I_BAR: "I-Bar", SERVICE_BAR: "Service Bar", QUICKIE_BAR: "Quickie Bar" };
export const BAR_COLORS: Record<BarLocation, string> = { I_BAR: "#3b82f6", SERVICE_BAR: "#8b5cf6", QUICKIE_BAR: "#f59e0b" };
export function formatBarLocation(bar: BarLocation | string): string { return BAR_LABELS[bar as BarLocation] || bar; }
export function formatCurrency(amount: number): string { return `$${amount.toFixed(2)}`; }
export function formatTime(isoString: string): string { return new Date(isoString).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }); }
export function formatDate(isoString: string): string { return new Date(isoString).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); }
