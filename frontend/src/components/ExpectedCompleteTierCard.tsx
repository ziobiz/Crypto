'use client';

import { useT } from '@/context/LocaleProvider';
import type { MessageKey } from '@/i18n/messages';
import {
  EXPECTED_COMPLETE_CUSTOM_DAY_OPTIONS,
  EXPECTED_COMPLETE_TIERS,
  type ExpectedCompleteTier,
  type HqCompletionTierDays,
} from '@/lib/api';

const DEFAULT_BANK_TIERS: HqCompletionTierDays = {
  REGULAR: 4,
  PLUS: 3,
  PRIME: 2,
  ELITE: 1,
  SIGNATURE: 0,
};

const DEFAULT_CARD_TIERS: HqCompletionTierDays = {
  REGULAR: 2,
  PLUS: 1,
  PRIME: 1,
  ELITE: 0,
  SIGNATURE: 0,
};

function tierLabelKey(tier: ExpectedCompleteTier): MessageKey {
  return `customers.expectedComplete.tier.${tier}` as MessageKey;
}

function formatTierOption(
  tier: ExpectedCompleteTier,
  daysMap: HqCompletionTierDays,
  t: (key: MessageKey) => string,
): string {
  const name = t(tierLabelKey(tier));
  if (tier === 'CUSTOM') return name;
  const days = daysMap[tier] ?? 0;
  if (days <= 0) return `${name} (${t('customers.expectedComplete.sameDay')})`;
  return `${name} (T+${days})`;
}

function TierRow({
  label,
  tier,
  customDays,
  daysMap,
  required,
  onChange,
}: {
  label: string;
  tier: ExpectedCompleteTier;
  customDays: number | null;
  daysMap: HqCompletionTierDays;
  required?: boolean;
  onChange: (next: { tier: ExpectedCompleteTier; customDays: number | null }) => void;
}) {
  const t = useT();
  const resolvedDays =
    tier === 'CUSTOM'
      ? customDays ?? 1
      : daysMap[tier as keyof HqCompletionTierDays] ?? 0;

  return (
    <div className="rounded-md border border-gray-100 bg-white/60 p-3">
      <p className="text-[12px] font-semibold text-gray-700">{label}</p>
      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="pg-field min-w-0 flex-1">
          <span className="pg-field-label">{t('customers.expectedComplete.select')}</span>
          <select
            required={required}
            value={tier}
            onChange={(e) => {
              const next = e.target.value as ExpectedCompleteTier;
              onChange({
                tier: next,
                customDays: next === 'CUSTOM' ? customDays ?? 1 : null,
              });
            }}
            className="pg-input mt-1"
          >
            {EXPECTED_COMPLETE_TIERS.map((code) => (
              <option key={code} value={code}>
                {formatTierOption(code, daysMap, t)}
              </option>
            ))}
          </select>
        </label>
        {tier === 'CUSTOM' && (
          <label className="pg-field w-full sm:w-40">
            <span className="pg-field-label">
              {t('customers.expectedComplete.customDays')}
              <span className="pg-field-required"> *</span>
            </span>
            <select
              required
              value={customDays ?? 1}
              onChange={(e) =>
                onChange({
                  tier: 'CUSTOM',
                  customDays: Number(e.target.value),
                })
              }
              className="pg-input mt-1"
            >
              {EXPECTED_COMPLETE_CUSTOM_DAY_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  T+{d}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <p className="mt-2 text-[12px] text-gray-600">
        {resolvedDays <= 0
          ? t('customers.expectedComplete.previewSameDay')
          : t('customers.expectedComplete.preview').replace('{n}', String(resolvedDays))}
      </p>
    </div>
  );
}

export function ExpectedCompleteTierCard({
  bankTier,
  bankCustomDays,
  cardTier,
  cardCustomDays,
  bankDaysMap,
  cardDaysMap,
  required,
  onChangeBank,
  onChangeCard,
}: {
  bankTier: ExpectedCompleteTier;
  bankCustomDays: number | null;
  cardTier: ExpectedCompleteTier;
  cardCustomDays: number | null;
  bankDaysMap?: HqCompletionTierDays | null;
  cardDaysMap?: HqCompletionTierDays | null;
  required?: boolean;
  onChangeBank: (next: { tier: ExpectedCompleteTier; customDays: number | null }) => void;
  onChangeCard: (next: { tier: ExpectedCompleteTier; customDays: number | null }) => void;
}) {
  const t = useT();

  return (
    <div className="pg-inset-panel sm:col-span-2">
      <p className="pg-inset-title">
        {t('customers.expectedComplete.title')}
        {required ? <span className="pg-field-required"> *</span> : null}
      </p>
      <p className="mt-1 pg-hint">{t('customers.expectedComplete.hint')}</p>
      <div className="mt-3 grid gap-3">
        <TierRow
          label={t('customers.expectedComplete.bank')}
          tier={bankTier}
          customDays={bankCustomDays}
          daysMap={bankDaysMap ?? DEFAULT_BANK_TIERS}
          required={required}
          onChange={onChangeBank}
        />
        <TierRow
          label={t('customers.expectedComplete.card')}
          tier={cardTier}
          customDays={cardCustomDays}
          daysMap={cardDaysMap ?? DEFAULT_CARD_TIERS}
          required={required}
          onChange={onChangeCard}
        />
      </div>
    </div>
  );
}
