'use client';

import { useState } from 'react';

type CopyButtonProps = {
  text: string;
  label: string;
  copiedLabel: string;
  className?: string;
};

/** Clipboard copy with brief “copied” feedback */
export function CopyButton({ text, label, copiedLabel, className = '' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  if (!text) return null;

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      className={
        className ||
        'shrink-0 rounded border border-slate-300 bg-white px-2 py-0.5 text-[11px] font-semibold hover:bg-slate-50'
      }
      onClick={() => void onCopy()}
    >
      {copied ? copiedLabel : label}
    </button>
  );
}

type CopyableMonoProps = {
  value?: string | null;
  copyLabel: string;
  copiedLabel: string;
  strong?: boolean;
};

export function CopyableMono({
  value,
  copyLabel,
  copiedLabel,
  strong = false,
}: CopyableMonoProps) {
  const text = (value ?? '').trim();
  return (
    <dd className="flex flex-wrap items-center gap-2">
      <span className={`font-mono tracking-wide ${strong ? 'font-semibold' : ''}`}>
        {text || '—'}
      </span>
      {text ? <CopyButton text={text} label={copyLabel} copiedLabel={copiedLabel} /> : null}
    </dd>
  );
}
