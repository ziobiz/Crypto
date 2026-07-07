'use client';

import { useT } from '@/context/LocaleProvider';
import { PHONE_COUNTRY_CODES } from '@/constants/phone-country-codes';
import type { CardPaymentInput } from '@/lib/api';

export type CardFormState = CardPaymentInput & {
  waiverAccepted: boolean;
};

export const emptyCardForm = (defaults?: Partial<CardPaymentInput>): CardFormState => ({
  cardNumber: '',
  cardExpiry: '',
  cardCvv: '',
  cardholderName: defaults?.cardholderName ?? '',
  email: defaults?.email ?? '',
  phone: defaults?.phone ?? '',
  phoneCountryCode: defaults?.phoneCountryCode ?? '+82',
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
      <div>
        <label className="pg-label">{t('usdt.cardNumber')}</label>
        <input
          className="pg-input mt-1 w-full"
          inputMode="numeric"
          autoComplete="cc-number"
          value={value.cardNumber}
          onChange={(e) => patch({ cardNumber: e.target.value })}
          placeholder="0000 0000 0000 0000"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="pg-label">{t('usdt.cardExpiry')}</label>
          <input
            className="pg-input mt-1 w-full"
            inputMode="numeric"
            autoComplete="cc-exp"
            value={value.cardExpiry}
            onChange={(e) => patch({ cardExpiry: e.target.value })}
            placeholder="MM/YY"
          />
        </div>
        <div>
          <label className="pg-label">{t('usdt.cardCvv')}</label>
          <input
            className="pg-input mt-1 w-full"
            inputMode="numeric"
            autoComplete="cc-csc"
            value={value.cardCvv}
            onChange={(e) => patch({ cardCvv: e.target.value })}
            placeholder="CVV"
          />
        </div>
      </div>
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
        <label className="pg-label">{t('auth.email')}</label>
        <input
          type="email"
          className="pg-input mt-1 w-full"
          value={value.email}
          onChange={(e) => patch({ email: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-[7rem_1fr] gap-2">
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
          <label className="pg-label">{t('auth.phone')}</label>
          <input
            className="pg-input mt-1 w-full"
            inputMode="tel"
            value={value.phone}
            onChange={(e) => patch({ phone: e.target.value })}
          />
        </div>
      </div>
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
        <p className="font-semibold">{t('usdt.cardWaiverTitle')}</p>
        <p className="mt-1 whitespace-pre-line">{t('usdt.cardWaiverText')}</p>
        <label className="mt-2 flex cursor-pointer items-start gap-2">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={value.waiverAccepted}
            onChange={(e) => patch({ waiverAccepted: e.target.checked })}
          />
          <span>{t('usdt.cardWaiverAccept')}</span>
        </label>
      </div>
    </div>
  );
}
