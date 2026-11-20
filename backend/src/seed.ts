import { env } from "./env";
import { prisma } from "./prisma";
import { hashPassword } from "./utils/password";

async function main() {
  const username = env.ADMIN_USERNAME.trim().toLowerCase();
  const email = "admin@valizadeh.local";

  const existing = await prisma.user.findFirst({ where: { OR: [{ username }, { email }] }, include: { profile: true } });
  if (existing) {
    // Ensure role + username correct
    await prisma.user.update({ where: { id: existing.id }, data: { role: "admin", username, email } });
    if (!existing.profile) {
      await prisma.profile.create({ data: { userId: existing.id, name: "admin" } });
    }
    console.log("Admin already exists ✔");
    return;
  }

  const passwordHash = await hashPassword(env.ADMIN_PASSWORD);
  await prisma.user.create({
    data: {
      email,
      username,
      passwordHash,
      role: "admin",
      profile: { create: { name: "admin" } },
    },
  });
  console.log("Admin created ✔");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
