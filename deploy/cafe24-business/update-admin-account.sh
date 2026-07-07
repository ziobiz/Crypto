#!/bin/bash
# 운영 DB — 총본사 관리자 이메일·비밀번호 (PG: 이메일아이디+1!)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT/backend"

node <<'NODE'
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const EMAIL = 'ziobizm@gmail.com';
const local = EMAIL.split('@')[0];
const PASSWORD = `${local}1!`;

(async () => {
  const prisma = new PrismaClient();
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const updated = await prisma.user.updateMany({
    where: {
      OR: [{ role: 'SUPER_ADMIN' }, { email: { in: ['admin@ziobiz.com', EMAIL] } }],
    },
    data: {
      email: EMAIL,
      passwordHash,
      passwordMustChange: false,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      totpEnabled: false,
      totpSecret: null,
    },
  });
  console.log(`Updated ${updated.count} admin → ${EMAIL} / ${PASSWORD}`);
  await prisma.$disconnect();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
NODE
