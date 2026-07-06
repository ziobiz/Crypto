'use client';

const OTP_INPUT_CLASS =
  'w-full rounded-lg border px-3 py-3 text-center text-2xl tracking-widest';

export function OtpCodeInput({
  value,
  onChange,
  onComplete,
  disabled,
  className = OTP_INPUT_CLASS,
}: {
  value: string;
  onChange: (value: string) => void;
  onComplete: (code: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
    onChange(digits);
    if (digits.length === 6 && !disabled) {
      onComplete(digits);
    }
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={6}
      value={value}
      onChange={handleChange}
      disabled={disabled}
      className={className}
      placeholder="000000"
      required
    />
  );
}
