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

export type LoginResponse =
  | { token: string; user: User }
  | {
      otpRequired: true;
      otpToken: string;
      otpMethod: 'totp';
      maskedEmail: string;
    }
  | { mustChangePassword: true; changeToken: string; email: string }
  | {
      mustSetupOtp: true;
      enrollToken: string;
      maskedEmail: string;
      smtpConfigured?: boolean;
    };

export const api = {
  branding: () => request<BrandingResponse>('/api/branding'),

  login: (email: string, password: string) =>
    request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  verifyOtp: (otpToken: string, code: string) =>
    request<{ token: string; user: User }>('/api/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify({ otpToken, code }),
    }),

  changePassword: (changeToken: string, newPassword: string, confirmPassword: string) =>
    request<LoginResponse>('/api/auth/password/change', {
      method: 'POST',
      body: JSON.stringify({ changeToken, newPassword, confirmPassword }),
    }),

  otpEnrollSendEmail: (enrollToken: string) =>
    request<{ ok: boolean; maskedEmail: string; smtpConfigured?: boolean }>(
      '/api/auth/otp/enroll/send-email',
      { method: 'POST', body: JSON.stringify({ enrollToken }) },
    ),

  otpEnrollVerifyEmail: (enrollToken: string, code: string) =>
    request<{ secret: string; otpauthUrl: string; enrollToken: string }>(
      '/api/auth/otp/enroll/verify-email',
      { method: 'POST', body: JSON.stringify({ enrollToken, code }) },
    ),

  otpEnrollActivate: (enrollToken: string, code: string) =>
    request<{ token: string; user: User }>('/api/auth/otp/enroll/activate', {
      method: 'POST',
      body: JSON.stringify({ enrollToken, code }),
    }),

  registerSendCode: (email: string, name: string) =>
    request<{ ok: boolean }>('/api/auth/register/send-code', {
      method: 'POST',
      body: JSON.stringify({ email, name }),
    }),

  register: (data: RegisterInput) =>
    request<{ ok: boolean; message: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: () => request<MeResponse>('/api/auth/me'),

  dashboard: () => request<DashboardResponse>('/api/auth/dashboard'),

  sessionInfo: () => request<{ ip: string; serverTime: string }>('/api/auth/session-info'),

  salesOffices: () =>
    request<SalesOffice[]>('/api/organizations/sales-offices'),

  organizations: () => request<Organization[]>('/api/organizations'),

  users: {
    list: (params?: UserListParams) => {
      const q = new URLSearchParams();
      if (params?.role) q.set('role', params.role);
      if (params?.organizationId) q.set('organizationId', params.organizationId);
      if (params?.search) q.set('search', params.search);
      if (params?.isActive !== undefined) q.set('isActive', String(params.isActive));
      if (params?.page) q.set('page', String(params.page));
      const qs = q.toString();
      return request<UserListResponse>(`/api/users${qs ? `?${qs}` : ''}`);
    },
    get: (id: string) => request<ManagedUser>(`/api/users/${id}`),
    create: (data: CreateUserInput) =>
      request<ManagedUser>('/api/users', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: UpdateUserInput) =>
      request<ManagedUser>(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    resetPassword: (id: string, password: string) =>
      request<{ ok: boolean }>(`/api/users/${id}/password`, {
        method: 'PATCH',
        body: JSON.stringify({ password }),
      }),
  },

  exchangeRate: () =>
    request<ExchangeRateResponse>('/api/tickets/usdt-purchase/exchange-rate'),

  exchangeRatesAll: () =>
    request<AllExchangeRatesResponse>('/api/tickets/usdt-purchase/exchange-rate?all=true'),

  exchangeRateFor: (currency: string) =>
    request<ExchangeRateResponse>(`/api/tickets/usdt-purchase/exchange-rate?currency=${currency}`),

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
    uploadDepositProof: (
      id: string,
      file: File,
      meta?: { depositAmount?: number; depositorName?: string; depositTransferredAt?: string },
    ) => {
      const form = new FormData();
      form.append('file', file);
      if (meta?.depositAmount != null) form.append('depositAmount', String(meta.depositAmount));
      if (meta?.depositorName) form.append('depositorName', meta.depositorName);
      if (meta?.depositTransferredAt) form.append('depositTransferredAt', meta.depositTransferredAt);
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
  totpEnabled?: boolean;
  passwordMustChange?: boolean;
  wallets: Wallet[];
  customerProfile?: {
    id: string;
    customerType: string;
    recruitingOrg?: { id: string; name: string; code: string };
  };
}

export interface RegisterInput {
  email: string;
  emailCode: string;
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

export interface Organization {
  id: string;
  code: string;
  name: string;
  type: string;
  path?: string;
}

export type UserRoleType = 'SUPER_ADMIN' | 'ORG_STAFF' | 'CUSTOMER';

export interface ManagedUser {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: UserRoleType;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  organization?: { id: string; code: string; name: string; type: string; path: string } | null;
  customerProfile?: {
    id: string;
    customerType: string;
    businessName?: string | null;
    recruitingOrg?: { id: string; code: string; name: string };
  } | null;
}

export interface UserListParams {
  role?: UserRoleType;
  organizationId?: string;
  search?: string;
  isActive?: boolean;
  page?: number;
}

export interface UserListResponse {
  items: ManagedUser[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: UserRoleType;
  organizationId?: string;
  customerType?: 'INDIVIDUAL' | 'CORPORATE';
  recruitingOrgId?: string;
  businessName?: string;
  businessNumber?: string;
}

export interface UpdateUserInput {
  name?: string;
  phone?: string | null;
  role?: UserRoleType;
  organizationId?: string | null;
  isActive?: boolean;
  recruitingOrgId?: string;
}

export interface Wallet {
  id: string;
  label?: string;
  address: string;
  network: string;
  isDefault: boolean;
  fxFeePercent: number;
  gasFeeAmount: number;
  transferFeeAmount: number;
  otherFeeAmount: number;
  platformFeeAmount: number;
  effectiveFees?: {
    fxFeePercent: number;
    gasFeeUsdt: number;
    transferFeeUsdt: number;
    otherFeeUsdt: number;
  };
}

export interface WalletInput {
  label?: string;
  address: string;
  network?: string;
  isDefault?: boolean;
  fxFeePercent?: number;
  gasFeeAmount?: number;
  transferFeeAmount?: number;
  otherFeeAmount?: number;
  platformFeeAmount?: number;
}

export interface ExchangeRateResponse {
  currency?: string;
  usdtFiatRate?: number;
  usdtKrwRate: number;
  source: string;
  fetchedAt: string;
  disclaimer: string;
}

export interface AllExchangeRatesResponse {
  rates: Record<string, { rate: number; label: string }>;
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
  expectedUsdtMin?: number | null;
  expectedUsdtMax?: number | null;
  depositAmount?: number | null;
  depositorName?: string | null;
  depositTransferredAt?: string | null;
  gasFeeSnapshot: number;
  fxFeePercentSnapshot: number;
  transferFeeSnapshot: number;
  otherFeeSnapshot: number;
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
  saveCommissionRates: (
    rates: Array<{ organizationId: string; ticketType: string; ratePercent: number }>,
  ) =>
    request<HqCommissionPayload>('/api/hq-policy/commission/rates', {
      method: 'PUT',
      body: JSON.stringify({ rates }),
    }),
  getPlatform: () => request<HqPlatformPayload>('/api/hq-policy/platform'),
  savePlatform: (config: HqPlatformConfig) =>
    request<HqPlatformPayload>('/api/hq-policy/platform', {
      method: 'PUT',
      body: JSON.stringify({ config }),
    }),
  savePlatformEmail: (email: HqEmailOtpConfig) =>
    request<HqPlatformPayload>('/api/hq-policy/platform/email', {
      method: 'PUT',
      body: JSON.stringify({ email }),
    }),
  sendPlatformEmailTest: (to: string) =>
    request<{ ok: boolean }>('/api/hq-policy/platform/email/test', {
      method: 'POST',
      body: JSON.stringify({ to }),
    }),
  uploadPlatformLogo: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<HqPlatformPayload>('/api/hq-policy/platform/logo', {
      method: 'POST',
      body: form,
    });
  },
  uploadPlatformAuthLogo: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<HqPlatformPayload>('/api/hq-policy/platform/auth-logo', {
      method: 'POST',
      body: form,
    });
  },
  uploadPlatformFavicon: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<HqPlatformPayload>('/api/hq-policy/platform/favicon', {
      method: 'POST',
      body: form,
    });
  },
  uploadPlatformBackground: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<HqPlatformPayload>('/api/hq-policy/platform/background', {
      method: 'POST',
      body: form,
    });
  },
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
  defaultFxFeePercent: number;
  defaultGasFeeUsdt: number;
  defaultTransferFeeUsdt: number;
  defaultOtherFeeUsdt: number;
  maxTicketAmountKrw: number;
  riskEnabled: boolean;
  maxDailyTicketsPerCustomer: number;
  notes?: string;
  defaultPlatformFeeUsdt?: number;
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

export interface BrandingResponse {
  siteName: string;
  logoUrl: string | null;
  authLogoUrl: string | null;
  faviconUrl: string | null;
  authBackgroundUrl: string | null;
  authMainText: string;
  footerText: string;
  loginNoticeEnabled: boolean;
  loginNoticeI18n: Partial<
    Record<'KR' | 'JP' | 'US' | 'CH' | 'TH', { title: string; body: string }>
  >;
}

export interface HqPlatformConfig {
  primaryDomain: string;
  apiPublicUrl: string;
  corsOrigins: string[];
  sslCertPath?: string;
  redirectRootToPrimary: boolean;
  siteName: string;
  logoUrl?: string;
  authLogoUrl?: string;
  faviconUrl?: string;
  authBackgroundUrl?: string;
  authMainText?: string;
  footerText?: string;
  loginNoticeEnabled?: boolean;
  loginNoticeI18n?: Partial<
    Record<'KR' | 'JP' | 'US' | 'CH' | 'TH', { title: string; body: string }>
  >;
}

export interface HqPlatformPayload {
  config: HqPlatformConfig;
  email: HqEmailOtpConfig;
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

export interface HqEmailOtpConfig {
  otpEnabled: boolean;
  otpForSuperAdmin: boolean;
  otpForHeadOffice: boolean;
  otpForMasterDistributor: boolean;
  otpExpireMinutes: number;
  otpEmailSubject: string;
  otpEmailBody: string;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPassword: string;
  fromAddress: string;
  fromName: string;
  tradeReceiptEmailEnabled: boolean;
}
