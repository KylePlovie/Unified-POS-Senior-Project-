import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma";
import { authenticate } from "../middleware/auth";

export const paymentRoutes = Router();

paymentRoutes.post("/", authenticate, async (req: Request, res: Response) => {
  const data = z.object({ tabId: z.string(), paymentType: z.enum(["CASH", "CARD"]), amount: z.number().positive(), tip: z.number().min(0).default(0) }).parse(req.body);
  const tab = await prisma.tab.findUnique({ where: { id: data.tabId }, include: { lineItems: true, payments: true } });
  if (!tab || tab.status !== "OPEN") return res.status(400).json({ error: "Tab is not open" });

  const payment = await prisma.payment.create({ data: { tabId: data.tabId, paymentType: data.paymentType, amount: data.amount, tip: data.tip } });

  const subtotal = tab.lineItems.filter((li) => li.status !== "VOIDED").reduce((sum, li) => sum + li.unitPrice * li.quantity, 0);
  const totalPaid = tab.payments.reduce((sum, p) => sum + p.amount, 0) + data.amount;

  let closedTab = null;
  if (totalPaid >= subtotal) {
    closedTab = await prisma.tab.update({ where: { id: data.tabId }, data: { status: "CLOSED", closedAt: new Date() } });
    const user = (req as any).user;
    await prisma.auditLog.create({ data: { actionType: "TAB_CLOSE", description: `Tab closed. Total: $${subtotal.toFixed(2)}, Paid: $${totalPaid.toFixed(2)}`, entityType: "Tab", entityId: data.tabId, userId: user.id } });
  }

  res.status(201).json({ payment, tabClosed: !!closedTab, subtotal, totalPaid, balanceDue: Math.max(0, subtotal - totalPaid) });
});

paymentRoutes.get("/receipt/:tabId", authenticate, async (req: Request, res: Response) => {
  const tab = await prisma.tab.findUnique({
    where: { id: req.params.tabId },
    include: { lineItems: { where: { status: { not: "VOIDED" } } }, payments: true, createdBy: { select: { name: true } } },
  });
  if (!tab) return res.status(404).json({ error: "Tab not found" });
  const subtotal = tab.lineItems.reduce((sum, li) => sum + li.unitPrice * li.quantity, 0);
  const totalTips = tab.payments.reduce((sum, p) => sum + p.tip, 0);
  res.json({
    tabId: tab.id, customer: tab.customerName || `Lane ${tab.laneNumber}`, server: tab.createdBy.name,
    items: tab.lineItems.map((li) => ({ description: li.description, qty: li.quantity, price: li.unitPrice, total: li.unitPrice * li.quantity })),
    subtotal, tips: totalTips, total: subtotal + totalTips, payments: tab.payments, closedAt: tab.closedAt,
  });
});
