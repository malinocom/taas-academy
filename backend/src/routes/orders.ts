import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { adminOnly, authRequired, AuthedRequest } from "../auth/middleware";
import crypto from "node:crypto";

export const ordersRoutes = Router();

ordersRoutes.post("/", authRequired, async (req: AuthedRequest, res) => {
  const body = z.object({
    items: z.array(z.object({ noteId: z.string(), title: z.string(), price: z.number().int().nonnegative(), qty: z.number().int().positive() })),
    customer: z.any(),
  }).parse(req.body);
  const total = body.items.reduce((s, it) => s + it.price * it.qty, 0);
  const now = new Date();
  const created = await prisma.order.create({
    data: {
      id: crypto.randomUUID(),
      userId: req.auth!.userId,
      items: body.items as any,
      customer: body.customer as any,
      total,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    }
  });
  return res.json({
    id: created.id,
    userId: created.userId,
    items: created.items,
    total: created.total,
    status: created.status,
    customer: created.customer,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  });
});

ordersRoutes.get("/my", authRequired, async (req: AuthedRequest, res) => {
  const rows = await prisma.order.findMany({ where: { userId: req.auth!.userId }, orderBy: { createdAt: "desc" } });
  return res.json(rows.map(o => ({
    id: o.id,
    userId: o.userId,
    items: o.items,
    total: o.total,
    status: o.status,
    customer: o.customer,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
  })));
});

ordersRoutes.get("/", adminOnly, async (_req, res) => {
  const rows = await prisma.order.findMany({ orderBy: { createdAt: "desc" } });
  return res.json(rows.map(o => ({
    id: o.id,
    userId: o.userId,
    items: o.items,
    total: o.total,
    status: o.status,
    customer: o.customer,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
  })));
});

ordersRoutes.patch("/:id/status", adminOnly, async (req, res) => {
  const body = z.object({ status: z.enum(["pending","paid","processing","sent","delivered","canceled"]) }).parse(req.body);
  const updated = await prisma.order.update({ where: { id: req.params.id }, data: { status: body.status as any, updatedAt: new Date() } });
  return res.json({
    id: updated.id,
    userId: updated.userId,
    items: updated.items,
    total: updated.total,
    status: updated.status,
    customer: updated.customer,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
});


