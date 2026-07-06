'use client';

import type { ReactNode } from 'react';
import { getApiBaseUrl } from '@/lib/api-base';

type BrandAssetKey = 'authLogo' | 'logo' | 'favicon' | 'background';

export function brandPreviewUrl(path: string | undefined, cacheBust: number): string | null {
  if (!path) return null;
  const base = path.split('?')[0];
  return `${getApiBaseUrl()}${base}?v=${cacheBust}`;
}

export function BrandAssetField({
  label,
  desc,
  url,
  cacheBust,
  accept,
  uploading,
  uploadLabel,
  savingLabel,
  uploadedLabel,
  showUploaded,
  onUpload,
  preview,
}: {
  label: string;
  desc?: string;
  url?: string;
  cacheBust: number;
  accept: string;
  uploading: boolean;
  uploadLabel: string;
  savingLabel: string;
  uploadedLabel: string;
  showUploaded: boolean;
  onUpload: (file: File) => void;
  preview: (src: string) => ReactNode;
}) {
  const src = brandPreviewUrl(url, cacheBust);

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">{label}</p>
      <div className="min-h-[3.5rem] rounded-lg border border-gray-200 bg-gray-50 p-2">
        {src ? (
          preview(src)
        ) : (
          <p className="flex h-12 items-center justify-center text-xs text-gray-400">—</p>
        )}
      </div>
      {showUploaded && (
        <p className="text-xs font-medium text-green-600">{uploadedLabel}</p>
      )}
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50">
        <input
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) onUpload(f);
          }}
        />
        {uploading ? savingLabel : uploadLabel}
      </label>
      {desc ? <p className="text-xs text-gray-500">{desc}</p> : null}
    </div>
  );
}

export type { BrandAssetKey };
