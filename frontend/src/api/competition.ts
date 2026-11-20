import { apiFetch } from "../lib/api";

export interface Competition {
  id: string;          // مطابق Prisma (UUID)
  title: string;
  description?: string | null;
  startDate: string;   // ISO string از بک‌اند
  endDate: string;     // ISO string
  status: "upcoming" | "active" | "finished" | "draft";
  participantCount?: number;
}

export interface CompetitionParticipant {
  id: string;             // String در Prisma
  competitionId: string;  // String در Prisma
  studentId: string;      // String در Prisma (احتمالاً User.id)
  totalStudyMinutes: number;
  totalCorrect: number;
  totalWrong: number;
  totalEmpty: number;
  finalRank?: number | null;
}

export interface CompetitionDailyRecord {
  id: string;             // String در Prisma
  competitionId: string;  // String در Prisma
  participantId: string;  // String در Prisma
  studentId: string;      // String در Prisma
  date: string;           // ISO string
  studyMinutes: number;
  correctCount: number;
  wrongCount: number;
  emptyCount: number;
}

/**
 * دریافت رقابت فعال فعلی برای دانش‌آموز لاگین‌شده
 */
export async function getMyActiveCompetition() {
  return apiFetch<{
    competition: Competition | null;
    participant: CompetitionParticipant | null;
    todayRecord: CompetitionDailyRecord | null;
    leaderboard: CompetitionParticipant[];
  }>("/competitions/me/active");
}

/**
 * ارسال رکورد روزانه‌ی دانش‌آموز در رقابت
 */
export async function submitDailyRecord(
  competitionId: string,
  payload: {
    studyMinutes: number;
    correctCount: number;
    wrongCount: number;
    emptyCount: number;
  }
) {
  return apiFetch<CompetitionDailyRecord>(
    `/competitions/${competitionId}/records`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
}

/**
 * دریافت لیدربورد یک رقابت
 */
export async function getLeaderboard(competitionId: string) {
  return apiFetch<{
    leaderboard: CompetitionParticipant[];
    myRank: number | null;
  }>(`/competitions/${competitionId}/leaderboard`);
}

// ---------- Admin APIs ----------

/**
 * لیست رقابت‌ها برای ادمین
 */
export async function listCompetitions() {
  return apiFetch<Competition[]>("/competitions");
}

/**
 * ایجاد رقابت جدید
 * startDate / endDate باید ISO string (میلادی) باشند
 * مثال: 2025-01-01T08:00:00.000Z
 */
export async function createCompetition(payload: {
  title: string;
  description?: string;
  startDate: string; // ISO
  endDate: string;   // ISO
}) {
  return apiFetch<Competition>("/competitions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/**
 * اضافه کردن شرکت‌کننده به رقابت
 */
export async function addParticipant(
  competitionId: string,
  studentId: string
) {
  return apiFetch<CompetitionParticipant>(
    `/competitions/${competitionId}/participants`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId }),
    }
  );
}

/**
 * حذف شرکت‌کننده از رقابت
 */
export async function updateCompetitionStatus(
  competitionId: string,
  status: Competition["status"]
) {
  return apiFetch<Competition>(`/competitions/${competitionId}/status`, {
    method: "PATCH",
    body: { status },
  });
}

export async function removeParticipant(
  competitionId: string,
  studentId: string
) {
  return apiFetch<void>(
    `/competitions/${competitionId}/participants/${studentId}`,
    {
      method: "DELETE",
    }
  );
}

/**
 * لیست شرکت‌کنندگان به همراه رکوردهای روزانه‌شان
 */
export async function listParticipants(competitionId: string) {
  return apiFetch<
    (CompetitionParticipant & { dailyRecords: CompetitionDailyRecord[] })[]
  >(`/competitions/${competitionId}/participants`);
}
