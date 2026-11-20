import type { WorkReportStatus } from "./types";

export function reportStatusLabel(s: WorkReportStatus) {
  switch (s) {
    case "submitted":
      return "ارسال شده";
    case "approved":
      return "تایید شد";
    case "rejected":
      return "رد شد";
  }
}
