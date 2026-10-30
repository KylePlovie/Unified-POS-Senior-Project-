import { Router, Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { authenticate } from "../middleware/auth";

export const reportRoutes = Router();
reportRoutes.use(authenticate);

reportRoutes.get("/sales", async (req: Request, res: Response) => {
  const { from, to } = req.query;
  const dateFilter: any = {};
  if (from) dateFilter.gte = new Date(from as string);
  if (to) dateFilter.lte = new Date(to as string);

  const lineItems = await prisma.lineItem.findMany({
    where: { status: { notIn: ["VOIDED"] }, ...(from || to ? { createdAt: dateFilter } : {}) },
    select: { routeTo: true, unitPrice: true, quantity: true, category: true, createdAt: true },
  });

  const byBar: Record<string, { count: number; revenue: number }> = {};
  const byCategory: Record<string, { count: number; revenue: number }> = {};

  for (const item of lineItems) {
    const rev = item.unitPrice * item.quantity;
    if (!byBar[item.routeTo]) byBar[item.routeTo] = { count: 0, revenue: 0 };
    byBar[item.routeTo].count += item.quantity;
    byBar[item.routeTo].revenue += rev;
    if (!byCategory[item.category]) byCategory[item.category] = { count: 0, revenue: 0 };
    byCategory[item.category].count += item.quantity;
    byCategory[item.category].revenue += rev;
  }

  const totalRevenue = lineItems.reduce((sum, li) => sum + li.unitPrice * li.quantity, 0);
  res.json({ totalItems: lineItems.length, totalRevenue, byBar, byCategory });
});

reportRoutes.get("/tabs", async (_req: Request, res: Response) => {
  const [openTabs, closedToday] = await Promise.all([
    prisma.tab.count({ where: { status: "OPEN" } }),
    prisma.tab.count({ where: { status: "CLOSED", closedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
  ]);
  res.json({ openTabs, closedToday });
});
