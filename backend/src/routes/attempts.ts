import { Router } from "express";
import { z } from "zod";
import PDFDocument from "pdfkit";
import fs from "node:fs";
import path from "node:path";
import { prisma } from "../prisma";
import { adminOnly, authRequired, AuthedRequest } from "../auth/middleware";
import { Prisma } from "@prisma/client";


// ---- Local types to make TS happy ----

type UserSummary = { email: string | null; name: string };

type QuestionEntity = {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  imageUrl: string | null;
  imageFileName: string | null;
  subject: string | null;
  lessonCode: string | null;
  major: string | null;
};

type QuestionBankGroupQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  selectedIndex: number | null | undefined;
  imageUrl: string | null;
  imageFileName: string | null;
  isCorrect: boolean;
};

type PdfGroupQuestion = {
  no: number;
  correctIndex: number;
  selectedIndex: number | null | undefined;
  isCorrect: boolean;
};

type LessonGroupQuestionBank = {
  subject: string | null;
  lessonCode: string | null;
  major: string | null;
  total: number;
  correct: number;
  wrong: number;
  blank: number;
  questions: QuestionBankGroupQuestion[];
};

type LessonGroupPdf = {
  subject: string;
  lessonCode: string;
  major: string;
  total: number;
  correct: number;
  wrong: number;
  blank: number;
  questions: PdfGroupQuestion[];
};

type BreakdownRow = {
  subject: string | null;
  lessonCode: string | null;
  major: string | null;
  total: number;
  correct: number;
  wrong: number;
  blank: number;
  percent: number;
};

// Optional Persian shaping (best-effort)
let reshape: any = null;
let bidi: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  reshape = require("arabic-persian-reshaper");
} catch {}
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  bidi = require("bidi-js");
} catch {}

export const attemptsRoutes = Router();

function optionLabel(i: number) {
  return ["الف", "ب", "ج", "د"][i] ?? String(i + 1);
}

function safeFa(text: string) {
  const t = String(text ?? "");
  try {
    if (reshape && bidi) {
      const reshaped = reshape.reshape(t);
      // bidi-js in RTL base direction (prevents word-order flip like 'خانوادگی نام')
      try {
        const b = new bidi.Bidi();
        if (
          typeof b.setPara === "function" &&
          typeof b.writeReordered === "function" &&
          bidi.DIRECTION
        ) {
          b.setPara(reshaped, bidi.DIRECTION.RTL, true);
          return b.writeReordered(bidi.DO_MIRRORING);
        }
      } catch {}
      if (typeof bidi.getReorderedString === "function") {
        // fallback api
        return bidi.getReorderedString(reshaped, "R");
      }
      if (typeof new bidi.Bidi().getReorderedString === "function") {
        return new bidi.Bidi().getReorderedString(reshaped, "R");
      }
      return reshaped;
    }
    if (reshape) return reshape.reshape(t);
  } catch {
    // ignore
  }
  return t;
}

function toAttemptDto(a: any, extras?: any) {
  return {
    id: a.id,
    examId: a.examId,
    userId: a.userId,
    attemptNo: a.attemptNo,
    answers: a.answers,
    startedAt: a.startedAt.toISOString(),
    endedAt: a.endedAt.toISOString(),
    percent: a.percent,
    taraz: a.taraz ?? 4000,
    correct: a.correct,
    wrong: a.wrong,
    blank: a.blank,
    penalty: a.penalty,
    netCorrect: a.netCorrect,
    total: a.total,
    breakdown: a.breakdown,
    warnings: a.warnings ?? undefined,
    adminMessage: a.adminMessage ?? undefined,
    adminMessageAt: a.adminMessageAt ? a.adminMessageAt.toISOString() : undefined,
    lessonGroups: extras?.lessonGroups,
    rank: extras?.rank,
    participants: extras?.participants,
    bestPercent: extras?.bestPercent,
    bestByLesson: extras?.bestByLesson,
  };
}

function enforceStartWindow(exam: any) {
  const now = Date.now();
  if (exam.startAt && now < exam.startAt.getTime()) {
    const err: any = new Error("NOT_STARTED");
    err.status = 403;
    err.startAt = exam.startAt.toISOString();
    throw err;
  }
  if (exam.endAt && now > exam.endAt.getTime()) {
    const err: any = new Error("ENDED");
    err.status = 403;
    err.endAt = exam.endAt.toISOString();
    throw err;
  }
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function scoreWithNegativeMarking(correct: number, wrong: number, total: number, enabled: boolean, wrongPerPenalty: number) {
  const p = Math.max(1, Number(wrongPerPenalty) || 3);
  const penaltyEquivalent = enabled ? wrong / p : 0;
  const netCorrect = enabled ? correct - penaltyEquivalent : correct;
  const rawPercent = total > 0 ? (netCorrect / total) * 100 : 0;
  const percent = Math.round(rawPercent);
  return { netCorrect, percent, penalty: enabled ? wrong : 0 };
}

function percentFromNet(netCorrect: number, total: number) {
  return total > 0 ? (Number(netCorrect || 0) / total) * 100 : 0;
}

async function recalculateExamTaraz(examId: string) {
  const rows = await prisma.attempt.findMany({
    where: { examId },
    select: { id: true, netCorrect: true, total: true },
  });

  if (!rows.length) return;

  const percents = rows.map((r) => percentFromNet(r.netCorrect, r.total));
  const mean = percents.reduce((sum, v) => sum + v, 0) / percents.length;
  const variance = percents.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / percents.length;
  const std = Math.sqrt(variance);

  await Promise.all(rows.map((r, idx) => {
    const z = std > 0.000001 ? (percents[idx] - mean) / std : 0;
    const taraz = Math.max(4000, Math.round(5000 + 2000 * z));
    return prisma.attempt.update({ where: { id: r.id }, data: { taraz } });
  }));
}

function betterAttempt<T extends { taraz?: number | null; percent: number; netCorrect: number; endedAt: Date }>(a: T, b: T): T {
  const at = Number(a.taraz ?? 4000);
  const bt = Number(b.taraz ?? 4000);
  if (at !== bt) return at > bt ? a : b;
  if (a.netCorrect !== b.netCorrect) return a.netCorrect > b.netCorrect ? a : b;
  if (a.percent !== b.percent) return a.percent > b.percent ? a : b;
  return a.endedAt < b.endedAt ? a : b;
}

function computeRankIfFinished(exam: any, userId: string) {
  const now = Date.now();
  if (!exam.endAt) return null;
  if (now <= exam.endAt.getTime()) return null;
  return prisma.attempt
    .findMany({
      where: { examId: exam.id },
      select: { userId: true, percent: true, taraz: true, netCorrect: true, endedAt: true },
    })
    .then((rows) => {
      // best attempt per user
      const best = new Map<
        string,
        { percent: number; taraz?: number | null; netCorrect: number; endedAt: Date }
      >();
      for (const r of rows) {
        const cur = best.get(r.userId);
        const row = {
          percent: r.percent,
          taraz: r.taraz ?? 4000,
          netCorrect: r.netCorrect,
          endedAt: r.endedAt,
        };
        best.set(r.userId, cur ? betterAttempt(cur, row) : row);
      }
      const list = Array.from(best.entries()).map(([uid, v]) => ({
        userId: uid,
        ...v,
      }));
      list.sort((a, b) => {
        if ((b.taraz ?? 4000) !== (a.taraz ?? 4000)) return (b.taraz ?? 4000) - (a.taraz ?? 4000);
        if (b.netCorrect !== a.netCorrect) return b.netCorrect - a.netCorrect;
        if (b.percent !== a.percent) return b.percent - a.percent;
        return a.endedAt.getTime() - b.endedAt.getTime();
      });
      
      const idx = list.findIndex((x) => x.userId === userId);
      return { rank: idx >= 0 ? idx + 1 : null, participants: list.length };
    });
}

// ---- Admin list ----
attemptsRoutes.get("/", adminOnly, async (req, res) => {
  const examId = typeof req.query.examId === "string" ? req.query.examId : undefined;
  const rows = await prisma.attempt.findMany({
    where: examId ? { examId } : undefined,
    orderBy: [{ createdAt: "desc" }],
    take: 500,
  });

  // include exam title and student name/email
  const examIds = Array.from(new Set(rows.map((r) => r.examId)));
  const userIds = Array.from(new Set(rows.map((r) => r.userId)));

  const [exams, users] = await Promise.all([
    prisma.exam.findMany({
      where: { id: { in: examIds } },
      select: { id: true, title: true },
    }),
    prisma.user.findMany({
      where: { id: { in: userIds } },
      include: { profile: true },
    }),
  ]);

  const examMap = new Map<string, string>(exams.map((e) => [e.id, e.title]));
  const userMap = new Map<string, UserSummary>(
    users.map((u) => [u.id, { email: u.email, name: u.profile?.name ?? "" }]),
  );

  const out = rows.map((a) => {
    const user = userMap.get(a.userId);
    return {
      id: a.id,
      examId: a.examId,
      examTitle: examMap.get(a.examId) ?? "",
      userId: a.userId,
      userName: user?.name ?? "",
      userEmail: user?.email ?? "",
      attemptNo: a.attemptNo,
      startedAt: a.startedAt.toISOString(),
      endedAt: a.endedAt.toISOString(),
      percent: a.percent,
      taraz: a.taraz ?? 4000,
      correct: a.correct,
      wrong: a.wrong,
      blank: a.blank,
      netCorrect: a.netCorrect,
      total: a.total,
      createdAt: a.createdAt.toISOString(),
    };
  });

  return res.json(out);
});

// ---- Student list ----
attemptsRoutes.get("/my", authRequired, async (req: AuthedRequest, res) => {
  const rows = await prisma.attempt.findMany({
    where: { userId: req.auth!.userId },
    orderBy: { createdAt: "desc" },
  });
  return res.json(rows.map((a) => toAttemptDto(a)));
});

// ---- Create attempt ----
attemptsRoutes.post("/", authRequired, async (req: AuthedRequest, res) => {
  const body = z
    .object({
      examId: z.string().min(1),
      answers: z.record(z.string(), z.number().int()).default({}),
      startedAt: z.string().datetime().optional(),
      endedAt: z.string().datetime().optional(),
      warnings: z.any().optional(),
    })
    .parse(req.body);

  const exam = await prisma.exam.findUnique({ where: { id: body.examId } });
  if (!exam) return res.status(404).json({ message: "NOT_FOUND" });

  // students: must be assigned + published
  if (req.auth!.role !== "admin") {
    if (!exam.published) return res.status(404).json({ message: "NOT_FOUND" });
    if (
      exam.assignedUserIds.length &&
      !exam.assignedUserIds.includes(req.auth!.userId)
    )
      return res.status(403).json({ message: "FORBIDDEN" });

    // time window
    try {
      enforceStartWindow(exam);
    } catch (err: any) {
      return res
        .status(err.status ?? 403)
        .json({ message: err.message, startAt: err.startAt, endAt: err.endAt });
    }

    // attempt limit
    const allowance = await prisma.examAttemptAllowance
      .findUnique({
        where: { examId_userId: { examId: exam.id, userId: req.auth!.userId } },
      })
      .catch(() => null);
    const allowedAttempts = allowance?.allowedAttempts ?? 1;
    const usedAttempts = await prisma.attempt.count({
      where: { examId: exam.id, userId: req.auth!.userId },
    });
    if (usedAttempts >= allowedAttempts)
      return res.status(409).json({ message: "ALREADY_ATTEMPTED" });
  }

  const userId = req.auth!.userId;
  const used = await prisma.attempt.count({ where: { examId: exam.id, userId } });
  const attemptNo = used + 1;

  // scoring
  let total = 0;
  let correct = 0;
  let wrong = 0;
  let blank = 0;
  let percent = 0;
  let penalty = 0;
  let netCorrect = 0;
  let breakdown: BreakdownRow[] = [];

  if (exam.mode === "questionBank") {
    const questions = (await prisma.question.findMany({
      where: { id: { in: exam.questionIds } },
    })) as QuestionEntity[];
    total = questions.length;
    const ans = body.answers;

    // group stats
    const groupKey = (q: QuestionEntity) =>
      `${q.subject}__${q.lessonCode}__${q.major}`;
    const groups = new Map<
      string,
      {
        subject: string | null;
        lessonCode: string | null;
        major: string | null;
        total: number;
        correct: number;
        wrong: number;
        blank: number;
      }
    >();

    for (const q of questions) {
      const selected = ans[q.id];
      const isBlank = selected === undefined || selected === null;
      const isCorrect = !isBlank && selected === q.correctIndex;

      if (isBlank) blank += 1;
      else if (isCorrect) correct += 1;
      else wrong += 1;

      const k = groupKey(q);
      if (!groups.has(k)) {
        groups.set(k, {
          subject: q.subject,
          lessonCode: q.lessonCode,
          major: q.major,
          total: 0,
          correct: 0,
          wrong: 0,
          blank: 0,
        });
      }
      const g = groups.get(k)!;
      g.total += 1;
      if (isBlank) g.blank += 1;
      else if (isCorrect) g.correct += 1;
      else g.wrong += 1;
    }

    // negative marking (formula): ((correct*P - wrong) / (total*P)) * 100
    const nm = (exam.negativeMarking ?? null) as any;
    const enabled = !!nm?.enabled;
    const P = Number(nm?.wrongPerPenalty ?? 3) || 3;

    {
      const scored = scoreWithNegativeMarking(correct, wrong, total, enabled, P);
      netCorrect = scored.netCorrect;
      penalty = scored.penalty;
      percent = scored.percent;
    }

    breakdown = Array.from(groups.values()).map((g) => {
      const gp = scoreWithNegativeMarking(g.correct, g.wrong, g.total, enabled, P).percent;
      return {
        subject: g.subject,
        lessonCode: g.lessonCode,
        major: g.major,
        total: g.total,
        correct: g.correct,
        wrong: g.wrong,
        blank: g.blank,
        percent: gp,
      };
    });
  } else {
    // PDF mode
    const answerKey = (exam.answerKey ?? {}) as Record<string, number>;
    const qc =
      exam.questionCount ??
      Math.max(
        ...Object.keys(answerKey)
          .map((k) => Number(k))
          .filter((n) => Number.isFinite(n)),
        0,
      );
    total = qc;

    const nm = (exam.negativeMarking ?? null) as any;
    const enabled = !!nm?.enabled;
    const P = Number(nm?.wrongPerPenalty ?? 3) || 3;

    const ans = body.answers;

    // subject ranges
    const ranges = (exam.subjectRanges ?? []) as Array<{
      from: number;
      to: number;
      subject: string;
    }>;
    const getSubject = (no: number) => {
      for (const r of ranges) {
        if (no >= r.from && no <= r.to) return r.subject;
      }
      return "بدون دسته‌بندی";
    };

    const groups = new Map<
      string,
      {
        subject: string;
        lessonCode: string;
        major: string;
        total: number;
        correct: number;
        wrong: number;
        blank: number;
      }
    >();

    for (let no = 1; no <= qc; no++) {
      const key = String(no);
      const correctIdx = answerKey[key];
      const selectedIdx = ans[key];
      const isBlank = selectedIdx === undefined || selectedIdx === null;
      const isCorrect =
        !isBlank && typeof correctIdx === "number" && selectedIdx === correctIdx;

      if (isBlank) blank += 1;
      else if (isCorrect) correct += 1;
      else wrong += 1;

      const subject = getSubject(no);
      const groupK = `${subject}__PDF__عمومی`;
      if (!groups.has(groupK))
        groups.set(groupK, {
          subject,
          lessonCode: "PDF",
          major: "عمومی",
          total: 0,
          correct: 0,
          wrong: 0,
          blank: 0,
        });
      const g = groups.get(groupK)!;
      g.total += 1;
      if (isBlank) g.blank += 1;
      else if (isCorrect) g.correct += 1;
      else g.wrong += 1;
    }

    {
      const scored = scoreWithNegativeMarking(correct, wrong, total, enabled, P);
      netCorrect = scored.netCorrect;
      penalty = scored.penalty;
      percent = scored.percent;
    }

    breakdown = Array.from(groups.values()).map((g) => ({
      subject: g.subject,
      lessonCode: g.lessonCode,
      major: g.major,
      total: g.total,
      correct: g.correct,
      wrong: g.wrong,
      blank: g.blank,
      percent: scoreWithNegativeMarking(g.correct, g.wrong, g.total, enabled, P).percent,
    }));
  }

  const startedAt = body.startedAt ? new Date(body.startedAt) : new Date();
  const endedAt = body.endedAt ? new Date(body.endedAt) : new Date();

  const attempt = await prisma.attempt.create({
    data: {
      examId: exam.id,                 // ✅ مطابق schema.prisma
      user: { connect: { id: userId } },
  
      attemptNo,
      answers: body.answers,
      startedAt,
      endedAt,
      percent,
      taraz: 4000,
      correct,
      wrong,
      blank,
      penalty,
      netCorrect,
      total,
      breakdown,
      warnings: body.warnings ?? null,
    },
  });
  
  
  

  await recalculateExamTaraz(exam.id);
  const freshAttempt = await prisma.attempt.findUnique({ where: { id: attempt.id } });
  return res.status(201).json(toAttemptDto(freshAttempt ?? attempt));
});

// ---- Get attempt details (owner or admin) ----
attemptsRoutes.get("/:id", authRequired, async (req: AuthedRequest, res) => {
  const a = await prisma.attempt.findUnique({ where: { id: req.params.id } });
  if (!a) return res.status(404).json({ message: "NOT_FOUND" });

  if (req.auth!.role !== "admin" && a.userId !== req.auth!.userId)
    return res.status(403).json({ message: "FORBIDDEN" });

  const exam = await prisma.exam.findUnique({ where: { id: a.examId } });
  if (!exam) return res.status(404).json({ message: "NOT_FOUND" });

  let lessonGroups: (LessonGroupQuestionBank | LessonGroupPdf)[] | null = null;

  if (exam.mode === "questionBank") {
    const questions = (await prisma.question.findMany({
      where: { id: { in: exam.questionIds } },
    })) as QuestionEntity[];
    const ans = (a.answers ?? {}) as Record<string, number | null | undefined>;

    const groupKey = (q: QuestionEntity) =>
      `${q.subject}__${q.lessonCode}__${q.major}`;
    const groups = new Map<string, LessonGroupQuestionBank>();

    for (const q of questions) {
      const selectedIndex = ans[q.id];
      const isBlank = selectedIndex === undefined || selectedIndex === null;
      const isCorrect = !isBlank && selectedIndex === q.correctIndex;

      const k = groupKey(q);
      if (!groups.has(k)) {
        groups.set(k, {
          subject: q.subject,
          lessonCode: q.lessonCode,
          major: q.major,
          total: 0,
          correct: 0,
          wrong: 0,
          blank: 0,
          questions: [],
        });
      }
      const g = groups.get(k)!;
      g.total += 1;
      if (isBlank) g.blank += 1;
      else if (isCorrect) g.correct += 1;
      else g.wrong += 1;

      g.questions.push({
        id: q.id,
        prompt: q.prompt,
        options: q.options,
        correctIndex: q.correctIndex,
        selectedIndex: isBlank ? null : selectedIndex,
        imageUrl: q.imageUrl,
        imageFileName: q.imageFileName,
        isCorrect,
      });
    }

    lessonGroups = Array.from(groups.values());
  } else {
    // PDF mode: rebuild lessons + questions from stored answerKey and subjectRanges
    const answerKey = (exam.answerKey ?? {}) as Record<string, number>;
    const qc =
      exam.questionCount ??
      Math.max(
        ...Object.keys(answerKey)
          .map((k) => Number(k))
          .filter((n) => Number.isFinite(n)),
        0,
      );

    const ranges = (exam.subjectRanges ?? []) as Array<{
      from: number;
      to: number;
      subject: string;
    }>;

    const getSubject = (no: number) => {
      for (const r of ranges) {
        if (no >= r.from && no <= r.to) return r.subject;
      }
      return "بدون دسته‌بندی";
    };

    const groups = new Map<string, LessonGroupPdf>();

    const ans = (a.answers ?? {}) as Record<string, number | null | undefined>;

    for (let no = 1; no <= qc; no++) {
      const key = String(no);
      const correctIndex = answerKey[key];
      const selectedIndex = ans[key];
      const isBlank = selectedIndex === undefined || selectedIndex === null;
      const isCorrect =
        !isBlank && typeof correctIndex === "number" && selectedIndex === correctIndex;
      const subject = getSubject(no);

      const k = `${subject}__PDF__عمومی`;
      if (!groups.has(k)) {
        groups.set(k, {
          subject,
          lessonCode: "PDF",
          major: "عمومی",
          total: 0,
          correct: 0,
          wrong: 0,
          blank: 0,
          questions: [],
        });
      }
      const g = groups.get(k)!;
      g.total += 1;
      if (isBlank) g.blank += 1;
      else if (isCorrect) g.correct += 1;
      else g.wrong += 1;

      g.questions.push({
        no,
        correctIndex: typeof correctIndex === "number" ? correctIndex : 0,
        selectedIndex: isBlank ? null : selectedIndex,
        isCorrect,
      });
    }

    lessonGroups = Array.from(groups.values());
  }

  const rankInfo = await computeRankIfFinished(exam, a.userId).catch(() => null);

  // Best overall percent + per-lesson best percent (across all attempts)
  const allAttempts = await prisma.attempt.findMany({
    where: { examId: exam.id },
    select: {
      userId: true,
      percent: true,
      taraz: true,
      netCorrect: true,
      total: true,
      endedAt: true,
      breakdown: true,
    },
  });
  
  const bestByUser = new Map<
  string,
  { percent: number; taraz?: number | null; netCorrect: number; total: number; endedAt: Date; breakdown: any }
>();

  
for (const r of allAttempts) {
  const cur = bestByUser.get(r.userId);

  const row = {
    percent: r.percent,
    taraz: (r as any).taraz ?? 4000,
    netCorrect: r.netCorrect,
    total: r.total,
    endedAt: r.endedAt,
    breakdown: r.breakdown,
  };

  bestByUser.set(r.userId, cur ? betterAttempt(cur, row) : row);
}

  
  const bestAttempts = Array.from(bestByUser.values());
  

  const bestPercent = bestAttempts.reduce((m, r) => {
  const percent =
    r.total > 0 ? (Number(r.netCorrect ?? 0) / r.total) * 100 : 0;

  return percent > m ? percent : m;
}, 0);

  
  const bestByLesson = new Map<string, number>();
  for (const r of bestAttempts){

    const b = (r.breakdown ?? []) as BreakdownRow[];
    for (const row of b) {
      const key = String(row.subject ?? "");
      const cur = bestByLesson.get(key) ?? 0;
      const v = Number(row.percent ?? 0);
      if (v > cur) bestByLesson.set(key, v);
    }
  }

  // attach bestPercent to lessonGroups summary rows
  const lessonGroupsWithBest = (lessonGroups || []).map((g) => ({
    ...g,
    bestPercent: bestByLesson.get(String(g.subject ?? "")) ?? undefined,
  }));

  return res.json(
    toAttemptDto(a, {
      lessonGroups: lessonGroupsWithBest,
      rank: rankInfo?.rank ?? undefined,
      participants: rankInfo?.participants ?? undefined,
      bestPercent,
      bestByLesson: Object.fromEntries(bestByLesson.entries()),
    }),
  );
});

// ---- PDF report download (student owner or admin) ----
attemptsRoutes.get("/:id/pdf", authRequired, async (req: AuthedRequest, res) => {
  const a = await prisma.attempt.findUnique({ where: { id: req.params.id } });
  if (!a) return res.status(404).send("NOT_FOUND");
  if (req.auth!.role !== "admin" && a.userId !== req.auth!.userId)
    return res.status(403).send("FORBIDDEN");

  const [exam, user] = await Promise.all([
    prisma.exam.findUnique({ where: { id: a.examId } }),
    prisma.user.findUnique({
      where: { id: a.userId },
      include: { profile: true },
    }),
  ]);
  if (!exam || !user) return res.status(404).send("NOT_FOUND");

  const rankInfo = await computeRankIfFinished(exam, a.userId).catch(() => null);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="megahadaf-report-${a.id}.pdf"`,
  );

  const doc = new PDFDocument({ size: "A4", margin: 40 });
  doc.pipe(res);

  // assets
  const fontPath = path.resolve(__dirname, "../../assets/fonts/DejaVuSans.ttf");
  const logoPath = path.resolve(__dirname, "../../assets/brand/logo.png");

  if (fs.existsSync(fontPath)) doc.font(fontPath);

  // header
  if (fs.existsSync(logoPath)) {
    try {
      doc.image(logoPath, 40, 36, { width: 44 });
    } catch {
      // ignore
    }
  }

  doc
    .fontSize(18)
    .text(safeFa("کارنامه آزمون - مگاهدف"), 0, 40, { align: "center" });
  doc.moveDown(1.2);
  doc.fontSize(12);
  const name = user.profile?.name || user.email;

  // helpers for tables
  const pageW = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const x0 = doc.page.margins.left;

  function drawTable(
    title: string,
    headers: string[],
    rows: string[][],
    colWidths: number[],
  ) {
    doc.moveDown(0.6);
    doc.fontSize(13).fillColor("#111827").text(safeFa(title), { align: "right" });
    doc.moveDown(0.4);

    const rowH = 26;
    let y = doc.y;

    const drawRow = (cells: string[], isHeader = false) => {
      let x = x0;
      // background for header
      if (isHeader) {
        doc.save();
        doc
          .rect(
            x0,
            y,
            colWidths.reduce((a, b) => a + b, 0),
            rowH,
          )
          .fill("#eef2ff")
          .restore();
      }
      for (let i = 0; i < cells.length; i++) {
        doc
          .rect(x, y, colWidths[i], rowH)
          .strokeColor("#cbd5e1")
          .lineWidth(1)
          .stroke();
        doc.fillColor("#0f172a");
        doc.fontSize(isHeader ? 10.5 : 10.5);
        const textX = x + colWidths[i] - 4; // right align
        const textY = y + 8;
        doc.text(safeFa(cells[i]), textX, textY, {
          width: colWidths[i] - 8,
          align: "right",
        });
        x += colWidths[i];
      }
      y += rowH;
      if (y > doc.page.height - doc.page.margins.bottom - rowH) {
        doc.addPage();
        y = doc.page.margins.top;
      }
    };

    drawRow(headers, true);
    for (const r of rows) drawRow(r, false);

    doc.moveDown(0.4);
    doc.y = y + 4;
  }

  // basic info
  doc.moveDown(0.4);
  doc.fontSize(11.5).fillColor("#0f172a");
  const started = a.startedAt.toISOString().slice(0, 19).replace("T", " ");
  const ended = a.endedAt.toISOString().slice(0, 19).replace("T", " ");

  doc.text(
    safeFa(
      `نام داوطلب: ${name}\nآزمون: ${exam.title}\nتاریخ شروع: ${started}\nتاریخ پایان: ${ended}`,
    ),
    {
      align: "right",
    },
  );
  doc.moveDown(0.6);

  // summary table
  drawTable(
    "خلاصه عملکرد",
    ["تراز", "درصد", "تعداد صحیح", "تعداد غلط", "تعداد نزده", "نمره منفی", "تعداد کل"],
    [
      [
        `${a.taraz ?? 4000}`,
        `${a.percent ?? 0}`,
        `${a.correct ?? 0}`,
        `${a.wrong ?? 0}`,
        `${a.blank ?? 0}`,
        `${a.penalty ?? 0}`,
        `${a.total ?? 0}`,
      ],
    ],
    [60, 60, 70, 70, 70, 70, 70],
  );

  // rank table (if available)
  if (rankInfo?.rank && rankInfo?.participants) {
    drawTable(
      "رتبه در آزمون",
      ["رتبه", "تعداد شرکت‌کنندگان"],
      [[`${rankInfo.rank}`, `${rankInfo.participants}`]],
      [120, 150],
    );
  }

  // per-lesson breakdown from attempt.breakdown
  const breakdown = (a.breakdown ?? []) as BreakdownRow[];
  if (breakdown.length > 0) {
    const rows = breakdown.map((b) => [
      String(b.subject ?? ""),
      String(b.lessonCode ?? ""),
      String(b.major ?? ""),
      String(b.total ?? 0),
      String(b.correct ?? 0),
      String(b.wrong ?? 0),
      String(b.blank ?? 0),
      String(b.percent ?? 0),
    ]);

    drawTable(
      "کارنامه دروس",
      ["درس", "کد درس", "رشته", "تعداد", "صحیح", "غلط", "نزده", "درصد"],
      rows,
      [110, 70, 70, 50, 50, 50, 50, 60],
    );
  }

  doc.end();
});
attemptsRoutes.get("/exams/:examId/top10", async (req, res) => {
  const { examId } = req.params;

  try {
    const rows = await prisma.attempt.findMany({
      where: { examId },
      select: {
        id: true,
        userId: true,
        percent: true,
        taraz: true,
        correct: true,
        wrong: true,
        blank: true,
        netCorrect: true,
        total: true,
        endedAt: true,
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    // بهترین attempt هر کاربر
    const bestByUser = new Map<string, any>();

    for (const r of rows) {
      const cur = bestByUser.get(r.userId);

      bestByUser.set(r.userId, cur ? betterAttempt(cur, r) : r);
    }

    const list = Array.from(bestByUser.values());

    list.sort((a, b) => {
      if ((b.taraz ?? 4000) !== (a.taraz ?? 4000)) return (b.taraz ?? 4000) - (a.taraz ?? 4000);
      if (b.netCorrect !== a.netCorrect) return b.netCorrect - a.netCorrect;
      if (b.percent !== a.percent) return b.percent - a.percent;
      return a.endedAt.getTime() - b.endedAt.getTime();
    });
    
    

    const top10 = list.slice(0, 10);

    const result = top10.map((r, index) => ({
      rank: index + 1,
      id: r.id,
      userId: r.userId,
      userName: r.user.profile?.name || r.user.email || "unknown",
      percent: r.percent,
      taraz: r.taraz ?? 4000,
      correct: r.correct,
      wrong: r.wrong,
      blank: r.blank,
      netCorrect: r.netCorrect,
      total: r.total,
      endedAt: r.endedAt,
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed_to_load_top10" });
  }
});


export default attemptsRoutes;

