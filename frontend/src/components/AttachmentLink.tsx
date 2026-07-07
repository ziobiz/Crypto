'use client';

import { useEffect, useState } from 'react';
import { Attachment } from '@/lib/api';
import { useT } from '@/context/LocaleProvider';
import type { MessageKey } from '@/i18n/messages';
import { getApiBaseUrl } from '@/lib/api-base';

const API_URL = getApiBaseUrl();

const PURPOSE_KEYS: Record<string, MessageKey> = {
  CONTRACT_DOCUMENT: 'attachment.CONTRACT_DOCUMENT',
  FIAT_DEPOSIT_RECEIPT: 'attachment.FIAT_DEPOSIT_RECEIPT',
  USDT_TRANSFER_PROOF: 'attachment.USDT_TRANSFER_PROOF',
  SHIPPING_PROOF: 'attachment.SHIPPING_PROOF',
  OTHER: 'attachment.OTHER',
};

export function AttachmentLink({ attachment }: { attachment: Attachment }) {
  const t = useT();
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_URL}/api/attachments/${attachment.id}/file`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.blob())
      .then((blob) => setUrl(URL.createObjectURL(blob)))
      .catch(console.error);

    return () => { if (url) URL.revokeObjectURL(url); };
  }, [attachment.id]);

  const purposeKey = PURPOSE_KEYS[attachment.purpose];
  const purposeLabel = purposeKey ? t(purposeKey) : attachment.purpose;

  if (!url) return <span className="text-sm text-gray-500">{attachment.fileName}</span>;

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
      {attachment.fileName} ({purposeLabel})
    </a>
  );
}
