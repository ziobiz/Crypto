/** Push DEFAULT individual register notice i18n into live platform config. */
const { PrismaClient } = require('@prisma/client');
const {
  DEFAULT_INDIVIDUAL_REGISTER_NOTICE_I18N,
} = require('../dist/constants/individual-register-notice-i18n');

const p = new PrismaClient();

async function main() {
  const key = 'hq.platform.domains';
  const row = await p.systemConfig.findUnique({ where: { key } });
  const value = row?.value && typeof row.value === 'object' ? { ...row.value } : {};
  value.individualRegisterNoticeEnabled = true;
  value.individualRegisterNoticeI18n = DEFAULT_INDIVIDUAL_REGISTER_NOTICE_I18N;
  await p.systemConfig.upsert({
    where: { key },
    create: {
      key,
      value,
      description: 'HQ platform policy',
    },
    update: { value },
  });
  console.log(
    JSON.stringify(
      {
        ok: true,
        locales: Object.keys(DEFAULT_INDIVIDUAL_REGISTER_NOTICE_I18N),
        krTitle: DEFAULT_INDIVIDUAL_REGISTER_NOTICE_I18N.KR.title,
      },
      null,
      2,
    ),
  );
  await p.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
