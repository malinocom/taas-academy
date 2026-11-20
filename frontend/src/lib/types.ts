export type Note = {
  id: string;
  title: string;
  price: number;
  description: string;
  tags?: string[];
  coverEmoji?: string;
  /** تصاویر پیش‌نمایش جزوه */
  imageUrls?: string[];
  /** لینک فایل PDF فقط در پنل مدیریت نمایش داده می‌شود. */
  pdfUrl?: string | null;
  pdfFileName?: string | null;
  hasPdf?: boolean;
};

// رشته تحصیلی (برای سوال‌ها و آزمون)
export type Major = "انسانی" | "تجربی" | "ریاضی" | "عمومی";

export type ExamMode = "questionBank" | "pdf";

export type SubjectRange = {
  from: number;
  to: number;
  subject: string;
};

export type OrderStatus = "pending" | "paid" | "processing" | "sent" | "delivered" | "canceled";

export type OrderItem = {
  noteId: string;
  title: string;
  price: number;
  qty: number;
};

export type OrderCustomer = {
  name: string;
  phone: string;
  nationalId: string;
  email: string;
  grade?: string;
  major?: Major;
  address?: string;
};

export type Order = {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  customer: OrderCustomer;
  createdAt: string;
  updatedAt: string;
};

export type WorkReportStatus = "submitted" | "approved" | "rejected";

export type WorkReport = {
  id: string;
  userId: string;
  title?: string;
  note?: string;
  /** تصاویر گزارش کار (URL عمومی Supabase Storage) */
  imageUrls: string[];
  createdAt: string;
  status: WorkReportStatus;
  adminComment?: string;
  reviewedAt?: string;
};

export type Question = {
  id: string;
  /** متن سوال */
  prompt: string;
  /** چهار گزینه */
  options: string[];
  /** گزینه صحیح (۰ تا ۳) */
  correctIndex: number;

  /** نام درس برای نمایش/تحلیل (مثلاً: فارسی، ریاضی، شیمی) */
  subject: string;
  /** کد درس (ترجیحاً متنی تا 01 و… از بین نرود) */
  lessonCode: string;
  /** رشته تحصیلی */
  major: Major;

  /** پایه (اختیاری) مثل دهم/یازدهم/دوازدهم */
  grade?: string;

  /** کلید بودجه‌بندی (اختیاری) برای گزارش/چینش */
  blueprintKey?: string;

  /** اگر true باشد، سوال فقط با عکس نمایش داده می‌شود و متن/گزینه‌ها اختیاری هستند */
  isImageOnly?: boolean;

  difficulty: "آسان" | "متوسط" | "سخت";
  tags: string[];

  /** تصویر اختیاری (URL عمومی) */
  imageUrl?: string;
  /** برای ایمپورت اکسل (اختیاری) */
  imageFileName?: string;
};

export type ExamBlueprintItem = {
  major: Major;
  lessonCode: string;
  subject: string;
  count: number;
};

export type Exam = {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;

  /** نوع آزمون */
  mode?: ExamMode;

  /** زمان‌بندی (اختیاری) */
  startAt?: string;
  endAt?: string;

  /** حالت PDF */
  pdfUrl?: string | null;
  pdfFileName?: string | null;
  questionCount?: number;
  answerKey?: Record<string, number>;
  subjectRanges?: SubjectRange[];

  /** سوال‌های این آزمون (بعد از تولید) */
  questionIds: string[];

  /** سهم‌بندی تولید سوال (برای نمایش/بازسازی) */
  blueprint?: ExamBlueprintItem[];

  /** نمره منفی: هر N غلط = 1 درست کم */
  negativeMarking?: {
    enabled: boolean;
    wrongPerPenalty: number;
  };

  /**
   * اگر خالی باشد => برای همه دانش‌آموزها
   * اگر پر باشد => فقط همان کاربران می‌توانند این آزمون را ببینند/شروع کنند.
   */
  assignedUserIds?: string[];

  published: boolean;
  createdAt: string;
};

export type SubjectBreakdownRow = {
  subject: string;
  lessonCode: string;
  major: Major;
  total: number;
  correct: number;
  wrong: number;
  blank: number;
  percent: number;
  netCorrect?: number;
};

export type Attempt = {
  id: string;
  examId: string;
  userId: string;

  /** answers[qid] = original option index */
  answers: Record<string, number>;

  startedAt: string;
  endedAt: string;

  percent: number;
  taraz?: number;
  correct: number;
  wrong: number;
  blank: number;
  penalty: number;
  netCorrect: number;
  total: number;

  /** شکست درسی (برای هر درس: صحیح/غلط/خالی + درصد) */
  breakdown: SubjectBreakdownRow[];

  /** گزارش امنیت */
  warnings?: { type: string; at: string }[];

  /** پیام/بازخورد ادمین برای همین آزمون */
  adminMessage?: string;
  adminMessageAt?: string;

  /** رتبه بعد از پایان آزمون (اگر محاسبه شده باشد) */
  rank?: number;
  participants?: number;

  /** بالاترین درصد ثبت‌شده در همین آزمون */
  bestPercent?: number;

  /** بالاترین درصد هر درس (کل آزمون) */
  bestByLesson?: Record<string, number>;

  /**
   * جزئیات سؤال‌به‌سؤال (برای نمایش در نتایج دانش‌آموز و ادمین)
   * گروه‌بندی شده بر اساس درس (subject + lessonCode + major)
   */
  lessonGroups?: {
    subject: string;
    lessonCode: string;
    major: Major;
    total: number;
    correct: number;
    wrong: number;
    blank: number;
    questions: (
      | {
          // Question-bank mode
          id: string;
          prompt: string;
          options: string[];
          correctIndex: number;
          selectedIndex: number | null;
          isCorrect: boolean;
          subject: string;
          lessonCode: string;
          major: Major;
          imageUrl?: string | null;
        }
      | {
          // PDF mode
          no: number;
          correctIndex: number;
          selectedIndex: number | null;
          isCorrect: boolean;
        }
    )[];
  }[];
};

export type AdminAttemptRow = Attempt & {
  examTitle?: string;
  userName?: string;
  userEmail?: string;
};
