'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from '@/context/LocaleProvider';

/** Legacy org-fees path → customer fee management */
export default function OrgFeesRedirectPage() {
  const router = useRouter();
  const t = useT();
  useEffect(() => {
    router.replace('/dashboard/customers/fees');
  }, [router]);
  return <p className="pg-hint">{t('common.loading')}</p>;
}
