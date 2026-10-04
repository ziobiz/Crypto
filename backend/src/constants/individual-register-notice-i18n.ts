/** 개인고객 공개 가입 경고 안내 (다국어) — 본사정책에서 수정 */
export const DEFAULT_INDIVIDUAL_REGISTER_NOTICE_I18N: Record<
  'KR' | 'JP' | 'US' | 'CH' | 'TH',
  { title: string; body: string }
> = {
  KR: {
    title: '개인고객 가입 안내',
    body:
      '본 가입은 개인고객 전용입니다. 기업고객은 직접 가입할 수 없으며, 반드시 관리자를 통해 등록해야 합니다.\n\n개인고객 1회 최대 거래 한도(해당 통화 상당 USD):\n· 일본인: 100만 엔 상당 USD\n· 한국인: 1,000만 원 상당 USD\n· 태국인: 33만 바트 상당 USD\n· 미국인: 10,000 USD\n· 중국인: 65천 위안 상당 USD\n\n위 한도를 초과하는 거래는 불가합니다. 가입 전 반드시 확인해 주세요.',
  },
  JP: {
    title: '個人顧客の登録について',
    body:
      '本登録は個人顧客専用です。法人顧客はご自身で登録できず、必ず管理者を通じて登録してください。\n\n個人顧客の1回あたり最大取引限度（各通貨相当のUSD）:\n· 日本の方: 100万円相当のUSD\n· 韓国の方: 1,000万ウォン相当のUSD\n· タイの方: 33万バーツ相当のUSD\n· 米国の方: 10,000 USD\n· 中国の方: 6.5万元相当のUSD\n\n上記限度を超える取引はできません。登録前にご確認ください。',
  },
  US: {
    title: 'Individual customer signup notice',
    body:
      'This signup is for individual customers only. Corporate customers cannot self-register and must be registered by an administrator.\n\nIndividual per-transaction maximum (USD equivalent in local currency):\n· Japan: USD equivalent of JPY 1,000,000\n· Korea: USD equivalent of KRW 10,000,000\n· Thailand: USD equivalent of THB 330,000\n· United States: USD 10,000\n· China: USD equivalent of CNY 65,000\n\nTrades above these limits are not allowed. Please review before signing up.',
  },
  CH: {
    title: '个人客户注册须知',
    body:
      '本注册仅限个人客户。企业客户无法自行注册，必须通过管理员登记。\n\n个人客户单笔最大交易限额（当地货币等值 USD）：\n· 日本：100万日元等值 USD\n· 韩国：1,000万韩元等值 USD\n· 泰国：33万泰铢等值 USD\n· 美国：10,000 USD\n· 中国：6.5万人民币等值 USD\n\n超过上述限额的交易不可进行。注册前请务必确认。',
  },
  TH: {
    title: 'ประกาศสมัครลูกค้าบุคคล',
    body:
      'การสมัครนี้สำหรับลูกค้าบุคคลเท่านั้น ลูกค้าองค์กรสมัครด้วยตนเองไม่ได้ และต้องลงทะเบียนผ่านผู้ดูแลระบบเท่านั้น\n\nวงเงินสูงสุดต่อการทำธุรกรรมหนึ่งครั้งของลูกค้าบุคคล (USD เทียบเท่าสกุลท้องถิ่น):\n· ญี่ปุ่น: เทียบเท่า 1,000,000 เยน เป็น USD\n· เกาหลี: เทียบเท่า 10,000,000 วอน เป็น USD\n· ไทย: เทียบเท่า 330,000 บาท เป็น USD\n· สหรัฐฯ: 10,000 USD\n· จีน: เทียบเท่า 65,000 หยวน เป็น USD\n\nทำธุรกรรมเกินวงเงินไม่ได้ กรุณาตรวจสอบก่อนสมัคร',
  },
};

export type IndividualRegisterNoticeLocale = keyof typeof DEFAULT_INDIVIDUAL_REGISTER_NOTICE_I18N;

export function resolveIndividualRegisterNotice(
  locale: IndividualRegisterNoticeLocale,
  enabled?: boolean,
  custom?: Partial<Record<IndividualRegisterNoticeLocale, { title: string; body: string }>>,
): { title: string; body: string } | null {
  if (enabled === false) return null;
  const customEntry = custom?.[locale];
  if (customEntry?.title?.trim()) {
    return {
      title: customEntry.title,
      body: customEntry.body ?? '',
    };
  }
  return (
    DEFAULT_INDIVIDUAL_REGISTER_NOTICE_I18N[locale] ?? DEFAULT_INDIVIDUAL_REGISTER_NOTICE_I18N.KR
  );
}
