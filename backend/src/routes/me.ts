import { Router } from "express";
import { prisma } from "../prisma";
import { requireAuth } from "../auth/middleware";
import type { AuthedRequest } from "../auth/middleware";
import { toGregorian, isValidJalaaliDate } from "jalaali-js";

export const meRoutes = Router();

function toEnglishDigits(input: string) {
  return String(input || "")
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

function parseDateOnlyToUTCDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const clean = toEnglishDigits(dateStr).slice(0, 10);
  const parts = clean.split("-").map(Number);
  if (parts.length !== 3) return null;
  const [y, m, d] = parts;
  if (!y || !m || !d) return null;

  if (y >= 1700) return new Date(Date.UTC(y, m - 1, d));
  if (!isValidJalaaliDate(y, m, d)) return null;
  const g = toGregorian(y, m, d);
  return new Date(Date.UTC(g.gy, g.gm - 1, g.gd));
}

function startOfTodayUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function addDaysUTC(date: Date, days: number) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function dateToIsoDate(date: Date | null | undefined) {
  return date ? date.toISOString().slice(0, 10) : null;
}

// -------------------------------------------------------------
// دریافت برنامه روز + وضعیت مطالعه (StudyProgress)
// دانش‌آموز فقط برنامه‌های گذشته، امروز و حداکثر ۳ روز آینده را می‌بیند.
// -------------------------------------------------------------
meRoutes.get("/me/private-plan", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        isPrivateStudent: true,
        privateRenewalDate: true,
        profile: { select: { name: true, grade: true, phone: true } },
        privateAdvisor: { select: { profile: { select: { name: true } } } },
      },
    });

    if (!user?.isPrivateStudent) {
      return res.json({
        success: true,
        isPrivateStudent: false,
        canViewDate: true,
        plan: null,
        progress: [],
        progresses: [],
      });
    }

    const rawDate = String(req.query.date || "");
    const parsedDate = parseDateOnlyToUTCDate(rawDate);
    if (!parsedDate) return res.status(400).json({ error: "تاریخ نامعتبر است" });

    const today = startOfTodayUTC();
    const maxFutureDate = addDaysUTC(today, 3);
    if (parsedDate.getTime() > maxFutureDate.getTime()) {
      return res.json({
        success: true,
        isPrivateStudent: true,
        canViewDate: false,
        limitDate: dateToIsoDate(maxFutureDate),
        user: {
          name: user.profile?.name || "دانش‌آموز",
          grade: user.profile?.grade || "",
          phone: user.profile?.phone || "",
          advisorName: user.privateAdvisor?.profile?.name || "",
          renewalDate: dateToIsoDate(user.privateRenewalDate),
        },
        plan: null,
        progress: [],
        progresses: [],
      });
    }

    const plan = await prisma.privatePlan.findUnique({
      where: { userId_date: { userId, date: parsedDate } },
      include: { rows: { orderBy: { orderIndex: "asc" } } },
    });

    const progresses = await prisma.studyProgress.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });

    return res.json({
      success: true,
      isPrivateStudent: true,
      canViewDate: true,
      user: {
        name: user.profile?.name || "دانش‌آموز",
        grade: user.profile?.grade || "",
        phone: user.profile?.phone || "",
        advisorName: user.privateAdvisor?.profile?.name || "",
        renewalDate: dateToIsoDate(user.privateRenewalDate),
      },
      plan: plan || null,
      progress: progresses || [],
      progresses: progresses || [],
    });
  } catch (error) {
    next(error);
  }
});

meRoutes.patch("/me/private-plan/rows/:rowId/toggle", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const userId = req.auth?.userId;
    const rowId = Number(req.params.rowId);

    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    if (!rowId) return res.status(400).json({ error: "Invalid row id" });

    const row = await prisma.privatePlanRow.findFirst({ where: { id: rowId, plan: { userId } } });
    if (!row) return res.status(404).json({ error: "Row not found" });

    const updated = await prisma.privatePlanRow.update({ where: { id: rowId }, data: { done: !row.done } });
    return res.json({ success: true, row: updated });
  } catch (error) {
    next(error);
  }
});

export default meRoutes;
