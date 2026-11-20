import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { adminOnly, authOptional, authRequired } from "../auth/middleware";

export const bookingsRoutes = Router();

// Public create (no login required)
bookingsRoutes.post("/", async (req, res) => {
  const body = z
    .object({
      fullName: z.string().min(2).max(120),
      grade: z.string().min(1).max(60),
      major: z.string().min(1).max(60),
      goal: z.string().min(1).max(120),
      hadAdvisorBefore: z.boolean(),
      phone: z.string().min(6).max(30),
      parentPhone: z.string().max(30).optional().nullable(),
      advisorChoice: z.string().min(1).max(120),
      cancelReason: z.string().max(500).optional().nullable(),
    })
    .parse(req.body);

  const created = await prisma.consultationBooking.create({
    data: {
      id: `B_${Math.random().toString(16).slice(2)}_${Date.now()}`,
      fullName: body.fullName,
      grade: body.grade,
      major: body.major,
      goal: body.goal,
      hadAdvisorBefore: body.hadAdvisorBefore,
      phone: body.phone,
      parentPhone: body.parentPhone ?? null,
      advisorChoice: body.advisorChoice,
      cancelReason: body.cancelReason ?? null,
    },
  });

  return res.json({ ok: true, id: created.id });
});

// Admin list
bookingsRoutes.get("/admin", adminOnly, async (_req, res) => {
  const rows = await prisma.consultationBooking.findMany({ orderBy: { createdAt: "desc" } });
  return res.json(rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

// Admin update status/note
bookingsRoutes.patch("/admin/:id", adminOnly, async (req, res) => {
  const body = z
    .object({
      status: z.enum(["new", "contacted", "closed"]).optional(),
      note: z.string().max(2000).optional().nullable(),
    })
    .parse(req.body);

  const updated = await prisma.consultationBooking.update({
    where: { id: req.params.id },
    data: {
      status: body.status,
      note: body.note === undefined ? undefined : body.note,
    },
  });

  return res.json({ ok: true, id: updated.id, status: updated.status, note: updated.note ?? null });
});
