import express from "express";
import "express-async-errors";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "node:path";
import fs from "node:fs";
import { env } from "./env";
import { authOptional } from "./auth/middleware";
import { authRoutes } from "./routes/auth";
import { adminRoutes } from "./routes/admin";
import { notesRoutes } from "./routes/notes";
import { ordersRoutes } from "./routes/orders";
import { workReportsRoutes } from "./routes/workReports";
import { questionsRoutes } from "./routes/questions";
import { examsRoutes } from "./routes/exams";
import { attemptsRoutes } from "./routes/attempts";
import { uploadRoutes } from "./routes/upload";
import { bookingsRoutes } from "./routes/bookings";
import competitionRoutes from "./routes/competitions";
import { meRoutes } from "./routes/me";
import { advisorRoutes } from "./routes/advisor";


const app = express();
app.disable("x-powered-by");
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// The service runs behind a reverse proxy in production; trust the proxy so
// secure cookies and request protocol detection work correctly.
app.set("trust proxy", 1);

app.use(cookieParser());
// Some admin operations (bulk question creation from Excel, etc.) can be large.
// Keep this comfortably high to avoid random crashes / failed fetch.
app.use(express.json({ limit: "50mb" }));

const allowedOrigins = new Set(env.FRONTEND_ORIGINS);
app.use(
  cors({
    origin(origin, callback) {
      // Permit server-to-server and same-origin requests without an Origin header.
      if (!origin || allowedOrigins.has(origin)) return callback(null, true);
      return callback(new Error("CORS_ORIGIN_NOT_ALLOWED"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Ensure upload dir exists. Public uploads are cached; purchased note PDFs are
// deliberately excluded and streamed only through the authenticated notes route.
if (!fs.existsSync(env.UPLOAD_DIR)) fs.mkdirSync(env.UPLOAD_DIR, { recursive: true });
const publicUploads = express.static(path.resolve(env.UPLOAD_DIR), {
  maxAge: "7d",
  setHeaders(response) {
    response.setHeader("X-Content-Type-Options", "nosniff");
  },
});
app.use("/uploads", (req, res, next) => {
  let pathname = req.path;
  try {
    pathname = decodeURIComponent(pathname);
  } catch {
    return res.sendStatus(400);
  }
  if (pathname.replace(/\\/g, "/").startsWith("/note-files/")) return res.sendStatus(404);
  return publicUploads(req, res, next);
});

app.get("/health", (_req, res) => res.json({ ok: true }));

// Attach auth info if access cookie exists
app.use(authOptional);

app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);
app.use("/notes", notesRoutes);
app.use("/orders", ordersRoutes);
app.use("/work-reports", workReportsRoutes);
app.use("/questions", questionsRoutes);
app.use("/exams", examsRoutes);
app.use("/attempts", attemptsRoutes);
app.use("/upload", uploadRoutes);
app.use("/bookings", bookingsRoutes);
app.use("/api", meRoutes);
app.use("/advisor", advisorRoutes);
app.use("/competitions", competitionRoutes);
app.use((err: any, _req: any, res: any, next: any) => {
  if (res.headersSent) return next(err);
  console.error(err);

  let status = Number(err?.status) || 500;
  if (err?.name === "ZodError") status = 400;
  if (err?.code === "P2002") status = 409;
  if (err?.code === "P2025") status = 404;
  if (err?.message === "CORS_ORIGIN_NOT_ALLOWED") status = 403;

  const message = status >= 500 && env.NODE_ENV === "production"
    ? "SERVER_ERROR"
    : (err?.message || "SERVER_ERROR");
  return res.status(status).json({ message });
});

app.listen(env.PORT, () => {
  console.log(`API running on http://localhost:${env.PORT}`);
});
