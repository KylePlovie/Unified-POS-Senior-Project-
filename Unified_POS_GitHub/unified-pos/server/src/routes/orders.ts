import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma";
import { authenticate } from "../middleware/auth";

export const orderRoutes = Router();

const AddItemSchema = z.object({
  tabId: z.string(), description: z.string().min(1), category: z.string().min(1),
  quantity: z.number().int().positive().default(1), unitPrice: z.number().min(0),
  routeTo: z.enum(["I_BAR", "SERVICE_BAR", "QUICKIE_BAR"]),
});

orderRoutes.post("/item", authenticate, async (req: Request, res: Response) => {
  const data = AddItemSchema.parse(req.body);
  const tab = await prisma.tab.findUnique({ where: { id: data.tabId } });
  if (!tab || tab.status !== "OPEN") return res.status(400).json({ error: "Tab is not open" });
  const lineItem = await prisma.lineItem.create({ data: { tabId: data.tabId, description: data.description, category: data.category, quantity: data.quantity, unitPrice: data.unitPrice, routeTo: data.routeTo } });
  res.status(201).json(lineItem);
});

orderRoutes.post("/items", authenticate, async (req: Request, res: Response) => {
  const { tabId, items } = z.object({ tabId: z.string(), items: z.array(z.object({ description: z.string().min(1), category: z.string().min(1), quantity: z.number().int().positive().default(1), unitPrice: z.number().min(0), routeTo: z.enum(["I_BAR", "SERVICE_BAR", "QUICKIE_BAR"]) })) }).parse(req.body);
  const tab = await prisma.tab.findUnique({ where: { id: tabId } });
  if (!tab || tab.status !== "OPEN") return res.status(400).json({ error: "Tab is not open" });
  const lineItems = await prisma.$transaction(items.map((item) => prisma.lineItem.create({ data: { ...item, tabId } })));
  res.status(201).json(lineItems);
});

orderRoutes.post("/:itemId/send", authenticate, async (req: Request, res: Response) => {
  const lineItem = await prisma.lineItem.findUnique({ where: { id: req.params.itemId }, include: { tab: true } });
  if (!lineItem) return res.status(404).json({ error: "Item not found" });
  if (lineItem.status !== "PENDING") return res.status(400).json({ error: "Item already sent or voided" });
  const [updated, printJob] = await prisma.$transaction([
    prisma.lineItem.update({ where: { id: lineItem.id }, data: { status: "SENT" } }),
    prisma.printJob.create({ data: { lineItemId: lineItem.id, barLocation: lineItem.routeTo, payload: JSON.stringify({ tab: lineItem.tab.customerName || `Lane ${lineItem.tab.laneNumber}`, item: lineItem.description, qty: lineItem.quantity, time: new Date().toISOString() }) } }),
  ]);
  res.json({ lineItem: updated, printJob });
});
