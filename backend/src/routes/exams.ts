import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { adminOnly, authRequired, AuthedRequest } from "../auth/middleware";

export const examsRoutes = Router();

// Shared exam output shape
function examDto(e: any) {
  return {
    id: e.id,
    title: e.title,
    description: e.description,
    mode: e.mode,
    startAt: e.startAt ? e.startAt.toISOString() : undefined,
    endAt: e.endAt ? e.endAt.toISOString() : undefined,
    durationMinutes: e.durationMinutes,
    questionIds: e.questionIds,
    blueprint: e.blueprint,
    negativeMarking: e.negativeMarking,
    assignedUserIds: e.assignedUserIds,
    published: e.published,

    // PDF-exam fields
    pdfUrl: e.pdfUrl ?? undefined,
    pdfFileName: e.pdfFileName ?? undefined,
    questionCount: e.questionCount ?? undefined,
    answerKey: e.answerKey ?? undefined,
    subjectRanges: e.subjectRanges ?? undefined,

    createdAt: e.createdAt.toISOString(),
  };
}

const ExamSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().default(""),
  mode: z.enum(["questionBank", "pdf"]).optional(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  durationMinutes: z.number().int().positive(),
  questionIds: z.array(z.string()).default([]),
  blueprint: z.any().optional(),
  negativeMarking: z.any().optional(),
  assignedUserIds: z.array(z.string()).optional(),
  published: z.boolean(),

  // PDF-exam fields
  pdfUrl: z.string().url().optional(),
  pdfFileName: z.string().optional(),
  questionCount: z.number().int().nonnegative().optional(),
  answerKey: z.record(z.string(), z.number().int()).optional(),
  subjectRanges: z.array(z.object({ from: z.number().int().positive(), to: z.number().int().positive(), subject: z.string().min(1) })).optional(),

  createdAt: z.string(),
});

function enforceStudentVisibility(req: AuthedRequest, e: any) {
  if (req.auth!.role === "admin") return;
  if (!e.published) throw Object.assign(new Error("NOT_FOUND"), { status: 404 });
  if (e.assignedUserIds.length && !e.assignedUserIds.includes(req.auth!.userId)) {
    throw Object.assign(new Error("FORBIDDEN"), { status: 403 });
  }
}

function enforceStartWindow(e: any) {
  const now = Date.now();
  if (e.startAt && now < e.startAt.getTime()) {
    const err: any = new Error("NOT_STARTED");
    err.status = 403;
    err.startAt = e.startAt.toISOString();
    throw err;
  }
  if (e.endAt && now > e.endAt.getTime()) {
    const err: any = new Error("ENDED");
    err.status = 403;
    err.endAt = e.endAt.toISOString();
    throw err;
  }
}

// Admin: list all
examsRoutes.get("/", adminOnly, async (_req, res) => {
  const rows = await prisma.exam.findMany({ orderBy: { createdAt: "desc" } });
  return res.json(rows.map(examDto));
});

// Student: list my published + assigned
examsRoutes.get("/my", authRequired, async (req: AuthedRequest, res) => {
  const rows = await prisma.exam.findMany({ where: { published: true }, orderBy: { createdAt: "desc" } });
  const filtered = rows.filter((e) => e.assignedUserIds.length === 0 || e.assignedUserIds.includes(req.auth!.userId));
  return res.json(filtered.map(examDto));
});

examsRoutes.get("/:id", authRequired, async (req: AuthedRequest, res) => {
  const e = await prisma.exam.findUnique({ where: { id: req.params.id } });
  if (!e) return res.json(null);
  try {
    enforceStudentVisibility(req, e);
  } catch (err: any) {
    if (err.status === 404) return res.status(404).json(null);
    if (err.status === 403) return res.status(403).json({ message: "FORBIDDEN" });
    return res.status(500).json({ message: "SERVER_ERROR" });
  }
  return res.json(examDto(e));
});

// Start exam: return sanitized questions for students
examsRoutes.get("/:id/start", authRequired, async (req: AuthedRequest, res) => {
  const e = await prisma.exam.findUnique({ where: { id: req.params.id } });
  if (!e) return res.status(404).json({ message: "NOT_FOUND" });

  // visibility
  if (req.auth!.role !== "admin") {
    if (!e.published) return res.status(404).json({ message: "NOT_FOUND" });
    if (e.assignedUserIds.length && !e.assignedUserIds.includes(req.auth!.userId)) return res.status(403).json({ message: "FORBIDDEN" });
  }

  // time window (students only)
  if (req.auth!.role !== "admin") {
    try {
      enforceStartWindow(e);
    } catch (err: any) {
      return res.status(err.status ?? 403).json({ message: err.message, startAt: err.startAt, endAt: err.endAt });
    }
  }

  // Attempt gating: by default students have 1 attempt. Admin is exempt.
  let attemptInfo: { allowedAttempts: number; usedAttempts: number; canAttempt: boolean } | undefined = undefined;
  if (req.auth!.role !== "admin") {
    const userId = req.auth!.userId;
    const allowance = await prisma.examAttemptAllowance
      .findUnique({ where: { examId_userId: { examId: e.id, userId } } })
      .catch(() => null);
    const allowedAttempts = allowance?.allowedAttempts ?? 1;
    const usedAttempts = await prisma.attempt.count({ where: { examId: e.id, userId } });
    attemptInfo = { allowedAttempts, usedAttempts, canAttempt: usedAttempts < allowedAttempts };
  }

  // questions payload
  let safeQuestions: any[] = [];
  if (e.mode === "questionBank") {
    const questions = await prisma.question.findMany({ where: { id: { in: e.questionIds } } });
    const map = new Map(questions.map((q) => [q.id, q]));
    const ordered = e.questionIds.map((id) => map.get(id)).filter(Boolean) as any[];

    safeQuestions = ordered.map((q) => ({
      id: q.id,
      prompt: q.prompt,
      options: q.options,
      // correctIndex intentionally omitted
      subject: q.subject,
      lessonCode: q.lessonCode,
      major: q.major,
      difficulty: q.difficulty,
      tags: q.tags,
      imageUrl: q.imageUrl ?? undefined,
      imageFileName: q.imageFileName ?? undefined,
    }));
  }

  return res.json({ exam: examDto(e), questions: safeQuestions, attemptInfo });
});

// Admin: create
examsRoutes.post("/", adminOnly, async (req, res) => {
  const parsed = ExamSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "INVALID_PAYLOAD", issues: parsed.error.issues });
  const body = parsed.data;

  const mode = body.mode ?? "questionBank";

  // Basic validation for PDF exams
  if (mode === "pdf") {
    if (!body.pdfUrl) return res.status(400).json({ message: "PDF_URL_REQUIRED" });
    if (!body.answerKey || Object.keys(body.answerKey).length === 0) return res.status(400).json({ message: "ANSWER_KEY_REQUIRED" });
    const qc = body.questionCount ?? Math.max(...Object.keys(body.answerKey).map((k) => Number(k)).filter((n) => Number.isFinite(n)), 0);
    if (!qc || qc <= 0) return res.status(400).json({ message: "QUESTION_COUNT_REQUIRED" });
  }

  const created = await prisma.exam.create({
    data: {
      id: body.id,
      title: body.title,
      description: body.description,
      mode,
      startAt: body.startAt ? new Date(body.startAt) : null,
      endAt: body.endAt ? new Date(body.endAt) : null,
      durationMinutes: body.durationMinutes,
      questionIds: body.questionIds,
      blueprint: body.blueprint ?? null,
      negativeMarking: body.negativeMarking ?? null,
      assignedUserIds: body.assignedUserIds ?? [],
      published: body.published,
      pdfUrl: body.pdfUrl ?? null,
      pdfFileName: body.pdfFileName ?? null,
      questionCount: body.questionCount ?? null,
      answerKey: body.answerKey ?? null,
      subjectRanges: body.subjectRanges ?? null,
      createdAt: new Date(body.createdAt),
    },
  });

  return res.json(examDto(created));
});

// Admin: update (also used to enable/disable)
examsRoutes.patch("/:id", adminOnly, async (req, res) => {
  const schema = z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    mode: z.enum(["questionBank", "pdf"]).optional(),
    startAt: z.string().datetime().nullable().optional(),
    endAt: z.string().datetime().nullable().optional(),
    durationMinutes: z.number().int().positive().optional(),
    questionIds: z.array(z.string()).optional(),
    blueprint: z.any().optional(),
    negativeMarking: z.any().optional(),
    assignedUserIds: z.array(z.string()).optional(),
    published: z.boolean().optional(),
    pdfUrl: z.string().url().nullable().optional(),
    pdfFileName: z.string().nullable().optional(),
    questionCount: z.number().int().nonnegative().nullable().optional(),
    answerKey: z.record(z.string(), z.number().int()).nullable().optional(),
    subjectRanges: z.array(z.object({ from: z.number().int().positive(), to: z.number().int().positive(), subject: z.string().min(1) })).nullable().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "INVALID_PAYLOAD", issues: parsed.error.issues });
  const body = parsed.data;

  const updated = await prisma.exam.update({
    where: { id: req.params.id },
    data: {
      title: body.title,
      description: body.description,
      mode: body.mode,
      startAt: body.startAt === undefined ? undefined : body.startAt === null ? null : new Date(body.startAt),
      endAt: body.endAt === undefined ? undefined : body.endAt === null ? null : new Date(body.endAt),
      durationMinutes: body.durationMinutes,
      questionIds: body.questionIds,
      blueprint: body.blueprint === undefined ? undefined : body.blueprint,
      negativeMarking: body.negativeMarking === undefined ? undefined : body.negativeMarking,
      assignedUserIds: body.assignedUserIds,
      published: body.published,
      pdfUrl: body.pdfUrl === undefined ? undefined : body.pdfUrl,
      pdfFileName: body.pdfFileName === undefined ? undefined : body.pdfFileName,
      questionCount: body.questionCount === undefined ? undefined : body.questionCount,
      answerKey: body.answerKey === undefined ? undefined : body.answerKey,
      subjectRanges: body.subjectRanges === undefined ? undefined : body.subjectRanges,
    },
  });

  return res.json(examDto(updated));
});

examsRoutes.delete("/:id", adminOnly, async (req, res) => {
  await prisma.exam.delete({ where: { id: req.params.id } });
  return res.json({ ok: true });
});

// ---- Attempt allowances (admin): enable retakes
examsRoutes.post("/:id/allowances", adminOnly, async (req, res) => {
  const body = z.object({ userId: z.string().min(1), allowedAttempts: z.number().int().min(1) }).parse(req.body);
  const row = await prisma.examAttemptAllowance.upsert({
    where: { examId_userId: { examId: req.params.id, userId: body.userId } },
    create: { examId: req.params.id, userId: body.userId, allowedAttempts: body.allowedAttempts },
    update: { allowedAttempts: body.allowedAttempts },
  });
  return res.json({ ok: true, examId: row.examId, userId: row.userId, allowedAttempts: row.allowedAttempts });
});

// Counts (admin): used attempts per user for a given exam
examsRoutes.get("/:id/attempts-counts", adminOnly, async (req, res) => {
  const rows = await prisma.attempt.findMany({ where: { examId: req.params.id }, select: { userId: true } });
  const counts: Record<string, number> = {};
  for (const r of rows) counts[r.userId] = (counts[r.userId] ?? 0) + 1;

  const allowances = await prisma.examAttemptAllowance.findMany({ where: { examId: req.params.id } });
  const allowed: Record<string, number> = {};
  for (const a of allowances) allowed[a.userId] = a.allowedAttempts;

  return res.json({ usedAttempts: counts, allowedAttempts: allowed });
});
