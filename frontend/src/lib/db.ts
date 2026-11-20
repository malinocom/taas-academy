import type { Major, Note, Order, OrderStatus, Question, Exam, Attempt, AdminAttemptRow, WorkReport, WorkReportStatus } from "./types";
import { apiFetch, apiUrl } from "./api";

// Upload helpers (used by question/exam builders)
export async function uploadSingleDb(file: File, type: string = "misc"): Promise<{ url: string }> {
  const form = new FormData();
  // Send type in the query string as well as FormData so the backend knows the
  // destination before Multer starts writing the file.
  form.append("type", type);
  form.append("file", file);
  return apiFetch<{ url: string }>(`/upload/one?type=${encodeURIComponent(type)}`, {
    method: "POST",
    body: form,
  });
}

export async function uploadManyDb(files: File[], type: string = "misc"): Promise<{ items: { originalName: string; url: string }[] }> {
  const form = new FormData();
  form.append("type", type);
  files.forEach((file) => form.append("files", file));
  return apiFetch<{ items: { originalName: string; url: string }[] }>(`/upload/many?type=${encodeURIComponent(type)}`, {
    method: "POST",
    body: form,
  });
}

export type Role = "admin" | "advisor" | "student";

export type Profile = {
  user_id: string;
  role: Role;
  name: string;
  email: string;
  major?: Major | null;
  grade?: string | null;
  phone?: string | null;
  national_id?: string | null;
  address?: string | null;
  created_at: string;
  is_private_student?: boolean;
  private_advisor_id?: string | null;
  private_advisor_name?: string | null;
  private_renewal_date?: string | null;
};

// ---- Auth ----
export async function getSessionUser() {
  try {
    const r = await apiFetch<any>("/auth/me");
    return r?.user ?? null;
  } catch {
    return null;
  }
}

export async function signOut() {
  await apiFetch("/auth/logout", { method: "POST" });
}

export async function signInStudent(email: string, password: string) {
  const r = await apiFetch<any>("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: email.trim(), password }),
  });
  return r;
}

export async function signInAdmin(username: string, password: string) {
  const u = username.trim().toLowerCase();
  if (u !== "admin") throw new Error("نام کاربری ادمین نامعتبر است.");
  const r = await apiFetch<any>("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: u, password }),
  });
  return r;
}

export async function signUpStudent(args: {
  name: string;
  email: string;
  password: string;
  major?: Major;
  grade?: string;
  phone?: string;
  nationalId?: string;
  address?: string;
}) {
  const r = await apiFetch<any>("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: args.name,
      email: args.email,
      password: args.password,
      major: args.major,
      grade: args.grade,
      phone: args.phone,
      nationalId: args.nationalId,
      address: args.address,
    }),
  });
  return r?.user;
}

// Profiles are returned via /auth/me and admin students endpoint in this backend.
export async function getProfile(_userId: string) {
  try {
    const r = await apiFetch<any>("/auth/me");
    const u = r?.user;
    if (!u) return null;
    const p = u.profile || {};
    const prof: Profile = {
      user_id: u.id,
      role: u.role,
      name: p.name ?? "",
      email: u.email,
      major: p.major ?? null,
      grade: p.grade ?? null,
      phone: p.phone ?? null,
      national_id: p.nationalId ?? null,
      address: p.address ?? null,
      created_at: p.createdAt ?? new Date().toISOString(),
    };
    return prof;
  } catch {
    return null;
  }
}

export async function upsertProfile() {
  throw new Error("ویرایش پروفایل در این نسخه از طریق API جداگانه انجام می‌شود.");
}

export async function listStudents() {
  return apiFetch<Profile[]>("/admin/students");
}

// ---- Uploads (local) ----
export async function uploadOne(_bucket: string, file: File, _path: string) {
  const form = new FormData();
  const type = bucketToType(_bucket);
  form.append("type", type);
  form.append("file", file);
  const r = await apiFetch<{ url: string }>(`/upload/one?type=${encodeURIComponent(type)}`, {
    method: "POST",
    body: form,
  });
  return r.url;
}

export async function uploadMany(_bucket: string, files: File[], _folder: string) {
  const form = new FormData();
  const type = bucketToType(_bucket);
  form.append("type", type);
  for (const file of files) form.append("files", file);
  const r = await apiFetch<{ items: { originalName: string; url: string }[] }>(`/upload/many?type=${encodeURIComponent(type)}`, {
    method: "POST",
    body: form,
  });
  return r.items;
}

function bucketToType(bucket: string) {
  if (bucket.includes("note")) return "notes";
  if (bucket.includes("report")) return "reports";
  if (bucket.includes("question")) return "questions";
  return "misc";
}

// ---- Notes (Shop) ----
export async function listNotes() {
  return apiFetch<Note[]>("/notes");
}

export async function getNote(noteId: string) {
  return apiFetch<Note | null>(`/notes/${noteId}`);
}

export async function createNote(args: Omit<Note, "id">) {
  return apiFetch<Note>("/notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
}

export async function updateNote(noteId: string, patch: Partial<Note>) {
  return apiFetch<Note>(`/notes/${noteId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}

export async function deleteNote(noteId: string) {
  await apiFetch(`/notes/${noteId}`, { method: "DELETE" });
  return true;
}

// ---- Orders ----
export async function createOrderDb(order: Omit<Order, "id" | "createdAt" | "updatedAt" | "status" | "total" | "userId"> & { userId?: string }) {
  return apiFetch<Order>("/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items: order.items, customer: order.customer }),
  });
}

export async function listOrdersAll() {
  return apiFetch<Order[]>("/orders");
}

export async function listOrdersForUser(_userId: string) {
  return apiFetch<Order[]>("/orders/my");
}

export async function updateOrderStatusDb(orderId: string, status: OrderStatus) {
  return apiFetch<Order>(`/orders/${orderId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

// ---- Work Reports ----
export async function createWorkReportDb(args: { userId: string; title?: string; note?: string; imageUrls: string[] }) {
  // userId ignored (taken from cookie)
  return apiFetch<WorkReport>("/work-reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: args.title, note: args.note, imageUrls: args.imageUrls }),
  });
}

export async function listWorkReportsAll() {
  return apiFetch<WorkReport[]>("/work-reports");
}

export async function listWorkReportsForUser(_userId: string) {
  return apiFetch<WorkReport[]>("/work-reports/my");
}

export async function reviewWorkReportDb(id: string, status: WorkReportStatus, adminComment?: string) {
  return apiFetch<WorkReport>(`/work-reports/${id}/review`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, adminComment }),
  });
}

// ---- Questions (Admin) ----
export async function listQuestions() {
  return apiFetch<Question[]>("/questions");
}

export type PagedResult<T> = {
  page: number;
  pageSize: number;
  total: number;
  items: T[];
};

export async function listQuestionsPaged(args: {
  page: number;
  pageSize: number;
  text?: string;
  major?: Major;
  subject?: string;
  lessonCode?: string;
}) {
  const qs = new URLSearchParams();
  qs.set("page", String(args.page));
  qs.set("pageSize", String(args.pageSize));
  if (args.text?.trim()) qs.set("text", args.text.trim());
  if (args.major?.trim()) qs.set("major", args.major.trim());
  if (args.subject?.trim()) qs.set("subject", args.subject.trim());
  if (args.lessonCode?.trim()) qs.set("lessonCode", args.lessonCode.trim());

  return apiFetch<PagedResult<Question>>(`/questions?${qs.toString()}`);
}

export async function getQuestionsByIds(ids: string[]) {
  // In the secure backend, students get questions through /exams/:id/start.
  // Keep this for admin tooling only.
  if (!ids.length) return [] as Question[];
  const all = await listQuestions();
  const map = new Map(all.map((q) => [q.id, q]));
  return ids.map((id) => map.get(id)).filter(Boolean) as Question[];
}

export async function createQuestionDb(q: Omit<Question, "id"> & { id?: string }) {
  const row = { ...q, id: q.id && q.id.trim() ? q.id : cryptoId("q") } as Question;
  return apiFetch<Question>("/questions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(row),
  });
}

export async function deleteQuestionDb(qid: string) {
  await apiFetch(`/questions/${qid}`, { method: "DELETE" });
  return true;
}

export async function bulkCreateQuestionsDb(rows: Question[]) {
  const withIds = rows.map((r) => ({ ...r, id: r.id && r.id.trim() ? r.id : cryptoId("q") }));
  return apiFetch<Question[]>("/questions/bulk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(withIds),
  });
}

// ---- Exams ----
export async function createExamDb(exam: Exam) {
  const row = { ...exam, id: exam.id && exam.id.trim() ? exam.id : cryptoId("exam") };
  return apiFetch<Exam>("/exams", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(row),
  });
}

export async function updateExamDb(examId: string, patch: Partial<Exam>) {
  return apiFetch<Exam>(`/exams/${examId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}

export async function deleteExamDb(examId: string) {
  await apiFetch(`/exams/${examId}`, { method: "DELETE" });
  return true;
}

export async function listExamsAll() {
  return apiFetch<Exam[]>("/exams");
}

// ---- Admin: retake management ----
export async function getExamRetakesDb(examId: string) {
  return apiFetch<{ examId: string; title: string; rows: { userId: string; name: string; email: string; allowedAttempts: number; usedAttempts: number; canAttempt: boolean }[] }>(`/admin/exams/${examId}/retakes`);
}

export async function updateExamRetakeDb(examId: string, args: { userId: string; allowedAttempts?: number; increment?: number }) {
  return apiFetch<{ ok: true; examId: string; userId: string; allowedAttempts: number }>(`/admin/exams/${examId}/retakes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
}

export async function listExamsForUser(_userId: string) {
  return apiFetch<Exam[]>("/exams/my");
}

export async function getExamDb(examId: string) {
  return apiFetch<Exam | null>(`/exams/${examId}`);
}

export async function getExamStartDb(examId: string) {
  return apiFetch<{ exam: Exam; questions: Omit<Question, "correctIndex">[]; attemptInfo?: { allowedAttempts: number; usedAttempts: number; canAttempt: boolean } }>(`/exams/${examId}/start`);
}

// ---- Attempts ----
export async function createAttemptDb(args: { examId: string; answers: Record<string, number>; startedAt?: string; endedAt?: string; warnings?: any }) {
  return apiFetch<Attempt>("/attempts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(args),
  });
}

export async function listAttemptsForUser(_userId: string) {
  return apiFetch<Attempt[]>("/attempts/my");
}

export async function listAttemptsAll(examId?: string) {
  const q = examId ? `?examId=${encodeURIComponent(examId)}` : "";
  return apiFetch<AdminAttemptRow[]>(`/attempts${q}`);
}

export async function setAttemptAdminMessage(attemptId: string, message: string) {
  return apiFetch<{ ok: true; id: string; adminMessage: string; adminMessageAt?: string }>(`/attempts/${attemptId}/admin-message`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
}

export async function getAttemptDb(attemptId: string) {
  return apiFetch<Attempt | null>(`/attempts/${attemptId}`);
}

// ---- Consultation booking ----
export type ConsultationBooking = {
  id: string;
  createdAt: string;
  fullName: string;
  grade: string;
  major: string;
  goal: string;
  hadAdvisorBefore: boolean;
  phone: string;
  parentPhone?: string | null;
  advisorChoice: string;
  cancelReason?: string | null;
  status: "new" | "contacted" | "closed";
  note?: string | null;
};

export async function createBookingDb(input: {
  fullName: string;
  grade: string;
  major: string;
  goal: string;
  hadAdvisorBefore: boolean;
  phone: string;
  parentPhone?: string;
  advisorChoice: string;
  cancelReason?: string;
}) {
  return apiFetch<{ ok: true; id: string }>(`/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function listBookingsAdminDb() {
  return apiFetch<ConsultationBooking[]>(`/bookings/admin`);
}

export async function updateBookingAdminDb(id: string, patch: { status?: "new" | "contacted" | "closed"; note?: string | null }) {
  return apiFetch<{ ok: true; id: string; status: string; note: string | null }>(`/bookings/admin/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}

function cryptoId(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

// ---- Compatibility constants (used by UI) ----
export const BUCKETS = {
  notesImages: "notes-images",
  reportImages: "report-images",
  questionImages: "question-images",
};

export const PUBLIC = {
  apiBase: apiUrl(),
};