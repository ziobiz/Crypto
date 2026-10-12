'use client';

import Link from 'next/link';
import { useT } from '@/context/LocaleProvider';

/** 검증관리 — ICOPAY 크립토 멤버십 연동 슬롯 (멤버십관리와 연계) */
export default function HqMembershipCryptoOpsPage() {
  const t = useT();
  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-slate-900">
        {t('paidMembership.ops.cryptoTitle')}
      </h2>
      <p className="pg-hint text-sm">{t('paidMembership.ops.cryptoDesc')}</p>
      <ul className="list-disc space-y-2 pl-5 text-sm text-slate-700">
        <li>{t('paidMembership.ops.cryptoStep1')}</li>
        <li>{t('paidMembership.ops.cryptoStep2')}</li>
        <li>{t('paidMembership.ops.cryptoStep3')}</li>
        <li>{t('paidMembership.ops.cryptoStep4')}</li>
      </ul>
      <p className="pg-callout pg-callout-muted text-xs">{t('paidMembership.ops.cryptoNote')}</p>
      <p className="text-sm">
        <Link className="pg-link font-semibold" href="/dashboard/membership-admin/payments">
          {t('nav.membershipAdmin')} → {t('membershipAdmin.tab.payments')}
        </Link>
      </p>
    </div>
  );
}
