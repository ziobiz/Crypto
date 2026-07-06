/** PG 로그인 패널 기본 공지 (다국어) */
export const DEFAULT_LOGIN_NOTICE_I18N: Record<
  'KR' | 'JP' | 'US' | 'CH' | 'TH',
  { title: string; body: string }
> = {
  KR: {
    title: '사칭 피해 주의 안내',
    body:
      '최근 본사나 플랫폼을 사칭해 금전적 요구를 하는 사례가 발생하고 있습니다.\n\n저희는 결제와 관련한 금전을 별도로 요청하지 않습니다. 의심스러운 연락을 받으셨다면 고객센터 또는 계약된 영업지사로 사실 여부를 반드시 확인해 주시기 바랍니다.',
  },
  JP: {
    title: 'なりすまし被害にご注意',
    body:
      '最近、当社やプラットフォームを装った金銭要求の事例が発生しています。\n\n当社が決済に関して別途金銭を請求することはありません。不審な連絡を受けた場合は、カスタマーセンターまたは担当営業所にご確認ください。',
  },
  US: {
    title: 'Fraud Impersonation Notice',
    body:
      'There have been recent cases of impersonation requesting money.\n\nWe never ask for separate payments related to transactions. If you receive suspicious contact, please verify with customer support or your assigned sales office.',
  },
  CH: {
    title: '谨防冒充诈骗',
    body:
      '近期发生冒充本公司或平台索要资金的情况。\n\n我们不会另行索要与交易相关的资金。如收到可疑联系，请务必向客服或所属营业点核实。',
  },
  TH: {
    title: 'แจ้งเตือนมิจฉาชีพแอบอ้าง',
    body:
      'มีกรณีแอบอ้างเป็นบริษัทหรือแพลตฟอร์มเพื่อเรียกเก็บเงิน\n\nเราไม่เรียกเก็บเงินแยกต่างหากเกี่ยวกับการชำระเงิน หากได้รับการติดต่อที่น่าสงสัย โปรดตรวจสอบกับศูนย์บริการลูกค้าหรือสำนักงานขายที่ดูแลคุณ',
  },
};

export type LoginNoticeLocale = keyof typeof DEFAULT_LOGIN_NOTICE_I18N;

export function resolveLoginNotice(
  locale: LoginNoticeLocale,
  enabled?: boolean,
  custom?: Partial<Record<LoginNoticeLocale, { title: string; body: string }>>,
): { title: string; body: string } | null {
  if (enabled === false) return null;
  const customEntry = custom?.[locale];
  if (customEntry?.title) {
    return {
      title: customEntry.title,
      body: customEntry.body ?? '',
    };
  }
  return DEFAULT_LOGIN_NOTICE_I18N[locale] ?? DEFAULT_LOGIN_NOTICE_I18N.KR;
}
