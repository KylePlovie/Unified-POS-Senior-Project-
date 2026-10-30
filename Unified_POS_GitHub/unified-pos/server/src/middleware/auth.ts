import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { AppError } from "./errorHandler";

const prisma = new PrismaClient();
type Role = "SERVER" | "BARTENDER" | "MANAGER" | "ADMIN";

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) throw new AppError("Missing x-user-id header", 401);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.active) throw new AppError("User not found or inactive", 401);
  (req as any).user = user;
  next();
}

export function authorize(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user) throw new AppError("Not authenticated", 401);
    if (!allowedRoles.includes(user.role)) throw new AppError(`Requires one of: ${allowedRoles.join(", ")}`, 403);
    next();
  };
}
