'use client';

import { useEffect, useState } from 'react';
import { getToken } from '@/lib/api';
import { getApiBaseUrl } from '@/lib/api-base';

const API_URL = getApiBaseUrl();

export function KycFileLink({
  id,
  fileName,
  purposeLabel,
}: {
  id: string;
  fileName: string;
  purposeLabel: string;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    fetch(`${API_URL}/api/kyc/attachments/${id}/file`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.blob())
      .then((blob) => setUrl(URL.createObjectURL(blob)))
      .catch(console.error);
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [id]);

  if (!url) return <span className="text-sm text-gray-500">{fileName}</span>;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="pg-link text-sm">
      {purposeLabel} · {fileName}
    </a>
  );
}
