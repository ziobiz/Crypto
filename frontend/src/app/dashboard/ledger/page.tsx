'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthProvider';
import { useT } from '@/context/LocaleProvider';
import { api, LedgerSummary } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/format';
import { StatusBadge } from '@/components/StatusBadge';
import {
  MobileStackCard,
  MobileStackEmpty,
  MobileStackField,
  MobileStackFields,
  MobileStackList,
} from '@/components/layout/MobileStackList';

const CURRENCY_ORDER = ['USDT', 'KRW', 'USD', 'JPY', 'CNY', 'THB'];

function sortCurrencies(currencies: string[]): string[] {
  return [...currencies].sort((a, b) => {
    const ai = CURRENCY_ORDER.indexOf(a);
    const bi = CURRENCY_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

export default function LedgerPage() {
  const { user } = useAuth();
  const t = useT();
  const [ledger, setLedger] = useState<LedgerSummary | null>(null);
  const [orgs, setOrgs] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [orgId, setOrgId] = useState(user?.organization?.id ?? '');

  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN') {
      api.organizations().then((list) => {
        setOrgs(list);
        if (!orgId && list[0]) setOrgId(list[0].id);
      }).catch(console.error);
    }
  }, [user?.role]);

  useEffect(() => {
    const id = user?.role === 'SUPER_ADMIN' ? orgId : user?.organization?.id;
    if (!id) return;
    api.ledger(id).then(setLedger).catch(console.error);
  }, [user, orgId]);

  if (!ledger) return <p className="pg-hint">{t('common.loading')}</p>;

  const typeLabel = (type: string) =>
    type === 'USDT_PURCHASE' || type === 'USDT'
      ? t('ledger.type.usdt')
      : type === 'TRADE_ESCROW' || type === 'ESCROW'
        ? t('ledger.type.escrow')
        : type;

  const totalsByCurrency =
    ledger.totalsByCurrency ??
    (ledger.totalAmount > 0 ? { [ledger.currency]: ledger.totalAmount } : {});
  const byTicketType = ledger.byTicketType ?? {};
  const currencies = sortCurrencies(Object.keys(totalsByCurrency));
  const ticketTypes = Object.keys(byTicketType);

  function ticketLink(href?: string | null, ticketNo?: string) {
    if (!href || !ticketNo) return ticketNo ?? '—';
    return (
      <Link href={href} className="pg-link break-all">
        {ticketNo}
      </Link>
    );
  }

  return (
    <div className="pg-stack">
      {user?.role === 'SUPER_ADMIN' && orgs.length > 0 && (
        <label className="block max-w-sm">
          <span className="pg-label">{t('ledger.orgFilter')}</span>
          <select
            className="pg-input mt-1 w-full"
            value={orgId}
            onChange={(e) => setOrgId(e.target.value)}
          >
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>{o.code} {o.name}</option>
            ))}
          </select>
        </label>
      )}
      <div>
        <p className="mb-2 text-[13px] font-bold text-gray-700">{t('ledger.byCurrency')}</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {currencies.length === 0 ? (
            <div className="pg-stat">
              <p className="pg-stat-label">{t('ledger.currency.usdt')}</p>
              <p className="pg-stat-value">{formatCurrency(0, 'USDT')}</p>
            </div>
          ) : (
            currencies.map((cur) => (
              <div key={cur} className="pg-stat">
                <p className="pg-stat-label">{t('ledger.currencyTotal', { currency: cur })}</p>
                <p className="pg-stat-value">{formatCurrency(totalsByCurrency[cur] ?? 0, cur)}</p>
              </div>
            ))
          )}
          <div className="pg-stat">
            <p className="pg-stat-label">{t('dashboard.commissionCount')}</p>
            <p className="pg-stat-value">{ledger.count}</p>
          </div>
          <div className="pg-stat">
            <p className="pg-stat-label">{t('dashboard.pendingCommission')}</p>
            <p className="pg-stat-value">{formatCurrency(ledger.pendingUsdt ?? 0, 'USDT')}</p>
          </div>
        </div>
      </div>

      {ticketTypes.length > 0 && (
        <div className="pg-card pg-table-wrap hidden md:block">
          <p className="border-b border-gray-200 px-3 py-2 text-[13px] font-bold text-gray-700">
            {t('ledger.byType')}
          </p>
          <table className="pg-table">
            <thead>
              <tr>
                <th>{t('ledger.col.type')}</th>
                {currencies.map((cur) => (
                  <th key={cur}>{cur}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ticketTypes.map((tt) => (
                <tr key={tt}>
                  <td>{typeLabel(tt)}</td>
                  {currencies.map((cur) => (
                    <td key={cur}>
                      {byTicketType[tt]?.[cur]
                        ? formatCurrency(byTicketType[tt]![cur]!, cur)
                        : '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <MobileStackList>
        {ledger.entries.map((e) => (
          <MobileStackCard key={e.id} href={e.ticketHref ?? undefined}>
            <div className="flex items-start justify-between gap-2">
              <span className="pg-link break-all text-sm font-semibold">{e.ticketNo}</span>
              {e.ticketStatus && (
                <StatusBadge
                  status={e.ticketStatus}
                  kind={e.ticketType === 'USDT_PURCHASE' ? 'usdt' : 'escrow'}
                />
              )}
            </div>
            <MobileStackFields>
              <MobileStackField label={t('ledger.col.customer')}>
                {e.customerLabel ?? '—'}
              </MobileStackField>
              <MobileStackField label={t('ledger.col.trade')}>
                {e.tradeSummary ?? '—'}
              </MobileStackField>
              <MobileStackField label={t('ledger.col.fee')}>
                {formatCurrency(e.amount, e.currency)} ({e.ratePercent}%)
              </MobileStackField>
              <MobileStackField label={t('ledger.col.appliedAt')}>
                {e.appliedAt ? formatDate(e.appliedAt) : '—'}
              </MobileStackField>
              <MobileStackField label={t('ledger.col.settledAt')}>
                {formatDate(e.settledAt)}
              </MobileStackField>
            </MobileStackFields>
          </MobileStackCard>
        ))}
        {ledger.entries.length === 0 && <MobileStackEmpty>{t('ledger.empty')}</MobileStackEmpty>}
      </MobileStackList>

      <div className="pg-card pg-table-wrap hidden md:block">
        <table className="pg-table">
          <thead>
            <tr>
              <th>{t('ledger.col.appliedAt')}</th>
              <th>{t('ledger.col.settledAt')}</th>
              <th>{t('ledger.col.customer')}</th>
              <th>{t('ledger.col.trade')}</th>
              <th>{t('ledger.col.type')}</th>
              <th>{t('ledger.col.status')}</th>
              <th>{t('ledger.col.fee')}</th>
              <th>{t('ledger.col.rate')}</th>
              <th>{t('ledger.col.ticket')}</th>
            </tr>
          </thead>
          <tbody>
            {ledger.entries.map((e) => (
              <tr key={e.id}>
                <td className="pg-muted whitespace-nowrap text-xs">
                  {e.appliedAt ? formatDate(e.appliedAt) : '—'}
                </td>
                <td className="pg-muted whitespace-nowrap text-xs">{formatDate(e.settledAt)}</td>
                <td className="max-w-[10rem] truncate text-xs" title={e.customerLabel ?? ''}>
                  {e.customerLabel ?? '—'}
                </td>
                <td className="max-w-xs text-xs">{e.tradeSummary ?? '—'}</td>
                <td>{typeLabel(e.ticketType)}</td>
                <td className="text-xs">
                  {e.ticketStatus ? (
                    <StatusBadge
                      status={e.ticketStatus}
                      kind={e.ticketType === 'USDT_PURCHASE' ? 'usdt' : 'escrow'}
                    />
                  ) : (
                    '—'
                  )}
                </td>
                <td>{formatCurrency(e.amount, e.currency)}</td>
                <td>{e.ratePercent}%</td>
                <td>{ticketLink(e.ticketHref, e.ticketNo)}</td>
              </tr>
            ))}
            {ledger.entries.length === 0 && (
              <tr>
                <td colSpan={9} className="pg-empty">
                  {t('ledger.empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pg-card pg-table-wrap">
        <p className="border-b border-gray-200 px-3 py-2 text-[13px] font-bold text-gray-700">
          {t('ledger.pendingTitle')}
        </p>
        <MobileStackList>
          {(ledger.pendingLines ?? []).map((e) => (
            <MobileStackCard key={`${e.ticketNo}-${e.ticketType}`} href={e.ticketHref ?? undefined}>
              <span className="pg-link break-all text-sm font-semibold">{e.ticketNo}</span>
              <MobileStackFields>
                <MobileStackField label={t('ledger.col.customer')}>
                  {e.customerLabel ?? '—'}
                </MobileStackField>
                <MobileStackField label={t('ledger.col.trade')}>
                  {e.tradeSummary ?? '—'}
                </MobileStackField>
                <MobileStackField label={t('usdt.col.status')}>
                  {e.status}
                </MobileStackField>
                <MobileStackField label={t('ledger.col.fee')}>
                  {formatCurrency(e.amount, e.currency)} ({e.ratePercent}%)
                </MobileStackField>
              </MobileStackFields>
            </MobileStackCard>
          ))}
          {(ledger.pendingLines ?? []).length === 0 && (
            <MobileStackEmpty>{t('ledger.pendingEmpty')}</MobileStackEmpty>
          )}
        </MobileStackList>
        <table className="pg-table hidden md:table">
          <thead>
            <tr>
              <th>{t('ledger.col.ticket')}</th>
              <th>{t('ledger.col.customer')}</th>
              <th>{t('ledger.col.trade')}</th>
              <th>{t('ledger.col.type')}</th>
              <th>{t('ledger.col.status')}</th>
              <th>{t('ledger.col.fee')}</th>
              <th>{t('ledger.col.rate')}</th>
            </tr>
          </thead>
          <tbody>
            {(ledger.pendingLines ?? []).map((e) => (
              <tr key={`${e.ticketNo}-${e.ticketType}`}>
                <td>{ticketLink(e.ticketHref, e.ticketNo)}</td>
                <td className="max-w-[10rem] truncate text-xs">{e.customerLabel ?? '—'}</td>
                <td className="max-w-xs text-xs">{e.tradeSummary ?? '—'}</td>
                <td>{typeLabel(e.ticketType)}</td>
                <td className="pg-muted text-xs">{e.status}</td>
                <td>{formatCurrency(e.amount, e.currency)}</td>
                <td>{e.ratePercent}%</td>
              </tr>
            ))}
            {(ledger.pendingLines ?? []).length === 0 && (
              <tr>
                <td colSpan={7} className="pg-empty">{t('ledger.pendingEmpty')}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
