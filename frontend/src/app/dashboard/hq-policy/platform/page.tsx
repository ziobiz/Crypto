'use client';

import { useEffect, useState } from 'react';
import { hqPolicyApi, type HqPlatformConfig, type HqPlatformPayload } from '@/lib/api';

export default function HqPlatformPage() {
  const [data, setData] = useState<HqPlatformPayload | null>(null);
  const [config, setConfig] = useState<HqPlatformConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    hqPolicyApi
      .getPlatform()
      .then((d) => {
        setData(d);
        setConfig(d.config);
      })
      .catch((e) => setError(e instanceof Error ? e.message : '불러오기 실패'));
  }, []);

  async function save() {
    if (!config) return;
    setSaving(true);
    setMsg('');
    try {
      const next = await hqPolicyApi.savePlatform(config);
      setData(next);
      setConfig(next.config);
      setMsg('저장되었습니다. CORS·프론트 env 반영 후 재빌드가 필요할 수 있습니다.');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : '저장 실패');
    } finally {
      setSaving(false);
    }
  }

  if (error) {
    return <p className="text-sm text-red-600">{error} — 백엔드 재배포 후 pm2 restart crypto-api</p>;
  }

  if (!data || !config) return <p className="text-sm text-gray-500">불러오는 중…</p>;

  const ssl = data.ssl;

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">도메인 · SSL · 서버</h2>
        <p className="text-sm text-gray-500">PG 「본사정책 → 플랫폼」— 메인 도메인 api.tinpass.com</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-gray-600">메인 도메인</span>
            <input
              value={config.primaryDomain}
              onChange={(e) => setConfig({ ...config, primaryDomain: e.target.value })}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-gray-600">공개 API URL</span>
            <input
              value={config.apiPublicUrl}
              onChange={(e) => setConfig({ ...config, apiPublicUrl: e.target.value })}
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-gray-600">CORS Origins (쉼표 구분)</span>
            <input
              value={config.corsOrigins.join(', ')}
              onChange={(e) =>
                setConfig({
                  ...config,
                  corsOrigins: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                })
              }
              className="mt-1 w-full rounded-lg border px-3 py-2"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="text-gray-600">SSL 인증서 경로 (PEM)</span>
            <input
              value={config.sslCertPath ?? ''}
              onChange={(e) => setConfig({ ...config, sslCertPath: e.target.value })}
              className="mt-1 w-full rounded-lg border px-3 py-2 font-mono text-xs"
            />
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={config.redirectRootToPrimary}
            onChange={(e) => setConfig({ ...config, redirectRootToPrimary: e.target.checked })}
          />
          tinpass.com → 메인 도메인 리다이렉트
        </label>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? '저장 중…' : '플랫폼 설정 저장'}
        </button>
        {msg && <p className="text-sm text-gray-600">{msg}</p>}
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="font-medium text-gray-900">SSL 상태</h3>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">상태</dt>
              <dd className="font-medium">{ssl.status}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">만료</dt>
              <dd>{ssl.detail}</dd>
            </div>
            {ssl.daysRemaining != null && (
              <div className="flex justify-between">
                <dt className="text-gray-500">남은 일수</dt>
                <dd className={ssl.daysRemaining < 30 ? 'text-amber-600 font-medium' : ''}>
                  {ssl.daysRemaining}일
                </dd>
              </div>
            )}
          </dl>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="font-medium text-gray-900">서버</h3>
          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">호스트</dt>
              <dd>{data.server.hostname}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">메모리</dt>
              <dd>
                {data.server.memFreeMb} / {data.server.memTotalMb} MB free
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Load</dt>
              <dd>{data.server.loadAvg.map((n) => n.toFixed(2)).join(', ')}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
        <p className="font-medium text-gray-800">Let&apos;s Encrypt (서버 SSH)</p>
        <pre className="mt-2 overflow-x-auto rounded bg-white p-3 text-xs">
{`apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d api.tinpass.com -d tinpass.com -d www.tinpass.com`}
        </pre>
      </section>
    </div>
  );
}
