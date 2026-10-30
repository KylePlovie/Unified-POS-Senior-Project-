import { Router, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma";
import { authenticate } from "../middleware/auth";

export const requestRoutes = Router();
requestRoutes.use(authenticate);

// GET /api/requests — get pending requests for a specific bar
requestRoutes.get("/", async (req: Request, res: Response) => {
  const { toBar, status = "PENDING" } = req.query;

  const requests = await prisma.barRequest.findMany({
    where: {
      ...(toBar ? { toBar: toBar as string } : {}),
      status: status as string,
    },
    include: {
      requestedBy: { select: { id: true, name: true, role: true } },
      fulfilledBy: { select: { id: true, name: true, role: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  res.json(requests);
});

// GET /api/requests/counts — get pending request counts per bar (for badges)
requestRoutes.get("/counts", async (_req: Request, res: Response) => {
  const requests = await prisma.barRequest.findMany({
    where: { status: "PENDING" },
    select: { toBar: true },
  });

  const counts: Record<string, number> = {};
  for (const r of requests) {
    counts[r.toBar] = (counts[r.toBar] || 0) + 1;
  }

  res.json(counts);
});

// POST /api/requests — create a cross-bar request
requestRoutes.post("/", async (req: Request, res: Response) => {
  const data = z.object({
    fromBar: z.enum(["I_BAR", "SERVICE_BAR", "QUICKIE_BAR"]),
    toBar: z.enum(["I_BAR", "SERVICE_BAR", "QUICKIE_BAR"]),
    itemDescription: z.string().min(1),
    quantity: z.number().int().positive().default(1),
    notes: z.string().optional(),
    lineItemId: z.string().optional(),
    tabId: z.string().optional(),
  }).parse(req.body);

  const user = (req as any).user;

  const request = await prisma.barRequest.create({
    data: {
      ...data,
      requestedById: user.id,
    },
    include: {
      requestedBy: { select: { id: true, name: true, role: true } },
    },
  });

  res.status(201).json(request);
});

// POST /api/requests/:id/fulfill — mark a request as fulfilled
requestRoutes.post("/:id/fulfill", async (req: Request, res: Response) => {
  const user = (req as any).user;

  const request = await prisma.barRequest.update({
    where: { id: req.params.id },
    data: {
      status: "FULFILLED",
      fulfilledById: user.id,
      fulfilledAt: new Date(),
    },
    include: {
      requestedBy: { select: { id: true, name: true, role: true } },
      fulfilledBy: { select: { id: true, name: true, role: true } },
    },
  });

  res.json(request);
});

// POST /api/requests/:id/cancel — cancel a request
requestRoutes.post("/:id/cancel", async (req: Request, res: Response) => {
  const request = await prisma.barRequest.update({
    where: { id: req.params.id },
    data: { status: "CANCELLED" },
  });

  res.json(request);
});
