import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma";
import { authenticate } from "../middleware/auth";

export const tabRoutes = Router();

tabRoutes.get("/", authenticate, async (req: Request, res: Response) => {
  const { status = "OPEN", barLocation } = req.query;
  const tabs = await prisma.tab.findMany({
    where: { status: status as any, ...(barLocation ? { barLocation: barLocation as any } : {}) },
    include: {
      lineItems: true,
      createdBy: { select: { id: true, name: true, role: true } },
      _count: { select: { lineItems: true, payments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const tabsWithTotals = tabs.map((tab) => {
    const subtotal = tab.lineItems.filter((li) => li.status !== "VOIDED").reduce((sum, li) => sum + li.unitPrice * li.quantity, 0);
    return { ...tab, subtotal };
  });

  res.json(tabsWithTotals);
});

tabRoutes.get("/:id", authenticate, async (req: Request, res: Response) => {
  const tab = await prisma.tab.findUnique({
    where: { id: req.params.id },
    include: { lineItems: { orderBy: { createdAt: "asc" } }, payments: true, createdBy: { select: { id: true, name: true, role: true } } },
  });
  if (!tab) return res.status(404).json({ error: "Tab not found" });
  const subtotal = tab.lineItems.filter((li) => li.status !== "VOIDED").reduce((sum, li) => sum + li.unitPrice * li.quantity, 0);
  const totalPaid = tab.payments.reduce((sum, p) => sum + p.amount, 0);
  res.json({ ...tab, subtotal, totalPaid, balanceDue: subtotal - totalPaid });
});

tabRoutes.post("/", authenticate, async (req: Request, res: Response) => {
  const data = z.object({ customerName: z.string().optional(), laneNumber: z.number().int().positive().optional(), barLocation: z.enum(["I_BAR", "SERVICE_BAR", "QUICKIE_BAR"]) }).parse(req.body);
  const user = (req as any).user;
  const tab = await prisma.tab.create({ data: { ...data, createdById: user.id }, include: { createdBy: { select: { id: true, name: true, role: true } } } });
  res.status(201).json(tab);
});

tabRoutes.patch("/:id/transfer", authenticate, async (req: Request, res: Response) => {
  const { barLocation } = z.object({ barLocation: z.enum(["I_BAR", "SERVICE_BAR", "QUICKIE_BAR"]) }).parse(req.body);
  const user = (req as any).user;
  const tab = await prisma.tab.update({ where: { id: req.params.id }, data: { barLocation } });
  await prisma.auditLog.create({ data: { actionType: "TRANSFER", description: `Tab transferred to ${barLocation}`, entityType: "Tab", entityId: tab.id, userId: user.id } });
  res.json(tab);
});
