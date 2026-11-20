import { Router } from "express";
import { z } from "zod";
import { adminOnly } from "../auth/middleware";
import { prisma } from "../prisma";
import { hashPassword } from "../utils/password";
import jalaali from "jalaali-js";

export const adminRoutes = Router();

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

  // Gregorian dates in this project are 20xx. Jalali dates are 13xx/14xx.
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
    role: u.role,
    name: u.profile?.name ?? "",
    email: u.email,
    major: u.profile?.major ?? null,
    grade: u.profile?.grade ?? null,
    phone: u.profile?.phone ?? null,
    national_id: u.profile?.nationalId ?? null,
    address: u.profile?.address ?? null,
    created_at: u.createdAt.toISOString(),
    is_private_student: u.isPrivateStudent,
    private_advisor_id: u.privateAdvisorId ?? null,
    private_advisor_name: u.privateAdvisor?.profile?.name ?? null,
    private_renewal_date: dateToIsoDate(u.privateRenewalDate),
  };
}

function advisorDto(u: any) {
  return {
    user_id: u.id,
    role: u.role,
    name: u.profile?.name ?? u.username ?? u.email,
    email: u.email,
    username: u.username,
    phone: u.profile?.phone ?? null,
    created_at: u.createdAt.toISOString(),
  };
}

/* ============================================
   STUDENTS / ADVISORS
============================================ */

adminRoutes.get("/students", adminOnly, async (_req, res) => {
  const students = await prisma.user.findMany({
    where: { role: "student" },
    include: { profile: true, privateAdvisor: { include: { profile: true } } },
    orderBy: { createdAt: "desc" },
  });

  res.json(students.map(studentDto));
});

adminRoutes.get("/advisors", adminOnly, async (_req, res) => {
  const advisors = await prisma.user.findMany({
    where: { role: "advisor" },
    include: { profile: true },
    orderBy: { createdAt: "desc" },
  });
  res.json({ advisors: advisors.map(advisorDto) });
});

adminRoutes.post("/advisors", adminOnly, async (req, res, next) => {
  try {
    const body = z.object({
      name: z.string().min(1),
      email: z.string().email(),
      username: z.string().min(3).optional(),
      password: z.string().min(6),
      phone: z.string().optional(),
    }).parse(req.body);

    const email = body.email.trim().toLowerCase();
    const username = (body.username || email.split("@")[0]).trim().toLowerCase();

    const exists = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
    if (exists) return res.status(409).json({ error: "مشاور با این ایمیل یا نام کاربری قبلاً ثبت شده است" });

    const advisor = await prisma.user.create({
      data: {
        email,
        username,
        role: "advisor",
        passwordHash: await hashPassword(body.password),
        profile: { create: { name: body.name, phone: body.phone ?? null } },
      },
      include: { profile: true },
    });

    res.json({ advisor: advisorDto(advisor) });
  } catch (err) {
    next(err);
  }
});

/* Toggle Private */
adminRoutes.post("/students/:userId/private", adminOnly, async (req, res, next) => {
  try {
    const schema = z.object({
      isPrivateStudent: z.boolean(),
      advisorId: z.string().nullable().optional(),
      privateRenewalDate: z.string().nullable().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid body" });

    const advisorId = parsed.data.advisorId || null;
    if (advisorId) {
      const advisor = await prisma.user.findFirst({ where: { id: advisorId, role: "advisor" } });
      if (!advisor) return res.status(404).json({ error: "advisor not found" });
    }

    const renewalDate = parseDateOnlyToUTC(parsed.data.privateRenewalDate ?? null);

    const user = await prisma.user.update({
      where: { id: req.params.userId },
      data: {
        isPrivateStudent: parsed.data.isPrivateStudent,
        privateAdvisorId: parsed.data.isPrivateStudent ? advisorId : null,
        privateRenewalDate: parsed.data.isPrivateStudent ? renewalDate : null,
      },
      include: { profile: true, privateAdvisor: { include: { profile: true } } },
    });

    res.json(studentDto(user));
  } catch (err) {
    next(err);
  }
});

adminRoutes.patch("/students/:userId/private-assignment", adminOnly, async (req, res, next) => {
  try {
    const body = z.object({
      advisorId: z.string().nullable().optional(),
      privateRenewalDate: z.string().nullable().optional(),
      isPrivateStudent: z.boolean().optional(),
    }).parse(req.body);

    const advisorId = body.advisorId || null;
    if (advisorId) {
      const advisor = await prisma.user.findFirst({ where: { id: advisorId, role: "advisor" } });
      if (!advisor) return res.status(404).json({ error: "advisor not found" });
    }

    const renewalDate = parseDateOnlyToUTC(body.privateRenewalDate ?? null);

    const user = await prisma.user.update({
      where: { id: req.params.userId },
      data: {
        isPrivateStudent: body.isPrivateStudent ?? true,
        privateAdvisorId: advisorId,
        privateRenewalDate: renewalDate,
      },
      include: { profile: true, privateAdvisor: { include: { profile: true } } },
    });

    res.json(studentDto(user));
  } catch (err) {
    next(err);
  }
});

/* Private Students List */
adminRoutes.get("/private-students", adminOnly, async (_req, res, next) => {
  try {
    const students = await prisma.user.findMany({
      where: { role: "student", isPrivateStudent: true },
      include: { profile: true, privateAdvisor: { include: { profile: true } } },
      orderBy: { createdAt: "desc" },
    });

    res.json({ students: students.map(studentDto) });
  } catch (err) {
    next(err);
  }
});

adminRoutes.get("/private-advisors", adminOnly, async (_req, res, next) => {
  try {
    const advisors = await prisma.user.findMany({
      where: { role: "advisor" },
      include: {
        profile: true,
        privateStudents: {
          where: { role: "student", isPrivateStudent: true },
          include: { profile: true },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const unassigned = await prisma.user.findMany({
      where: { role: "student", isPrivateStudent: true, privateAdvisorId: null },
      include: { profile: true },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      advisors: advisors.map((a) => ({
        ...advisorDto(a),
        students: a.privateStudents.map(studentDto),
      })),
      unassigned: unassigned.map(studentDto),
    });
  } catch (err) {
    next(err);
  }
});

/* Admin retake panel used by frontend */
adminRoutes.get("/exams/:examId/retakes", adminOnly, async (req, res, next) => {
  try {
    const exam = await prisma.exam.findUnique({ where: { id: req.params.examId } });
    if (!exam) return res.status(404).json({ error: "آزمون پیدا نشد" });

    const [students, attempts, allowances] = await Promise.all([
      prisma.user.findMany({ where: { role: "student" }, include: { profile: true }, orderBy: { createdAt: "desc" } }),
      prisma.attempt.findMany({ where: { examId: exam.id }, select: { userId: true } }),
      prisma.examAttemptAllowance.findMany({ where: { examId: exam.id } }),
    ]);

    const used = new Map<string, number>();
    for (const a of attempts) used.set(a.userId, (used.get(a.userId) ?? 0) + 1);
    const allowed = new Map<string, number>();
    for (const a of allowances) allowed.set(a.userId, a.allowedAttempts);

    const relevant = exam.assignedUserIds.length
      ? students.filter((s) => exam.assignedUserIds.includes(s.id))
      : students;

    res.json({
      examId: exam.id,
      title: exam.title,
      rows: relevant.map((s) => {
        const allowedAttempts = allowed.get(s.id) ?? 1;
        const usedAttempts = used.get(s.id) ?? 0;
        return {
          userId: s.id,
          name: s.profile?.name ?? "",
          email: s.email,
          allowedAttempts,
          usedAttempts,
          canAttempt: usedAttempts < allowedAttempts,
        };
      }),
    });
  } catch (err) {
    next(err);
  }
});

adminRoutes.post("/exams/:examId/retakes", adminOnly, async (req, res, next) => {
  try {
    const body = z.object({
      userId: z.string().min(1),
      allowedAttempts: z.number().int().min(1).optional(),
      increment: z.number().int().min(1).optional(),
    }).parse(req.body);

    const current = await prisma.examAttemptAllowance.findUnique({
      where: { examId_userId: { examId: req.params.examId, userId: body.userId } },
    }).catch(() => null);

    const nextAllowed = body.allowedAttempts ?? ((current?.allowedAttempts ?? 1) + (body.increment ?? 1));

    const row = await prisma.examAttemptAllowance.upsert({
      where: { examId_userId: { examId: req.params.examId, userId: body.userId } },
      create: { examId: req.params.examId, userId: body.userId, allowedAttempts: nextAllowed },
      update: { allowedAttempts: nextAllowed },
    });

    res.json({ ok: true, examId: row.examId, userId: row.userId, allowedAttempts: row.allowedAttempts });
  } catch (err) {
    next(err);
  }
});

/* ============================================
   DAILY PRIVATE PLAN
============================================ */

const planRowSchema = z.object({
  time: z.string().optional().nullable(),
  subjectName: z.string().min(1),
  testCount: z.number().int().nonnegative(),
  description: z.string().optional().nullable(),
  duration: z.number().int().nonnegative().optional(),
  orderIndex: z.number().int().nonnegative().optional(),
});

const upsertPlanSchema = z.object({
  date: z.string(),
  rows: z.array(planRowSchema),
});

adminRoutes.get("/users/:userId", adminOnly, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.userId },
      include: { profile: true, privateAdvisor: { include: { profile: true } } },
    });
    if (!user) return res.status(404).json({ error: "user not found" });

    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      isPrivateStudent: user.isPrivateStudent,
      privateAdvisorId: user.privateAdvisorId,
      privateAdvisorName: user.privateAdvisor?.profile?.name ?? null,
      privateRenewalDate: dateToIsoDate(user.privateRenewalDate),
      profile: user.profile,
    });
  } catch (err) {
    next(err);
  }
});

/* GET Plan */
adminRoutes.get("/private-students/:userId/plans", adminOnly, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const dateStr = String(req.query.date || "");
    const date = parseDateOnlyToUTC(dateStr);

    if (!date) return res.status(400).json({ error: "date query required" });

    const plan = await prisma.privatePlan.findUnique({
      where: { userId_date: { userId, date } },
      include: { rows: { orderBy: { orderIndex: "asc" } } },
    });

    const progresses = await prisma.studyProgress.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });

    res.json({ plan, progresses });
  } catch (err) {
    next(err);
  }
});

/* UPSERT Plan */
adminRoutes.post("/private-students/:userId/plans", adminOnly, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const parsed = upsertPlanSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid body", details: parsed.error });

    const { date: dateStr, rows } = parsed.data;
    const date = parseDateOnlyToUTC(dateStr);
    if (!date) return res.status(400).json({ error: "Invalid date" });

    const rowData = rows.map((r, i) => ({
      time: r.time ?? "",
      subjectName: r.subjectName,
      testCount: r.testCount,
      description: r.description ?? "",
      duration: Number(r.duration) || 0,
      orderIndex: r.orderIndex ?? i + 1,
    }));

    const plan = await prisma.privatePlan.upsert({
      where: { userId_date: { userId, date } },
      update: {
        advisorId: null,
        rows: { deleteMany: {}, create: rowData },
      },
      create: {
        userId,
        date,
        advisorId: null,
        rows: { create: rowData },
      },
      include: { rows: { orderBy: { orderIndex: "asc" } } },
    });

    res.json({ plan });
  } catch (err) {
    next(err);
  }
});

/* DELETE Plan */
adminRoutes.delete("/private-students/:userId/plans/:planId", adminOnly, async (req, res, next) => {
  try {
    const { userId, planId } = req.params;

    const existing = await prisma.privatePlan.findFirst({
      where: { id: Number(planId), userId },
    });

    if (!existing) return res.status(404).json({ error: "Plan not found" });

    await prisma.privatePlan.delete({ where: { id: Number(planId) } });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

/* ============================================
   STUDY PROGRESS
============================================ */

adminRoutes.get("/private-students/:userId/progress", adminOnly, async (req, res, next) => {
  try {
    const progresses = await prisma.studyProgress.findMany({
      where: { userId: req.params.userId },
      orderBy: { createdAt: "asc" },
    });

    res.json({ progresses });
  } catch (err) {
    next(err);
  }
});

adminRoutes.post("/private-students/:userId/progress", adminOnly, async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const { subjectName } = req.body;

    if (!subjectName || subjectName.trim() === "") {
      return res.status(400).json({ error: "subjectName is required" });
    }

    const progress = await prisma.studyProgress.upsert({
      where: { userId_subjectName: { userId, subjectName } },
      update: {},
      create: { userId, subjectName, boxes: [] },
    });

    res.json(progress);
  } catch (err) {
    next(err);
  }
});

adminRoutes.patch("/private-students/:userId/progress/:id/add-box", adminOnly, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const progress = await prisma.studyProgress.findUnique({ where: { id } });
    if (!progress) return res.status(404).json({ error: "progress not found" });

    const boxes = [...(progress.boxes as boolean[]), false];
    const updated = await prisma.studyProgress.update({ where: { id }, data: { boxes } });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

adminRoutes.patch("/private-students/:userId/progress/:id/toggle", adminOnly, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { index } = req.body;

    if (typeof index !== "number") return res.status(400).json({ error: "index required" });

    const progress = await prisma.studyProgress.findUnique({ where: { id } });
    if (!progress) return res.status(404).json({ error: "progress not found" });

    const boxes = [...(progress.boxes as boolean[])];
    if (index < 0 || index >= boxes.length) return res.status(400).json({ error: "index out of range" });

    boxes[index] = !boxes[index];
    const updated = await prisma.studyProgress.update({ where: { id }, data: { boxes } });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

adminRoutes.delete("/private-students/:userId/progress/:id", adminOnly, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await prisma.studyProgress.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});
