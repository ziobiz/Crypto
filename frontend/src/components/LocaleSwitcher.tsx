'use client';

import { LocaleBar } from '@/components/layout/LocaleBar';

/** @deprecated LocaleBar 사용 */
export function LocaleSwitcher({ compact }: { compact?: boolean }) {
  return <LocaleBar className={compact ? 'scale-95' : ''} />;
}
