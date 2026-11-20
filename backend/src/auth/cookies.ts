import type { Response } from "express";
import { env } from "../env";

const base = {
  httpOnly: true,
  secure: env.COOKIE_SECURE,
  sameSite: env.COOKIE_SAME_SITE,
  path: "/",
} as const;

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  res.cookie("access_token", accessToken, { ...base, maxAge: env.ACCESS_TOKEN_TTL_SECONDS * 1000 });
  res.cookie("refresh_token", refreshToken, { ...base, maxAge: env.REFRESH_TOKEN_TTL_SECONDS * 1000 });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie("access_token", { path: "/" });
  res.clearCookie("refresh_token", { path: "/" });
}
