'use client';

import { useId, useRef } from 'react';
import { useT } from '@/context/LocaleProvider';

type LocalizedFileInputProps = {
  accept?: string;
  multiple?: boolean;
  className?: string;
  files?: File[];
  onFiles: (files: File[]) => void;
};

export function LocalizedFileInput({
  accept,
  multiple,
  className,
  files,
  onFiles,
}: LocalizedFileInputProps) {
  const t = useT();
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const list = files ?? [];
  const summary =
    list.length === 0
      ? t('common.noFile')
      : list.length === 1
        ? list[0].name
        : t('common.filesSelected', { count: String(list.length) });

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ''}`}>
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(e) => {
          onFiles(Array.from(e.target.files ?? []));
        }}
      />
      <button
        type="button"
        className="pg-btn pg-btn-secondary text-sm"
        onClick={() => inputRef.current?.click()}
      >
        {t('common.chooseFile')}
      </button>
      <span className="text-sm text-gray-600">{summary}</span>
    </div>
  );
}
