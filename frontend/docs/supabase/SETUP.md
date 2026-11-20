# راه‌اندازی Supabase (واقعی)

## 1) ساخت جداول + RLS
1. در Supabase برو به **SQL Editor**
2. فایل `schema.sql` را کامل اجرا کن.

> نکته: در این پروژه نام ستون‌ها مطابق کد (CamelCase) تعریف شده‌اند.

## 2) ساخت Bucket های Storage
در **Storage** این Bucketها را بساز:
- `question_images`
- `notes_images`
- `work_reports`

پیشنهاد:
- `notes_images` و `question_images` را Public کن (برای نمایش مستقیم تصاویر)
- `work_reports` می‌تواند Public باشد یا Private؛ اگر Private باشد باید سیاست‌های Storage و Signed URL پیاده‌سازی شود (فعلاً ساده نگه داشته شده و Public فرض شده).

## 3) ساخت اکانت ادمین
طبق کد، ورود ادمین فقط با **نام کاربری: admin** انجام می‌شود و ایمیل ثابت است:
- Email: `admin@valizadeh.local`

بنابراین:
1. در Supabase → **Authentication → Users** یک کاربر بساز با ایمیل بالا
2. یک رمز عبور دلخواه بذار
3. در سایت با همان رمز و نام کاربری `admin` وارد شو

در اولین ورود، پروفایل ادمین (role=admin) به صورت خودکار در جدول `profiles` ساخته/به‌روزرسانی می‌شود.

## 4) تنظیم ENV
در ریشه پروژه:
- فایل `.env.example` را کپی کن و به `.env` تغییر نام بده
- مقادیر `VITE_SUPABASE_URL` و `VITE_SUPABASE_ANON_KEY` را قرار بده

## 5) اجرا
```bash
npm install
npm run dev
```
