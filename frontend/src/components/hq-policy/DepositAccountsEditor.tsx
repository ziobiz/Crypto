'use client';

import { useState } from 'react';
import { useT } from '@/context/LocaleProvider';
import { LOCALES } from '@/i18n/locales';
import type { DepositReceivingAccountInfo, HqPlatformConfig } from '@/lib/api';

type FiatCur = 'KRW' | 'JPY' | 'THB' | 'CNY' | 'USD' | 'EUR';

const EMPTY_ACCT = (cur: FiatCur): DepositReceivingAccountInfo => ({
  bankName: '',
  accountNumber: '',
  accountHolder: '',
  bankAddress: '',
  bankCode: '',
  branchCode: '',
  branchName: '',
  accountType: '',
  bankCountry: '',
  routingNumber: '',
  bic: '',
  notice: '',
  noticeI18n: {},
  transferEnabled: true,
  cardEnabled: true,
  remittanceEnabled: cur === 'USD' || cur === 'EUR',
});

const DEFAULT_NOTICE_I18N = {
  KR: '금액을 정상적으로 수령하려면, 수취인 이름을 정확히 복사하여 입력해야 합니다. (半角カタカナ 그대로 사용)',
  US: 'To receive the funds correctly, copy and enter the beneficiary name exactly as shown. (Use half-width katakana as-is.)',
  JP: '正常に着金するには、受取人名を表示どおり正確にコピーして入力してください。（半角カタカナのまま使用）',
  CH: '为确保正常入账，请精确复制并输入收款人姓名。（请原样使用半角片假名）',
  TH: 'เพื่อให้รับเงินได้ถูกต้อง ต้องคัดลอกและใส่ชื่อผู้รับให้ตรงตามที่แสดง (ใช้คาตาคานะแบบครึ่งความกว้างตามเดิม)',
} as const;

type Props = {
  config: HqPlatformConfig;
  setConfig: (next: HqPlatformConfig) => void;
};

export function DepositAccountsEditor({ config, setConfig }: Props) {
  const t = useT();
  const [depositNoticeLocale, setDepositNoticeLocale] = useState<(typeof LOCALES)[number]>('KR');

  return (
    <div className="space-y-4">
      <p className="pg-hint">{t('hq.platform.depositAccountsDesc')}</p>
      <p className="pg-hint font-medium text-amber-800">{t('hq.accounts.depositWhere')}</p>
      <div className="grid gap-4 lg:grid-cols-2">
        {(['KRW', 'JPY', 'THB', 'CNY', 'USD', 'EUR'] as const).map((cur) => {
          const isAch = cur === 'USD';
          const isSepa = cur === 'EUR';
          const isWesternRail = isAch || isSepa;
          const railLabel = isAch ? 'ACH' : isSepa ? 'SEPA' : null;
          const acct = config.depositReceivingAccounts?.[cur] ?? EMPTY_ACCT(cur);
          const patchAcct = (next: DepositReceivingAccountInfo) =>
            setConfig({
              ...config,
              depositReceivingAccounts: {
                ...config.depositReceivingAccounts,
                [cur]: next,
              },
            });
          const fillJpyPayoneer = () =>
            patchAcct({
              bankName: 'MUFG Bank, Ltd.',
              bankAddress: '7-1 Marunouchi 2-Chome, Chiyoda-ku Tokyo, Japan',
              bankCode: '0005',
              branchCode: '869',
              branchName: '',
              accountType: 'Savings / Futsu',
              bankCountry: '',
              routingNumber: '',
              bic: '',
              accountNumber: '4685448',
              accountHolder: 'ﾍﾟｲｵﾆｱ ｼﾞﾔﾊﾟﾝ(ｶ',
              notice: '',
              noticeI18n: { ...DEFAULT_NOTICE_I18N },
              transferEnabled: acct.transferEnabled !== false,
              cardEnabled: acct.cardEnabled !== false,
              remittanceEnabled: acct.remittanceEnabled === true,
            });
          const fillUsdAch = () =>
            patchAcct({
              bankName: 'LEAD BANK',
              bankAddress: '',
              bankCode: '',
              branchCode: '',
              branchName: '',
              accountType: 'Business',
              bankCountry: 'US',
              routingNumber: '101019644',
              bic: '',
              accountNumber: '219202635366',
              accountHolder: 'ONTHELINE CO LTD',
              notice: '',
              noticeI18n: {},
              transferEnabled: acct.transferEnabled !== false,
              cardEnabled: acct.cardEnabled !== false,
              remittanceEnabled: acct.remittanceEnabled !== false,
            });
          const fillEurSepa = () =>
            patchAcct({
              bankName: 'OpenPayd Financial Services Malta Ltd',
              bankAddress: '',
              bankCode: '',
              branchCode: '',
              branchName: '',
              accountType: 'Business',
              bankCountry: 'MT',
              routingNumber: '',
              bic: 'CFTEMTM1',
              accountNumber: 'MT03CFTE28004000000000005161666',
              accountHolder: 'ONTHELINE CO LTD',
              notice: '',
              noticeI18n: {},
              transferEnabled: acct.transferEnabled !== false,
              cardEnabled: acct.cardEnabled !== false,
              remittanceEnabled: acct.remittanceEnabled !== false,
            });
          const noticeText =
            acct.noticeI18n?.[depositNoticeLocale] ??
            (depositNoticeLocale === 'KR' ? acct.notice ?? '' : '') ??
            '';
          const setNoticeText = (value: string) =>
            patchAcct({
              ...acct,
              noticeI18n: { ...(acct.noticeI18n ?? {}), [depositNoticeLocale]: value },
              notice: depositNoticeLocale === 'KR' ? value : acct.notice,
            });
          const remitChecked =
            acct.remittanceEnabled !== undefined
              ? acct.remittanceEnabled === true
              : cur === 'USD' || cur === 'EUR';

          return (
            <div key={cur} className="rounded border border-slate-200 bg-white p-3 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-bold text-gray-800">
                  {cur}
                  {railLabel ? (
                    <span className="ml-2 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      {railLabel}
                    </span>
                  ) : null}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-700">
                  {cur === 'JPY' && (
                    <button
                      type="button"
                      onClick={fillJpyPayoneer}
                      className="rounded border border-amber-300 bg-amber-50 px-2 py-1 font-semibold text-amber-900 hover:bg-amber-100"
                    >
                      {t('hq.platform.depositFillJpyPayoneer')}
                    </button>
                  )}
                  {isAch && (
                    <button
                      type="button"
                      onClick={fillUsdAch}
                      className="rounded border border-sky-300 bg-sky-50 px-2 py-1 font-semibold text-sky-900 hover:bg-sky-100"
                    >
                      {t('hq.platform.depositFillUsdAch')}
                    </button>
                  )}
                  {isSepa && (
                    <button
                      type="button"
                      onClick={fillEurSepa}
                      className="rounded border border-violet-300 bg-violet-50 px-2 py-1 font-semibold text-violet-900 hover:bg-violet-100"
                    >
                      {t('hq.platform.depositFillEurSepa')}
                    </button>
                  )}
                  <label className="inline-flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={acct.transferEnabled !== false}
                      onChange={(e) => patchAcct({ ...acct, transferEnabled: e.target.checked })}
                    />
                    {t('hq.platform.depositTransferEnabled')}
                  </label>
                  <label className="inline-flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={acct.cardEnabled !== false}
                      onChange={(e) => patchAcct({ ...acct, cardEnabled: e.target.checked })}
                    />
                    {t('hq.platform.depositCardEnabled')}
                  </label>
                  <label className="inline-flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={remitChecked}
                      onChange={(e) => patchAcct({ ...acct, remittanceEnabled: e.target.checked })}
                    />
                    {t('hq.accounts.depositRemittanceEnabled')}
                  </label>
                </div>
              </div>
              {isWesternRail ? (
                <>
                  <label className="block">
                    <span className="pg-label">{t('hq.platform.depositBankAccountCurrency')}</span>
                    <input value={cur} readOnly className="pg-input mt-1 bg-slate-50 font-mono" />
                  </label>
                  {isAch ? (
                    <label className="block">
                      <span className="pg-label">{t('hq.platform.depositRoutingNumber')}</span>
                      <input
                        value={acct.routingNumber ?? ''}
                        onChange={(e) => patchAcct({ ...acct, routingNumber: e.target.value })}
                        className="pg-input mt-1 font-mono"
                        placeholder="101019644"
                      />
                    </label>
                  ) : null}
                  <label className="block">
                    <span className="pg-label">
                      {isSepa ? t('hq.platform.depositIban') : t('hq.platform.depositAccountNumber')}
                    </span>
                    <input
                      value={acct.accountNumber}
                      onChange={(e) => patchAcct({ ...acct, accountNumber: e.target.value })}
                      className="pg-input mt-1 font-mono"
                      placeholder={isSepa ? 'MT03CFTE28004000000000005161666' : '219202635366'}
                    />
                  </label>
                  {isSepa ? (
                    <label className="block">
                      <span className="pg-label">{t('hq.platform.depositBic')}</span>
                      <input
                        value={acct.bic ?? ''}
                        onChange={(e) => patchAcct({ ...acct, bic: e.target.value })}
                        className="pg-input mt-1 font-mono uppercase"
                        placeholder="CFTEMTM1"
                      />
                    </label>
                  ) : null}
                  <label className="block">
                    <span className="pg-label">{t('hq.platform.depositAccountHolder')}</span>
                    <input
                      value={acct.accountHolder}
                      onChange={(e) => patchAcct({ ...acct, accountHolder: e.target.value })}
                      className="pg-input mt-1"
                      placeholder="ONTHELINE CO LTD"
                    />
                  </label>
                  <label className="block">
                    <span className="pg-label">{t('hq.platform.depositAccountType')}</span>
                    <input
                      value={acct.accountType ?? ''}
                      onChange={(e) => patchAcct({ ...acct, accountType: e.target.value })}
                      className="pg-input mt-1"
                      placeholder="Business"
                    />
                  </label>
                  <label className="block">
                    <span className="pg-label">{t('hq.platform.depositBankCountry')}</span>
                    <input
                      value={acct.bankCountry ?? ''}
                      onChange={(e) => patchAcct({ ...acct, bankCountry: e.target.value })}
                      className="pg-input mt-1 font-mono uppercase"
                      placeholder={isSepa ? 'MT' : 'US'}
                    />
                  </label>
                  <label className="block">
                    <span className="pg-label">{t('hq.platform.depositBankName')}</span>
                    <input
                      value={acct.bankName}
                      onChange={(e) => patchAcct({ ...acct, bankName: e.target.value })}
                      className="pg-input mt-1"
                      placeholder={
                        isSepa ? 'OpenPayd Financial Services Malta Ltd' : 'LEAD BANK'
                      }
                    />
                  </label>
                </>
              ) : (
                <>
                  <label className="block">
                    <span className="pg-label">{t('hq.platform.depositBankName')}</span>
                    <input
                      value={acct.bankName}
                      onChange={(e) => patchAcct({ ...acct, bankName: e.target.value })}
                      className="pg-input mt-1"
                      placeholder="MUFG Bank, Ltd."
                    />
                  </label>
                  <label className="block">
                    <span className="pg-label">{t('hq.platform.depositBankAddress')}</span>
                    <input
                      value={acct.bankAddress ?? ''}
                      onChange={(e) => patchAcct({ ...acct, bankAddress: e.target.value })}
                      className="pg-input mt-1"
                      placeholder="7-1 Marunouchi 2-Chome, Chiyoda-ku Tokyo, Japan"
                    />
                  </label>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <label className="block">
                      <span className="pg-label">{t('hq.platform.depositBankCode')}</span>
                      <input
                        value={acct.bankCode ?? ''}
                        onChange={(e) => patchAcct({ ...acct, bankCode: e.target.value })}
                        className="pg-input mt-1 font-mono"
                        placeholder="0005"
                      />
                    </label>
                    <label className="block">
                      <span className="pg-label">{t('hq.platform.depositBranchCode')}</span>
                      <input
                        value={acct.branchCode ?? ''}
                        onChange={(e) => patchAcct({ ...acct, branchCode: e.target.value })}
                        className="pg-input mt-1 font-mono"
                        placeholder="869"
                      />
                    </label>
                    <label className="block">
                      <span className="pg-label">{t('hq.platform.depositAccountType')}</span>
                      <input
                        value={acct.accountType ?? ''}
                        onChange={(e) => patchAcct({ ...acct, accountType: e.target.value })}
                        className="pg-input mt-1"
                        placeholder="Savings / Futsu"
                      />
                    </label>
                  </div>
                  <label className="block">
                    <span className="pg-label">{t('hq.platform.depositAccountNumber')}</span>
                    <input
                      value={acct.accountNumber}
                      onChange={(e) => patchAcct({ ...acct, accountNumber: e.target.value })}
                      className="pg-input mt-1 font-mono"
                      placeholder="4685448"
                    />
                  </label>
                  <label className="block">
                    <span className="pg-label">{t('hq.platform.depositAccountHolder')}</span>
                    <input
                      value={acct.accountHolder}
                      onChange={(e) => patchAcct({ ...acct, accountHolder: e.target.value })}
                      className="pg-input mt-1 font-mono"
                      placeholder="ﾍﾟｲｵﾆｱ ｼﾞﾔﾊﾟﾝ(ｶ"
                    />
                    <span className="mt-1 block pg-hint">{t('usdt.deposit.holderNameStayJp')}</span>
                  </label>
                </>
              )}
              <div className="rounded border border-red-100 bg-red-50/60 p-2 space-y-2">
                <p className="pg-label text-red-800">{t('hq.platform.depositNotice')}</p>
                <p className="pg-hint">{t('hq.platform.depositNoticeI18nHint')}</p>
                <div className="flex flex-wrap gap-1">
                  {LOCALES.map((loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => setDepositNoticeLocale(loc)}
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        depositNoticeLocale === loc
                          ? 'bg-red-700 text-white'
                          : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
                <textarea
                  value={noticeText}
                  onChange={(e) => setNoticeText(e.target.value)}
                  rows={3}
                  className="pg-input border-red-200"
                  placeholder={isWesternRail ? '' : DEFAULT_NOTICE_I18N[depositNoticeLocale]}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
