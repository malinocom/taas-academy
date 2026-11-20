import type { Exam, Major, Question, SubjectBreakdownRow } from "./types";

function majorOf(q: Partial<Question>): Major {
  return (q.major as Major) || "عمومی";
}

function lessonCodeOf(q: Partial<Question>): string {
  return (q.lessonCode || "GEN").trim() || "GEN";
}

function subjectOf(q: Partial<Question>): string {
  return (q.subject || "عمومی").trim() || "عمومی";
}

export function scoreAnswers(
  questions: Question[],
  answers: Record<string, number>,
  opts?: { negativeMarking?: Exam["negativeMarking"] }
) {
  let correct = 0;
  let wrong = 0;
  let blank = 0;

  for (const q of questions) {
    const a = answers[q.id];

    if (typeof a !== "number") {
      blank += 1;
      continue;
    }

    if (a === q.correctIndex) correct += 1;
    else wrong += 1;
  }

  const total = questions.length;

  const nm = opts?.negativeMarking;
  const enabled = nm?.enabled ?? false;
  const k = Math.max(1, nm?.wrongPerPenalty || 3);

  // penalty calculation (continuous negative marking)
  const penalty = enabled ? wrong / k : 0;

  // net correct answers
  const netCorrect = enabled ? correct - penalty : correct;

  // raw percent
  const rawPercent = total > 0 ? (netCorrect / total) * 100 : 0;

  // rounded percent for display
  const rounded = Math.round(rawPercent);

  // preserve negative values close to zero
  const percent = rawPercent < 0 && rounded === 0 ? -1 : rounded;

  return {
    correct,
    wrong,
    blank,
    penalty,
    netCorrect,
    total,
    percent,
  };
}

export function subjectBreakdown(
  questions: Question[],
  answers: Record<string, number>,
  opts?: { negativeMarking?: Exam["negativeMarking"] }
): SubjectBreakdownRow[] {
  const map = new Map<string, Omit<SubjectBreakdownRow, "percent">>();

  for (const q of questions) {
    const subject = subjectOf(q);
    const major = majorOf(q);
    const lessonCode = lessonCodeOf(q);

    const key = `${major}__${lessonCode}__${subject}`;

    const cur =
      map.get(key) ||
      ({
        subject,
        lessonCode,
        major,
        total: 0,
        correct: 0,
        wrong: 0,
        blank: 0,
      } satisfies Omit<SubjectBreakdownRow, "percent">);

    cur.total += 1;

    const a = answers[q.id];

    if (typeof a !== "number") cur.blank += 1;
    else if (a === q.correctIndex) cur.correct += 1;
    else cur.wrong += 1;

    map.set(key, cur);
  }

  const nm = opts?.negativeMarking;
  const enabled = nm?.enabled ?? false;
  const k = Math.max(1, nm?.wrongPerPenalty || 3);

  const rows: SubjectBreakdownRow[] = [...map.values()].map((v) => {
    const penalty = enabled ? v.wrong / k : 0;
    const netCorrect = enabled ? v.correct - penalty : v.correct;

    const rawPercent = v.total > 0 ? (netCorrect / v.total) * 100 : 0;
    const rounded = Math.round(rawPercent);

    const percent = rawPercent < 0 && rounded === 0 ? -1 : rounded;

    return {
      ...v,
      percent,
      netCorrect,
    };
  });

  // sort by highest percent
  rows.sort((a, b) => b.percent - a.percent);

  return rows;
}
