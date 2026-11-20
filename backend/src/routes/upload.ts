import { Router, type NextFunction, type Response } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { env } from "../env";
import { authRequired, type AuthedRequest } from "../auth/middleware";

export const uploadRoutes = Router();

const ALLOWED_TYPES = new Set(["exams", "notes", "note-files", "questions", "reports", "misc"]);
const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "application/octet-stream",
]);

function ensureDir(directory: string) {
  if (!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: true });
}

function resolveUploadType(req: AuthedRequest) {
  const raw = req.query.type ?? (req.body as any)?.type ?? "misc";
  const requested = Array.isArray(raw) ? raw[0] : String(raw);
  return ALLOWED_TYPES.has(requested) ? requested : "";
}

function authorizeUpload(req: AuthedRequest, res: Response, next: NextFunction) {
  const type = resolveUploadType(req);
  if (!type) return res.status(400).json({ message: "INVALID_UPLOAD_TYPE" });
  if (type !== "reports" && req.auth?.role !== "admin") {
    return res.status(403).json({ message: "UPLOAD_PERMISSION_DENIED" });
  }
  (req as any).uploadType = type;
  next();
}

const storage = multer.diskStorage({
  destination(req, _file, callback) {
    const type = (req as any).uploadType || "misc";
    const root = path.resolve(env.UPLOAD_DIR);
    const destination = path.resolve(root, type);
    if (!destination.startsWith(`${root}${path.sep}`)) {
      return callback(new Error("INVALID_UPLOAD_PATH"), "");
    }
    ensureDir(destination);
    callback(null, destination);
  },
  filename(_req, file, callback) {
    const safe = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120) || "upload";
    callback(null, `${Date.now()}_${crypto.randomBytes(6).toString("hex")}_${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: 10 },
  fileFilter(_req, file, callback) {
    const extension = path.extname(file.originalname).toLowerCase();
    const allowedExtension = [".pdf", ".jpg", ".jpeg", ".png", ".webp", ".gif", ".heic", ".heif", ".xlsx", ".xls", ".csv"].includes(extension);
    if (!ALLOWED_MIME_TYPES.has(file.mimetype) || !allowedExtension) {
      return callback(new Error("UNSUPPORTED_FILE_TYPE"));
    }
    callback(null, true);
  },
});

function uploadError(error: any, res: Response) {
  if (!error) return false;
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    res.status(413).json({ message: "FILE_TOO_LARGE_MAX_25_MB" });
    return true;
  }
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_COUNT") {
    res.status(400).json({ message: "TOO_MANY_FILES_MAX_10" });
    return true;
  }
  res.status(400).json({ message: error.message || "UPLOAD_FAILED" });
  return true;
}

function publicFileUrl(filePath: string) {
  const relative = path.relative(path.resolve(env.UPLOAD_DIR), filePath).split(path.sep).join("/");
  return `${env.BACKEND_URL}/uploads/${relative.split("/").map(encodeURIComponent).join("/")}`;
}

uploadRoutes.post("/one", authRequired, authorizeUpload, (req: AuthedRequest, res: Response, next: NextFunction) => {
  upload.single("file")(req, res, (error: any) => {
    if (uploadError(error, res)) return;
    next();
  });
}, async (req: AuthedRequest, res: Response) => {
  const file = (req as any).file as Express.Multer.File | undefined;
  if (!file) return res.status(400).json({ message: "NO_FILE" });
  return res.json({ url: publicFileUrl(file.path) });
});

uploadRoutes.post("/many", authRequired, authorizeUpload, (req: AuthedRequest, res: Response, next: NextFunction) => {
  upload.array("files", 10)(req, res, (error: any) => {
    if (uploadError(error, res)) return;
    next();
  });
}, async (req: AuthedRequest, res: Response) => {
  const files = ((req as any).files ?? []) as Express.Multer.File[];
  if (!files.length) return res.status(400).json({ message: "NO_FILES" });
  const items = files.map((file) => ({
    originalName: file.originalname,
    url: publicFileUrl(file.path),
  }));
  return res.json({ items });
});
