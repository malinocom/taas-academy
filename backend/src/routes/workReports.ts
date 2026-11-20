import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { adminOnly, authRequired, AuthedRequest } from "../auth/middleware";
import crypto from "node:crypto";

export const workReportsRoutes = Router();

workReportsRoutes.post("/", authRequired, async (req: AuthedRequest, res) => {
  const body = z.object({
    title: z.string().optional(),
    note: z.string().optional(),
    imageUrls: z.array(z.string()).min(1)
  }).parse(req.body);  
  const created = await prisma.workReport.create({
    data: {
      id: crypto.randomUUID(),
      userId: req.auth!.userId,
      title: body.title ?? null,
      note: body.note ?? null,
      imageUrls: body.imageUrls,
      createdAt: new Date(),
      status: "submitted",
    }
  });
  return res.json({
    id: created.id,
    userId: created.userId,
    title: created.title ?? undefined,
    note: created.note ?? undefined,
    imageUrls: created.imageUrls,
    createdAt: created.createdAt.toISOString(),
    status: created.status,
    adminComment: created.adminComment ?? undefined,
    reviewedAt: created.reviewedAt?.toISOString(),
  });
});

workReportsRoutes.get("/my", authRequired, async (req: AuthedRequest, res) => {
  const rows = await prisma.workReport.findMany({ where: { userId: req.auth!.userId }, orderBy: { createdAt: "desc" } });
  return res.json(rows.map(w => ({
    id: w.id,
    userId: w.userId,
    title: w.title ?? undefined,
    note: w.note ?? undefined,
    imageUrls: w.imageUrls,
    createdAt: w.createdAt.toISOString(),
    status: w.status,
    adminComment: w.adminComment ?? undefined,
    reviewedAt: w.reviewedAt?.toISOString(),
  })));
});

workReportsRoutes.get("/", adminOnly, async (_req, res) => {
  const rows = await prisma.workReport.findMany({ orderBy: { createdAt: "desc" } });
  return res.json(rows.map(w => ({
    id: w.id,
    userId: w.userId,
    title: w.title ?? undefined,
    note: w.note ?? undefined,
    imageUrls: w.imageUrls,
    createdAt: w.createdAt.toISOString(),
    status: w.status,
    adminComment: w.adminComment ?? undefined,
    reviewedAt: w.reviewedAt?.toISOString(),
  })));
});

workReportsRoutes.patch("/:id/review", adminOnly, async (req, res) => {
  const body = z.object({ status: z.enum(["submitted","approved","rejected"]), adminComment: z.string().optional() }).parse(req.body);
  const updated = await prisma.workReport.update({
    where: { id: req.params.id },
    data: {
      status: body.status as any,
      adminComment: body.adminComment ?? null,
      reviewedAt: new Date(),
    }
  });
  return res.json({
    id: updated.id,
    userId: updated.userId,
    title: updated.title ?? undefined,
    note: updated.note ?? undefined,
    imageUrls: updated.imageUrls,
    createdAt: updated.createdAt.toISOString(),
    status: updated.status,
    adminComment: updated.adminComment ?? undefined,
    reviewedAt: updated.reviewedAt?.toISOString(),
  });
});
