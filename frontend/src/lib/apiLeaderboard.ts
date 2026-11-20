import { apiFetch } from "./api";

export async function fetchTop10(examId: string) {
  return apiFetch(`/attempts/exams/${encodeURIComponent(examId)}/top10`);
}
