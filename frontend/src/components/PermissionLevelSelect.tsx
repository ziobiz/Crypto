'use client';

import type { HqPermissionLevel } from '@/lib/api';
import { useT } from '@/context/LocaleProvider';
import { permissionLabelKey } from '@/i18n/page-paths';

const LEVEL_CLASS: Record<HqPermissionLevel, string> = {
  NONE: 'pg-perm-select pg-perm-none',
  VIEW: 'pg-perm-select pg-perm-view',
  MODIFY: 'pg-perm-select pg-perm-modify',
  DELETE: 'pg-perm-select pg-perm-delete',
};

export function PermissionLevelSelect({
  value,
  levels,
  onChange,
  disabled,
  className = '',
}: {
  value: HqPermissionLevel;
  levels: readonly HqPermissionLevel[] | HqPermissionLevel[];
  onChange: (v: HqPermissionLevel) => void;
  disabled?: boolean;
  className?: string;
}) {
  const t = useT();
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as HqPermissionLevel)}
      className={`${LEVEL_CLASS[value] ?? LEVEL_CLASS.NONE} ${className}`}
    >
      {levels.map((lv) => (
        <option key={lv} value={lv}>
          {t(permissionLabelKey(lv))}
        </option>
      ))}
    </select>
  );
}
