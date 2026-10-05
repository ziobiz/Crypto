'use client';

import { useT } from '@/context/LocaleProvider';
import { PHONE_COUNTRY_CODES } from '@/constants/phone-country-codes';
import type { CardPaymentInput } from '@/lib/api';

export type CardFormState = CardPaymentInput & {
  waiverAccepted: boolean;
};

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

export function CardPaymentForm({ value, onChange }: Props) {
  const t = useT();

  function patch(partial: Partial<CardFormState>) {
    onChange({ ...value, ...partial });
  }

  return (
    <div className="space-y-3 border-t border-gray-200 pt-4">
      <p className="text-xs font-semibold text-gray-800">{t('usdt.cardSectionTitle')}</p>
      <p className="text-[11px] text-gray-600">{t('usdt.cardHostedHint')}</p>
      <p className="text-[11px] text-gray-600">{t('usdt.cardFxNotice')}</p>
      <div>
        <label className="pg-label">{t('usdt.cardholderName')}</label>
        <input
          className="pg-input mt-1 w-full"
          autoComplete="cc-name"
          value={value.cardholderName}
          onChange={(e) => patch({ cardholderName: e.target.value })}
        />
      </div>
      <div>
        <label className="pg-label">{t('usdt.cardEmail')}</label>
        <input
          className="pg-input mt-1 w-full"
          type="email"
          autoComplete="email"
          value={value.email}
          onChange={(e) => patch({ email: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-[7.5rem_1fr] gap-2">
        <div>
          <label className="pg-label">{t('usdt.phoneCountryCode')}</label>
          <select
            className="pg-input mt-1 w-full"
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
          <label className="pg-label">{t('usdt.cardPhone')}</label>
          <input
            className="pg-input mt-1 w-full"
            inputMode="tel"
            autoComplete="tel-national"
            value={value.phone}
            onChange={(e) => patch({ phone: e.target.value })}
          />
        </div>
      </div>
      <label className="flex items-start gap-2 text-[12px] text-gray-700">
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
