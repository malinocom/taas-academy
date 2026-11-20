import { Router, type Response } from "express";
import { z } from "zod";
import fs from "node:fs";
import path from "node:path";
import { prisma } from "../prisma";
import { adminOnly, authRequired, type AuthedRequest } from "../auth/middleware";
import { env } from "../env";

export const notesRoutes = Router();

function noteDto(note: any, includePrivateFile = false) {
  return {
    id: note.id,
    title: note.title,
    price: note.price,
    description: note.description,
    tags: note.tags,
    coverEmoji: note.coverEmoji ?? undefined,
    imageUrls: note.imageUrls ?? [],
    hasPdf: Boolean(note.pdfUrl),
    ...(includePrivateFile ? { pdfUrl: note.pdfUrl ?? undefined, pdfFileName: note.pdfFileName ?? undefined } : {}),
  };
}

async function hasNoteFileAccess(userId: string, role: string | undefined, noteId: string) {
  if (role === "admin") return true;
  if (role !== "student") return false;

  const orders = await prisma.order.findMany({
    where: { userId, status: { in: ["paid", "processing", "sent", "delivered"] } },
    select: { items: true },
  });

  return orders.some((order) => {
    if (!Array.isArray(order.items)) return false;
    return (order.items as any[]).some((item) => item && item.noteId === noteId);
  });
}

function resolveStoredPdfPath(pdfUrl: string) {
  let parsed: URL;
  try {
    parsed = new URL(pdfUrl);
  } catch {
    return null;
  }
  if (parsed.origin !== env.BACKEND_URL || !parsed.pathname.startsWith("/uploads/note-files/")) return null;

  const relative = decodeURIComponent(parsed.pathname.slice("/uploads/".length));
  const root = path.resolve(env.UPLOAD_DIR);
  const filePath = path.resolve(root, relative);
  if (!filePath.startsWith(`${root}${path.sep}`)) return null;
  return filePath;
}

notesRoutes.get("/", async (req: AuthedRequest, res) => {
  const notes = await prisma.note.findMany({ orderBy: { createdAt: "desc" } });
  const isAdmin = req.auth?.role === "admin";
  return res.json(notes.map((note) => noteDto(note, isAdmin)));
});

// Protected file access: a student can view the PDF only after an admin marks
// an order containing this note as paid/processing/sent/delivered.
notesRoutes.get("/:id/file/access", authRequired, async (req: AuthedRequest, res) => {
  const note = await prisma.note.findUnique({ where: { id: req.params.id }, select: { id: true, pdfUrl: true } });
  if (!note || !note.pdfUrl) return res.json({ available: false, message: "PDF_NOT_AVAILABLE" });
  const available = await hasNoteFileAccess(req.auth!.userId, req.auth!.role, note.id);
  return res.json({ available, message: available ? "AVAILABLE" : "ORDER_NOT_APPROVED" });
});

notesRoutes.get("/:id/file", authRequired, async (req: AuthedRequest, res: Response) => {
  const note = await prisma.note.findUnique({ where: { id: req.params.id } });
  if (!note || !note.pdfUrl) return res.status(404).json({ message: "PDF_NOT_FOUND" });

  const allowed = await hasNoteFileAccess(req.auth!.userId, req.auth!.role, note.id);
  if (!allowed) return res.status(403).json({ message: "ORDER_NOT_APPROVED" });

  const filePath = resolveStoredPdfPath(note.pdfUrl);
  if (!filePath || !fs.existsSync(filePath)) return res.status(404).json({ message: "PDF_FILE_MISSING" });

  const fileName = (note.pdfFileName || `${note.title}.pdf`).replace(/[\r\n"\\]/g, "_");
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename*=UTF-8''${encodeURIComponent(fileName)}`);
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  return res.sendFile(filePath);
});

notesRoutes.get("/:id", async (req: AuthedRequest, res) => {
  const note = await prisma.note.findUnique({ where: { id: req.params.id } });
  if (!note) return res.json(null);
  return res.json(noteDto(note, req.auth?.role === "admin"));
});

const createNoteSchema = z.object({
  title: z.string().trim().min(1).max(180),
  price: z.number().int().nonnegative(),
  description: z.string().trim().min(1).max(10000),
  tags: z.array(z.string()).default([]),
  coverEmoji: z.string().optional(),
  imageUrls: z.array(z.string().url()).optional(),
  pdfUrl: z.string().url().nullable().optional(),
  pdfFileName: z.string().max(255).nullable().optional(),
});

const updateNoteSchema = createNoteSchema.partial();

notesRoutes.post("/", adminOnly, async (req, res) => {
  const body = createNoteSchema.parse(req.body);
  const created = await prisma.note.create({
    data: {
      title: body.title,
      price: body.price,
      description: body.description,
      tags: body.tags,
      coverEmoji: body.coverEmoji ?? null,
      imageUrls: body.imageUrls ?? [],
      pdfUrl: body.pdfUrl ?? null,
      pdfFileName: body.pdfFileName ?? null,
    },
  });
  return res.status(201).json(noteDto(created, true));
});

notesRoutes.patch("/:id", adminOnly, async (req, res) => {
  const body = updateNoteSchema.parse(req.body);
  const updated = await prisma.note.update({
    where: { id: req.params.id },
    data: {
      ...body,
      coverEmoji: body.coverEmoji === undefined ? undefined : body.coverEmoji,
      imageUrls: body.imageUrls ?? undefined,
      pdfUrl: body.pdfUrl === undefined ? undefined : body.pdfUrl,
      pdfFileName: body.pdfFileName === undefined ? undefined : body.pdfFileName,
    },
  });
  return res.json(noteDto(updated, true));
});

notesRoutes.delete("/:id", adminOnly, async (req, res) => {
  await prisma.note.delete({ where: { id: req.params.id } });
  return res.json({ ok: true });
});
