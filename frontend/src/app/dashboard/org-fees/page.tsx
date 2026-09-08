'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from '@/context/LocaleProvider';

/** 수수료관리는 고객 허브 수수료 페이지로 이전 */
export default function OrgFeesRedirectPage() {
  const router = useRouter();
  const t = useT();
  useEffect(() => {
    router.replace('/dashboard/customers/fees');
  }, [router]);
  return <p className="pg-hint">{t('common.loading')}</p>;
}
