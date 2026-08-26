'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from '@/context/LocaleProvider';

/** 수수료관리는 고객별 배분으로 이전 — 고객관리로 이동 */
export default function OrgFeesRedirectPage() {
  const router = useRouter();
  const t = useT();
  useEffect(() => {
    router.replace('/dashboard/customers');
  }, [router]);
  return <p className="pg-hint">{t('common.loading')}</p>;
}
