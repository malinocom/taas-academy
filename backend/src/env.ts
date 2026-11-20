import "dotenv/config";

function req(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export const env = {
  PORT: Number(process.env.PORT ?? 4000),
  NODE_ENV: process.env.NODE_ENV ?? "development",
  FRONTEND_ORIGINS: (process.env.FRONTEND_ORIGINS ?? "http://localhost:5173")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),

  DATABASE_URL: req("DATABASE_URL"),

  JWT_ACCESS_SECRET: req("JWT_ACCESS_SECRET"),
  JWT_REFRESH_SECRET: req("JWT_REFRESH_SECRET"),
  // Default to 1 day so long exams (e.g. 150 minutes) don't lose session.
  // You can still override via ACCESS_TOKEN_TTL_SECONDS in .env.
  ACCESS_TOKEN_TTL_SECONDS: Number(process.env.ACCESS_TOKEN_TTL_SECONDS ?? 86400),
  REFRESH_TOKEN_TTL_SECONDS: Number(process.env.REFRESH_TOKEN_TTL_SECONDS ?? 2592000),

  COOKIE_SECURE: (process.env.COOKIE_SECURE ?? (process.env.NODE_ENV === "production" ? "true" : "false")) === "true",
  COOKIE_SAME_SITE: (process.env.COOKIE_SAME_SITE ?? "lax") as "lax" | "strict" | "none",

  ADMIN_USERNAME: (process.env.ADMIN_USERNAME ?? "admin").trim(),
  ADMIN_PASSWORD: req("ADMIN_PASSWORD"),

  UPLOAD_DIR: process.env.UPLOAD_DIR ?? "./uploads",
  PUBLIC_BASE_URL: process.env.PUBLIC_BASE_URL ?? `http://localhost:${process.env.PORT ?? 4000}`,
  BACKEND_URL: (process.env.BACKEND_URL ?? process.env.PUBLIC_BASE_URL ?? `http://localhost:${process.env.PORT ?? 4000}`).replace(/\/+$/, ""),
};
