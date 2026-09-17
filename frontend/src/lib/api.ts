import { getApiBaseUrl } from './api-base';
import { clearAuthSessionCookie, writeAuthSessionCookie } from './auth-session';

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

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  const session = sessionStorage.getItem('token');
  if (session) return session;
  localStorage.removeItem('token');
  return null;
}

export function setToken(token: string) {
  sessionStorage.setItem('token', token);
  localStorage.removeItem('token');
  writeAuthSessionCookie();
}

export function clearToken() {
  sessionStorage.removeItem('token');
  localStorage.removeItem('token');
  clearAuthSessionCookie();
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
  if (typeof window !== 'undefined') {
    const sensitive = sessionStorage.getItem('crypto-sensitive-token');
    if (sensitive) headers['X-Sensitive-Token'] = sensitive;
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

  workflowDisplay: () => request<HqWorkflowDisplayConfig>('/api/dashboard/workflow-display'),

  login: (email: string, password: string, turnstileToken?: string) =>
    request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, turnstileToken }),
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

  stepUpOtp: (code: string) =>
    request<{ sensitiveToken: string }>('/api/auth/step-up/otp', {
      method: 'POST',
      body: JSON.stringify({ code }),
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

  dashboardCharts: (range: ChartRange = '30d') =>
    request<DashboardChartsResponse>(`/api/dashboard/charts?range=${range}`),

  sessionInfo: () => request<{ ip: string; serverTime: string }>('/api/auth/session-info'),

  salesOffices: () =>
    request<SalesOffice[]>('/api/organizations/sales-offices'),

  organizations: (includeInactive = false) =>
    request<Organization[]>(
      `/api/organizations${includeInactive ? '?includeInactive=true' : ''}`,
    ),
  commissionGrid: () => request<CommissionGridPayload>('/api/organizations/commission-grid'),

  createOrganization: (data: CreateOrganizationInput) =>
    request<Organization>('/api/organizations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateOrganization: (id: string, data: UpdateOrganizationInput) =>
    request<Organization>(`/api/organizations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteOrganization: (id: string) =>
    request<Organization>(`/api/organizations/${id}`, { method: 'DELETE' }),

  users: {
    list: (params?: UserListParams) => {
      const q = new URLSearchParams();
      if (params?.role) q.set('role', params.role);
      if (params?.organizationId) q.set('organizationId', params.organizationId);
      if (params?.search) q.set('search', params.search);
      if (params?.isActive !== undefined) q.set('isActive', String(params.isActive));
      if (params?.staffOnly) q.set('staffOnly', 'true');
      if (params?.kycStatus) q.set('kycStatus', params.kycStatus);
      if (params?.page) q.set('page', String(params.page));
      const qs = q.toString();
      return request<UserListResponse>(`/api/users${qs ? `?${qs}` : ''}`);
    },
    get: (id: string) => request<ManagedUser>(`/api/users/${id}`),
    create: (data: CreateUserInput) =>
      request<ManagedUser>('/api/users', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: UpdateUserInput) =>
      request<ManagedUser>(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    resetPassword: (id: string, password?: string) =>
      request<{ ok: boolean; initialPassword?: string }>(`/api/users/${id}/password`, {
        method: 'PATCH',
        body: JSON.stringify(password ? { password } : {}),
      }),
    resetOtp: (id: string) =>
      request<{ ok: boolean; totpEnabled: boolean }>(`/api/users/${id}/otp`, {
        method: 'PATCH',
      }),
    reviewWallet: (userId: string, walletId: string, status: 'APPROVED' | 'REJECTED') =>
      request<Wallet>(`/api/users/${userId}/wallets/${walletId}/approval`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    remove: (id: string) => request<ManagedUser>(`/api/users/${id}`, { method: 'DELETE' }),
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

  merchant: {
    listOperators: () =>
      request<{
        operators: MerchantOperator[];
        activeCount: number;
        maxActive: number;
      }>('/api/merchant/operators'),
    createOperator: (data: { email: string; name: string; phone?: string }) =>
      request<{ operator: MerchantOperator; initialPasswordHint: string }>('/api/merchant/operators', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    deactivateOperator: (id: string) =>
      request<MerchantOperator>(`/api/merchant/operators/${id}/deactivate`, { method: 'PATCH' }),
    activateOperator: (id: string) =>
      request<MerchantOperator>(`/api/merchant/operators/${id}/activate`, { method: 'PATCH' }),
    listOperationLogs: (params?: { page?: number; pageSize?: number }) => {
      const q = new URLSearchParams();
      if (params?.page) q.set('page', String(params.page));
      if (params?.pageSize) q.set('pageSize', String(params.pageSize));
      const qs = q.toString();
      return request<{
        total: number;
        page: number;
        pageSize: number;
        rows: MerchantOperationLog[];
      }>(`/api/merchant/operation-logs${qs ? `?${qs}` : ''}`);
    },
    deleteOperationLog: (id: string) =>
      request<{ ok: boolean }>(`/api/merchant/operation-logs/${id}`, { method: 'DELETE' }),
  },

  kyc: {
    me: () => request<KycCase>('/api/kyc/me'),
    submit: (files: { forecast: File[]; taxSupport?: File[] }) => {
      const form = new FormData();
      for (const f of files.forecast) form.append('forecast', f);
      for (const f of files.taxSupport ?? []) form.append('taxSupport', f);
      return request<KycCase>('/api/kyc/me', { method: 'POST', body: form });
    },
    getByUser: (userId: string) => request<KycCase>(`/api/kyc/users/${userId}`),
    reviewByUser: (
      userId: string,
      data: { action: 'APPROVE' | 'REJECT'; reason?: string; hqNote?: string },
    ) =>
      request<KycCase>(`/api/kyc/users/${userId}/review`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    list: (status?: string) =>
      request<KycCase[]>(`/api/kyc/cases${status ? `?status=${encodeURIComponent(status)}` : ''}`),
    get: (id: string) => request<KycCase>(`/api/kyc/cases/${id}`),
    review: (id: string, data: { action: 'APPROVE' | 'REJECT'; reason?: string; hqNote?: string }) =>
      request<KycCase>(`/api/kyc/cases/${id}/review`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  usdt: {
    list: () => request<UsdtTicket[]>('/api/tickets/usdt-purchase'),
    get: (id: string) => request<UsdtTicket>(`/api/tickets/usdt-purchase/${id}`),
    depositContext: () =>
      request<UsdtDepositContext>('/api/tickets/usdt-purchase/deposit-context'),
    cardContext: () =>
      request<UsdtCardPaymentContext>('/api/tickets/usdt-purchase/card-context'),
    fees: (params: {
      walletId: string;
      fiatCurrency: string;
      fiatAmount?: number;
      targetUsdtAmount?: number;
      cardChargeFiat?: number;
      paymentMethod?: 'BANK' | 'CARD';
    }) => {
      const q = new URLSearchParams({
        walletId: params.walletId,
        currency: params.fiatCurrency,
      });
      if (params.paymentMethod === 'CARD') q.set('paymentMethod', 'CARD');
      if (params.fiatAmount != null) q.set('fiatAmount', String(params.fiatAmount));
      if (params.targetUsdtAmount != null) q.set('targetUsdtAmount', String(params.targetUsdtAmount));
      if (params.cardChargeFiat != null) q.set('cardChargeFiat', String(params.cardChargeFiat));
      return request<UsdtFeePreview>(`/api/tickets/usdt-purchase/fees?${q}`);
    },
    simulate: (params: {
      fiatCurrency: string;
      fiatAmount?: number;
      targetUsdtAmount?: number;
      network?: string;
      feeMode?: 'LIVE' | 'SAND';
    }) => {
      const q = new URLSearchParams({ currency: params.fiatCurrency });
      if (params.fiatAmount != null) q.set('fiatAmount', String(params.fiatAmount));
      if (params.targetUsdtAmount != null) q.set('targetUsdtAmount', String(params.targetUsdtAmount));
      if (params.network) q.set('network', params.network);
      if (params.feeMode) q.set('feeMode', params.feeMode);
      return request<UsdtFeePreview>(`/api/tickets/usdt-purchase/simulate?${q}`);
    },
    create: (data: {
      fiatAmount?: number;
      targetUsdtAmount?: number;
      cardChargeFiat?: number;
      walletId: string;
      fiatCurrency?: string;
      paymentMethod?: 'BANK_TRANSFER' | 'CARD';
      cardWaiverAccepted?: true;
      card?: CardPaymentInput;
    }) =>
      request<UsdtTicket>('/api/tickets/usdt-purchase', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateStatus: (
      id: string,
      data: {
        status: string;
        usdtTxId?: string;
        actualUsdtAmount?: number;
        adminNote?: string;
        cancelReason?: string;
        amountConfirmAcknowledged?: boolean;
      },
    ) =>
      request<UsdtTicket>(`/api/tickets/usdt-purchase/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    setBrokerUsdt: (id: string, brokerUsdtAmount: number) =>
      request<UsdtTicket>(`/api/tickets/usdt-purchase/${id}/broker-usdt`, {
        method: 'PATCH',
        body: JSON.stringify({ brokerUsdtAmount }),
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
    syncCurfexDeposit: (id: string) =>
      request<{ synced: boolean; applied: boolean; statusCode?: string; ticket?: UsdtTicket }>(
        `/api/tickets/usdt-purchase/${id}/curfex-sync`,
        { method: 'POST' },
      ),
    simulateCurfexSandboxDeposit: (id: string) =>
      request<{ applied: boolean; ticket?: UsdtTicket }>(
        `/api/tickets/usdt-purchase/${id}/curfex-sandbox-deposit`,
        { method: 'POST' },
      ),
    uploadApplicationDocs: (
      id: string,
      files: { sourceOfFunds?: File[]; depositReceipt?: File[] },
    ) => {
      const form = new FormData();
      for (const f of files.sourceOfFunds ?? []) form.append('sourceOfFunds', f);
      for (const f of files.depositReceipt ?? []) form.append('depositReceipt', f);
      return request<UsdtTicket>(`/api/tickets/usdt-purchase/${id}/application-docs`, {
        method: 'POST',
        body: form,
      });
    },
  },

  escrow: {
    list: () => request<EscrowTicket[]>('/api/tickets/trade-escrow'),
    get: (id: string) => request<EscrowTicket>(`/api/tickets/trade-escrow/${id}`),
    lookupMember: (email: string) =>
      request<EscrowMemberLookup>(
        `/api/tickets/trade-escrow/lookup-member?email=${encodeURIComponent(email)}`,
      ),
    previewFees: (amount: number, currency: string) =>
      request<EscrowFeePreview>(
        `/api/tickets/trade-escrow/preview-fees?amount=${amount}&currency=${currency}`,
      ),
    depositContext: (id: string) =>
      request<EscrowDepositContext>(`/api/tickets/trade-escrow/${id}/deposit-context`),
    create: (data: EscrowInput) =>
      request<EscrowTicket>('/api/tickets/trade-escrow', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateStatus: (
      id: string,
      data: { status: string; payoutTxId?: string; sellerPayoutAccount?: string; adminNote?: string },
    ) =>
      request<EscrowTicket>(`/api/tickets/trade-escrow/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    accept: (id: string) =>
      request<EscrowTicket>(`/api/tickets/trade-escrow/${id}/accept`, {
        method: 'POST',
        body: JSON.stringify({ disclaimerAccepted: true }),
      }),
    reject: (id: string, reason?: string) =>
      request<EscrowTicket>(`/api/tickets/trade-escrow/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
    startShipping: (id: string, file?: File) => {
      if (file) {
        const form = new FormData();
        form.append('file', file);
        return request<EscrowTicket>(`/api/tickets/trade-escrow/${id}/start-shipping`, {
          method: 'POST',
          body: form,
        });
      }
      return request<EscrowTicket>(`/api/tickets/trade-escrow/${id}/start-shipping`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
    },
    sellerAccept: (id: string) =>
      request<EscrowTicket>(`/api/tickets/trade-escrow/${id}/accept`, {
        method: 'POST',
        body: JSON.stringify({ disclaimerAccepted: true }),
      }),
    sellerReject: (id: string, reason?: string) =>
      request<EscrowTicket>(`/api/tickets/trade-escrow/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
    uploadBuyerDeposit: (
      id: string,
      file: File,
      meta?: { depositAmount?: number; depositorName?: string; depositTransferredAt?: string },
    ) => {
      const form = new FormData();
      form.append('file', file);
      if (meta?.depositAmount != null) form.append('depositAmount', String(meta.depositAmount));
      if (meta?.depositorName) form.append('depositorName', meta.depositorName);
      if (meta?.depositTransferredAt) form.append('depositTransferredAt', meta.depositTransferredAt);
      return request<EscrowTicket>(`/api/tickets/trade-escrow/${id}/buyer-deposit-proof`, {
        method: 'POST',
        body: form,
      });
    },
    buyerApproval: (id: string, sellerPayoutAccount?: string) =>
      request<EscrowTicket>(`/api/tickets/trade-escrow/${id}/buyer-approval`, {
        method: 'POST',
        body: JSON.stringify({ sellerPayoutAccount }),
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

  simulator: {
    log: (data: {
      mode: 'fiat' | 'target';
      currency: string;
      network: string;
      inputAmount: number;
      requiredFiat: number;
      netUsdt: number;
      totalFeeUsdt: number;
      exchangeRate: number;
    }) =>
      request<SimulatorRunRow | { skipped: true }>('/api/simulator/runs', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    mine: (limit = 2) => request<SimulatorRunRow[]>(`/api/simulator/mine?limit=${limit}`),
    hqList: (page: number, pageSize: number | 'all') =>
      request<SimulatorHqListResponse>(
        `/api/simulator/hq?page=${page}&pageSize=${encodeURIComponent(String(pageSize))}`,
      ),
    analytics: (range: 'day' | 'week' | 'month') =>
      request<SimulatorAnalytics>(`/api/simulator/hq/analytics?range=${range}`),
  },

  costAnalysis: {
    list: () => request<CostAnalysisRow[]>('/api/cost-analysis/cost'),
    preview: (data: {
      currency: string;
      depositFiat: number;
      receivedUsdt: number;
      correctionUsdt: number;
      gasFeeUsdt: number;
    }) =>
      request<CostAnalysisPreview>('/api/cost-analysis/cost/preview', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    create: (data: {
      currency: string;
      depositFiat: number;
      receivedUsdt: number;
      correctionUsdt: number;
      gasFeeUsdt: number;
      note?: string;
    }) =>
      request<CostAnalysisRow>('/api/cost-analysis/cost', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    profitList: () => request<ProfitAnalysisRow[]>('/api/cost-analysis/profit'),
    setBroker: (ticketId: string, brokerUsdtAmount: number) =>
      request<ProfitAnalysisRow>(`/api/cost-analysis/profit/${ticketId}/broker`, {
        method: 'PATCH',
        body: JSON.stringify({ brokerUsdtAmount }),
      }),
  },
};

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'ORG_STAFF' | 'CUSTOMER' | 'CUSTOMER_OPERATOR' | 'ORGANIZER' | 'SETTLEMENT_ADMIN';
  organization?: { id: string; name: string; type: string; path: string };
  customerProfile?: { id: string; customerType: string };
  merchantAdminUserId?: string | null;
  operatorsEnabled?: boolean;
}

export interface MeResponse extends User {
  totpEnabled?: boolean;
  passwordMustChange?: boolean;
  sessionPolicy?: SessionPolicy;
  pageAccess?: Record<string, string>;
  kycStatus?: 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED';
  wallets: Wallet[];
  operatorsEnabled?: boolean;
  merchantAdminUserId?: string | null;
  customerProfile?: {
    id: string;
    customerType: string;
    recruitingOrg?: { id: string; name: string; code: string };
    simulatorEnabled?: boolean;
    simulatorRateMode?: 'LIVE' | 'SAND';
    operatorsEnabled?: boolean;
  };
}

export interface SessionPolicy {
  idleTimeoutMinutes: number;
  defaultUsdtFiatCurrency: 'KRW' | 'JPY' | 'THB' | 'CNY';
}

export type SimulatorRunRow = {
  id: string;
  mode: 'fiat' | 'target' | string;
  currency: string;
  network: string;
  inputAmount: number;
  requiredFiat: number;
  netUsdt: number;
  totalFeeUsdt: number;
  exchangeRate: number;
  createdAt: string;
  customerName?: string;
  customerEmail?: string;
  userId?: string;
};

export type SimulatorHqListResponse = {
  total: number;
  page: number;
  pageSize: number | 'all';
  items: SimulatorRunRow[];
  retentionMonths: number;
};

export type SimulatorAnalytics = {
  range: 'day' | 'week' | 'month';
  total: number;
  avgNetUsdt: number;
  peakHour: string | null;
  topCurrency: string | null;
  topNetwork: string | null;
  byHour: Array<{ hour: string; count: number }>;
  byDay: Array<{ date: string; count: number }>;
  byCurrency: Array<{ currency: string; count: number }>;
  byNetwork: Array<{ network: string; count: number }>;
  byMode: Array<{ mode: string; count: number }>;
  amountBuckets: { lt1k: number; k1to10: number; k10to100: number; over100k: number };
  retentionMonths: number;
};

export type CostAnalysisPreview = {
  currency: string;
  depositFiat: number;
  receivedUsdt: number;
  exchangeRate: number;
  exchangeRateAt: string;
  exchangeSource: string;
  correctionUsdt: number;
  gasFeeUsdt: number;
  feeUsdt: number;
  grossUsdt: number;
};

export type CostAnalysisRow = CostAnalysisPreview & {
  id: string;
  note: string | null;
  createdAt: string;
  createdByName: string;
  createdByEmail: string;
};

export type ProfitAnalysisRow = {
  ticketId: string;
  ticketNo: string;
  status: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  fiatAmount: number;
  fiatCurrency: string;
  exchangeRate: number;
  expectedUsdtAmount: number;
  brokerUsdtAmount: number | null;
  profitUsdt: number | null;
};

export type FeeBillingPresentation = 'INTEGRATED' | 'ITEMIZED' | 'HYBRID';
export type FeeBillingMethod = 'FOLLOW_HQ' | FeeBillingPresentation;
export type UsdtCollectionMode = 'FOLLOW_HQ' | 'FIXED' | 'VIRTUAL';

export interface FeeDiagramDisplayConfig {
  gross: boolean;
  fxFee: boolean;
  gasFee: boolean;
  transferFee: boolean;
  otherFee: boolean;
  localPremium: boolean;
  /** 운영수수료 — 표시만 제어. 정산은 항상 적용 */
  operatingFee: boolean;
  net: boolean;
  requiredFiat: boolean;
  showRates: boolean;
  /** 본사 기본 청구방식 */
  defaultFeeBillingMethod?: FeeBillingPresentation;
  /** 해석된 청구방식 (API) */
  billingMethod?: FeeBillingPresentation;
}

export interface RegisterBankAccountInput {
  currency: 'KRW' | 'JPY' | 'THB' | 'CNY';
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branchName?: string;
}

export interface RegisterInput {
  email: string;
  emailCode: string;
  name: string;
  phone: string;
  phoneCountryCode: string;
  customerType: 'INDIVIDUAL' | 'CORPORATE';
  recruitingOrgId: string;
  businessName?: string;
  businessNumber?: string;
  representative?: string;
  businessAddress?: string;
  businessCategory?: string;
  bankAccounts: RegisterBankAccountInput[];
  walletAddress: string;
  walletNetwork?: string;
  walletLabel?: string;
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
  parentId?: string | null;
  isActive?: boolean;
  simulatorEnabled?: boolean;
  simulatorRateMode?: 'LIVE' | 'SAND';
  deletedAt?: string | null;
  purgeAt?: string | null;
  parent?: { id: string; code: string; name: string; type: string } | null;
}

export interface CreateOrganizationInput {
  name: string;
  type: string;
  parentId?: string | null;
  code?: string;
}

export interface UpdateOrganizationInput {
  name?: string;
  isActive?: boolean;
  simulatorEnabled?: boolean;
  simulatorRateMode?: 'LIVE' | 'SAND';
}

export interface HqDeletionPolicy {
  userRetentionMonths: number;
  orgRetentionMonths: number;
}

export type KycStatus = 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED';

export interface KycAttachment {
  id: string;
  purpose: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
}

export interface KycCase {
  id: string;
  userId: string;
  status: KycStatus;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  rejectReason?: string | null;
  hqNote?: string | null;
  createdAt: string;
  updatedAt: string;
  reviewedBy?: { id: string; name: string; email: string } | null;
  user?: {
    id: string;
    email: string;
    name: string;
    isActive: boolean;
    customerType?: string | null;
    businessName?: string | null;
  };
  attachments: KycAttachment[];
}

export type WorkflowUiLocale = 'KR' | 'US' | 'JP' | 'CH' | 'TH';

export type LocalizedStatusLabels = Record<WorkflowUiLocale, string>;

export type HqSlaConfig = {
  timezone: string;
  businessDays: number[];
  businessStart: string;
  businessEnd: string;
  hoursInBusiness: number;
  hoursAfterHours: number;
};

export type HqWorkflowDisplayConfig = {
  usdtStatusLabels: Record<string, LocalizedStatusLabels>;
  escrowStatusLabels: Record<string, LocalizedStatusLabels>;
  sla: HqSlaConfig;
};

export interface DeletedUserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  deletedAt: string | null;
  purgeAt: string | null;
  organization?: { id: string; name: string; code: string; type: string } | null;
}

export interface HqDeletionPayload {
  policy: HqDeletionPolicy;
  users: DeletedUserRow[];
  orgs: Organization[];
}

export type UserRoleType =
  | 'SUPER_ADMIN'
  | 'ORG_STAFF'
  | 'CUSTOMER'
  | 'CUSTOMER_OPERATOR'
  | 'ORGANIZER'
  | 'SETTLEMENT_ADMIN';

export interface ManagedUser {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: UserRoleType;
  isActive: boolean;
  totpEnabled?: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  registerReason?: string | null;
  createdBy?: { id: string; email: string; name: string; role: string } | null;
  managementLogs?: UserManagementLogItem[];
  organization?: { id: string; code: string; name: string; type: string; path: string } | null;
  customerProfile?: {
    id: string;
    customerType: string;
    businessName?: string | null;
    simulatorEnabled?: boolean;
    simulatorRateMode?: 'LIVE' | 'SAND';
    feeBillingMethod?: FeeBillingMethod;
    usdtCollectionMode?: UsdtCollectionMode;
    operatorsEnabled?: boolean;
    walletFeesVisible?: boolean;
    recruitingOrg?: { id: string; code: string; name: string };
    feeShare?: CustomerFeeShare | null;
    feePolicies?: Array<{
      ticketKind: string;
      feeTypeCode: string;
      feeTypeName: string | null;
      applyStartDate: string;
    }>;
  } | null;
  wallets?: {
    id: string;
    label?: string | null;
    address: string;
    network: string;
    isDefault: boolean;
    hqRegistered?: boolean;
    approvalStatus?: WalletApprovalStatus;
  }[];
  bankAccounts?: {
    id: string;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    isDefault: boolean;
  }[];
  kyc?: { id: string; status: KycStatus; submittedAt?: string | null; rejectReason?: string | null } | null;
}

export interface UserListParams {
  role?: UserRoleType;
  organizationId?: string;
  search?: string;
  isActive?: boolean;
  page?: number;
  staffOnly?: boolean;
  kycStatus?: string;
}

export interface UserListResponse {
  items: ManagedUser[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface UserManagementLogItem {
  id: string;
  action: 'REGISTER' | 'ACTIVATE' | 'DEACTIVATE';
  reason: string;
  createdAt: string;
  changedBy: { id: string; email: string; name: string; role: string };
}

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: UserRoleType;
  reason: string;
  organizationId?: string;
  customerType?: 'INDIVIDUAL' | 'CORPORATE';
  recruitingOrgId?: string;
  businessName?: string;
  businessNumber?: string;
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
  walletAddress?: string;
  walletNetwork?: string;
  walletLabel?: string;
  feeShare?: CustomerFeeShare;
  /** 고객 등록 시 USDT 매입 수수료 타입. 비우면 HQ 기본 타입 */
  usdtFeeTypeCode?: string;
  /** 고객 등록 시 무역거래 수수료 타입. 비우면 HQ 기본 타입 */
  tradeFeeTypeCode?: string;
  /** USDT 시뮬레이터 허용 (기본 true). false면 본사 권한보다 우선 차단 */
  simulatorEnabled?: boolean;
  simulatorRateMode?: 'LIVE' | 'SAND';
  feeBillingMethod?: FeeBillingMethod;
  usdtCollectionMode?: UsdtCollectionMode;
  operatorsEnabled?: boolean;
  walletFeesVisible?: boolean;
}

export interface UpdateUserInput {
  name?: string;
  phone?: string | null;
  role?: UserRoleType;
  organizationId?: string | null;
  isActive?: boolean;
  recruitingOrgId?: string;
  statusReason?: string;
  feeShare?: CustomerFeeShare;
  simulatorEnabled?: boolean;
  simulatorRateMode?: 'LIVE' | 'SAND';
  feeBillingMethod?: FeeBillingMethod;
  usdtCollectionMode?: UsdtCollectionMode;
  operatorsEnabled?: boolean;
  walletFeesVisible?: boolean;
}

export type WalletApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Wallet {
  id: string;
  label?: string;
  address: string;
  network: string;
  isDefault: boolean;
  hqRegistered?: boolean;
  approvalStatus?: WalletApprovalStatus;
  feesVisible?: boolean;
  fxFeePercent?: number;
  gasFeeAmount?: number;
  transferFeeAmount?: number;
  otherFeeAmount?: number;
  platformFeeAmount?: number;
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

export interface MerchantOperator {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  isActive: boolean;
  totpEnabled: boolean;
  createdAt: string;
}

export interface MerchantOperationLog {
  id: string;
  action: string;
  summary: string;
  createdAt: string;
  actor: { id: string; email: string; name: string; role: string };
  merchantAdmin: { id: string; email: string; name: string };
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
  rates: Record<string, { rate: number; label: string; source?: string }>;
  source: string;
  fetchedAt: string;
  disclaimer: string;
}

export interface DepositReceivingAccountInfo {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  bankAddress?: string;
  bankCode?: string;
  branchCode?: string;
  branchName?: string;
  accountType?: string;
  notice?: string;
  noticeI18n?: Partial<Record<'KR' | 'US' | 'JP' | 'CH' | 'TH', string>>;
  transferEnabled?: boolean;
  cardEnabled?: boolean;
}

export interface UsdtCurrencyTradeFlags {
  transfer: boolean;
  card: boolean;
}

export interface UsdtDepositContext {
  receivingAccounts: Partial<Record<'KRW' | 'JPY' | 'THB' | 'CNY', DepositReceivingAccountInfo>>;
  currencyTrade?: Record<'KRW' | 'JPY' | 'THB' | 'CNY', UsdtCurrencyTradeFlags>;
  curfexEnabledCurrencies?: Array<'JPY' | 'KRW' | 'THB' | 'CNY'>;
  usdtCollectionMode?: UsdtCollectionMode;
  hqDefaultCollectionMode?: 'FIXED' | 'VIRTUAL';
  registeredBank: { bankName: string; accountNumber: string; accountHolder: string } | null;
  depositWindowHours: number;
}

export interface BankAccountInfo {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
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

export interface LocalPremiumInfo {
  currency: 'KRW' | 'THB' | 'JPY';
  premiumPercent: number;
  fairRate: number;
  domesticRate: number;
  domesticSource?: string;
  domesticLabel?: string;
  usdFiatRate?: number;
  usdtUsdRate?: number;
  detailRates?: Record<string, number | null>;
  upbitRate?: number | null;
  bithumbRate?: number | null;
}

export interface UsdtFeePreview {
  fees: {
    fxFeePercent: number;
    gasFeeUsdt: number;
    transferFeeUsdt: number;
    otherFeeUsdt: number;
    localPremiumPercent?: number;
    localPremiumFeeUsdt?: number;
    kimchiPremiumPercent?: number;
    kimchiPremiumFeeUsdt?: number;
    baseOtherFeeUsdt?: number;
    fairExchangeRate?: number;
    operatingFeePercent?: number;
    operatingFeeFixedUsdt?: number;
  };
  fiatAmount: number;
  exchangeRate: number;
  breakdown?: {
    targetUsdt: number;
    grossUsdt: number;
    fxFeeUsdt: number;
    gasFeeUsdt: number;
    transferFeeUsdt: number;
    otherFeeUsdt: number;
    baseOtherFeeUsdt?: number;
    localPremiumFeeUsdt?: number;
    localPremiumPercent?: number;
    kimchiPremiumFeeUsdt?: number;
    kimchiPremiumPercent?: number;
    operatingFeeUsdt?: number;
    netUsdt: number;
    requiredFiat: number;
    fairExchangeRate?: number;
  };
  localPremium?: LocalPremiumInfo;
  kimchiPremium?: KimchiPremiumInfo;
  transactionLimits?: TransactionLimitSummary;
  feeDiagramDisplay?: FeeDiagramDisplayConfig;
  currencyAmountDisplay?: HqCurrencyAmountDisplayPolicy;
  paymentMethod?: 'CARD';
  cardFeePercent?: number;
  cardFeeFiat?: number;
  cardChargeFiat?: number;
  fiatForConversion?: number;
}

export interface UsdtCardPaymentContext {
  cardPaymentEnabled: boolean;
  enabled: boolean;
  cardFeePercent: number;
  limits: Record<SymbolFeeCurrency, { min: number; max: number }>;
  currencyTrade?: Record<'KRW' | 'JPY' | 'THB' | 'CNY', UsdtCurrencyTradeFlags>;
  icopayConfigured: boolean;
  userPhone: string | null;
  userPhoneCountryCode: string | null;
  userEmail: string | null;
  userName: string | null;
}

export interface CardPaymentInput {
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
  cardholderName: string;
  email: string;
  phone: string;
  phoneCountryCode: string;
}

export interface TransactionLimitSummary {
  enabled: boolean;
  limits: CurrencyTransactionLimits;
  dailyTotal: number;
  monthlyTotal: number;
  remainingDaily: number | null;
  remainingMonthly: number | null;
  effectiveMin: number;
  effectiveMax: number | null;
}

export interface KimchiPremiumInfo {
  premiumPercent: number;
  fairRate: number;
  domesticRate: number;
  upbitRate: number | null;
  bithumbRate: number | null;
}

export interface UsdtTicket {
  id: string;
  ticketNo: string;
  type: string;
  status: string;
  paymentMethod?: 'BANK_TRANSFER' | 'CARD';
  fiatAmount: number;
  fiatCurrency: string;
  exchangeRate: number;
  exchangeSource?: string;
  fairExchangeRate?: number | null;
  kimchiPremiumPercent?: number | null;
  kimchiPremiumFeeUsdt?: number | null;
  expectedUsdtAmount: number;
  expectedUsdtMin?: number | null;
  expectedUsdtMax?: number | null;
  targetUsdtAmount?: number | null;
  depositDeadlineAt?: string | null;
  bankMismatch?: boolean;
  cancelReason?: string | null;
  depositAmount?: number | null;
  depositorName?: string | null;
  depositTransferredAt?: string | null;
  gasFeeSnapshot: number;
  fxFeePercentSnapshot: number;
  transferFeeSnapshot: number;
  otherFeeSnapshot: number;
  platformFeeSnapshot: number;
  feePolicySnapshot?: TransactionFees | null;
  cardFeePercentSnapshot?: number | null;
  cardFeeFiatSnapshot?: number | null;
  cardChargeFiat?: number | null;
  cardPaymentStatus?: string | null;
  cardLast4?: string | null;
  icopayOrderId?: string | null;
  icopayTransactionId?: string | null;
  collectionProvider?: 'FIXED' | 'CURFEX' | string | null;
  curfexRefNo?: string | null;
  curfexStatusCode?: string | null;
  curfexDepositDetectedAt?: string | null;
  curfexAutoDetect?: boolean;
  collectionAccount?: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    branchName?: string;
    accountType?: string;
  } | null;
  usdtTxId?: string;
  actualUsdtAmount?: number;
  brokerUsdtAmount?: number | null;
  adminNote?: string;
  commissionSettled: boolean;
  createdAt: string;
  expectedCompleteAt?: string | null;
  attachments: Attachment[];
  statusHistory: StatusHistory[];
  wallet?: Wallet;
  registeredBank?: BankAccountInfo | null;
  customer?: { user: { name: string; email: string } };
  feeDiagramDisplay?: FeeDiagramDisplayConfig;
}

export interface EscrowTicket {
  id: string;
  ticketNo: string;
  type: string;
  status: string;
  tradeTier: 'PREMIUM' | 'STANDARD' | 'CAUTION';
  requiresReview: boolean;
  initiatedAsRole?: string;
  title: string;
  description?: string;
  escrowTerms?: string;
  amount: number;
  currency: string;
  totalCommissionPool: number;
  payoutTxId?: string;
  sellerPayoutAccount?: string;
  payoutScheduledAt?: string;
  payoutProcessedAt?: string;
  adminNote?: string;
  rejectionReason?: string;
  voidReason?: string;
  deliveryTerms?: string;
  deliveryDeadline?: string;
  buyerAcceptedAt?: string;
  sellerAcceptedAt?: string;
  acceptanceDeadlineAt?: string;
  shippingStartedAt?: string;
  retryParentTicketId?: string;
  retryCount: number;
  canRetry: boolean;
  depositDeadlineAt?: string;
  depositorName?: string;
  depositAmount?: number | null;
  depositTransferredAt?: string;
  commissionSettled: boolean;
  createdAt: string;
  expectedCompleteAt?: string | null;
  completedAt?: string | null;
  buyer: EscrowParty;
  seller: EscrowParty;
  attachments: Attachment[];
  statusHistory: StatusHistory[];
}

export interface EscrowParty {
  id: string;
  name: string;
  email: string;
  customerType: 'INDIVIDUAL' | 'CORPORATE';
  businessName?: string | null;
}

export interface EscrowInput {
  counterpartyEmail: string;
  myRole: 'BUYER' | 'SELLER';
  title: string;
  description?: string;
  escrowTerms?: string;
  amount: number;
  currency?: string;
  deliveryTerms?: string;
  deliveryDeadline?: string;
  disclaimerAccepted: true;
  retryParentTicketId?: string;
}

export interface EscrowMemberLookup {
  found: boolean;
  member?: {
    id: string;
    name: string;
    email: string;
    customerType: string;
    businessName?: string | null;
  };
}

export interface EscrowFeePreview {
  amount: number;
  currency: string;
  totalRatePercent: number;
  commissionPool: number;
  netToSeller: number;
  lines: Array<{
    organizationId: string;
    organizationName: string;
    ratePercent: number;
    amount: number;
  }>;
}

export interface EscrowDepositContext {
  ticketNo: string;
  amount: number;
  currency: string;
  receivingAccount?: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  } | null;
  registeredBank?: {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  } | null;
  depositWindowHours: number;
  depositDeadlineAt?: string;
  isUsdtEscrow: boolean;
  tradeTier?: string;
  payoutPolicy?: 'SAME_DAY' | 'NEXT_DAY_13KST';
}

export interface DashboardResponse {
  role: string;
  stats: Record<string, number>;
  organizationId?: string;
}

export type ChartRange = '7d' | '30d' | '12m';

export type ChartFiatCurrency = 'KRW' | 'JPY' | 'THB' | 'CNY';

export interface ExchangeStatSnapshot {
  rate: number;
  volume24hUsdt: number | null;
  volume24hQuote: number | null;
  changePercent24h: number | null;
  source: string;
  capturedAt: string;
}

export interface DashboardChartsResponse {
  range: ChartRange;
  scope: 'self' | 'all' | 'org_subtree';
  usdtFlow: {
    stages: Array<{ status: string; count: number }>;
    timeline: Array<{ date: string; count: number; fiatAmount: number; usdtAmount: number }>;
  };
  marketRates: Record<
    ChartFiatCurrency,
    {
      current: ExchangeStatSnapshot | null;
      series: Array<{ date: string; rate: number }>;
    }
  >;
  exchangeStats: Record<ChartFiatCurrency, ExchangeStatSnapshot | null>;
  ourPerformance: {
    showOrgBreakdown: boolean;
    totals: { count: number; fiatAmount: number; usdtAmount: number };
    byCurrency: Array<{
      currency: ChartFiatCurrency;
      count: number;
      fiatAmount: number;
      usdtAmount: number;
    }>;
    byOrg?: Array<{
      orgId: string;
      orgName: string;
      orgType: string;
      count: number;
      fiatAmount: number;
      usdtAmount: number;
    }>;
    timeline: Array<{ date: string; count: number; fiatAmount: number; usdtAmount: number }>;
  } | null;
}

export interface LedgerSummary {
  organizationId: string;
  organizationName?: string;
  totalAmount: number;
  currency: string;
  totalAmountAll?: number;
  totalsByCurrency: Record<string, number>;
  byTicketType: Record<string, Record<string, number>>;
  count: number;
  earnedUsdt?: number;
  pendingUsdt?: number;
  pendingCount?: number;
  pendingLines?: Array<{
    ticketNo: string;
    ticketType: string;
    amount: number;
    currency: string;
    ratePercent: number;
    baseAmount: number;
    status: string;
    ticketId?: string;
    ticketHref?: string | null;
    customerLabel?: string | null;
    tradeSummary?: string | null;
    appliedAt?: string;
  }>;
  entries: Array<{
    id: string;
    amount: number;
    currency: string;
    ratePercent: number;
    baseAmount: number;
    ticketNo: string;
    ticketType: string;
    settledAt: string;
    description?: string;
    ticketId?: string;
    ticketHref?: string | null;
    customerName?: string | null;
    customerEmail?: string | null;
    customerLabel?: string | null;
    tradeSummary?: string | null;
    ticketStatus?: string | null;
    appliedAt?: string;
  }>;
}

export type HqOrgLevel = 'HEAD_OFFICE' | 'MASTER_DISTRIBUTOR' | 'REGIONAL_BRANCH' | 'AGENCY' | 'SALES_OFFICE';

export interface HqOrgShareSlice {
  poolPercent: number;
  perTicketUsdt: number;
}

export type HqOrgShareByType = Record<HqOrgLevel, HqOrgShareSlice>;

export interface HqOrgSharePolicy {
  escrowFeePercent: number;
  escrowPerTicketUsdt: number;
  USDT_PURCHASE: HqOrgShareByType;
  TRADE_ESCROW: HqOrgShareByType;
}

export type CustomerFeeShare = {
  escrowFeePercent: number;
  escrowPerTicketUsdt: number;
  USDT_PURCHASE: HqOrgShareByType;
  TRADE_ESCROW: HqOrgShareByType;
};

export interface CommissionGridRow {
  organizationId: string;
  code: string;
  name: string;
  type: string;
  path: string;
  isActive: boolean;
  USDT_PURCHASE: { useDefault: boolean; poolPercent: number; perTicketUsdt: number };
  TRADE_ESCROW: { useDefault: boolean; poolPercent: number; perTicketUsdt: number };
}

export interface CommissionGridPayload {
  policy: HqOrgSharePolicy;
  rows: CommissionGridRow[];
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
  saveSymbolFeeTiers: (feeTiers: SymbolFeeTierRow[]) =>
    request<HqCommissionPayload>('/api/hq-policy/commission/fee-tiers', {
      method: 'PUT',
      body: JSON.stringify({ feeTiers }),
    }),
  saveExchangeRateSources: (exchangeRateSources: HqExchangeRateSourcePolicy) =>
    request<HqCommissionPayload>('/api/hq-policy/commission/exchange-rate-sources', {
      method: 'PUT',
      body: JSON.stringify({ exchangeRateSources }),
    }),
  saveOrgShare: (orgShare: HqOrgSharePolicy) =>
    request<HqCommissionPayload>('/api/hq-policy/commission/org-share', {
      method: 'PUT',
      body: JSON.stringify({ orgShare }),
    }),
  listFeeTypes: () =>
    request<{ feeTypes: FeeTypeTemplate[] }>('/api/hq-policy/commission/fee-types'),
  createFeeType: (body: {
    code: string;
    name: string;
    ticketKind: FeeTicketKind;
    config?: HqOrgSharePolicy;
    isDefault?: boolean;
  }) =>
    request<{ feeTypes: FeeTypeTemplate[] } & HqCommissionPayload>('/api/hq-policy/commission/fee-types', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  updateFeeType: (
    id: string,
    body: { name?: string; config?: HqOrgSharePolicy; isDefault?: boolean; sortOrder?: number },
  ) =>
    request<{ feeTypes: FeeTypeTemplate[] } & HqCommissionPayload>(
      `/api/hq-policy/commission/fee-types/${id}`,
      { method: 'PUT', body: JSON.stringify(body) },
    ),
  deleteFeeType: (id: string) =>
    request<{ feeTypes: FeeTypeTemplate[] } & HqCommissionPayload>(
      `/api/hq-policy/commission/fee-types/${id}`,
      { method: 'DELETE' },
    ),
  saveGasNetworks: (gasNetworks: HqGasNetworkPolicy) =>
    request<HqCommissionPayload>('/api/hq-policy/commission/gas-networks', {
      method: 'PUT',
      body: JSON.stringify({ gasNetworks }),
    }),
  saveCurrencyAmountDisplay: (currencyAmountDisplay: HqCurrencyAmountDisplayPolicy) =>
    request<HqCommissionPayload>('/api/hq-policy/commission/currency-amount-display', {
      method: 'PUT',
      body: JSON.stringify({ currencyAmountDisplay }),
    }),
  saveSimulatorCommissionRisk: (risk: HqCommissionRiskConfig) =>
    request<HqCommissionPayload>('/api/hq-policy/commission/simulator/risk', {
      method: 'PUT',
      body: JSON.stringify({ risk }),
    }),
  saveSimulatorSymbolFeeTiers: (feeTiers: SymbolFeeTierRow[]) =>
    request<HqCommissionPayload>('/api/hq-policy/commission/simulator/fee-tiers', {
      method: 'PUT',
      body: JSON.stringify({ feeTiers }),
    }),
  saveCommissionRates: (
    rates: Array<{
      organizationId: string;
      ticketType: string;
      ratePercent: number;
      perTicketUsdt?: number;
      useDefault?: boolean;
    }>,
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
  uploadPlatformOgImage: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<HqPlatformPayload>('/api/hq-policy/platform/og', {
      method: 'POST',
      body: form,
    });
  },
  getCardPayment: () => request<{ config: HqCardPaymentConfig }>('/api/hq-policy/payment/card'),
  saveCardPayment: (config: HqCardPaymentConfig) =>
    request<{ config: HqCardPaymentConfig }>('/api/hq-policy/payment/card', {
      method: 'PUT',
      body: JSON.stringify({ config }),
    }),
  getIcopay: () => request<{ config: HqIcopayConfig }>('/api/hq-policy/payment/icopay'),
  saveIcopay: (config: HqIcopayConfig) =>
    request<{ config: HqIcopayConfig }>('/api/hq-policy/payment/icopay', {
      method: 'PUT',
      body: JSON.stringify({ config }),
    }),
  getCurfex: () =>
    request<{ config: HqCurfexConfig; webhookUrl?: string }>('/api/hq-policy/payment/curfex'),
  saveCurfex: (config: HqCurfexConfig) =>
    request<{ config: HqCurfexConfig; webhookUrl?: string }>('/api/hq-policy/payment/curfex', {
      method: 'PUT',
      body: JSON.stringify({ config }),
    }),
  generateCurfexWebhookSecret: () =>
    request<{ config: HqCurfexConfig; webhookUrl?: string; webhookSecretOnce?: string }>(
      '/api/hq-policy/payment/curfex/webhook-secret',
      { method: 'POST' },
    ),
  getDeletion: () => request<HqDeletionPayload>('/api/hq-policy/deletion'),
  getWorkflowDisplay: () => request<HqWorkflowDisplayConfig>('/api/hq-policy/workflow-display'),
  saveWorkflowDisplay: (config: HqWorkflowDisplayConfig) =>
    request<HqWorkflowDisplayConfig>('/api/hq-policy/workflow-display', {
      method: 'PUT',
      body: JSON.stringify({ config }),
    }),
  saveDeletion: (policy: HqDeletionPolicy) =>
    request<HqDeletionPayload>('/api/hq-policy/deletion', {
      method: 'PUT',
      body: JSON.stringify({ policy }),
    }),
  purgeDeletedUser: (id: string) =>
    request<{ ok: boolean }>(`/api/hq-policy/deletion/users/${id}`, { method: 'DELETE' }),
  restoreDeletedUser: (id: string) =>
    request<{ ok: boolean }>(`/api/hq-policy/deletion/users/${id}/restore`, { method: 'POST' }),
  purgeDeletedOrg: (id: string) =>
    request<{ ok: boolean }>(`/api/hq-policy/deletion/orgs/${id}`, { method: 'DELETE' }),
  listChangeLogs: (query?: {
    page?: number;
    limit?: number;
    entityType?: string;
    search?: string;
    from?: string;
    to?: string;
  }) => {
    const params = new URLSearchParams();
    if (query?.page) params.set('page', String(query.page));
    if (query?.limit) params.set('limit', String(query.limit));
    if (query?.entityType) params.set('entityType', query.entityType);
    if (query?.search) params.set('search', query.search);
    if (query?.from) params.set('from', query.from);
    if (query?.to) params.set('to', query.to);
    const qs = params.toString();
    return request<AdminChangeLogListResponse>(
      `/api/hq-policy/ops/change-logs${qs ? `?${qs}` : ''}`,
    );
  },
  listReleaseLogs: (query?: { page?: number; limit?: number; search?: string; locale?: string }) => {
    const params = new URLSearchParams();
    if (query?.page) params.set('page', String(query.page));
    if (query?.limit) params.set('limit', String(query.limit));
    if (query?.search) params.set('search', query.search);
    if (query?.locale) params.set('locale', query.locale);
    const qs = params.toString();
    return request<PlatformReleaseListResponse>(
      `/api/hq-policy/ops/release-logs${qs ? `?${qs}` : ''}`,
    );
  },
};

export type AdminChangeLogItem = {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entityType: string;
  entityId: string | null;
  entityLabel: string | null;
  summary: string;
  before: unknown;
  after: unknown;
  ipAddress: string | null;
  createdAt: string;
  changedBy: { id: string; email: string; name: string; role: string };
};

export type AdminChangeLogListResponse = {
  items: AdminChangeLogItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

export type PlatformReleaseLogItem = {
  id: string;
  version: string;
  title: string | null;
  description: string | null;
  changeLevel: 'MAJOR' | 'MINOR' | 'PATCH';
  source: 'AUTO' | 'MANUAL' | 'DEPLOY';
  entityType: string | null;
  packageSizeMb: number | null;
  status: string;
  deployedAt: string;
  notes: string | null;
  createdAt: string;
  recordedBy: { id: string; email: string; name: string; role: string } | null;
};

export type PlatformReleaseListResponse = {
  items: PlatformReleaseLogItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

export type CreatePlatformReleaseInput = {
  version: string;
  title?: string;
  description?: string;
  packageSizeMb?: number;
  status?: string;
  deployedAt?: string;
  notes?: string;
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

export type CurrencyTransactionLimits = {
  perTransactionMin: number;
  perTransactionMax: number;
  dailyMin: number;
  dailyMax: number;
  monthlyMin: number;
  monthlyMax: number;
};

export type CustomerTransactionLimitsPolicy = {
  INDIVIDUAL: Record<SymbolFeeCurrency, CurrencyTransactionLimits>;
  CORPORATE: Record<SymbolFeeCurrency, CurrencyTransactionLimits>;
};

export type FeeMode = 'percent' | 'fixed';

export type TransactionFees = {
  fxFeeMode: FeeMode;
  fxFeePercent: number;
  fxFeeUsdt: number;
  gasFeeMode: FeeMode;
  gasFeePercent: number;
  gasFeeUsdt: number;
  transferFeeMode: FeeMode;
  transferFeePercent: number;
  transferFeeUsdt: number;
  otherFeeMode: FeeMode;
  otherFeePercent: number;
  otherFeeUsdt: number;
  operatingFeePercent?: number;
  operatingFeeFixedUsdt?: number;
};

export interface HqCommissionRiskConfig {
  defaultFxFeePercent: number;
  defaultFxFeeUsdt?: number;
  defaultFxFeeMode?: FeeMode;
  defaultGasFeeUsdt: number;
  defaultGasFeePercent?: number;
  defaultGasFeeMode?: FeeMode;
  defaultTransferFeeUsdt: number;
  defaultTransferFeePercent?: number;
  defaultTransferFeeMode?: FeeMode;
  defaultOtherFeeUsdt: number;
  defaultOtherFeePercent?: number;
  defaultOtherFeeMode?: FeeMode;
  feeDiagramDisplay?: FeeDiagramDisplayConfig;
  /** 시뮬레이터 SAND 전용 도식 (없으면 LIVE feeDiagramDisplay와 동일하게 취급) */
  sandboxFeeDiagramDisplay?: FeeDiagramDisplayConfig;
  maxTicketAmountKrw: number;
  riskEnabled: boolean;
  maxDailyTicketsPerCustomer: number;
  transactionLimits: CustomerTransactionLimitsPolicy;
  notes?: string;
  defaultPlatformFeeUsdt?: number;
}

export type SymbolFeeCurrency = 'KRW' | 'JPY' | 'THB' | 'CNY' | 'USD';

export interface SymbolFeeTierRow extends TransactionFees {
  id: string;
  currency: SymbolFeeCurrency;
  maxAmount: number;
}

export type ExchangeRateSourceId =
  | 'coingecko'
  | 'exchangerate_api'
  | 'binance_cross'
  | 'binance_global'
  | 'binance_th'
  | 'bybit_cross'
  | 'kraken_book'
  | 'upbit'
  | 'kr_domestic';

export type HqExchangeRateSourcePolicy = Record<SymbolFeeCurrency, ExchangeRateSourceId>;

export interface LocalMarketPremiumAnalysis {
  currency: 'KRW' | 'THB' | 'JPY';
  domesticRate: number;
  fairRate: number;
  premiumPercent: number;
  domesticSource: string;
  domesticLabel: string;
  usdFiatRate: number;
  usdtUsdRate: number;
  detailRates: Record<string, number | null>;
  fetchedAt: string;
}

export interface KimchiPremiumAnalysis {
  domesticRate: number;
  fairRate: number;
  premiumPercent: number;
  upbitRate: number | null;
  bithumbRate: number | null;
  usdKrwRate: number;
  usdtUsdRate: number;
  fetchedAt: string;
}

export interface ExchangeRatePreviewRow {
  currency: SymbolFeeCurrency;
  configuredSource: ExchangeRateSourceId;
  rate: number | null;
  actualSource: string;
  fetchedAt: string | null;
  error?: string;
}

export type GasNetworkCode = 'TRC20' | 'ERC20' | 'BEP20' | 'POLYGON' | 'ARBITRUM' | 'SOL';
export type GasFeeGroupId = 'DEFAULT' | 'A' | 'B' | 'C';

export type HqGasNetworkPolicy = {
  activeGroup: GasFeeGroupId;
  networks: Array<{
    code: GasNetworkCode;
    fees: Record<GasFeeGroupId, number>;
  }>;
};

export type FeeTicketKind = 'USDT_PURCHASE' | 'TRADE_ESCROW';

export interface FeeTypeTemplate {
  id: string;
  ticketKind: FeeTicketKind;
  code: string;
  name: string;
  isDefault: boolean;
  sortOrder: number;
  config: HqOrgSharePolicy;
}

export interface CustomerFeeGridRow {
  id?: string;
  customerProfileId: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  ticketKind: FeeTicketKind;
  feeTypeCode: string;
  feeTypeName: string | null;
  operatingPercent: number;
  operatingFixedUsdt: number;
  shares: HqOrgShareByType;
  applyStartDate: string;
  totalPercent: number;
  totalFixedUsdt: number;
}

export interface CustomerFeeHistoryRow {
  id: string;
  ticketKind: string;
  action: string;
  feeTypeCode: string | null;
  applyStartDate: string | null;
  beforeJson: unknown;
  afterJson: unknown;
  changedBy: { id: string; name: string; email: string } | null;
  createdAt: string;
}

export const customerFeesApi = {
  listTypes: () => request<{ feeTypes: FeeTypeTemplate[] }>('/api/customer-fees/fee-types'),
  list: (ticketKind: FeeTicketKind) =>
    request<{ ticketKind: FeeTicketKind; feeTypes: FeeTypeTemplate[]; rows: CustomerFeeGridRow[] }>(
      `/api/customer-fees?ticketKind=${ticketKind}`,
    ),
  save: (body: {
    customerProfileId: string;
    ticketKind: FeeTicketKind;
    feeTypeCode?: string;
    operatingPercent?: number;
    operatingFixedUsdt?: number;
    shares?: HqOrgShareByType;
    applyStartDate: string;
    assignTypeOnly?: boolean;
  }) => request<CustomerFeeGridRow>('/api/customer-fees', { method: 'POST', body: JSON.stringify(body) }),
  remove: (body: { customerProfileId: string; ticketKind: FeeTicketKind; policyId?: string }) =>
    request<{ ok: boolean }>('/api/customer-fees', { method: 'DELETE', body: JSON.stringify(body) }),
  history: (customerProfileId: string, ticketKind: FeeTicketKind) =>
    request<{ rows: CustomerFeeHistoryRow[] }>(
      `/api/customer-fees/history?customerProfileId=${encodeURIComponent(customerProfileId)}&ticketKind=${ticketKind}`,
    ),
};

export interface HqCommissionPayload {
  risk: HqCommissionRiskConfig;
  feeTiers: SymbolFeeTierRow[];
  simulatorRisk?: HqCommissionRiskConfig;
  simulatorFeeTiers?: SymbolFeeTierRow[];
  exchangeRateSources: HqExchangeRateSourcePolicy;
  exchangeRatePreview: ExchangeRatePreviewRow[];
  localPremiums: LocalMarketPremiumAnalysis[];
  kimchiPremium: KimchiPremiumAnalysis | null;
  rates: Array<{
    id: string;
    ticketType: string;
    ratePercent: string;
    organization: { id: string; code: string; name: string; type: string };
  }>;
  orgShare: HqOrgSharePolicy;
  feeTypes?: FeeTypeTemplate[];
  gasNetworks?: HqGasNetworkPolicy;
  currencyAmountDisplay?: HqCurrencyAmountDisplayPolicy;
  customerFeeShareOverrides?: Array<{
    userId: string;
    email: string;
    name: string;
    feeShare: CustomerFeeShare;
  }>;
}

export type CurrencyAmountMode = 'ROUND' | 'CEIL' | 'FLOOR';
export type HqCurrencyAmountRule = { decimals: number; mode: CurrencyAmountMode };
export type HqCurrencyAmountDisplayPolicy = {
  default: HqCurrencyAmountRule;
  KRW?: HqCurrencyAmountRule;
  JPY?: HqCurrencyAmountRule;
  THB?: HqCurrencyAmountRule;
  CNY?: HqCurrencyAmountRule;
  HKD?: HqCurrencyAmountRule;
  USD?: HqCurrencyAmountRule;
};

export interface BrandingResponse {
  siteName: string;
  currencyAmountDisplay?: unknown;
  tabTitle?: string;
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
  customerRegistrationEnabled: boolean;
  defaultUsdtFiatCurrency?: 'KRW' | 'JPY' | 'THB' | 'CNY';
  /** 기준시간 IANA TZ */
  baseTimezone?: string;
  /** 서비스기준시간 IANA TZ */
  serviceTimezone?: string;
}

export interface HqPlatformConfig {
  primaryDomain: string;
  apiPublicUrl: string;
  corsOrigins: string[];
  sslCertPath?: string;
  redirectRootToPrimary: boolean;
  siteName: string;
  /** 브라우저 탭. 비우면 siteName */
  tabTitle?: string;
  /** LINE·WhatsApp 미리보기 이미지. 제목=siteName, 설명=authMainText */
  ogImageUrl?: string;
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
  customerRegistrationEnabled?: boolean;
  idleTimeoutMinutes?: number;
  defaultUsdtFiatCurrency?: 'KRW' | 'JPY' | 'THB' | 'CNY';
  simulatorRetentionMonths?: number;
  depositReceivingAccounts?: Partial<Record<'KRW' | 'JPY' | 'THB' | 'CNY', DepositReceivingAccountInfo>>;
  baseTimezone?: string;
  serviceTimezone?: string;
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
  sensitiveOtpExpireMinutes?: number;
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

export interface HqIcopayConfig {
  enabled: boolean;
  mid: string;
  bracketSecret: string;
  apiBaseUrl?: string;
  sandbox?: boolean;
}

export interface HqCurfexConfig {
  enabled: boolean;
  clientId: string;
  clientSecret: string;
  apiBaseUrl?: string;
  walletName?: string;
  /** Currencies that use CURFEX (default JPY). Others stay on fixed accounts. */
  currencies?: Array<'JPY' | 'KRW' | 'THB' | 'CNY'>;
  sandbox?: boolean;
  webhookSecret?: string;
  autoApproveOnDeposit?: boolean;
  /** HQ default when customer follows HQ: FIXED or VIRTUAL (TINPASS VA) */
  defaultCollectionMode?: 'FIXED' | 'VIRTUAL';
}

export type CardCurrencyLimits = { min: number; max: number };

export interface HqCardPaymentConfig {
  enabled: boolean;
  cardFeePercent: number;
  limits: Record<SymbolFeeCurrency, CardCurrencyLimits>;
}
