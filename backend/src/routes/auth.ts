import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { hashPassword, verifyPassword } from "../utils/password";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../auth/tokens";
import { clearAuthCookies, setAuthCookies } from "../auth/cookies";
import { authRequired, AuthedRequest } from "../auth/middleware";
import crypto from "node:crypto";

function sha256(text: string) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

function userToClient(u: any, profile: any) {
  return {
    id: u.id,
    email: u.email,
    username: u.username,
    role: u.role,
    profile: {
      name: profile?.name,
      major: profile?.major,
      grade: profile?.grade,
      phone: profile?.phone,
      nationalId: profile?.nationalId,
      address: profile?.address,
      createdAt: profile?.createdAt,
    },
  };
}

export const authRoutes = Router();

authRoutes.post(
  "/register",
  async (req, res) => {
    const body = z
      .object({
        name: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(6),
        major: z.string().optional(),
        grade: z.string().optional(),
        phone: z.string().optional(),
        nationalId: z.string().optional(),
        address: z.string().optional(),
      })
      .parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: body.email.toLowerCase() } });
    if (existing) return res.status(409).json({ message: "EMAIL_EXISTS" });

    const passwordHash = await hashPassword(body.password);
    const user = await prisma.user.create({
      data: {
        email: body.email.toLowerCase(),
        passwordHash,
        role: "student",
        profile: {
          create: {
            name: body.name,
            major: body.major ?? null,
            grade: body.grade ?? null,
            phone: body.phone ?? null,
            nationalId: body.nationalId ?? null,
            address: body.address ?? null,
          },
        },
      },
      include: { profile: true },
    });

    // auto login after register
    const accessToken = signAccessToken({ sub: user.id, role: user.role as any });
    const refreshToken = signRefreshToken({ sub: user.id, role: user.role as any });
    await prisma.user.update({ where: { id: user.id }, data: { refreshTokenHash: sha256(refreshToken) } });
    setAuthCookies(res, accessToken, refreshToken);
    return res.json({ ok: true, user: userToClient(user, user.profile) });
  }
);

authRoutes.post(
  "/login",
  async (req, res) => {
    const body = z
      .object({
        identifier: z.string().min(1), // email or username
        password: z.string().min(1),
      })
      .parse(req.body);

    const ident = body.identifier.trim().toLowerCase();
    const user =
      ident.includes("@")
        ? await prisma.user.findUnique({ where: { email: ident }, include: { profile: true } })
        : await prisma.user.findUnique({ where: { username: ident }, include: { profile: true } });

    if (!user) return res.status(401).json({ message: "INVALID_CREDENTIALS" });

    const ok = await verifyPassword(body.password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "INVALID_CREDENTIALS" });

    const accessToken = signAccessToken({ sub: user.id, role: user.role as any });
    const refreshToken = signRefreshToken({ sub: user.id, role: user.role as any });
    await prisma.user.update({ where: { id: user.id }, data: { refreshTokenHash: sha256(refreshToken) } });
    setAuthCookies(res, accessToken, refreshToken);
    return res.json({ ok: true, user: userToClient(user, user.profile) });
  }
);

authRoutes.get("/me", authRequired, async (req: AuthedRequest, res) => {
  const u = await prisma.user.findUnique({ where: { id: req.auth!.userId }, include: { profile: true } });
  if (!u) return res.status(401).json({ message: "UNAUTHORIZED" });
  return res.json({ ok: true, user: userToClient(u, u.profile) });
});

authRoutes.post("/refresh", async (req, res) => {
  const rt = (req as any).cookies?.refresh_token as string | undefined;
  if (!rt) return res.status(401).json({ message: "NO_REFRESH" });
  try {
    const payload = verifyRefreshToken(rt);
    const u = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!u || !u.refreshTokenHash) return res.status(401).json({ message: "INVALID_REFRESH" });
    if (sha256(rt) !== u.refreshTokenHash) return res.status(401).json({ message: "INVALID_REFRESH" });
    const accessToken = signAccessToken({ sub: u.id, role: u.role as any });
    const refreshToken = signRefreshToken({ sub: u.id, role: u.role as any });
    await prisma.user.update({ where: { id: u.id }, data: { refreshTokenHash: sha256(refreshToken) } });
    setAuthCookies(res, accessToken, refreshToken);
    return res.json({ ok: true });
  } catch {
    return res.status(401).json({ message: "INVALID_REFRESH" });
  }
});

authRoutes.post("/logout", async (req, res) => {
  try {
    const rt = (req as any).cookies?.refresh_token as string | undefined;
    if (rt) {
      try {
        const payload = verifyRefreshToken(rt);
        await prisma.user.update({ where: { id: payload.sub }, data: { refreshTokenHash: null } });
      } catch {
        // ignore
      }
    }
  } finally {
    clearAuthCookies(res);
  }
  return res.json({ ok: true });
});
