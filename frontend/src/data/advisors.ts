export type Advisor = {
  id: string;
  name: string;
  majorTag?: string;
  bullets: string[];
  instagram?: string;
  image: string; // public path
};

// مگاهدف — لیست مشاوران
// (عکس‌های واقعی را می‌توانید در frontend/public/advisors جایگزین کنید)
export const advisors: Advisor[] = [
  {
    id: "abolfazl-bahari",
    name: "ابوالفضل بهاری",
    bullets: [
      "مشاور تحصیلی و برنامه‌ریزی",
      "برنامه شخصی‌سازی‌شده",
      "پیگیری هفتگی",
      "پشتیبانی تا رسیدن به هدف",
    ],
    image: "/advisors/abolfazl-bahari.png",
  },
  {
    id: "zeinab-arjmand",
    name: "زینب ارجمند",
    bullets: [
      "مشاور تحصیلی و برنامه‌ریزی",
      "تحلیل آزمون و رفع اشکال",
      "آموزش مهارت‌های مطالعه",
      "پشتیبانی مرحله‌به‌مرحله",
    ],
    image: "/advisors/zeinab-arjmand.png",
  },
  {
    id: "mahdi-shavor",
    name: "مهدی شاور",
    bullets: [
      "مشاور تحصیلی و برنامه‌ریزی",
      "برنامه‌ریزی قابل اجرا",
      "مدیریت زمان و انگیزه",
      "پشتیبانی تا روز آزمون",
    ],
    image: "/advisors/mahdi-shavor.png",
  },
  {
    id: "hanieh-noorbakht",
    name: "هانیه نوربخت",
    bullets: [
      "مشاور تحصیلی و برنامه‌ریزی",
      "همراهی در مسیر کنکور",
      "رفع اشکال و پیگیری منظم",
      "پشتیبانی همه‌جانبه",
    ],
    image: "/advisors/hanieh-noorbakht.png",
  },
];
