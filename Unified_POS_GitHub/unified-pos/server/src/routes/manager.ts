import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma";
import { authenticate, authorize } from "../middleware/auth";

export const managerRoutes = Router();
managerRoutes.use(authenticate);
managerRoutes.use(authorize("MANAGER", "ADMIN"));

managerRoutes.post("/void", async (req: Request, res: Response) => {
  const { lineItemId, reason } = z.object({ lineItemId: z.string(), reason: z.string().min(1, "Void reason is required") }).parse(req.body);
  const user = (req as any).user;
  const lineItem = await prisma.lineItem.findUnique({ where: { id: lineItemId } });
  if (!lineItem) return res.status(404).json({ error: "Item not found" });
  if (lineItem.status === "VOIDED") return res.status(400).json({ error: "Item already voided" });
  const [updated] = await prisma.$transaction([
    prisma.lineItem.update({ where: { id: lineItemId }, data: { status: "VOIDED", voidReason: reason } }),
    prisma.auditLog.create({ data: { actionType: "VOID", description: `Voided "${lineItem.description}" — Reason: ${reason}`, entityType: "LineItem", entityId: lineItemId, userId: user.id } }),
  ]);
  res.json(updated);
});

managerRoutes.post("/comp", async (req: Request, res: Response) => {
  const { lineItemId, reason } = z.object({ lineItemId: z.string(), reason: z.string().min(1, "Comp reason is required") }).parse(req.body);
  const user = (req as any).user;
  const lineItem = await prisma.lineItem.findUnique({ where: { id: lineItemId } });
  if (!lineItem) return res.status(404).json({ error: "Item not found" });
  const [updated] = await prisma.$transaction([
    prisma.lineItem.update({ where: { id: lineItemId }, data: { status: "COMPED", compReason: reason } }),
    prisma.auditLog.create({ data: { actionType: "COMP", description: `Comped "${lineItem.description}" — Reason: ${reason}`, entityType: "LineItem", entityId: lineItemId, userId: user.id } }),
  ]);
  res.json(updated);
});

managerRoutes.get("/audit", async (req: Request, res: Response) => {
  const { limit = "50", actionType } = req.query;
  const logs = await prisma.auditLog.findMany({
    where: actionType ? { actionType: actionType as string } : {},
    include: { performedBy: { select: { id: true, name: true, role: true } } },
    orderBy: { timestamp: "desc" },
    take: parseInt(limit as string, 10),
  });
  res.json(logs);
});
