'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { useLocale, useT } from '@/context/LocaleProvider';
import { api, type KycCase } from '@/lib/api';
import { LocalizedFileInput } from '@/components/LocalizedFileInput';
import { KycFileLink } from '@/components/KycFileLink';
import type { MessageKey } from '@/i18n/messages';

function statusKey(status: string): MessageKey {
  if (status === 'PENDING') return 'kyc.status.PENDING';
  if (status === 'APPROVED') return 'kyc.status.APPROVED';
  if (status === 'REJECTED') return 'kyc.status.REJECTED';
  return 'kyc.status.NOT_SUBMITTED';
}

function purposeKey(purpose: string): MessageKey {
  if (purpose === 'JP_TAX_SUPPORT_DOC') return 'attachment.JP_TAX_SUPPORT_DOC';
  return 'attachment.FUNDING_FORECAST_REPORT';
}

function CustomerKycPanel() {
  const t = useT();
  const { locale } = useLocale();
  const { user, refresh } = useAuth();
  const [kyc, setKyc] = useState<KycCase | null>(null);
  const [forecast, setForecast] = useState<File[]>([]);
  const [tax, setTax] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const corporate = user?.customerProfile?.customerType === 'CORPORATE';

  const load = () => api.kyc.me().then(setKyc).catch(console.error);
  useEffect(() => {
    load();
  }, []);

  const canSubmit =
    user?.role === 'CUSTOMER' && kyc && (kyc.status === 'NOT_SUBMITTED' || kyc.status === 'REJECTED');

  async function submit() {
    setError('');
    if (forecast.length === 0) {
      setError(t('kyc.forecastRequired'));
      return;
    }
    if (corporate && tax.length === 0) {
      setError(t('kyc.taxRequired'));
      return;
    }
    setLoading(true);
    try {
      const next = await api.kyc.submit({ forecast, taxSupport: tax });
      setKyc(next);
      setForecast([]);
      setTax([]);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('kyc.submitFailed'));
    } finally {
      setLoading(false);
    }
  }

  if (!kyc) return <p className="pg-hint">{t('common.loading')}</p>;

  return (
    <div className="pg-stack">
      <p className="pg-hint">{t('kyc.customerHint')}</p>
      <div className="pg-card">
        <div className="pg-card-body space-y-3">
          <p>
            <span className="pg-badge pg-badge-info">{t(statusKey(kyc.status))}</span>
          </p>
          {kyc.status === 'REJECTED' && kyc.rejectReason && (
            <p className="text-sm text-red-600">{t('kyc.rejectReason')}: {kyc.rejectReason}</p>
          )}
          {kyc.attachments.length > 0 && (
            <ul className="space-y-1">
              {kyc.attachments.map((a) => (
                <li key={a.id}>
                  <KycFileLink id={a.id} fileName={a.fileName} purposeLabel={t(purposeKey(a.purpose))} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {canSubmit && (
        <div className="pg-card">
          <div className="pg-card-head">{t('kyc.submitTitle')}</div>
          <div className="pg-card-body space-y-4">
            <p className="pg-hint">{corporate ? t('kyc.corporateHint') : t('kyc.individualHint')}</p>
            <div className="flex flex-wrap gap-2">
              <a
                href={`/templates/${locale}/TINPASS_JP_6month_funding_forecast.xlsx`}
                className="pg-btn pg-btn-secondary text-sm"
                download
              >
                {t('usdt.funding.downloadForecast')}
              </a>
              <a
                href={`/templates/${locale}/TINPASS_JP_USDT_application_checklist.xlsx`}
                className="pg-btn pg-btn-secondary text-sm"
                download
              >
                {t('usdt.funding.downloadApply')}
              </a>
            </div>
            <div>
              <label className="pg-label">{t('usdt.funding.forecastFile')}</label>
              <div className="mt-1">
                <LocalizedFileInput
                  accept=".xlsx,.xls,.pdf,application/pdf"
                  multiple
                  files={forecast}
                  onFiles={setForecast}
                />
              </div>
            </div>
            {corporate && (
              <div>
                <label className="pg-label">{t('usdt.funding.taxFiles')}</label>
                <div className="mt-1">
                  <LocalizedFileInput
                    accept=".pdf,image/*,.xlsx,.xls"
                    multiple
                    files={tax}
                    onFiles={setTax}
                  />
                </div>
              </div>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="button" className="pg-btn pg-btn-primary" disabled={loading} onClick={submit}>
              {loading ? t('usdt.processing') : t('kyc.submit')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function KycPage() {
  const t = useT();
  const { user } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (user && user.role !== 'CUSTOMER' && user.role !== 'CUSTOMER_OPERATOR') {
      router.replace('/dashboard/customers');
    }
  }, [user, router]);
  if (user?.role === 'CUSTOMER' || user?.role === 'CUSTOMER_OPERATOR') return <CustomerKycPanel />;
  return <p className="pg-hint">{t('common.loading')}</p>;
}
