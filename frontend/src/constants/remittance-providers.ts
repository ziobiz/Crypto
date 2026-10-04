/** 빠른송금(소액 해외송금) 서비스 — Wise류 대안 포함 */
export const REMITTANCE_PROVIDERS = [
  { value: 'WISE', label: 'Wise' },
  { value: 'REMITLY', label: 'Remitly' },
  { value: 'WORLDREMIT', label: 'WorldRemit' },
  { value: 'REVOLUT', label: 'Revolut' },
  { value: 'WESTERN_UNION', label: 'Western Union' },
  { value: 'MONEYGRAM', label: 'MoneyGram' },
  { value: 'XOOM', label: 'Xoom (PayPal)' },
  { value: 'RIA', label: 'Ria' },
  { value: 'OFX', label: 'OFX' },
  { value: 'PAYONEER', label: 'Payoneer' },
  { value: 'OTHER', label: 'Other' },
] as const;

export type RemittanceProviderValue = (typeof REMITTANCE_PROVIDERS)[number]['value'];

export function isRemittanceProvider(v: string): v is RemittanceProviderValue {
  return REMITTANCE_PROVIDERS.some((p) => p.value === v);
}
