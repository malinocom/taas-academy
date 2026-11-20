import type { OrderStatus } from "./types";

export function orderStatusLabel(s: OrderStatus) {
  switch (s) {
    case "pending":
      return "در انتظار پرداخت";
    case "paid":
      return "پرداخت شده";
    case "processing":
      return "در حال آماده‌سازی";
    case "sent":
      return "ارسال شد";
    case "delivered":
      return "تحویل شد";
    case "canceled":
      return "لغو شد";
  }
}
