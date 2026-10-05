/**
 * ITU-T E.164 storage.
 * Country calling code + national significant number.
 * The national trunk prefix (0) is not stored.
 * +82 010…, +82 10…, and +82(0)10… are the same number.
 */

/** Countries that dial a trunk prefix 0 inside the country and drop it internationally. */
const TRUNK_ZERO_CALLING_CODES = new Set([
  '81',
  '82',
  '66',
  '86',
  '44',
  '61',
  '49',
  '33',
  '39',
  '34',
  '31',
  '46',
  '47',
  '45',
  '41',
  '43',
  '32',
  '353',
  '64',
  '27',
  '60',
  '62',
  '63',
  '84',
  '90',
  '91',
  '92',
  '94',
  '95',
  '98',
]);

export type CanonicalPhone = {
  /** "+82" */
  phoneCountryCode: string;
  /** digits only, trunk 0 removed. e.g. "1012345678" */
  phone: string;
};

export function countryCallingDigits(countryCode?: string | null): string {
  return String(countryCode ?? '').replace(/\D/g, '');
}

export function canonicalizePhone(
  countryCode?: string | null,
  rawPhone?: string | null,
): CanonicalPhone | null {
  const cc = countryCallingDigits(countryCode);
  if (!cc || rawPhone == null) return null;
  const withoutTrunkMark = String(rawPhone).trim().replace(/\(0\)/g, '');
  let digits = withoutTrunkMark.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith(cc) && digits.length > cc.length + 5) {
    digits = digits.slice(cc.length);
  }
  if (TRUNK_ZERO_CALLING_CODES.has(cc) && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  if (digits.length < 6) return null;
  return { phoneCountryCode: `+${cc}`, phone: digits };
}

export function phonesMatch(
  storedCountry?: string | null,
  storedPhone?: string | null,
  queryCountry?: string | null,
  queryPhone?: string | null,
): boolean {
  const query = canonicalizePhone(queryCountry, queryPhone);
  if (!query || !storedPhone) return false;
  const storedCc = countryCallingDigits(storedCountry);
  const queryCc = countryCallingDigits(query.phoneCountryCode);
  const stored = canonicalizePhone(storedCc || queryCc, storedPhone);
  if (!stored || stored.phone !== query.phone) return false;
  if (storedCc && storedCc !== queryCc) return false;
  return true;
}

/** Digit forms so 010… and 10… both match a stored national number. */
export function phoneLookupNeedles(raw: string): string[] {
  const digits = String(raw ?? '').replace(/\D/g, '');
  if (digits.length < 6) return [];
  const variants = new Set<string>([digits]);
  if (digits.startsWith('0')) variants.add(digits.slice(1));
  else variants.add(`0${digits}`);
  return [...variants].filter((n) => n.length >= 6);
}

/** 이병선 → 이*선. First and last character stay visible. */
export function maskPersonName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '';
  return trimmed
    .split(/(\s+)/)
    .map((part) => {
      if (/^\s+$/.test(part)) return part;
      const chars = Array.from(part);
      if (chars.length <= 1) return '*';
      if (chars.length === 2) return `${chars[0]}*`;
      return `${chars[0]}${'*'.repeat(chars.length - 2)}${chars[chars.length - 1]}`;
    })
    .join('');
}
