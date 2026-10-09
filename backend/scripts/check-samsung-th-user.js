const { PrismaClient } = require('@prisma/client');

(async () => {
  const p = new PrismaClient();
  const u = await p.user.findFirst({
    where: { email: { equals: 'samsung.th@gmail.com', mode: 'insensitive' } },
    include: { customerProfile: true, organization: true },
  });
  console.log(
    JSON.stringify(
      {
        found: !!u,
        id: u?.id,
        email: u?.email,
        isActive: u?.isActive,
        role: u?.role,
        org: u?.organization,
        profile: u?.customerProfile,
      },
      null,
      2,
    ),
  );
  await p.$disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
