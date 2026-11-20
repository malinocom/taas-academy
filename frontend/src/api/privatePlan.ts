import { apiFetch } from "../lib/api"

/* =========================
   Types
========================= */

export interface PlanRow {
  subject: string
  studyTime: number
  count: number
}

export interface ProgressBox {
  id: number
  subjectName: string
  boxes: boolean[]
}

export interface PrivatePlan {
  planId: number
  rows: PlanRow[]
  progress: ProgressBox[]
}

export interface MyPrivatePlanResponse {
  planId: number
  rows: PlanRow[]
  progress: ProgressBox[]
}

/* =========================
   Admin API
========================= */

export const privatePlanApi = {

  async getPlan(userId: number | string, date: string): Promise<PrivatePlan | null> {

    const data = await apiFetch<any>(
      `/admin/private-students/${userId}/plans?date=${encodeURIComponent(date)}`
    )

    if (!data?.plan) return null

    return {
      planId: data.plan.id,

      rows: (data.plan.rows || []).map((r: any): PlanRow => ({
        subject: r.subjectName,
        studyTime: r.duration,
        count: r.testCount
      })),

      progress: (data.progresses || []).map((p: any): ProgressBox => ({
        id: p.id,
        subjectName: p.subjectName,
        boxes: Array.isArray(p.boxes) ? p.boxes : []
      }))
    }
  },

  async savePlan(userId: number | string, date: string, rows: PlanRow[]) {

    return apiFetch(
      `/admin/private-students/${userId}/plans`,
      {
        method: "POST",
        body: {
          date,
          rows: rows.map(r => ({
            subjectName: r.subject,
            duration: r.studyTime,
            testCount: r.count
          }))
        }
      }
    )
  },

  async addProgressBox(userId: number | string, subjectName: string) {

    return apiFetch(
      `/admin/private-students/${userId}/progress`,
      {
        method: "POST",
        body: { subjectName }
      }
    )
  },

  async toggleProgressBox(userId: number | string, id: number, index: number) {
    return apiFetch(
      `/admin/private-students/${userId}/progress/${id}/toggle`,
      {
        method: "PATCH",
        body: { index }
      }
    )
  },

  async removeProgressBox(userId: number | string, id: number) {
    return apiFetch(
      `/admin/private-students/${userId}/progress/${id}`,
      { method: "DELETE" }
    )
  },
  async deletePlan(userId: number | string, planId: number) {

    return apiFetch(
      `/admin/private-students/${userId}/plans/${planId}`,
      {
        method: "DELETE"
      }
    )
  }
  
}



/* =========================
   Student API
========================= */

export async function getMyPrivatePlan(
  date: string
): Promise<MyPrivatePlanResponse | null> {

  const data = await apiFetch<any>(
    `/api/me/private-plan?date=${encodeURIComponent(date)}`
  )

  if (!data?.plan) return null

  return {
    planId: data.plan.id,

    rows: (data.plan.rows || []).map((r: any): PlanRow => ({
      subject: r.subjectName,
      studyTime: r.duration,
      count: r.testCount
    })),

    progress: (data.progresses || []).map((p: any): ProgressBox => ({
      id: p.id,
      subjectName: p.subjectName,
      boxes: Array.isArray(p.boxes) ? p.boxes : []
    }))
  }
}
