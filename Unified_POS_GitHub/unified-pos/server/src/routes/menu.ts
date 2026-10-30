import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma";
import { authenticate, authorize } from "../middleware/auth";

export const menuRoutes = Router();

// GET /api/menu — list active menu items (anyone can see the menu)
menuRoutes.get("/", async (_req: Request, res: Response) => {
  const items = await prisma.menuItem.findMany({
    where: { active: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
  res.json(items);
});

// GET /api/menu/all — list ALL items including inactive (manager view)
menuRoutes.get("/all", authenticate, authorize("ADMIN", "MANAGER"), async (_req: Request, res: Response) => {
  const items = await prisma.menuItem.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
  res.json(items);
});

// GET /api/menu/categories — list unique categories
menuRoutes.get("/categories", async (_req: Request, res: Response) => {
  const items = await prisma.menuItem.findMany({
    where: { active: true },
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  });
  res.json(items.map(i => i.category));
});

// POST /api/menu — create a new menu item (manager only)
menuRoutes.post("/", authenticate, authorize("ADMIN", "MANAGER"), async (req: Request, res: Response) => {
  const data = z.object({
    name: z.string().min(1),
    category: z.string().min(1),
    price: z.number().min(0),
    availableAt: z.string().min(1), // comma-separated: "I_BAR,SERVICE_BAR"
  }).parse(req.body);

  const item = await prisma.menuItem.create({ data });

  const user = (req as any).user;
  await prisma.auditLog.create({
    data: {
      actionType: "MENU_ADD", description: `Added menu item "${data.name}" ($${data.price}) in ${data.category}`,
      entityType: "MenuItem", entityId: item.id, userId: user.id,
    },
  });

  res.status(201).json(item);
});

// PATCH /api/menu/:id — update a menu item
menuRoutes.patch("/:id", authenticate, authorize("ADMIN", "MANAGER"), async (req: Request, res: Response) => {
  const data = z.object({
    name: z.string().min(1).optional(),
    category: z.string().min(1).optional(),
    price: z.number().min(0).optional(),
    availableAt: z.string().min(1).optional(),
  }).parse(req.body);

  const item = await prisma.menuItem.update({ where: { id: req.params.id }, data });

  const user = (req as any).user;
  await prisma.auditLog.create({
    data: {
      actionType: "MENU_UPDATE", description: `Updated menu item "${item.name}"`,
      entityType: "MenuItem", entityId: item.id, userId: user.id,
    },
  });

  res.json(item);
});

// DELETE /api/menu/:id — soft delete (deactivate)
menuRoutes.delete("/:id", authenticate, authorize("ADMIN", "MANAGER"), async (req: Request, res: Response) => {
  const item = await prisma.menuItem.update({ where: { id: req.params.id }, data: { active: false } });

  const user = (req as any).user;
  await prisma.auditLog.create({
    data: {
      actionType: "MENU_REMOVE", description: `Removed menu item "${item.name}"`,
      entityType: "MenuItem", entityId: item.id, userId: user.id,
    },
  });

  res.json({ success: true });
});
