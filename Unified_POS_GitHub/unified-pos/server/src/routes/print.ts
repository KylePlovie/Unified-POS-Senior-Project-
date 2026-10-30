import { Router, Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { authenticate } from "../middleware/auth";

export const printRoutes = Router();
printRoutes.use(authenticate);

printRoutes.get("/queue", async (req: Request, res: Response) => {
  const { barLocation } = req.query;
  const jobs = await prisma.printJob.findMany({
    where: { status: { in: ["QUEUED", "FAILED"] }, ...(barLocation ? { barLocation: barLocation as any } : {}) },
    include: { lineItem: { select: { description: true, quantity: true, tab: { select: { customerName: true, laneNumber: true } } } } },
    orderBy: { createdAt: "asc" },
  });
  res.json(jobs);
});

printRoutes.post("/:jobId/complete", async (req: Request, res: Response) => {
  const job = await prisma.printJob.update({ where: { id: req.params.jobId }, data: { status: "PRINTED", printedAt: new Date() } });
  await prisma.lineItem.update({ where: { id: job.lineItemId }, data: { status: "PRINTED" } });
  res.json(job);
});

printRoutes.post("/:jobId/retry", async (req: Request, res: Response) => {
  const job = await prisma.printJob.update({ where: { id: req.params.jobId }, data: { status: "QUEUED", attempts: { increment: 1 } } });
  res.json(job);
});
