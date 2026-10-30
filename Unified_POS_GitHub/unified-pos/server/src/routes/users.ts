import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma";
import { authenticate, authorize } from "../middleware/auth";

export const userRoutes = Router();

userRoutes.post("/login", async (req: Request, res: Response) => {
  const { pin } = z.object({ pin: z.string().length(4) }).parse(req.body);
  const user = await prisma.user.findFirst({ where: { pin, active: true } });
  if (!user) return res.status(401).json({ error: "Invalid PIN" });
  res.json({ id: user.id, name: user.name, role: user.role });
});

// List all users (active + inactive for admin view)
userRoutes.get("/", async (req: Request, res: Response) => {
  const { all } = req.query;
  const users = await prisma.user.findMany({
    where: all === "true" ? {} : { active: true },
    select: { id: true, name: true, role: true, pin: true, active: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  res.json(users);
});

// Create a new user (ADMIN or MANAGER only)
userRoutes.post("/", authenticate, authorize("ADMIN", "MANAGER"), async (req: Request, res: Response) => {
  const data = z.object({
    name: z.string().min(1, "Name is required"),
    pin: z.string().length(4, "PIN must be 4 digits"),
    role: z.enum(["SERVER", "BARTENDER", "MANAGER"]),
  }).parse(req.body);

  // Check PIN is unique
  const existing = await prisma.user.findFirst({ where: { pin: data.pin, active: true } });
  if (existing) return res.status(400).json({ error: "PIN already in use" });

  const user = await prisma.user.create({ data });

  // Audit log
  const admin = (req as any).user;
  await prisma.auditLog.create({
    data: {
      actionType: "USER_CREATE",
      description: `Created user "${data.name}" with role ${data.role}`,
      entityType: "User", entityId: user.id, userId: admin.id,
    },
  });

  res.status(201).json(user);
});

// Update a user (ADMIN or MANAGER only)
userRoutes.patch("/:id", authenticate, authorize("ADMIN", "MANAGER"), async (req: Request, res: Response) => {
  const data = z.object({
    name: z.string().min(1).optional(),
    pin: z.string().length(4).optional(),
    role: z.enum(["SERVER", "BARTENDER", "MANAGER"]).optional(),
  }).parse(req.body);

  const target = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!target) return res.status(404).json({ error: "User not found" });

  // Protect the admin account
  if (target.role === "ADMIN") return res.status(403).json({ error: "Cannot modify the Administrator account" });

  // Check PIN uniqueness if changing
  if (data.pin) {
    const existing = await prisma.user.findFirst({ where: { pin: data.pin, active: true, id: { not: req.params.id } } });
    if (existing) return res.status(400).json({ error: "PIN already in use" });
  }

  const updated = await prisma.user.update({ where: { id: req.params.id }, data });

  const admin = (req as any).user;
  await prisma.auditLog.create({
    data: {
      actionType: "USER_UPDATE",
      description: `Updated user "${updated.name}"`,
      entityType: "User", entityId: updated.id, userId: admin.id,
    },
  });

  res.json(updated);
});

// Deactivate a user (soft delete — ADMIN or MANAGER only)
userRoutes.delete("/:id", authenticate, authorize("ADMIN", "MANAGER"), async (req: Request, res: Response) => {
  const target = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!target) return res.status(404).json({ error: "User not found" });

  if (target.role === "ADMIN") return res.status(403).json({ error: "Cannot deactivate the Administrator account" });

  const updated = await prisma.user.update({ where: { id: req.params.id }, data: { active: false } });

  const admin = (req as any).user;
  await prisma.auditLog.create({
    data: {
      actionType: "USER_DEACTIVATE",
      description: `Deactivated user "${target.name}"`,
      entityType: "User", entityId: target.id, userId: admin.id,
    },
  });

  res.json({ success: true, user: updated });
});

// Reactivate a user
userRoutes.post("/:id/reactivate", authenticate, authorize("ADMIN", "MANAGER"), async (req: Request, res: Response) => {
  const updated = await prisma.user.update({ where: { id: req.params.id }, data: { active: true } });

  const admin = (req as any).user;
  await prisma.auditLog.create({
    data: {
      actionType: "USER_REACTIVATE",
      description: `Reactivated user "${updated.name}"`,
      entityType: "User", entityId: updated.id, userId: admin.id,
    },
  });

  res.json(updated);
});
