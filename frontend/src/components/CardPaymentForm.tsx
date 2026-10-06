'use client';

import { useT } from '@/context/LocaleProvider';
import { PHONE_COUNTRY_CODES } from '@/constants/phone-country-codes';
import type { CardFeeBrand, CardFeeMode, CardPaymentInput } from '@/lib/api';

const CARD_BRANDS: CardFeeBrand[] = ['VISA', 'MASTERCARD', 'AMEX', 'JCB', 'UNIONPAY', 'OTHER'];

export type CardFormState = CardPaymentInput & {
  waiverAccepted: boolean;
  cardBrand: CardFeeBrand;
  /** 법적 성명이 프로필에 고정되어 편집 불가 */
  nameLocked?: boolean;
};

const ENGLISH_NAME_RE = /^[A-Za-z][A-Za-z .'-]*$/;

export function isEnglishName(value: string): boolean {
  return ENGLISH_NAME_RE.test(value.trim());
}

export const emptyCardForm = (
  defaults?: Partial<CardPaymentInput> & { cardBrand?: CardFeeBrand; nameLocked?: boolean },
): CardFormState => ({
  cardholderName: defaults?.cardholderName ?? '',
  email: defaults?.email ?? '',
  phone: defaults?.phone ?? '',
  phoneCountryCode: defaults?.phoneCountryCode ?? '+66',
  firstName: defaults?.firstName ?? '',
  lastName: defaults?.lastName ?? '',
  waiverAccepted: false,
  cardBrand: defaults?.cardBrand ?? 'OTHER',
  nameLocked: defaults?.nameLocked ?? false,
});

type Props = {
  value: CardFormState;
  onChange: (next: CardFormState) => void;
  feeMode?: CardFeeMode;
};

export function CardPaymentForm({ value, onChange, feeMode = 'UNIFORM' }: Props) {
  const t = useT();
  const nameLocked = value.nameLocked === true;

  function patch(partial: Partial<CardFormState>) {
    const next = { ...value, ...partial };
    if (nameLocked) {
      next.firstName = value.firstName;
      next.lastName = value.lastName;
      next.cardholderName = value.cardholderName;
    } else {
      const first = String(next.firstName ?? '').trim();
      const last = String(next.lastName ?? '').trim();
      if (first || last) {
        next.cardholderName = [first, last].filter(Boolean).join(' ');
      }
    }
    onChange(next);
  }

  return (
    <div className="mt-5 rounded-xl border border-sky-200/80 bg-sky-50/90 p-4 shadow-sm ring-1 ring-sky-100">
      <p className="text-sm font-medium text-sky-950">{t('usdt.cardSectionTitle')}</p>
      <p className="mt-1.5 text-[11px] leading-relaxed text-sky-900/80">{t('usdt.cardHostedHint')}</p>
      <p className="mt-1 text-[11px] leading-relaxed text-sky-900/70">{t('usdt.cardBuyerEnglishHint')}</p>
      <p className="mt-1 text-[11px] leading-relaxed text-sky-800/70">{t('usdt.cardFxNotice')}</p>
      <p className="mt-1 text-[11px] font-medium leading-relaxed text-rose-800/90">
        {t('usdt.cardLegalNameLockedHint')}
      </p>

      {feeMode === 'BY_BRAND' && (
        <div className="mt-4 max-w-sm">
          <label className="pg-label text-sky-900">{t('usdt.cardBrand')}</label>
          <select
            className="pg-input mt-1 w-full border-sky-200 bg-white"
            value={value.cardBrand}
            onChange={(e) => patch({ cardBrand: e.target.value as CardFeeBrand })}
          >
            {CARD_BRANDS.map((b) => (
              <option key={b} value={b}>
                {t(`hq.cardFee.brand.${b}` as 'hq.cardFee.brand.VISA')}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-sky-800/80">{t('usdt.cardBrandHint')}</p>
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="pg-label text-sky-900">{t('usdt.cardFirstName')}</label>
          <input
            className="pg-input mt-1 w-full border-sky-200 bg-slate-100 text-slate-800"
            autoComplete="given-name"
            lang="en"
            spellCheck={false}
            readOnly
            value={value.firstName ?? ''}
          />
        </div>
        <div>
          <label className="pg-label text-sky-900">{t('usdt.cardLastName')}</label>
          <input
            className="pg-input mt-1 w-full border-sky-200 bg-slate-100 text-slate-800"
            autoComplete="family-name"
            lang="en"
            spellCheck={false}
            readOnly
            value={value.lastName ?? ''}
          />
        </div>
      </div>
      {!value.firstName || !value.lastName ? (
        <p className="mt-2 text-[11px] font-medium text-rose-700">{t('usdt.cardLegalNameMissing')}</p>
      ) : null}

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
