import { Router } from "express";
import { z } from "zod";
import { advisorOnly, AuthedRequest } from "../auth/middleware";
import { prisma } from "../prisma";
import jalaali from "jalaali-js";

export const advisorRoutes = Router();

function toEnglishDigits(input: string) {
  return String(input || "")
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

function parseDateOnlyToUTC(input: string | null | undefined): Date | null {
  if (!input) return null;
  const clean = toEnglishDigits(String(input)).slice(0, 10);
  const [y, m, d] = clean.split("-").map(Number);
  if (!y || !m || !d) return null;
  if (y >= 1700) return new Date(Date.UTC(y, m - 1, d));
  try {
    const g = jalaali.toGregorian(y, m, d);
    return new Date(Date.UTC(g.gy, g.gm - 1, g.gd));
  } catch {
    return null;
  }
}

function dateToIsoDate(date: Date | null | undefined) {
  return date ? date.toISOString().slice(0, 10) : null;
}

function studentDto(u: any) {
  return {
    user_id: u.id,
    name: u.profile?.name ?? "",
    email: u.email,
    major: u.profile?.major ?? null,
    grade: u.profile?.grade ?? null,
    phone: u.profile?.phone ?? null,
    private_renewal_date: dateToIsoDate(u.privateRenewalDate),
  };
}

async function ensureAssignedStudent(advisorId: string, userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, role: "student", isPrivateStudent: true, privateAdvisorId: advisorId },
    include: { profile: true, privateAdvisor: { include: { profile: true } } },
  });
  return user;
}

advisorRoutes.get("/private-students", advisorOnly, async (req: AuthedRequest, res) => {
  const rows = await prisma.user.findMany({
    where: { role: "student", isPrivateStudent: true, privateAdvisorId: req.auth!.userId },
    include: { profile: true },
    orderBy: { privateRenewalDate: "asc" },
  });
  res.json({ students: rows.map(studentDto) });
});

advisorRoutes.get("/users/:userId", advisorOnly, async (req: AuthedRequest, res) => {
  const user = await ensureAssignedStudent(req.auth!.userId, req.params.userId);
  if (!user) return res.status(404).json({ error: "دانش‌آموز برای این مشاور تعریف نشده است" });
  res.json({
    id: user.id,
    email: user.email,
    isPrivateStudent: user.isPrivateStudent,
    privateAdvisorId: user.privateAdvisorId,
    privateAdvisorName: user.privateAdvisor?.profile?.name ?? null,
    privateRenewalDate: dateToIsoDate(user.privateRenewalDate),
    profile: user.profile,
  });
});

const planRowSchema = z.object({
  time: z.string().optional().nullable(),
  subjectName: z.string().min(1),
  testCount: z.number().int().nonnegative(),
  description: z.string().optional().nullable(),
  duration: z.number().int().nonnegative().optional(),
  orderIndex: z.number().int().nonnegative().optional(),
});
const upsertPlanSchema = z.object({ date: z.string(), rows: z.array(planRowSchema) });

advisorRoutes.get("/private-students/:userId/plans", advisorOnly, async (req: AuthedRequest, res) => {
  const user = await ensureAssignedStudent(req.auth!.userId, req.params.userId);
  if (!user) return res.status(404).json({ error: "دانش‌آموز برای این مشاور تعریف نشده است" });

  const date = parseDateOnlyToUTC(String(req.query.date || ""));
  if (!date) return res.status(400).json({ error: "date query required" });

  const plan = await prisma.privatePlan.findUnique({
    where: { userId_date: { userId: req.params.userId, date } },
    include: { rows: { orderBy: { orderIndex: "asc" } } },
  });
  const progresses = await prisma.studyProgress.findMany({ where: { userId: req.params.userId }, orderBy: { createdAt: "asc" } });
  res.json({ plan, progresses });
});

advisorRoutes.post("/private-students/:userId/plans", advisorOnly, async (req: AuthedRequest, res) => {
  const user = await ensureAssignedStudent(req.auth!.userId, req.params.userId);
  if (!user) return res.status(404).json({ error: "دانش‌آموز برای این مشاور تعریف نشده است" });

  const parsed = upsertPlanSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid body", details: parsed.error });

  const date = parseDateOnlyToUTC(parsed.data.date);
  if (!date) return res.status(400).json({ error: "Invalid date" });

  const rowData = parsed.data.rows.map((r, i) => ({
    time: r.time ?? "",
    subjectName: r.subjectName,
    testCount: r.testCount,
    description: r.description ?? "",
    duration: Number(r.duration) || 0,
    orderIndex: r.orderIndex ?? i + 1,
  }));

  const plan = await prisma.privatePlan.upsert({
    where: { userId_date: { userId: req.params.userId, date } },
    update: { advisorId: req.auth!.userId, rows: { deleteMany: {}, create: rowData } },
    create: { userId: req.params.userId, advisorId: req.auth!.userId, date, rows: { create: rowData } },
    include: { rows: { orderBy: { orderIndex: "asc" } } },
  });
  res.json({ plan });
});

advisorRoutes.delete("/private-students/:userId/plans/:planId", advisorOnly, async (req: AuthedRequest, res) => {
  const user = await ensureAssignedStudent(req.auth!.userId, req.params.userId);
  if (!user) return res.status(404).json({ error: "دانش‌آموز برای این مشاور تعریف نشده است" });
  const existing = await prisma.privatePlan.findFirst({ where: { id: Number(req.params.planId), userId: req.params.userId } });
  if (!existing) return res.status(404).json({ error: "Plan not found" });
  await prisma.privatePlan.delete({ where: { id: Number(req.params.planId) } });
  res.json({ success: true });
});

advisorRoutes.get("/private-students/:userId/progress", advisorOnly, async (req: AuthedRequest, res) => {
  const user = await ensureAssignedStudent(req.auth!.userId, req.params.userId);
  if (!user) return res.status(404).json({ error: "دانش‌آموز برای این مشاور تعریف نشده است" });
  const progresses = await prisma.studyProgress.findMany({ where: { userId: req.params.userId }, orderBy: { createdAt: "asc" } });
  res.json({ progresses });
});

advisorRoutes.post("/private-students/:userId/progress", advisorOnly, async (req: AuthedRequest, res) => {
  const user = await ensureAssignedStudent(req.auth!.userId, req.params.userId);
  if (!user) return res.status(404).json({ error: "دانش‌آموز برای این مشاور تعریف نشده است" });
  const subjectName = String(req.body?.subjectName || "").trim();
  if (!subjectName) return res.status(400).json({ error: "subjectName is required" });
  const progress = await prisma.studyProgress.upsert({
    where: { userId_subjectName: { userId: req.params.userId, subjectName } },
    update: {},
    create: { userId: req.params.userId, subjectName, boxes: [] },
  });
  res.json(progress);
});

advisorRoutes.patch("/private-students/:userId/progress/:id/add-box", advisorOnly, async (req: AuthedRequest, res) => {
  const user = await ensureAssignedStudent(req.auth!.userId, req.params.userId);
  if (!user) return res.status(404).json({ error: "دانش‌آموز برای این مشاور تعریف نشده است" });
  const id = Number(req.params.id);
  const progress = await prisma.studyProgress.findFirst({ where: { id, userId: req.params.userId } });
  if (!progress) return res.status(404).json({ error: "progress not found" });
  const boxes = [...(progress.boxes as boolean[]), false];
  const updated = await prisma.studyProgress.update({ where: { id }, data: { boxes } });
  res.json(updated);
});

advisorRoutes.patch("/private-students/:userId/progress/:id/toggle", advisorOnly, async (req: AuthedRequest, res) => {
  const user = await ensureAssignedStudent(req.auth!.userId, req.params.userId);
  if (!user) return res.status(404).json({ error: "دانش‌آموز برای این مشاور تعریف نشده است" });
  const id = Number(req.params.id);
  const index = Number(req.body?.index);
  const progress = await prisma.studyProgress.findFirst({ where: { id, userId: req.params.userId } });
  if (!progress) return res.status(404).json({ error: "progress not found" });
  const boxes = [...(progress.boxes as boolean[])];
  if (index < 0 || index >= boxes.length) return res.status(400).json({ error: "index out of range" });
  boxes[index] = !boxes[index];
  const updated = await prisma.studyProgress.update({ where: { id }, data: { boxes } });
  res.json(updated);
});

advisorRoutes.delete("/private-students/:userId/progress/:id", advisorOnly, async (req: AuthedRequest, res) => {
  const user = await ensureAssignedStudent(req.auth!.userId, req.params.userId);
  if (!user) return res.status(404).json({ error: "دانش‌آموز برای این مشاور تعریف نشده است" });
  await prisma.studyProgress.delete({ where: { id: Number(req.params.id) } });
  res.json({ success: true });
});

export default advisorRoutes;
