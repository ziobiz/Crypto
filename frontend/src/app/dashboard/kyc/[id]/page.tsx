'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { useT } from '@/context/LocaleProvider';
import { api } from '@/lib/api';

export default function HqKycDetailRedirectPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const t = useT();
  const router = useRouter();

  useEffect(() => {
    if (user?.role === 'CUSTOMER') return;
    api.kyc
      .get(id)
      .then((kyc) => router.replace(`/dashboard/customers/${kyc.userId}`))
      .catch(() => router.replace('/dashboard/customers'));
  }, [id, user, router]);

  if (user?.role === 'CUSTOMER') {
    return <p className="pg-hint">{t('kyc.hqOnly')}</p>;
  }
  return <p className="pg-hint">{t('common.loading')}</p>;
}
