'use client';

import { useT } from '@/context/LocaleProvider';
import type { FeeMode, TransactionFees } from '@/lib/api';
import { PolicyNumberInput } from '@/components/policy/PolicyNumberInput';
import { PolicyCellValue } from '@/components/policy/PolicyCellValue';
import {
  feeFixedField,
  feeModeField,
  feePercentField,
  formatFeeComponentLabel,
  readFeeComponent,
  type FeeComponentKey,
} from '@/lib/fee-component';

type FeeDualInputProps = {
  feeKey: FeeComponentKey;
  fees: Partial<TransactionFees>;
  editing: boolean;
  onChange: (patch: Partial<TransactionFees>) => void;
};

export function FeeDualInput({ feeKey, fees, editing, onChange }: FeeDualInputProps) {
  const t = useT();
  const component = readFeeComponent(fees, feeKey);
  const modeField = feeModeField(feeKey);
  const percentField = feePercentField(feeKey);
  const fixedField = feeFixedField(feeKey);

  if (!editing) {
    return <PolicyCellValue>{formatFeeComponentLabel(fees, feeKey)}</PolicyCellValue>;
  }

  return (
    <div className="min-w-[9rem] space-y-1">
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => onChange({ [modeField]: 'percent' })}
          className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
            component.mode === 'percent' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          {t('hq.commission.feeModePercent')}
        </button>
        <button
          type="button"
          onClick={() => onChange({ [modeField]: 'fixed' })}
          className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
            component.mode === 'fixed' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          {t('hq.commission.feeModeFixed')}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-1">
        <PolicyNumberInput
          min={0}
          max={100}
          value={component.percent}
          onChange={(percent) => onChange({ [percentField]: percent, [modeField]: 'percent' })}
          className={`pg-input w-full text-xs ${component.mode === 'percent' ? '' : 'opacity-50'}`}
        />
        <PolicyNumberInput
          min={0}
          value={component.fixedUsdt}
          onChange={(fixedUsdt) => onChange({ [fixedField]: fixedUsdt, [modeField]: 'fixed' })}
          className={`pg-input w-full text-xs ${component.mode === 'fixed' ? '' : 'opacity-50'}`}
        />
      </div>
    </div>
  );
}
