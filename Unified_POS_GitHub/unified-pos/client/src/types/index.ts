export type Role = "SERVER" | "BARTENDER" | "MANAGER" | "ADMIN";
export type TabStatus = "OPEN" | "CLOSED" | "VOIDED";
export type BarLocation = "I_BAR" | "SERVICE_BAR" | "QUICKIE_BAR";
export type ItemStatus = "PENDING" | "SENT" | "PRINTED" | "VOIDED" | "COMPED";
export type PaymentType = "CASH" | "CARD";

export interface User { id: string; name: string; role: Role; }

export interface Tab {
  id: string; customerName: string | null; laneNumber: number | null;
  barLocation: BarLocation; status: TabStatus; createdAt: string; closedAt: string | null;
  createdBy: User; lineItems: LineItem[]; payments: Payment[];
  subtotal?: number; totalPaid?: number; balanceDue?: number;
}

export interface LineItem {
  id: string; description: string; category: string; quantity: number; unitPrice: number;
  routeTo: BarLocation; status: ItemStatus; voidReason: string | null; compReason: string | null; createdAt: string;
}

export interface Payment { id: string; paymentType: PaymentType; amount: number; tip: number; createdAt: string; }
export interface AuditLog { id: string; actionType: string; description: string; entityType: string; entityId: string; timestamp: string; performedBy: User; }
export interface PrintJob { id: string; barLocation: BarLocation; status: string; payload: string; attempts: number; createdAt: string; printedAt: string | null; }
export interface MenuItem { id: string; name: string; category: string; price: number; availableAt: string; active?: boolean; }
export interface BarRequest {
  id: string; fromBar: string; toBar: string; itemDescription: string; quantity: number;
  status: string; notes: string | null; createdAt: string; fulfilledAt: string | null;
  lineItemId: string | null; tabId: string | null;
  requestedBy: User; fulfilledBy: User | null;
}
export interface PaymentResponse { payment: Payment; tabClosed: boolean; subtotal: number; totalPaid: number; balanceDue: number; }
export interface Receipt { tabId: string; customer: string; server: string; items: { description: string; qty: number; price: number; total: number }[]; subtotal: number; tips: number; total: number; payments: Payment[]; closedAt: string | null; }
export interface SalesReport { totalItems: number; totalRevenue: number; byBar: Record<string, { count: number; revenue: number }>; byCategory: Record<string, { count: number; revenue: number }>; }
