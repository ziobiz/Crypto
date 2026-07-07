'use client';

import { useEffect, useState } from 'react';
import { formatAmountInput, parseAmountInput } from '@/lib/format';

type FormattedAmountInputProps = {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  min?: number;
  placeholder?: string;
  /** true면 blur 시에만 onChange 호출 (테이블 정렬 등으로 포커스가 튀는 경우) */
  commitOnBlur?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
};

/** 천 단위 콤마 — number 스피너·휠 증감 없음 */
export function FormattedAmountInput({
  value,
  onChange,
  className,
  min = 0,
  placeholder,
  commitOnBlur = false,
  disabled = false,
  readOnly = false,
}: FormattedAmountInputProps) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    if (!focused) {
      setDraft(formatAmountInput(value));
    }
  }, [value, focused]);

  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="off"
      placeholder={placeholder}
      className={className}
      disabled={disabled}
      readOnly={readOnly}
      value={focused ? draft : formatAmountInput(value)}
      onFocus={() => {
        if (disabled || readOnly) return;
        setFocused(true);
        setDraft(value > 0 ? formatAmountInput(value) : '');
      }}
      onBlur={() => {
        if (disabled || readOnly) return;
        setFocused(false);
        const next = Math.max(min, parseAmountInput(draft));
        onChange(next);
        setDraft(formatAmountInput(next));
      }}
      onChange={(e) => {
        if (disabled || readOnly) return;
        const digits = e.target.value.replace(/[^\d]/g, '');
        const formatted = digits ? formatAmountInput(Number(digits)) : '';
        setDraft(formatted);
        if (!commitOnBlur) {
          onChange(Math.max(min, digits ? Number(digits) : 0));
        }
      }}
      onWheel={(e) => {
        e.preventDefault();
        e.currentTarget.blur();
      }}
      onKeyDown={(e) => {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
        }
      }}
    />
  );
}
