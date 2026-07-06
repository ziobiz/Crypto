'use client';

import { useEffect, useState } from 'react';
import { Attachment } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export function AttachmentLink({ attachment }: { attachment: Attachment }) {
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

  if (!url) return <span className="text-sm text-gray-500">{attachment.fileName}</span>;

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
      {attachment.fileName} ({attachment.purpose})
    </a>
  );
}
