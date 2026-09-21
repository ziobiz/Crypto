'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function InvoicesIndexPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard/invoices/live');
  }, [router]);
  return null;
}
