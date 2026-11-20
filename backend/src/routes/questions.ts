import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { adminOnly } from "../auth/middleware";

const QuestionSchema = z.object({
  id: z.string().min(1),
  // For image-only questions, prompt can be empty.
  prompt: z.string().default(""),
  options: z.array(z.string()).length(4),
  correctIndex: z.number().int().min(0).max(3),
  subject: z.string().min(1),
  lessonCode: z.string().min(1),
  major: z.string().min(1),
  grade: z.string().optional(),
  blueprintKey: z.string().optional(),
  isImageOnly: z.boolean().optional(),
  difficulty: z.string().min(1),
  tags: z.array(z.string()).default([]),
  imageUrl: z.string().optional(),
  imageFileName: z.string().optional(),
});

export const questionsRoutes = Router();

function dto(q: any) {
  return {
    id: q.id,
    prompt: q.prompt,
    options: q.options,
    correctIndex: q.correctIndex,
    subject: q.subject,
    lessonCode: q.lessonCode,
    major: q.major,
    grade: q.grade ?? undefined,
    blueprintKey: q.blueprintKey ?? undefined,
    isImageOnly: q.isImageOnly ?? false,
    difficulty: q.difficulty,
    tags: q.tags,
    imageUrl: q.imageUrl ?? undefined,
    imageFileName: q.imageFileName ?? undefined,
  };
}

function toInt(v: unknown, fallback: number) {
  const n = typeof v === "string" ? Number(v) : Number.isFinite(v as any) ? Number(v) : NaN;
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// GET /questions
// - Backward-compatible: if no pagination params are provided, returns the full array (as before).
// - If `page`/`pageSize` provided, returns: { page, pageSize, total, items }
questionsRoutes.get("/", adminOnly, async (req, res) => {
  const hasPaging = typeof req.query.page === "string" || typeof req.query.pageSize === "string";

  const text = typeof req.query.text === "string" ? req.query.text.trim() : "";
  const major = typeof req.query.major === "string" ? req.query.major.trim() : "";
  const subject = typeof req.query.subject === "string" ? req.query.subject.trim() : "";
  const lessonCode = typeof req.query.lessonCode === "string" ? req.query.lessonCode.trim() : "";
  const includeAll = String(req.query.includeAll || "").toLowerCase() === "true";

  const where: any = {};
  const and: any[] = [];
  if (major) and.push({ major });
  if (subject) and.push({ subject: { contains: subject, mode: "insensitive" } });
  if (lessonCode) and.push({ lessonCode: { contains: lessonCode, mode: "insensitive" } });
  if (text) {
    and.push({
      OR: [
        { prompt: { contains: text, mode: "insensitive" } },
        { subject: { contains: text, mode: "insensitive" } },
        { lessonCode: { contains: text, mode: "insensitive" } },
        { tags: { has: text } },
      ],
    });
  }
  if (and.length) where.AND = and;

  // Hide exam-only questions unless explicitly requested.
  if (!includeAll) {
    where.NOT = { tags: { has: "__exam_only__" } };
  }

  if (!hasPaging) {
    const rows = await prisma.question.findMany({ where, orderBy: { id: "desc" } });
    return res.json(rows.map(dto));
  }

  const page = clamp(toInt(req.query.page, 1), 1, 10_000);
  const pageSize = clamp(toInt(req.query.pageSize, 20), 1, 100);
  const skip = (page - 1) * pageSize;

  const [total, rows] = await Promise.all([
    prisma.question.count({ where }),
    prisma.question.findMany({ where, orderBy: { id: "desc" }, skip, take: pageSize }),
  ]);

  return res.json({ page, pageSize, total, items: rows.map(dto) });
});

questionsRoutes.post("/", adminOnly, async (req, res) => {
  const body = QuestionSchema.parse(req.body);
  const created = await prisma.question.create({
    data: {
      id: body.id,
      prompt: body.prompt,
      options: body.options as any,
      correctIndex: body.correctIndex,
      subject: body.subject,
      lessonCode: body.lessonCode,
      major: body.major,
      grade: body.grade ?? null,
      blueprintKey: body.blueprintKey ?? null,
      isImageOnly: body.isImageOnly ?? false,
      difficulty: body.difficulty,
      tags: body.tags,
      imageUrl: body.imageUrl ?? null,
      imageFileName: body.imageFileName ?? null,
    }
  });
  return res.json(dto(created));
});

questionsRoutes.post("/bulk", adminOnly, async (req, res) => {
  const parsed = z.array(QuestionSchema).safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "INVALID_PAYLOAD", issues: parsed.error.issues });
  }
  const body = parsed.data;
  await prisma.question.createMany({
    data: body.map(b => ({
      id: b.id,
      prompt: b.prompt,
      options: b.options as any,
      correctIndex: b.correctIndex,
      subject: b.subject,
      lessonCode: b.lessonCode,
      major: b.major,
      grade: b.grade ?? null,
      blueprintKey: b.blueprintKey ?? null,
      isImageOnly: b.isImageOnly ?? false,
      difficulty: b.difficulty,
      tags: b.tags,
      imageUrl: b.imageUrl ?? null,
      imageFileName: b.imageFileName ?? null,
    })),
    skipDuplicates: true,
  });
  const ids = body.map(b => b.id);
  const rows = await prisma.question.findMany({ where: { id: { in: ids } } });
  return res.json(rows.map(dto));
});

questionsRoutes.delete("/:id", adminOnly, async (req, res) => {
  await prisma.question.delete({ where: { id: req.params.id } });
  return res.json({ ok: true });
});
