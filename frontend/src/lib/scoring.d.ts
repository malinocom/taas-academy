import type { Exam, Question, SubjectBreakdownRow } from "./types";
export declare function scoreAnswers(questions: Question[], answers: Record<string, number>, opts?: {
    negativeMarking?: Exam["negativeMarking"];
}): {
    correct: number;
    wrong: number;
    blank: number;
    penalty: number;
    netCorrect: number;
    total: number;
    percent: number;
};
export declare function subjectBreakdown(questions: Question[], answers: Record<string, number>, opts?: {
    negativeMarking?: Exam["negativeMarking"];
}): SubjectBreakdownRow[];
