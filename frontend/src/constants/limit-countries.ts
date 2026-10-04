export const LIMIT_COUNTRIES = [
  { code: 'JP', phone: '+81' },
  { code: 'KR', phone: '+82' },
  { code: 'TH', phone: '+66' },
  { code: 'US', phone: '+1' },
  { code: 'CN', phone: '+86' },
] as const;

export type LimitCountryCode = (typeof LIMIT_COUNTRIES)[number]['code'];

export function limitCountryFromPhone(phoneCountryCode?: string | null): LimitCountryCode {
  const hit = LIMIT_COUNTRIES.find((c) => c.phone === phoneCountryCode);
  return hit?.code ?? 'US';
}
