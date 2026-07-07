import type { MessageKey } from './messages';

/** HQ 접근·권한 화면 — API page.label 대신 i18n */
export const HQ_PAGE_PATH_KEYS: Record<string, MessageKey> = {
  '/dashboard': 'hq.page.dashboard',
  '/dashboard/usdt': 'hq.page.usdt',
  '/dashboard/escrow': 'hq.page.escrow',
  '/dashboard/ledger': 'hq.page.ledger',
  '/dashboard/wallets': 'hq.page.wallets',
  '/dashboard/users': 'hq.page.users',
  '/dashboard/hq-policy/access': 'hq.page.access',
  '/dashboard/hq-policy/org-columns': 'hq.page.orgColumns',
  '/dashboard/hq-policy/commission': 'hq.page.commission',
  '/dashboard/hq-policy/platform': 'hq.page.platform',
  '/dashboard/hq-policy/ops': 'hq.page.ops',
};

export function hqPageLabelKey(path: string): MessageKey | null {
  return HQ_PAGE_PATH_KEYS[path] ?? null;
}

export function permissionLabelKey(level: string): MessageKey {
  return `permission.${level}` as MessageKey;
}

const HQ_COLUMN_KEYS: Record<string, Record<string, MessageKey>> = {
  '/dashboard/usdt': {
    ticketNo: 'usdt.col.ticketNo',
    status: 'usdt.col.status',
    customer: 'usdt.col.customer',
    amount: 'usdt.col.amount',
    currency: 'usdt.col.currency',
    createdAt: 'usdt.col.date',
    updatedAt: 'common.updatedAt',
  },
  '/dashboard/escrow': {
    ticketNo: 'usdt.col.ticketNo',
    status: 'usdt.col.status',
    buyer: 'escrow.detail.buyer',
    seller: 'escrow.detail.seller',
    amount: 'usdt.col.amount',
    commissionPool: 'escrow.detail.commissionPool',
    createdAt: 'escrow.col.createdAt',
  },
  '/dashboard/ledger': {
    settledAt: 'ledger.col.settledAt',
    organization: 'users.col.org',
    amount: 'ledger.col.fee',
    ratePercent: 'ledger.col.rate',
    ticketNo: 'ledger.col.ticket',
  },
};

export function hqColumnLabelKey(pagePath: string, columnKey: string): MessageKey | null {
  return HQ_COLUMN_KEYS[pagePath]?.[columnKey] ?? null;
}
