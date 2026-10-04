import type { Locale } from '@/i18n/locales';

/** 로그인 패널 기본 공지 — 기준: 한국어 */
export const DEFAULT_LOGIN_NOTICE_I18N: Record<
  Locale,
  { title: string; body: string }
> = {
  KR: {
    title: '사칭 피해 주의 안내',
    body:
      '폐사는 서비스와 관련한 금전을 별도로 요청하지 않습니다. 의심스러운 연락을 받으셨다면 고객센터 또는 계약된 영업지사로 사실 여부를 반드시 확인해 주시기 바랍니다.',
  },
  US: {
    title: 'Impersonation Fraud Advisory',
    body:
      'Our company does not separately request money related to the service. If you receive a suspicious contact, please be sure to verify the facts with customer support or your contracted sales office.',
  },
  JP: {
    title: 'なりすまし被害注意のご案内',
    body:
      '弊社はサービスに関する金銭を別途請求することはありません。不審な連絡を受けた場合は、カスタマーセンターまたは契約された営業支社へ事実の確認を必ず行ってください。',
  },
  CH: {
    title: '冒充诈骗注意告知',
    body:
      '本公司不会另行索要与服务相关的款项。如收到可疑联系，请务必向客服中心或签约营业网点核实事实。',
  },
  TH: {
    title: 'แจ้งเตือนระวังการแอบอ้าง',
    body:
      'บริษัทไม่ขอเรียกเก็บเงินที่เกี่ยวข้องกับบริการแยกต่างหาก หากได้รับการติดต่อที่น่าสงสัย โปรดตรวจสอบข้อเท็จจริงกับศูนย์บริการลูกค้าหรือสำนักงานขายตามสัญญาอย่างแน่นอน',
  },
};

/** 구버전 기본 공지 → 신규 문구로 자동 이관 */
export const LEGACY_LOGIN_NOTICE_BODIES: Record<Locale, string[]> = {
  KR: [
    '최근 본사나 플랫폼을 사칭해 금전적 요구를 하는 사례가 발생하고 있습니다.\n\n저희는 결제와 관련한 금전을 별도로 요청하지 않습니다. 의심스러운 연락을 받으셨다면 고객센터 또는 계약된 영업지사로 사실 여부를 반드시 확인해 주시기 바랍니다.',
    '최근 본사나 플랫폼을 사칭해 금전적 요구를 하는 사례가 발생하고 있습니다.\n\n저희는 서비스와 관련한 금전을 별도로 요청하지 않습니다. 의심스러운 연락을 받으셨다면 고객센터 또는 계약된 영업지사로 사실 여부를 반드시 확인해 주시기 바랍니다.',
  ],
  US: [
    'There have been recent cases of impersonation requesting money.\n\nWe never ask for separate payments related to transactions. If you receive suspicious contact, please verify with customer support or your assigned sales office.',
    'There have been recent cases of impersonation requesting money.\n\nWe never ask for separate service related to transactions. If you receive suspicious contact, please verify with customer support or your assigned sales office.',
    'Our company does not separately request money related to the service. If you receive suspicious contact, please verify with customer support or your contracted sales office.',
  ],
  JP: [
    '最近、当社やプラットフォームを装った金銭要求の事例が発生しています。\n\n当社が決済に関して別途金銭を請求することはありません。不審な連絡を受けた場合は、カスタマーセンターまたは担当営業所にご確認ください。',
    '最近、本社やプラットフォームを詐称して金銭的要求をする事例が発生しています。\n\n当社は、サービスに関連する金銭を別途要求しません。疑わしい連絡を受けた場合は、お客様センターまたは契約された営業支社で事実かどうかを必ずご確認ください。',
    '当社はサービスに関して別途金銭を請求することはありません。不審な連絡を受けた場合は、カスタマーセンターまたは担当営業所に事実確認を必ず行ってください。',
  ],
  CH: [
    '近期发生冒充本公司或平台索要资金的情况。\n\n我们不会另行索要与交易相关的资金。如收到可疑联系，请务必向客服或所属营业点核实。',
    '近期发生冒充本公司或平台索要资金的情况。\n\n我们不会另行索要与交易相关的资金。如收到可疑联系，请务必向客服或所属营业点核实。\n\n\n近期，有个人或组织冒充我司总部或平台，并提出财务要求。\n\n我司不会就我司服务收取任何额外费用。如果您收到任何可疑信息，请务必通过我司客户服务中心或您指定的销售分支机构核实其真实性。',
    '本公司不会另行索要与服务相关的资金。如收到可疑联系，请务必向客服或签约营业点核实。',
  ],
  TH: [
    'มีกรณีแอบอ้างเป็นบริษัทหรือแพลตฟอร์มเพื่อเรียกเก็บเงิน\n\nเราไม่เรียกเก็บเงินแยกต่างหากเกี่ยวกับการชำระเงิน หากได้รับการติดต่อที่น่าสงสัย โปรดตรวจสอบกับศูนย์บริการลูกค้าหรือสำนักงานขายที่ดูแลคุณ',
    'บริษัทไม่เรียกเก็บเงินแยกต่างหากที่เกี่ยวข้องกับบริการ หากได้รับการติดต่อที่น่าสงสัย โปรดตรวจสอบข้อเท็จจริงกับศูนย์บริการลูกค้าหรือสำนักงานขายตามสัญญา',
  ],
};

export const LEGACY_LOGIN_NOTICE_TITLES: Record<Locale, string[]> = {
  KR: [],
  US: ['Fraud Impersonation Notice'],
  JP: ['なりすまし被害にご注意'],
  CH: ['谨防冒充诈骗'],
  TH: ['แจ้งเตือนมิจฉาชีพแอบอ้าง'],
};

export function resolveLoginNotice(
  locale: Locale,
  enabled?: boolean,
  custom?: Partial<Record<Locale, { title: string; body: string }>>,
): { title: string; body: string } | null {
  if (enabled === false) return null;
  const customEntry = custom?.[locale];
  if (customEntry?.title) {
    const body = customEntry.body ?? '';
    const title = customEntry.title.trim();
    const isLegacyBody = (LEGACY_LOGIN_NOTICE_BODIES[locale] ?? []).some((old) => old === body);
    const isLegacyTitle = (LEGACY_LOGIN_NOTICE_TITLES[locale] ?? []).some((old) => old === title);
    if (isLegacyBody || isLegacyTitle) return { ...DEFAULT_LOGIN_NOTICE_I18N[locale] };
    return { title: customEntry.title, body };
  }
  return DEFAULT_LOGIN_NOTICE_I18N[locale];
}
