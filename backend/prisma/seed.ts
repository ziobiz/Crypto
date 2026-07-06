import bcrypt from 'bcryptjs';
import {
  PrismaClient,
  OrgType,
  UserRole,
  CustomerType,
  TicketType,
} from '@prisma/client';
import { initialPasswordFromEmail } from '../src/lib/password-policy';

const prisma = new PrismaClient();

async function main() {
  const hashFor = async (email: string) => bcrypt.hash(initialPasswordFromEmail(email), 10);

  // ── 조직 계층: 본사 > 총판 > 지사 > 대리점 > 영업점 ──
  const hq = await prisma.organization.create({
    data: {
      code: 'HQ-001',
      name: '총본사',
      type: OrgType.HEAD_OFFICE,
      path: '/HQ-001',
    },
  });

  const master = await prisma.organization.create({
    data: {
      code: 'MD-001',
      name: '서울총판',
      type: OrgType.MASTER_DISTRIBUTOR,
      parentId: hq.id,
      path: '/HQ-001/MD-001',
    },
  });

  const branch = await prisma.organization.create({
    data: {
      code: 'RB-001',
      name: '강남지사',
      type: OrgType.REGIONAL_BRANCH,
      parentId: master.id,
      path: '/HQ-001/MD-001/RB-001',
    },
  });

  const agency = await prisma.organization.create({
    data: {
      code: 'AG-001',
      name: '역삼대리점',
      type: OrgType.AGENCY,
      parentId: branch.id,
      path: '/HQ-001/MD-001/RB-001/AG-001',
    },
  });

  const salesOffice = await prisma.organization.create({
    data: {
      code: 'SO-001',
      name: '역삼영업점',
      type: OrgType.SALES_OFFICE,
      parentId: agency.id,
      path: '/HQ-001/MD-001/RB-001/AG-001/SO-001',
    },
  });

  // ── 수수료 요율 (티켓 유형별) ──
  const orgs = [hq, master, branch, agency, salesOffice];
  const rates = [0.1, 0.15, 0.2, 0.25, 0.3]; // % 예시

  for (let i = 0; i < orgs.length; i++) {
    for (const ticketType of [TicketType.USDT_PURCHASE, TicketType.TRADE_ESCROW]) {
      await prisma.commissionRate.create({
        data: {
          organizationId: orgs[i].id,
          ticketType,
          ratePercent: rates[i],
        },
      });
    }
  }

  // ── 관리자 ──
  await prisma.user.create({
    data: {
      email: 'ziobizm@gmail.com',
      passwordHash: await hashFor('ziobizm@gmail.com'),
      name: '총본사 관리자',
      role: UserRole.SUPER_ADMIN,
      organizationId: hq.id,
      passwordMustChange: true,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  await prisma.user.create({
    data: {
      email: 'staff@so-001.com',
      passwordHash: await hashFor('staff@so-001.com'),
      name: '영업점 직원',
      role: UserRole.ORG_STAFF,
      organizationId: salesOffice.id,
      passwordMustChange: true,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
  });

  const customerUser = await prisma.user.create({
    data: {
      email: 'customer@example.com',
      passwordHash: await hashFor('customer@example.com'),
      name: '홍길동',
      role: UserRole.CUSTOMER,
      passwordMustChange: true,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      customerProfile: {
        create: {
          customerType: CustomerType.INDIVIDUAL,
          recruitingOrgId: salesOffice.id,
        },
      },
      wallets: {
        create: {
          label: '메인 USDT 지갑',
          address: 'TXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
          network: 'TRC20',
          isDefault: true,
          gasFeeAmount: 1.5,
          transferFeeAmount: 0.5,
          otherFeeAmount: 0,
        },
      },
    },
  });

  // ── 고객 (판매자 — 에스크로 테스트용) ──
  await prisma.user.create({
    data: {
      email: 'seller@example.com',
      passwordHash: await hashFor('seller@example.com'),
      name: '김판매',
      role: UserRole.CUSTOMER,
      passwordMustChange: true,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      customerProfile: {
        create: {
          customerType: CustomerType.CORPORATE,
          recruitingOrgId: salesOffice.id,
          businessName: '김판매 무역',
          businessNumber: '123-45-67890',
          representative: '김판매',
        },
      },
    },
  });

  console.log('Seed completed.');
  console.log('  Admin: ziobizm@gmail.com /', initialPasswordFromEmail('ziobizm@gmail.com'));
  console.log('  Staff: staff@so-001.com /', initialPasswordFromEmail('staff@so-001.com'));
  console.log('  Customer:', customerUser.email, '/', initialPasswordFromEmail('customer@example.com'));
  console.log('  Seller: seller@example.com /', initialPasswordFromEmail('seller@example.com'));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
