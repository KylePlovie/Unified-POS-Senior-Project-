import type { User, Tab, LineItem, BarLocation, PaymentType, PaymentResponse, Receipt, SalesReport, AuditLog, PrintJob, MenuItem, BarRequest } from "../types";

const API_BASE = "/api";
let currentUserId: string | null = null;

export function setCurrentUser(userId: string | null) { currentUserId = userId; }

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...(options.headers as Record<string, string>) };
  if (currentUserId) headers["x-user-id"] = currentUserId;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) { const body = await res.json().catch(() => ({})); throw new Error(body.error || `Request failed: ${res.status}`); }
  return res.json();
}

export interface UserFull { id: string; name: string; role: string; pin: string; active: boolean; createdAt: string; }

export const auth = {
  login: (pin: string) => request<User>("/users/login", { method: "POST", body: JSON.stringify({ pin }) }),
  listUsers: () => request<User[]>("/users"),
};

export const users = {
  listAll: () => request<UserFull[]>("/users?all=true"),
  create: (data: { name: string; pin: string; role: string }) => request<UserFull>("/users", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: { name?: string; pin?: string; role?: string }) => request<UserFull>(`/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deactivate: (id: string) => request<{ success: boolean }>(`/users/${id}`, { method: "DELETE" }),
  reactivate: (id: string) => request<UserFull>(`/users/${id}/reactivate`, { method: "POST" }),
};

export const tabs = {
  list: (status = "OPEN", barLocation?: BarLocation) => { const p = new URLSearchParams({ status }); if (barLocation) p.set("barLocation", barLocation); return request<Tab[]>(`/tabs?${p}`); },
  get: (id: string) => request<Tab>(`/tabs/${id}`),
  create: (data: { customerName?: string; laneNumber?: number; barLocation: BarLocation }) => request<Tab>("/tabs", { method: "POST", body: JSON.stringify(data) }),
  transfer: (tabId: string, barLocation: BarLocation) => request<Tab>(`/tabs/${tabId}/transfer`, { method: "PATCH", body: JSON.stringify({ barLocation }) }),
};

export const orders = {
  addItem: (data: { tabId: string; description: string; category: string; quantity: number; unitPrice: number; routeTo: BarLocation }) => request<LineItem>("/orders/item", { method: "POST", body: JSON.stringify(data) }),
  addItems: (tabId: string, items: { description: string; category: string; quantity: number; unitPrice: number; routeTo: BarLocation }[]) => request<LineItem[]>("/orders/items", { method: "POST", body: JSON.stringify({ tabId, items }) }),
  sendItem: (itemId: string) => request<{ lineItem: LineItem; printJob: PrintJob }>(`/orders/${itemId}/send`, { method: "POST" }),
};

export const payments = {
  apply: (data: { tabId: string; paymentType: PaymentType; amount: number; tip?: number }) => request<PaymentResponse>("/payments", { method: "POST", body: JSON.stringify(data) }),
  receipt: (tabId: string) => request<Receipt>(`/payments/receipt/${tabId}`),
};

export const manager = {
  voidItem: (lineItemId: string, reason: string) => request<LineItem>("/manager/void", { method: "POST", body: JSON.stringify({ lineItemId, reason }) }),
  compItem: (lineItemId: string, reason: string) => request<LineItem>("/manager/comp", { method: "POST", body: JSON.stringify({ lineItemId, reason }) }),
  auditLog: (limit = 50, actionType?: string) => { const p = new URLSearchParams({ limit: String(limit) }); if (actionType) p.set("actionType", actionType); return request<AuditLog[]>(`/manager/audit?${p}`); },
};

export const reports = {
  sales: (from?: string, to?: string) => { const p = new URLSearchParams(); if (from) p.set("from", from); if (to) p.set("to", to); return request<SalesReport>(`/reports/sales?${p}`); },
  tabSummary: () => request<{ openTabs: number; closedToday: number }>("/reports/tabs"),
};

export const print = {
  queue: (barLocation?: BarLocation) => { const p = new URLSearchParams(); if (barLocation) p.set("barLocation", barLocation); return request<PrintJob[]>(`/print/queue?${p}`); },
  complete: (jobId: string) => request<PrintJob>(`/print/${jobId}/complete`, { method: "POST" }),
  retry: (jobId: string) => request<PrintJob>(`/print/${jobId}/retry`, { method: "POST" }),
};

export const menu = {
  list: () => request<MenuItem[]>("/menu"),
  listAll: () => request<MenuItem[]>("/menu/all"),
  categories: () => request<string[]>("/menu/categories"),
  create: (data: { name: string; category: string; price: number; availableAt: string }) => request<MenuItem>("/menu", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: { name?: string; category?: string; price?: number; availableAt?: string }) => request<MenuItem>(`/menu/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove: (id: string) => request<{ success: boolean }>(`/menu/${id}`, { method: "DELETE" }),
};

export const barRequests = {
  list: (toBar?: string, status = "PENDING") => { const p = new URLSearchParams({ status }); if (toBar) p.set("toBar", toBar); return request<BarRequest[]>(`/requests?${p}`); },
  counts: () => request<Record<string, number>>("/requests/counts"),
  create: (data: { fromBar: string; toBar: string; itemDescription: string; quantity?: number; notes?: string; lineItemId?: string; tabId?: string }) => request<BarRequest>("/requests", { method: "POST", body: JSON.stringify(data) }),
  fulfill: (id: string) => request<BarRequest>(`/requests/${id}/fulfill`, { method: "POST" }),
  cancel: (id: string) => request<BarRequest>(`/requests/${id}/cancel`, { method: "POST" }),
};
