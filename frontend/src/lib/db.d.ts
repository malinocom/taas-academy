import type { Major, Note, Order, OrderStatus, Question, Exam, Attempt, AdminAttemptRow, WorkReport, WorkReportStatus } from "./types";
export declare function uploadSingleDb(file: File, type?: string): Promise<{
    url: string;
}>;
export declare function uploadManyDb(files: File[], type?: string): Promise<{
    items: { originalName: string; url: string }[];
}>;
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
    is_private_student?: boolean;
    private_advisor_id?: string | null;
    private_advisor_name?: string | null;
    private_renewal_date?: string | null;
    created_at: string;
};
export declare function getSessionUser(): Promise<any>;
export declare function signOut(): Promise<void>;
export declare function signInStudent(email: string, password: string): Promise<any>;
export declare function signInAdmin(username: string, password: string): Promise<any>;
export declare function signUpStudent(args: {
    name: string;
    email: string;
    password: string;
    major?: Major;
    grade?: string;
    phone?: string;
    nationalId?: string;
    address?: string;
}): Promise<any>;
export declare function getProfile(_userId: string): Promise<Profile>;
export declare function upsertProfile(): Promise<void>;
export declare function listStudents(): Promise<Profile[]>;
export declare function uploadOne(_bucket: string, file: File, _path: string): Promise<string>;
export declare function uploadMany(_bucket: string, files: File[], _folder: string): Promise<{
    originalName: string;
    url: string;
}[]>;
export declare function listNotes(): Promise<Note[]>;
export declare function getNote(noteId: string): Promise<Note>;
export declare function createNote(args: Omit<Note, "id">): Promise<Note>;
export declare function updateNote(noteId: string, patch: Partial<Note>): Promise<Note>;
export declare function deleteNote(noteId: string): Promise<boolean>;
export declare function createOrderDb(order: Omit<Order, "id" | "createdAt" | "updatedAt" | "status" | "total" | "userId"> & {
    userId?: string;
}): Promise<Order>;
export declare function listOrdersAll(): Promise<Order[]>;
export declare function listOrdersForUser(_userId: string): Promise<Order[]>;
export declare function updateOrderStatusDb(orderId: string, status: OrderStatus): Promise<Order>;
export declare function createWorkReportDb(args: {
    userId: string;
    title?: string;
    note?: string;
    imageUrls: string[];
}): Promise<WorkReport>;
export declare function listWorkReportsAll(): Promise<WorkReport[]>;
export declare function listWorkReportsForUser(_userId: string): Promise<WorkReport[]>;
export declare function reviewWorkReportDb(id: string, status: WorkReportStatus, adminComment?: string): Promise<WorkReport>;
export declare function listQuestions(): Promise<Question[]>;
export type PagedResult<T> = {
    page: number;
    pageSize: number;
    total: number;
    items: T[];
};
export declare function listQuestionsPaged(args: {
    page: number;
    pageSize: number;
    text?: string;
    major?: Major;
    subject?: string;
    lessonCode?: string;
}): Promise<PagedResult<Question>>;
export declare function getQuestionsByIds(ids: string[]): Promise<Question[]>;
export declare function createQuestionDb(q: Omit<Question, "id"> & {
    id?: string;
}): Promise<Question>;
export declare function deleteQuestionDb(qid: string): Promise<boolean>;
export declare function bulkCreateQuestionsDb(rows: Question[]): Promise<Question[]>;
export declare function createExamDb(exam: Exam): Promise<Exam>;
export declare function updateExamDb(examId: string, patch: Partial<Exam>): Promise<Exam>;
export declare function deleteExamDb(examId: string): Promise<boolean>;
export declare function listExamsAll(): Promise<Exam[]>;
export declare function getExamRetakesDb(examId: string): Promise<{
    examId: string;
    title: string;
    rows: {
        userId: string;
        name: string;
        email: string;
        allowedAttempts: number;
        usedAttempts: number;
        canAttempt: boolean;
    }[];
}>;
export declare function updateExamRetakeDb(examId: string, args: {
    userId: string;
    allowedAttempts?: number;
    increment?: number;
}): Promise<{
    ok: true;
    examId: string;
    userId: string;
    allowedAttempts: number;
}>;
export declare function listExamsForUser(_userId: string): Promise<Exam[]>;
export declare function getExamDb(examId: string): Promise<Exam>;
export declare function getExamStartDb(examId: string): Promise<{
    exam: Exam;
    questions: Omit<Question, "correctIndex">[];
    attemptInfo?: {
        allowedAttempts: number;
        usedAttempts: number;
        canAttempt: boolean;
    };
}>;
export declare function createAttemptDb(args: {
    examId: string;
    answers: Record<string, number>;
    startedAt?: string;
    endedAt?: string;
    warnings?: any;
}): Promise<Attempt>;
export declare function listAttemptsForUser(_userId: string): Promise<Attempt[]>;
export declare function listAttemptsAll(examId?: string): Promise<AdminAttemptRow[]>;
export declare function setAttemptAdminMessage(attemptId: string, message: string): Promise<{
    ok: true;
    id: string;
    adminMessage: string;
    adminMessageAt?: string;
}>;
export declare function getAttemptDb(attemptId: string): Promise<Attempt>;
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
export declare function createBookingDb(input: {
    fullName: string;
    grade: string;
    major: string;
    goal: string;
    hadAdvisorBefore: boolean;
    phone: string;
    parentPhone?: string;
    advisorChoice: string;
    cancelReason?: string;
}): Promise<{
    ok: true;
    id: string;
}>;
export declare function listBookingsAdminDb(): Promise<ConsultationBooking[]>;
export declare function updateBookingAdminDb(id: string, patch: {
    status?: "new" | "contacted" | "closed";
    note?: string | null;
}): Promise<{
    ok: true;
    id: string;
    status: string;
    note: string | null;
}>;
export declare const BUCKETS: {
    notesImages: string;
    reportImages: string;
    questionImages: string;
};
export declare const PUBLIC: {
    apiBase: any;
};
