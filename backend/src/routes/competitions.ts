import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { adminOnly, requireAuth, type AuthedRequest } from "../auth/middleware";

const router = Router();

const createCompetitionSchema = z.object({
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(2000).optional(),
  startDate: z.string().datetime({ offset: true }),
  endDate: z.string().datetime({ offset: true }),
});

const dailyRecordSchema = z.object({
  studyMinutes: z.number().int().min(0).max(24 * 60),
  correctCount: z.number().int().min(0).max(1000).default(0),
  wrongCount: z.number().int().min(0).max(1000).default(0),
  emptyCount: z.number().int().min(0).max(1000).default(0),
});

const statusSchema = z.object({ status: z.enum(["upcoming", "active", "finished", "draft"]) });

function startOfUtcDay(value = new Date()) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function participantDto(participant: any) {
  return {
    id: participant.id,
    competitionId: participant.competitionId,
    studentId: participant.studentId,
    totalStudyMinutes: participant.totalStudyMinutes ?? 0,
    totalCorrect: participant.totalCorrect ?? 0,
    totalWrong: participant.totalWrong ?? 0,
    totalEmpty: participant.totalBlank ?? 0,
    finalRank: participant.rank ?? null,
  };
}

function dailyRecordDto(record: any, studentId?: string) {
  return {
    id: record.id,
    competitionId: record.participant?.competitionId ?? record.competitionId,
    participantId: record.participantId,
    studentId: studentId ?? record.participant?.studentId,
    date: record.date,
    studyMinutes: record.studyMinutes ?? 0,
    correctCount: record.correct ?? 0,
    wrongCount: record.wrong ?? 0,
    emptyCount: record.blank ?? 0,
  };
}

function competitionDto(competition: any) {
  return {
    id: competition.id,
    title: competition.title,
    description: competition.description,
    startDate: competition.startDate,
    endDate: competition.endDate,
    status: competition.status,
    participantCount: competition._count?.participants ?? competition.participants?.length ?? 0,
  };
}

async function syncCompetitionStatuses() {
  const now = new Date();
  await prisma.competition.updateMany({
    where: { status: "upcoming", startDate: { lte: now }, endDate: { gte: now } },
    data: { status: "active" },
  });
  await prisma.competition.updateMany({
    where: { status: { in: ["upcoming", "active"] }, endDate: { lt: now } },
    data: { status: "finished" },
  });
}

async function buildLeaderboard(competitionId: string, currentUserId?: string) {
  const participants = await prisma.competitionParticipant.findMany({
    where: { competitionId },
    orderBy: [{ totalStudyMinutes: "desc" }, { totalCorrect: "desc" }, { totalWrong: "asc" }],
    include: { dailyRecords: true },
  });

  const leaderboard = participants.map((participant, index) => ({
    ...participantDto(participant),
    rank: index + 1,
    finalRank: index + 1,
    dailyRecords: participant.dailyRecords.map((record) => dailyRecordDto(record, participant.studentId)),
  }));

  const myIndex = currentUserId
    ? participants.findIndex((participant) => participant.studentId === currentUserId)
    : -1;

  return {
    leaderboard,
    myRank: myIndex >= 0 ? myIndex + 1 : null,
  };
}

/* ---------------------------------------------------------
   Student: active competition and daily record
   These routes must be registered before /:id routes.
--------------------------------------------------------- */
router.get("/me/active", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    if (req.auth?.role !== "student") return res.status(403).json({ message: "STUDENT_ONLY" });

    const now = new Date();
    await syncCompetitionStatuses();
    const competition = await prisma.competition.findFirst({
      where: {
        status: "active",
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { startDate: "asc" },
      include: { _count: { select: { participants: true } } },
    });

    if (!competition) {
      return res.json({ competition: null, participant: null, todayRecord: null, leaderboard: [] });
    }

    const participant = await prisma.competitionParticipant.findUnique({
      where: { competitionId_studentId: { competitionId: competition.id, studentId: req.auth.userId } },
    });

    const today = startOfUtcDay(now);
    const todayRecord = participant
      ? await prisma.competitionDailyRecord.findUnique({
          where: { participantId_date: { participantId: participant.id, date: today } },
          include: { participant: true },
        })
      : null;

    const board = await buildLeaderboard(competition.id, req.auth.userId);

    return res.json({
      competition: competitionDto(competition),
      participant: participant ? participantDto(participant) : null,
      todayRecord: todayRecord ? dailyRecordDto(todayRecord, req.auth.userId) : null,
      leaderboard: board.leaderboard,
      myRank: board.myRank,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/:id/records", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    if (req.auth?.role !== "student") return res.status(403).json({ message: "STUDENT_ONLY" });
    const parsed = dailyRecordSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "INVALID_DAILY_RECORD", issues: parsed.error.flatten() });

    const competition = await prisma.competition.findUnique({ where: { id: req.params.id } });
    if (!competition) return res.status(404).json({ message: "COMPETITION_NOT_FOUND" });
    const now = new Date();
    if (competition.status !== "active" || now < competition.startDate || now > competition.endDate) {
      return res.status(400).json({ message: "COMPETITION_NOT_ACTIVE" });
    }

    const participant = await prisma.competitionParticipant.findUnique({
      where: { competitionId_studentId: { competitionId: competition.id, studentId: req.auth.userId } },
    });
    if (!participant) return res.status(403).json({ message: "NOT_A_COMPETITION_PARTICIPANT" });

    const date = startOfUtcDay(now);
    const payload = parsed.data;
    const record = await prisma.competitionDailyRecord.upsert({
      where: { participantId_date: { participantId: participant.id, date } },
      update: {
        studyMinutes: payload.studyMinutes,
        correct: payload.correctCount,
        wrong: payload.wrongCount,
        blank: payload.emptyCount,
      },
      create: {
        participantId: participant.id,
        date,
        studyMinutes: payload.studyMinutes,
        correct: payload.correctCount,
        wrong: payload.wrongCount,
        blank: payload.emptyCount,
      },
    });

    const totals = await prisma.competitionDailyRecord.aggregate({
      where: { participantId: participant.id },
      _sum: { studyMinutes: true, correct: true, wrong: true, blank: true },
    });

    await prisma.competitionParticipant.update({
      where: { id: participant.id },
      data: {
        totalStudyMinutes: totals._sum.studyMinutes ?? 0,
        totalCorrect: totals._sum.correct ?? 0,
        totalWrong: totals._sum.wrong ?? 0,
        totalBlank: totals._sum.blank ?? 0,
      },
    });

    return res.json(dailyRecordDto({ ...record, participant: { competitionId: competition.id, studentId: req.auth.userId } }, req.auth.userId));
  } catch (error) {
    next(error);
  }
});

/* ---------------------------------------------------------
   Admin: competition management
--------------------------------------------------------- */
router.get("/", adminOnly, async (_req, res, next) => {
  try {
    await syncCompetitionStatuses();
    const competitions = await prisma.competition.findMany({
      include: { _count: { select: { participants: true } } },
      orderBy: { createdAt: "desc" },
    });
    return res.json(competitions.map(competitionDto));
  } catch (error) {
    next(error);
  }
});

router.post("/", adminOnly, async (req, res, next) => {
  try {
    const parsed = createCompetitionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "INVALID_COMPETITION", issues: parsed.error.flatten() });

    const startDate = new Date(parsed.data.startDate);
    const endDate = new Date(parsed.data.endDate);
    if (!Number.isFinite(startDate.getTime()) || !Number.isFinite(endDate.getTime()) || endDate <= startDate) {
      return res.status(400).json({ message: "INVALID_COMPETITION_DATES" });
    }

    const now = new Date();
    const status = startDate <= now && endDate >= now ? "active" : startDate > now ? "upcoming" : "finished";
    const competition = await prisma.competition.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description || null,
        startDate,
        endDate,
        status,
      },
      include: { _count: { select: { participants: true } } },
    });
    return res.status(201).json(competitionDto(competition));
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/status", adminOnly, async (req, res, next) => {
  try {
    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "INVALID_COMPETITION_STATUS" });
    const competition = await prisma.competition.update({
      where: { id: req.params.id },
      data: { status: parsed.data.status },
      include: { _count: { select: { participants: true } } },
    });
    return res.json(competitionDto(competition));
  } catch (error) {
    next(error);
  }
});

router.get("/:id/participants", adminOnly, async (req, res, next) => {
  try {
    const participants = await prisma.competitionParticipant.findMany({
      where: { competitionId: req.params.id },
      include: { dailyRecords: true },
      orderBy: [{ totalStudyMinutes: "desc" }, { totalCorrect: "desc" }],
    });
    return res.json(participants.map((participant, index) => ({
      ...participantDto(participant),
      finalRank: index + 1,
      dailyRecords: participant.dailyRecords.map((record) => dailyRecordDto(record, participant.studentId)),
    })));
  } catch (error) {
    next(error);
  }
});

router.post("/:id/participants", adminOnly, async (req, res, next) => {
  try {
    const parsed = z.object({ studentId: z.string().min(1) }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "STUDENT_ID_REQUIRED" });

    const [competition, student] = await Promise.all([
      prisma.competition.findUnique({ where: { id: req.params.id } }),
      prisma.user.findFirst({ where: { id: parsed.data.studentId, role: "student" } }),
    ]);
    if (!competition) return res.status(404).json({ message: "COMPETITION_NOT_FOUND" });
    if (!student) return res.status(404).json({ message: "STUDENT_NOT_FOUND" });

    const participant = await prisma.competitionParticipant.create({
      data: { competitionId: competition.id, studentId: student.id },
    });
    return res.status(201).json(participantDto(participant));
  } catch (error: any) {
    if (error?.code === "P2002") return res.status(409).json({ message: "STUDENT_ALREADY_REGISTERED" });
    next(error);
  }
});

router.delete("/:id/participants/:studentId", adminOnly, async (req, res, next) => {
  try {
    const participant = await prisma.competitionParticipant.findUnique({
      where: { competitionId_studentId: { competitionId: req.params.id, studentId: req.params.studentId } },
    });
    if (!participant) return res.status(404).json({ message: "PARTICIPANT_NOT_FOUND" });
    await prisma.$transaction([
      prisma.competitionDailyRecord.deleteMany({ where: { participantId: participant.id } }),
      prisma.competitionParticipant.delete({ where: { id: participant.id } }),
    ]);
    return res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.get("/:id/leaderboard", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const competition = await prisma.competition.findUnique({ where: { id: req.params.id } });
    if (!competition) return res.status(404).json({ message: "COMPETITION_NOT_FOUND" });
    const result = await buildLeaderboard(competition.id, req.auth?.userId);
    return res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", adminOnly, async (req, res, next) => {
  try {
    const competition = await prisma.competition.findUnique({
      where: { id: req.params.id },
      include: {
        participants: { include: { dailyRecords: true } },
        _count: { select: { participants: true } },
      },
    });
    if (!competition) return res.status(404).json({ message: "COMPETITION_NOT_FOUND" });
    return res.json({
      ...competitionDto(competition),
      participants: competition.participants.map((participant, index) => ({
        ...participantDto(participant),
        finalRank: index + 1,
        dailyRecords: participant.dailyRecords.map((record) => dailyRecordDto(record, participant.studentId)),
      })),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
