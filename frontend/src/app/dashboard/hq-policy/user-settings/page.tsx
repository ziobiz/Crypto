'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useT } from '@/context/LocaleProvider';
import { hqPolicyApi, type HqPlatformPayload } from '@/lib/api';

export default function HqUserSettingsPage() {
  const t = useT();
  const [platform, setPlatform] = useState<HqPlatformPayload | null>(null);

  useEffect(() => {
    hqPolicyApi.getPlatform().then(setPlatform).catch(console.error);
  }, []);

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-lg font-semibold">{t('hq.sub.access.userSettings')}</h2>
      <p className="text-sm text-gray-600">{t('hq.userSettings.desc')}</p>

      <div className="pg-section pg-section-pad text-sm space-y-3">
        <p><strong>{t('hq.userSettings.passwordPolicy')}</strong></p>
        <p className="text-gray-600">{t('hq.userSettings.passwordPolicyDesc')}</p>
        <p><strong>{t('hq.userSettings.otpPolicy')}</strong></p>
        <p className="text-gray-600">
          {platform?.email?.otpEnabled
            ? t('hq.userSettings.otpAllOn')
            : t('hq.userSettings.otpRoleBased')}
        </p>
        {platform?.email && (
          <ul className="list-disc pl-5 text-gray-600">
            <li>{t('hq.userSettings.otpExpire', { min: platform.email.otpExpireMinutes ?? 5 })}</li>
            <li>{t('hq.userSettings.idleTimeout')}</li>
            <li>{t('hq.userSettings.tradeReceipt')}</li>
          </ul>
        )}
        <Link
          href="/dashboard/hq-policy/platform"
          className="inline-block mt-2 text-blue-600 hover:underline"
        >
          {t('hq.userSettings.gotoPlatform')}
        </Link>
      </div>
    </div>
  );
}
