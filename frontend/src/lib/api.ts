import { getApiBaseUrl } from './api-base';

const API_URL = getApiBaseUrl();

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function setToken(token: string) {
  localStorage.setItem('token', token);
}

export function clearToken() {
  localStorage.removeItem('token');
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, err.error ?? 'Request failed', err.code);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (data: RegisterInput) =>
    request<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: () => request<MeResponse>('/api/auth/me'),

  dashboard: () => request<DashboardResponse>('/api/auth/dashboard'),

  salesOffices: () =>
    request<SalesOffice[]>('/api/organizations/sales-offices'),

  exchangeRate: () =>
    request<ExchangeRateResponse>('/api/tickets/usdt-purchase/exchange-rate'),

  wallets: {
    list: () => request<Wallet[]>('/api/wallets'),
    create: (data: WalletInput) =>
      request<Wallet>('/api/wallets', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<WalletInput>) =>
      request<Wallet>(`/api/wallets/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },

  usdt: {
    list: () => request<UsdtTicket[]>('/api/tickets/usdt-purchase'),
    get: (id: string) => request<UsdtTicket>(`/api/tickets/usdt-purchase/${id}`),
    create: (data: { fiatAmount: number; walletId: string; fiatCurrency?: string }) =>
      request<UsdtTicket>('/api/tickets/usdt-purchase', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateStatus: (
      id: string,
      data: { status: string; usdtTxId?: string; actualUsdtAmount?: number; adminNote?: string },
    ) =>
      request<UsdtTicket>(`/api/tickets/usdt-purchase/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    uploadDepositProof: (id: string, file: File) => {
      const form = new FormData();
      form.append('file', file);
      return request<UsdtTicket>(`/api/tickets/usdt-purchase/${id}/deposit-proof`, {
        method: 'POST',
        body: form,
      });
    },
  },

  escrow: {
    list: () => request<EscrowTicket[]>('/api/tickets/trade-escrow'),
    get: (id: string) => request<EscrowTicket>(`/api/tickets/trade-escrow/${id}`),
    create: (data: EscrowInput) =>
      request<EscrowTicket>('/api/tickets/trade-escrow', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateStatus: (
      id: string,
      data: { status: string; payoutTxId?: string; adminNote?: string },
    ) =>
      request<EscrowTicket>(`/api/tickets/trade-escrow/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    uploadBuyerDeposit: (id: string, file: File) => {
      const form = new FormData();
      form.append('file', file);
      return request<EscrowTicket>(`/api/tickets/trade-escrow/${id}/buyer-deposit-proof`, {
        method: 'POST',
        body: form,
      });
    },
    uploadSellerFulfillment: (id: string, file: File) => {
      const form = new FormData();
      form.append('file', file);
      return request<EscrowTicket>(
        `/api/tickets/trade-escrow/${id}/seller-fulfillment-proof`,
        { method: 'POST', body: form },
      );
    },
    buyerApproval: (id: string) =>
      request<EscrowTicket>(`/api/tickets/trade-escrow/${id}/buyer-approval`, {
        method: 'POST',
      }),
  },

  ledger: (organizationId?: string) =>
    request<LedgerSummary>(
      `/api/ledger${organizationId ? `?organizationId=${organizationId}` : ''}`,
    ),

  attachmentUrl: (id: string) => {
    const token = getToken();
    return `${API_URL}/api/attachments/${id}/file?token=${token}`;
  },
};

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'ORG_STAFF' | 'CUSTOMER';
  organization?: { id: string; name: string; type: string; path: string };
  customerProfile?: { id: string; customerType: string };
}

export interface MeResponse extends User {
  wallets: Wallet[];
  customerProfile?: {
    id: string;
    customerType: string;
    recruitingOrg?: { id: string; name: string; code: string };
  };
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  phone?: string;
  customerType: 'INDIVIDUAL' | 'CORPORATE';
  recruitingOrgId: string;
  businessName?: string;
  businessNumber?: string;
  representative?: string;
  businessAddress?: string;
  businessCategory?: string;
}

export interface SalesOffice {
  id: string;
  code: string;
  name: string;
}

export interface Wallet {
  id: string;
  label?: string;
  address: string;
  network: string;
  isDefault: boolean;
  gasFeeAmount: number;
  platformFeeAmount: number;
}

export interface WalletInput {
  label?: string;
  address: string;
  network?: string;
  isDefault?: boolean;
  gasFeeAmount?: number;
  platformFeeAmount?: number;
}

export interface ExchangeRateResponse {
  usdtKrwRate: number;
  source: string;
  fetchedAt: string;
  disclaimer: string;
}

export interface Attachment {
  id: string;
  purpose: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
}

export interface StatusHistory {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  note?: string;
  createdAt: string;
  changedBy: { id: string; name: string; role: string };
}

export interface UsdtTicket {
  id: string;
  ticketNo: string;
  type: string;
  status: string;
  fiatAmount: number;
  fiatCurrency: string;
  exchangeRate: number;
  expectedUsdtAmount: number;
  gasFeeSnapshot: number;
  platformFeeSnapshot: number;
  usdtTxId?: string;
  actualUsdtAmount?: number;
  adminNote?: string;
  commissionSettled: boolean;
  createdAt: string;
  attachments: Attachment[];
  statusHistory: StatusHistory[];
  wallet?: Wallet;
  customer?: { user: { name: string; email: string } };
}

export interface EscrowTicket {
  id: string;
  ticketNo: string;
  type: string;
  status: string;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  totalCommissionPool: number;
  payoutTxId?: string;
  adminNote?: string;
  commissionSettled: boolean;
  createdAt: string;
  buyer: { id: string; name: string; email: string };
  seller: { id: string; name: string; email: string };
  attachments: Attachment[];
  statusHistory: StatusHistory[];
}

export interface EscrowInput {
  sellerEmail: string;
  title: string;
  description?: string;
  amount: number;
  currency?: string;
}

export interface DashboardResponse {
  role: string;
  stats: Record<string, number>;
  organizationId?: string;
}

export interface LedgerSummary {
  organizationId: string;
  totalAmount: number;
  currency: string;
  count: number;
  entries: Array<{
    id: string;
    amount: number;
    ratePercent: number;
    baseAmount: number;
    ticketNo: string;
    ticketType: string;
    settledAt: string;
    description?: string;
  }>;
}

export const hqPolicyApi = {
  getAccess: () => request<HqAccessPayload>('/api/hq-policy/access'),
  saveAccess: (matrix: HqAccessMatrix) =>
    request<HqAccessPayload>('/api/hq-policy/access', {
      method: 'PUT',
      body: JSON.stringify({ matrix }),
    }),
  getOrgColumns: () => request<HqOrgColumnsPayload>('/api/hq-policy/org-columns'),
  saveOrgColumns: (config: HqOrgColumnConfig) =>
    request<HqOrgColumnsPayload>('/api/hq-policy/org-columns', {
      method: 'PUT',
      body: JSON.stringify({ config }),
    }),
  getCommission: () => request<HqCommissionPayload>('/api/hq-policy/commission'),
  saveCommissionRisk: (risk: HqCommissionRiskConfig) =>
    request<HqCommissionPayload>('/api/hq-policy/commission/risk', {
      method: 'PUT',
      body: JSON.stringify({ risk }),
    }),
  getPlatform: () => request<HqPlatformPayload>('/api/hq-policy/platform'),
  savePlatform: (config: HqPlatformConfig) =>
    request<HqPlatformPayload>('/api/hq-policy/platform', {
      method: 'PUT',
      body: JSON.stringify({ config }),
    }),
};

export type HqPermissionLevel = 'NONE' | 'VIEW' | 'MODIFY' | 'DELETE';

export type HqAccessMatrix = Record<string, Record<string, HqPermissionLevel>>;

export interface HqAccessPayload {
  pages: { path: string; label: string; group: string }[];
  orgLevels: string[];
  permissionLevels: HqPermissionLevel[];
  matrix: HqAccessMatrix;
}

export interface HqOrgColumnsPayload {
  catalog: Record<string, { key: string; label: string; fixed?: boolean }[]>;
  orgLevels: string[];
  config: HqOrgColumnConfig;
}

export type HqOrgColumnConfig = Record<
  string,
  Record<string, { allowedKeys: string[]; order: string[] }>
>;

export interface HqCommissionRiskConfig {
  defaultGasFeeUsdt: number;
  defaultPlatformFeeUsdt: number;
  maxTicketAmountKrw: number;
  riskEnabled: boolean;
  maxDailyTicketsPerCustomer: number;
  notes?: string;
}

export interface HqCommissionPayload {
  risk: HqCommissionRiskConfig;
  rates: Array<{
    id: string;
    ticketType: string;
    ratePercent: string;
    organization: { id: string; code: string; name: string; type: string };
  }>;
}

export interface HqPlatformConfig {
  primaryDomain: string;
  apiPublicUrl: string;
  corsOrigins: string[];
  sslCertPath?: string;
  redirectRootToPrimary: boolean;
}

export interface HqPlatformPayload {
  config: HqPlatformConfig;
  ssl: { status: string; detail: string; daysRemaining: number | null; notAfter?: string };
  server: {
    hostname: string;
    uptimeSec: number;
    memTotalMb: number;
    memFreeMb: number;
    loadAvg: number[];
  };
  pm2: unknown[];
}
