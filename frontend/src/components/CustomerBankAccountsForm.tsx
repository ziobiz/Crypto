'use client';

import { useT } from '@/context/LocaleProvider';

export type RegisterBankAccount = {
  currency: 'KRW' | 'JPY' | 'THB' | 'CNY';
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branchName: string;
};

const BANK_CURRENCIES = ['KRW', 'JPY', 'THB', 'CNY'] as const;

export function emptyBankAccounts(): RegisterBankAccount[] {
  return BANK_CURRENCIES.map((currency) => ({
    currency,
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    branchName: '',
  }));
}

export function filledBankAccounts(accounts: RegisterBankAccount[]) {
  return accounts.filter(
    (a) => a.bankName.trim() && a.accountNumber.trim() && a.accountHolder.trim(),
  );
}

type CustomerBankAccountsFormProps = {
  accounts: RegisterBankAccount[];
  onChange: (accounts: RegisterBankAccount[]) => void;
  accountHolderDefault?: string;
};

export function CustomerBankAccountsForm({
  accounts,
  onChange,
  accountHolderDefault,
}: CustomerBankAccountsFormProps) {
  const t = useT();

  function update(index: number, patch: Partial<RegisterBankAccount>) {
    onChange(accounts.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  return (
    <div className="space-y-3 rounded-lg border border-blue-100 bg-blue-50/50 p-3">
      <div>
        <p className="text-xs font-semibold text-blue-900">{t('register.bankSectionTitle')}</p>
        <p className="mt-1 text-[11px] text-blue-800">{t('register.bankSectionDesc')}</p>
      </div>
      {accounts.map((acct, index) => (
        <div key={acct.currency} className="rounded border border-white bg-white/80 p-3 space-y-2">
          <p className="text-xs font-bold text-gray-700">{acct.currency}</p>
          <label className="block text-sm">
            <span className="font-medium">{t('users.bankName')}</span>
            <input
              value={acct.bankName}
              onChange={(e) => update(index, { bankName: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder={t('users.bankNamePlaceholder')}
            />
          </label>
          {(acct.currency === 'JPY' || acct.currency === 'CNY') && (
            <label className="block text-sm">
              <span className="font-medium">{t('register.bankBranch')}</span>
              <input
                value={acct.branchName}
                onChange={(e) => update(index, { branchName: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder={t('register.bankBranchPlaceholder')}
              />
            </label>
          )}
          <label className="block text-sm">
            <span className="font-medium">{t('users.accountNumber')}</span>
            <input
              value={acct.accountNumber}
              onChange={(e) => update(index, { accountNumber: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium">{t('users.accountHolder')}</span>
            <input
              value={acct.accountHolder || accountHolderDefault || ''}
              onChange={(e) => update(index, { accountHolder: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </label>
        </div>
      ))}
      <p className="text-[10px] text-gray-600">{t('register.bankMinHint')}</p>
    </div>
  );
}
