import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "./tokens";

export type AuthedRequest = Request & {
  auth?: { userId: string; role: "admin" | "advisor" | "student" };
};

// ---------------------------
// Optional Auth
// ---------------------------
export function authOptional(req: AuthedRequest, _res: Response, next: NextFunction) {
  const token = (req as any).cookies?.access_token;

  if (token) {
    try {
      const payload = verifyAccessToken(token);
      req.auth = { userId: payload.sub, role: payload.role };
    } catch {
      // توکن نامعتبر → نادیده گرفته شود
    }
  }

  next();
}

// ---------------------------
// Required Auth
// ---------------------------
export function authRequired(req: AuthedRequest, res: Response, next: NextFunction) {
  authOptional(req, res, () => {
    if (!req.auth) {
      return res.status(401).json({ message: "احراز هویت انجام نشده است." });
    }
    next();
  });
}

// ---------------------------
// Admin Only
// ---------------------------
export function adminOnly(req: AuthedRequest, res: Response, next: NextFunction) {
  authRequired(req, res, () => {
    if (req.auth?.role !== "admin") {
      return res.status(403).json({ message: "دسترسی شما مجاز نیست." });
    }
    next();
  });
}

export function advisorOnly(req: AuthedRequest, res: Response, next: NextFunction) {
  authRequired(req, res, () => {
    if (req.auth?.role !== "advisor") {
      return res.status(403).json({ message: "دسترسی شما مجاز نیست." });
    }
    next();
  });
}

// ---------------------------
// Compatibility exports
// برای سازگاری با فایل‌های قبلی
// ---------------------------
export const requireAuth = authRequired;
export const requireAdmin = adminOnly;
export const requireAdvisor = advisorOnly;
