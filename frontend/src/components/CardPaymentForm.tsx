'use client';

import { useT } from '@/context/LocaleProvider';
import { PHONE_COUNTRY_CODES } from '@/constants/phone-country-codes';
import type { CardPaymentInput } from '@/lib/api';

export type CardFormState = CardPaymentInput & {
  waiverAccepted: boolean;
};

const ENGLISH_NAME_RE = /^[A-Za-z][A-Za-z .'-]*$/;

export function isEnglishName(value: string): boolean {
  return ENGLISH_NAME_RE.test(value.trim());
}

export const emptyCardForm = (defaults?: Partial<CardPaymentInput>): CardFormState => ({
  cardholderName: defaults?.cardholderName ?? '',
  email: defaults?.email ?? '',
  phone: defaults?.phone ?? '',
  phoneCountryCode: defaults?.phoneCountryCode ?? '+66',
  firstName: defaults?.firstName ?? '',
  lastName: defaults?.lastName ?? '',
  waiverAccepted: false,
});

type Props = {
  value: CardFormState;
  onChange: (next: CardFormState) => void;
};

function sanitizeEnglishName(raw: string): string {
  return raw.replace(/[^A-Za-z .'-]/g, '');
}

export function CardPaymentForm({ value, onChange }: Props) {
  const t = useT();

  function patch(partial: Partial<CardFormState>) {
    const next = { ...value, ...partial };
    const first = String(next.firstName ?? '').trim();
    const last = String(next.lastName ?? '').trim();
    if (first || last) {
      next.cardholderName = [first, last].filter(Boolean).join(' ');
    }
    onChange(next);
  }

  return (
    <div className="mt-5 rounded-xl border border-sky-200/80 bg-sky-50/90 p-4 shadow-sm ring-1 ring-sky-100">
      <p className="text-sm font-medium text-sky-950">{t('usdt.cardSectionTitle')}</p>
      <p className="mt-1.5 text-[11px] leading-relaxed text-sky-900/80">{t('usdt.cardHostedHint')}</p>
      <p className="mt-1 text-[11px] leading-relaxed text-sky-900/70">{t('usdt.cardBuyerEnglishHint')}</p>
      <p className="mt-1 text-[11px] leading-relaxed text-sky-800/70">{t('usdt.cardFxNotice')}</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="pg-label text-sky-900">{t('usdt.cardFirstName')}</label>
          <input
            className="pg-input mt-1 w-full border-sky-200 bg-white"
            autoComplete="given-name"
            lang="en"
            spellCheck={false}
            placeholder="Given name (English)"
            value={value.firstName ?? ''}
            onChange={(e) => patch({ firstName: sanitizeEnglishName(e.target.value) })}
          />
        </div>
        <div>
          <label className="pg-label text-sky-900">{t('usdt.cardLastName')}</label>
          <input
            className="pg-input mt-1 w-full border-sky-200 bg-white"
            autoComplete="family-name"
            lang="en"
            spellCheck={false}
            placeholder="Family name (English)"
            value={value.lastName ?? ''}
            onChange={(e) => patch({ lastName: sanitizeEnglishName(e.target.value) })}
          />
        </div>
      </div>

      <div className="mt-3">
        <label className="pg-label text-sky-900">{t('usdt.cardEmail')}</label>
        <input
          className="pg-input mt-1 w-full border-sky-200 bg-white"
          type="email"
          autoComplete="email"
          value={value.email}
          onChange={(e) => patch({ email: e.target.value })}
        />
      </div>

      <div className="mt-3 grid grid-cols-[7.5rem_1fr] gap-2">
        <div>
          <label className="pg-label text-sky-900">{t('usdt.phoneCountryCode')}</label>
          <select
            className="pg-input mt-1 w-full border-sky-200 bg-white"
            value={value.phoneCountryCode}
            onChange={(e) => patch({ phoneCountryCode: e.target.value })}
          >
            {PHONE_COUNTRY_CODES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="pg-label text-sky-900">{t('usdt.cardPhone')}</label>
          <input
            className="pg-input mt-1 w-full border-sky-200 bg-white"
            inputMode="tel"
            autoComplete="tel-national"
            value={value.phone}
            onChange={(e) => patch({ phone: e.target.value.replace(/[^\d\s+-]/g, '') })}
          />
        </div>
      </div>

      <label className="mt-4 flex items-start gap-2 text-[12px] text-sky-950">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={value.waiverAccepted}
          onChange={(e) => patch({ waiverAccepted: e.target.checked })}
        />
        <span>{t('usdt.cardWaiverAccept')}</span>
      </label>
    </div>
  );
}
