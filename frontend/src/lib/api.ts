import { getApiBaseUrl } from './api-base';
import { clearAuthSessionCookie, writeAuthSessionCookie } from './auth-session';

const API_URL = getApiBaseUrl();

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public details?: unknown,
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
    const locale = localStorage.getItem('crypto_ui_locale');
    if (locale) headers['X-Locale'] = locale;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, err.error ?? 'Request failed', err.code, err.details);
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

  registerSendCode: (
    email: string,
    name: string,
    opts?: { inviteOrgCode?: string; referrerUserId?: string },
  ) =>
    request<{
      ok: boolean;
      smtpConfigured?: boolean;
      maskedEmail?: string;
      expiresAt?: string;
      expiresInSeconds?: number;
    }>('/api/auth/register/send-code', {
      method: 'POST',
      body: JSON.stringify({
        email,
        name,
        inviteOrgCode: opts?.inviteOrgCode,
        referrerUserId: opts?.referrerUserId,
      }),
    }),

  registerVerifyCode: (
    email: string,
    code: string,
    opts?: { inviteOrgCode?: string; referrerUserId?: string },
  ) =>
    request<{ ok: boolean; emailProof: string }>('/api/auth/register/verify-code', {
      method: 'POST',
      body: JSON.stringify({
        email,
        code,
        inviteOrgCode: opts?.inviteOrgCode,
        referrerUserId: opts?.referrerUserId,
      }),
    }),

  registerReferrerSearch: (q: { email?: string; phone?: string; phoneCountryCode?: string }) => {
    const params = new URLSearchParams();
    if (q.email) params.set('email', q.email);
    if (q.phone) params.set('phone', q.phone);
    if (q.phoneCountryCode) params.set('phoneCountryCode', q.phoneCountryCode);
    return request<{ items: ReferrerSearchHit[] }>(
      `/api/auth/register/referrer-search?${params.toString()}`,
    );
  },

  registerInviteInfo: (params: { org?: string; ref?: string }) => {
    const q = new URLSearchParams();
    if (params.org) q.set('org', params.org);
    if (params.ref) q.set('ref', params.ref);
    return request<{ displayName: string; email?: string; mode: 'ORG' | 'REFERRER' }>(
      `/api/auth/register/invite-info?${q.toString()}`,
    );
  },

  register: (data: RegisterInput) =>
    request<{ ok: boolean; message: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  passwordForgotSendCode: (email: string, turnstileToken?: string) =>
    request<{ ok: boolean; maskedEmail: string; smtpConfigured?: boolean }>(
      '/api/auth/password/forgot/send-code',
      { method: 'POST', body: JSON.stringify({ email, turnstileToken }) },
    ),

  passwordForgotReset: (data: {
    email: string;
    code: string;
    newPassword: string;
    confirmPassword: string;
    turnstileToken?: string;
  }) =>
    request<{ ok: boolean }>('/api/auth/password/forgot/reset', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  otpForgotSendCode: (email: string, turnstileToken?: string) =>
    request<{ ok: boolean; maskedEmail: string; smtpConfigured?: boolean }>(
      '/api/auth/otp/forgot/send-code',
      { method: 'POST', body: JSON.stringify({ email, turnstileToken }) },
    ),

  otpForgotReset: (email: string, code: string, turnstileToken?: string) =>
    request<{
      ok: boolean;
      mustSetupOtp?: boolean;
      enrollToken?: string;
      maskedEmail?: string;
      smtpConfigured?: boolean;
    }>('/api/auth/otp/forgot/reset', {
      method: 'POST',
      body: JSON.stringify({ email, code, turnstileToken }),
    }),

  me: () => request<MeResponse>('/api/auth/me'),

  account: {
    get: () => request<CustomerAccountProfile>('/api/auth/account'),
    updateNickname: (name: string) =>
      request<{ ok: boolean; name: string; email: string }>('/api/auth/account', {
        method: 'PATCH',
        body: JSON.stringify({ name }),
      }),
    changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) =>
      request<{ ok: boolean }>('/api/auth/password/change-authenticated', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      }),
  },

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
      if (params?.approvalStatus) q.set('approvalStatus', params.approvalStatus);
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
    reviewWalletDeletion: (userId: string, walletId: string, status: 'APPROVED' | 'REJECTED') =>
      request<Wallet>(`/api/users/${userId}/wallets/${walletId}/deletion`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    reviewCustomerApproval: (userId: string, status: 'APPROVED' | 'REJECTED') =>
      request<ManagedUser>(`/api/users/${userId}/customer-approval`, {
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
    updateNickname: (id: string, label: string) =>
      request<Wallet>(`/api/wallets/${id}/nickname`, {
        method: 'PATCH',
        body: JSON.stringify({ label }),
      }),
    requestDelete: (id: string) =>
      request<Wallet>(`/api/wallets/${id}/delete-request`, { method: 'POST', body: '{}' }),
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
    getOperatorPageAccess: (id: string) =>
      request<MerchantOperatorPageAccess>(`/api/merchant/operators/${id}/page-access`),
    saveOperatorPageAccess: (id: string, overrides: Record<string, string> | null) =>
      request<MerchantOperatorPageAccess>(`/api/merchant/operators/${id}/page-access`, {
        method: 'PUT',
        body: JSON.stringify({ overrides }),
      }),
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

  tradeReceipts: {
    list: (params?: { page?: number; pageSize?: number; status?: TradeReceiptSendStatus; q?: string }) => {
      const q = new URLSearchParams();
      if (params?.page) q.set('page', String(params.page));
      if (params?.pageSize) q.set('pageSize', String(params.pageSize));
      if (params?.status) q.set('status', params.status);
      if (params?.q) q.set('q', params.q);
      const qs = q.toString();
      return request<{
        total: number;
        page: number;
        pageSize: number;
        rows: TradeReceiptEmailLogSummary[];
      }>(`/api/trade-receipts${qs ? `?${qs}` : ''}`);
    },
    get: (id: string) => request<TradeReceiptEmailLogDetail>(`/api/trade-receipts/${id}`),
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
      cardBrand?: CardFeeBrand | string | null;
      paymentMethod?: 'BANK' | 'CARD' | 'REMITTANCE' | 'BANK_TRANSFER';
      expressTier?: ExpressTier | string | null;
    }) => {
      const q = new URLSearchParams({
        walletId: params.walletId,
        currency: params.fiatCurrency,
      });
      if (params.paymentMethod === 'CARD') q.set('paymentMethod', 'CARD');
      if (params.paymentMethod === 'REMITTANCE') q.set('paymentMethod', 'REMITTANCE');
      if (params.fiatAmount != null) q.set('fiatAmount', String(params.fiatAmount));
      if (params.targetUsdtAmount != null) q.set('targetUsdtAmount', String(params.targetUsdtAmount));
      if (params.cardChargeFiat != null) q.set('cardChargeFiat', String(params.cardChargeFiat));
      if (params.cardBrand) q.set('cardBrand', String(params.cardBrand));
      if (params.expressTier) q.set('expressTier', String(params.expressTier));
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
      cardBrand?: CardFeeBrand | string | null;
      walletId: string;
      fiatCurrency?: string;
      paymentMethod?: 'BANK_TRANSFER' | 'CARD' | 'REMITTANCE';
      expressTier?: ExpressTier | string | null;
      cardWaiverAccepted?: true;
      card?: CardPaymentInput;
    }) =>
      request<UsdtTicket & { icopayCheckout?: IcopayCheckoutInfo }>('/api/tickets/usdt-purchase', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    syncCardPayment: (id: string) =>
      request<UsdtTicket>(`/api/tickets/usdt-purchase/${id}/sync-card-payment`, {
        method: 'POST',
      }),
    /** ICOPAY 결제 후 복귀 — orderNo/ticketId로 티켓 동기화 */
    cardReturn: (params?: { orderNo?: string; ticketId?: string }) => {
      const q = new URLSearchParams();
      if (params?.orderNo) q.set('orderNo', params.orderNo);
      if (params?.ticketId) q.set('ticketId', params.ticketId);
      const qs = q.toString();
      return request<{
        ticketId: string;
        ticketNo: string;
        status: string;
        cardPaymentStatus: string | null;
        outcome: 'PAID' | 'DECLINED' | 'PENDING';
        ticket: UsdtTicket;
      }>(`/api/tickets/usdt-purchase/card-return${qs ? `?${qs}` : ''}`);
    },
    updateStatus: (
      id: string,
      data: {
        status: string;
        usdtTxId?: string;
        actualUsdtAmount?: number;
        adminNote?: string;
        cancelReason?: string;
        amountConfirmAcknowledged?: boolean;
        sandboxInvoice?: boolean;
      },
    ) =>
      request<UsdtTicket>(`/api/tickets/usdt-purchase/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    addScheduleDelay: (id: string, data: { delayHours: number; reason: string }) =>
      request<UsdtTicket>(`/api/tickets/usdt-purchase/${id}/schedule-delay`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    confirmQuote: (
      id: string,
      data?: {
        confirmedFiatAmount?: number;
        confirmedUsdtAmount?: number;
        adminNote?: string;
      },
    ) =>
      request<UsdtTicket>(`/api/tickets/usdt-purchase/${id}/confirm-quote`, {
        method: 'POST',
        body: JSON.stringify(data ?? {}),
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
    addScheduleDelay: (id: string, data: { delayHours: number; reason: string }) =>
      request<EscrowTicket>(`/api/tickets/trade-escrow/${id}/schedule-delay`, {
        method: 'POST',
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

  invoices: {
    list: (
      kind: 'live' | 'official' | 'simulator' | 'sandbox' | 'all',
      range?: { from?: string; to?: string },
    ) => {
      const q = new URLSearchParams({ kind });
      if (range?.from) q.set('from', range.from);
      if (range?.to) q.set('to', range.to);
      return request<{
        items: Array<{
          id: string;
          invoice_no: string;
          status: string;
          issued_at: string;
          currency: string;
          amount: string | number;
          ticket_no?: string | null;
          invoice_kind?: string;
        }>;
      }>(`/api/invoices?${q.toString()}`);
    },
    async fetchPdfBlob(id: string, kind: 'live' | 'official' | 'simulator' = 'live') {
      const token = getToken();
      const q = new URLSearchParams({ kind });
      const res = await fetch(
        `${API_URL}/api/invoices/${encodeURIComponent(id)}/pdf?${q.toString()}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new ApiError(res.status, err.error ?? 'PDF failed', err.code);
      }
      return res.blob();
    },
    async previewPdf(id: string, kind: 'live' | 'official' | 'simulator' = 'live') {
      const blob = await this.fetchPdfBlob(id, kind);
      const url = URL.createObjectURL(blob);
      const opened = window.open(url, '_blank', 'noopener,noreferrer');
      if (!opened) {
        URL.revokeObjectURL(url);
        throw new ApiError(400, 'Popup blocked', 'POPUP_BLOCKED');
      }
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    },
    async downloadPdf(id: string, filename: string, kind: 'live' | 'official' | 'simulator' = 'live') {
      const { publicInvoicePdfFileName } = await import('./invoice-brand');
      const blob = await this.fetchPdfBlob(id, kind);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = publicInvoicePdfFileName(filename);
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    },
    delete: (id: string, kind: 'live' | 'official' | 'simulator' = 'live') => {
      const q = new URLSearchParams({ kind });
      return request<{
        invoice?: { id: string; invoiceNo?: string; status?: string };
      }>(`/api/invoices/${encodeURIComponent(id)}?${q.toString()}`, {
        method: 'DELETE',
      });
    },
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
    issueInvoice: (data: {
      mode: 'fiat' | 'target';
      currency: string;
      network: string;
      requiredFiat: number;
      netUsdt: number;
      exchangeRate: number;
      feeMode?: 'LIVE' | 'SAND';
    }) =>
      request<{
        ok: boolean;
        kind: 'simulator';
        invoiceNo?: string;
        ticketNo?: string;
        transactionId?: string;
        amount?: string;
        currency?: string;
        assetAmount?: string;
        memo?: string;
      }>('/api/simulator/issue-invoice', {
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

export type CustomerApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type TradeAccess = 'FULL' | 'VIEW_ONLY';

export interface MeResponse extends User {
  totpEnabled?: boolean;
  passwordMustChange?: boolean;
  sessionPolicy?: SessionPolicy;
  pageAccess?: Record<string, string>;
  kycStatus?: 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED';
  /** 가맹점 거래 실행 권한 — 미승인 시 VIEW_ONLY */
  tradeAccess?: TradeAccess;
  approvalStatus?: CustomerApprovalStatus | null;
  wallets: Wallet[];
  operatorsEnabled?: boolean;
  merchantAdminUserId?: string | null;
  legalFirstName?: string | null;
  legalLastName?: string | null;
  customerProfile?: {
    id: string;
    customerType: string;
    approvalStatus?: CustomerApprovalStatus;
    recruitingOrg?: { id: string; name: string; code: string };
    simulatorEnabled?: boolean;
    simulatorRateMode?: 'LIVE' | 'SAND';
    operatorsEnabled?: boolean;
  };
}

export interface CustomerAccountBank {
  id: string;
  currency: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branchName?: string | null;
  isDefault: boolean;
}

export interface CustomerAccountWallet {
  id: string;
  label: string | null;
  address: string;
  network: string;
  isDefault: boolean;
  approvalStatus: string;
}

export interface CustomerAccountProfile {
  id: string;
  email: string;
  name: string;
  legalFirstName: string | null;
  legalLastName: string | null;
  phone: string | null;
  phoneCountryCode: string | null;
  role: string;
  totpEnabled: boolean;
  createdAt: string;
  kycStatus: string;
  customerType: string | null;
  approvalStatus: CustomerApprovalStatus | null;
  limitCountry: string | null;
  businessName: string | null;
  recruitingOrg: { id: string; name: string; code: string } | null;
  bankAccounts: CustomerAccountBank[];
  wallets: CustomerAccountWallet[];
  canEditNickname: boolean;
  canChangePassword: boolean;
  canEditLegalName: boolean;
  canResetOtp: boolean;
}

export interface SessionPolicy {
  idleTimeoutMinutes: number;
  defaultUsdtFiatCurrency: 'KRW' | 'JPY' | 'THB' | 'CNY' | 'USD' | 'EUR';
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
  /** 고객 mine 응답: 계산 결과와 동일한 총수수료 노출·±범위 */
  feeDiagramDisplay?: FeeDiagramDisplayConfig;
  amountRangePct?: number | null;
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
export type TotalFeeVisibility = 'FOLLOW_HQ' | 'SHOW' | 'HIDE';
export type UsdtCollectionMode = 'FOLLOW_HQ' | 'FIXED' | 'VIRTUAL' | 'DIRECT';
export type UsdtPayMethodAccess = 'FOLLOW_HQ' | 'ENABLED' | 'DISABLED';
export type TradeReceiptEmailMode = 'FOLLOW_HQ' | 'ENABLED' | 'DISABLED' | 'HQ_ONLY';
export type TradeReceiptUiMode = 'FOLLOW_HQ' | 'ENABLED' | 'DISABLED';
export type TradeReceiptSendStatus = 'SENT' | 'FAILED' | 'SKIPPED';
export type UsdtQuoteResponseMode = 'FOLLOW_HQ' | 'AUTO' | 'MANUAL' | 'OFF';
export type ExpressFeeMode = 'FOLLOW_HQ' | 'CUSTOM' | 'DISABLED';

export const MEMBER_GRADES = [
  'STANDARD',
  'PREMIUM',
  'VIP',
  'VVIP',
  'PRESTIGE',
  'BLACK',
] as const;
export type MemberGrade = (typeof MEMBER_GRADES)[number];
export const USDT_QUOTE_AUTO_DELAY_MINUTES = [
  0, 1, 3, 5, 10, 30, 60, 180, 360, 720, 1440, 2880, 4320,
] as const;
export const USDT_QUOTE_MANUAL_SLA_HOURS = [3, 6, 12, 24] as const;
export type UsdtRiskLimitCode = 'LR' | 'MR' | 'HR' | 'XR' | 'SR' | 'ML';
export const USDT_RISK_LIMIT_CODES: UsdtRiskLimitCode[] = ['LR', 'MR', 'HR', 'XR', 'SR', 'ML'];

export interface FeeDiagramDisplayConfig {
  gross: boolean;
  fxFee: boolean;
  gasFee: boolean;
  transferFee: boolean;
  otherFee: boolean;
  localPremium: boolean;
  /** 운영수수료 — 표시만 제어. 정산은 항상 적용 */
  operatingFee: boolean;
  /** EXPRESS 수수료 */
  expressFee?: boolean;
  net: boolean;
  requiredFiat: boolean;
  showRates: boolean;
  /** 총 수수료(합계·항목) 금액 줄. false면 수령·입금·환율만 */
  showTotalFee?: boolean;
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

export interface ReferrerSearchHit {
  userId: string;
  email: string;
  displayName: string;
  /** 가맹점 연락처로 찾은 경우. 화면에는 유치 조직만 보인다 */
  introducedByUserId?: string;
  /** 가맹점 검색 시 개인/기업 구분 */
  customerType?: 'INDIVIDUAL' | 'CORPORATE';
}

export interface RegisterInput {
  limitCountry?: 'JP' | 'KR' | 'TH' | 'US' | 'CN';
  email: string;
  emailProof: string;
  /** Nickname / display name */
  name: string;
  legalFirstName: string;
  legalLastName: string;
  phone: string;
  phoneCountryCode: string;
  customerType: 'INDIVIDUAL';
  referrerUserId?: string;
  introducedByUserId?: string;
  inviteOrgCode?: string;
  noReferrer?: boolean;
  businessName?: string;
  businessNumber?: string;
  representative?: string;
  businessAddress?: string;
  businessCategory?: string;
  bankAccounts: RegisterBankAccountInput[];
  walletAddress: string;
  walletNetwork?: string;
  walletLabel?: string;
  wiseEnabled?: boolean;
  remittanceProvider?: string;
  remittanceProviderOther?: string;
  wiseSenderName?: string;
  wiseSenderEmail?: string;
  wiseSenderCountry?: string;
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
  referralUserId?: string | null;
  referralUser?: { id: string; email: string; name: string } | null;
  introducerRewardEnabled?: boolean;
  introducerRewardPercent?: number;
  introducerRewardFixedUsdt?: number;
  deletedAt?: string | null;
  purgeAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
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
  referralUserId?: string | null;
  introducerRewardEnabled?: boolean;
  introducerRewardPercent?: number;
  introducerRewardFixedUsdt?: number;
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

export type ExpectedCompleteNamedTier = 'REGULAR' | 'PLUS' | 'PRIME' | 'ELITE' | 'SIGNATURE';
export type ExpectedCompleteTier = ExpectedCompleteNamedTier | 'CUSTOM';

export const EXPECTED_COMPLETE_NAMED_TIERS: ExpectedCompleteNamedTier[] = [
  'REGULAR',
  'PLUS',
  'PRIME',
  'ELITE',
  'SIGNATURE',
];

export const EXPECTED_COMPLETE_TIERS: ExpectedCompleteTier[] = [
  ...EXPECTED_COMPLETE_NAMED_TIERS,
  'CUSTOM',
];

export const EXPECTED_COMPLETE_CUSTOM_DAY_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export type HqCompletionTierDays = Record<ExpectedCompleteNamedTier, number>;

export type HqSlaConfig = {
  timezone: string;
  businessDays: number[];
  businessStart: string;
  businessEnd: string;
  hoursInBusiness: number;
  hoursAfterHours: number;
  completionTiers: HqCompletionTierDays;
  completionTiersCard: HqCompletionTierDays;
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
  legalFirstName?: string | null;
  legalLastName?: string | null;
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
  /** 조직·본사만. 가맹점 API에는 내려가지 않음 */
  introducerSettlement?: {
    introducerName: string;
    introducerEmail: string;
    enabled: boolean;
    percent: number;
    fixedUsdt: number;
    lines: { ticketNo: string; usdtAmount: number; rewardUsdt: number }[];
    totalRewardUsdt: number;
  } | null;
  customerProfile?: {
    id: string;
    customerType: string;
    approvalStatus?: CustomerApprovalStatus;
    businessName?: string | null;
    simulatorEnabled?: boolean;
    simulatorRateMode?: 'LIVE' | 'SAND';
    feeBillingMethod?: FeeBillingMethod;
    totalFeeVisibility?: TotalFeeVisibility;
    usdtRiskLimitCode?: UsdtRiskLimitCode;
    usdtLimitMinUsdt?: number | null;
    usdtLimitMaxUsdt?: number | null;
    limitCountry?: string | null;
    signupCountry?: string | null;
    expectedCompleteTier?: ExpectedCompleteTier;
    expectedCompleteCustomDays?: number | null;
    expectedCompleteCardTier?: ExpectedCompleteTier;
    expectedCompleteCardCustomDays?: number | null;
  usdtCollectionMode?: UsdtCollectionMode;
  usdtPayBankMode?: UsdtPayMethodAccess;
  usdtPayRemittanceMode?: UsdtPayMethodAccess;
  usdtPayCardMode?: UsdtPayMethodAccess;
  usdtQuoteResponseMode?: UsdtQuoteResponseMode;
  tradeReceiptEmailMode?: TradeReceiptEmailMode;
  tradeReceiptAdminUiMode?: TradeReceiptUiMode;
  tradeReceiptMerchantUiMode?: TradeReceiptUiMode;
  usdtQuoteAutoDelayMinutes?: number | null;
  usdtQuoteManualSlaHours?: number | null;
  expressFeeMode?: ExpressFeeMode;
  expressFeeConfig?: unknown;
  memberGrade?: MemberGrade;
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
    deleteRequestedAt?: string | null;
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
  approvalStatus?: CustomerApprovalStatus;
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
  /** 비활성 로그인 안내 (내부 사유와 별도) */
  loginNotice?: string | null;
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
  totalFeeVisibility?: TotalFeeVisibility;
  usdtCollectionMode?: UsdtCollectionMode;
  usdtQuoteResponseMode?: UsdtQuoteResponseMode;
  tradeReceiptEmailMode?: TradeReceiptEmailMode;
  tradeReceiptAdminUiMode?: TradeReceiptUiMode;
  tradeReceiptMerchantUiMode?: TradeReceiptUiMode;
  usdtQuoteAutoDelayMinutes?: number | null;
  usdtQuoteManualSlaHours?: number | null;
  operatorsEnabled?: boolean;
  walletFeesVisible?: boolean;
  usdtRiskLimitCode?: UsdtRiskLimitCode;
  usdtLimitMinUsdt?: number | null;
  usdtLimitMaxUsdt?: number | null;
  limitCountry?: 'JP' | 'KR' | 'TH' | 'US' | 'CN' | null;
  expectedCompleteTier?: ExpectedCompleteTier;
  expectedCompleteCustomDays?: number | null;
  expectedCompleteCardTier?: ExpectedCompleteTier;
  expectedCompleteCardCustomDays?: number | null;
  expressFeeMode?: ExpressFeeMode;
  expressFeeConfig?: unknown;
  memberGrade?: MemberGrade;
}

export interface UpdateUserInput {
  name?: string;
  legalFirstName?: string | null;
  legalLastName?: string | null;
  phone?: string | null;
  role?: UserRoleType;
  organizationId?: string | null;
  isActive?: boolean;
  recruitingOrgId?: string;
  statusReason?: string;
  /** 비활성 시 로그인 안내 (선택). 비우면 HQ 기본/프리셋 안내 */
  statusLoginNotice?: string | null;
  feeShare?: CustomerFeeShare;
  simulatorEnabled?: boolean;
  simulatorRateMode?: 'LIVE' | 'SAND';
  feeBillingMethod?: FeeBillingMethod;
  totalFeeVisibility?: TotalFeeVisibility;
  usdtCollectionMode?: UsdtCollectionMode;
  usdtPayBankMode?: UsdtPayMethodAccess;
  usdtPayRemittanceMode?: UsdtPayMethodAccess;
  usdtPayCardMode?: UsdtPayMethodAccess;
  usdtQuoteResponseMode?: UsdtQuoteResponseMode;
  tradeReceiptEmailMode?: TradeReceiptEmailMode;
  tradeReceiptAdminUiMode?: TradeReceiptUiMode;
  tradeReceiptMerchantUiMode?: TradeReceiptUiMode;
  usdtQuoteAutoDelayMinutes?: number | null;
  usdtQuoteManualSlaHours?: number | null;
  operatorsEnabled?: boolean;
  walletFeesVisible?: boolean;
  usdtRiskLimitCode?: UsdtRiskLimitCode;
  usdtLimitMinUsdt?: number | null;
  usdtLimitMaxUsdt?: number | null;
  limitCountry?: 'JP' | 'KR' | 'TH' | 'US' | 'CN' | null;
  expectedCompleteTier?: ExpectedCompleteTier;
  expectedCompleteCustomDays?: number | null;
  expectedCompleteCardTier?: ExpectedCompleteTier;
  expectedCompleteCardCustomDays?: number | null;
  expressFeeMode?: ExpressFeeMode;
  expressFeeConfig?: unknown;
  customerType?: 'INDIVIDUAL' | 'CORPORATE';
  memberGrade?: MemberGrade;
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
  deleteRequestedAt?: string | null;
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
  label: string;
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
  hasOverrides?: boolean;
}

export interface MerchantOperatorPageAccess {
  user: { id: string; email: string; name: string; role: string };
  pages: { path: string; label: string; group: string }[];
  permissionLevels: HqPermissionLevel[];
  base: Record<string, HqPermissionLevel>;
  overrides: Record<string, HqPermissionLevel> | null;
  effective: Record<string, HqPermissionLevel>;
}

export interface MerchantOperationLog {
  id: string;
  action: string;
  summary: string;
  createdAt: string;
  actor: { id: string; email: string; name: string; role: string };
  merchantAdmin: { id: string; email: string; name: string };
}

export interface TradeReceiptEmailLogSummary {
  id: string;
  ticketId: string | null;
  ticketNo: string;
  ticketType: string;
  toEmail: string;
  toName: string | null;
  subject: string;
  status: TradeReceiptSendStatus;
  skipReason: string | null;
  errorMessage: string | null;
  customerProfileId: string | null;
  createdAt: string;
}

export interface TradeReceiptEmailLogDetail extends TradeReceiptEmailLogSummary {
  bodyText: string;
  bodyHtml: string | null;
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
  /** ACH/SEPA bank country (e.g. US, MT) */
  bankCountry?: string;
  /** USD ACH routing number */
  routingNumber?: string;
  /** EUR SEPA BIC/SWIFT */
  bic?: string;
  notice?: string;
  noticeI18n?: Partial<Record<'KR' | 'US' | 'JP' | 'CH' | 'TH', string>>;
  transferEnabled?: boolean;
  cardEnabled?: boolean;
  /** 송금계좌(DIRECT) 모드에서 이 통화 사용 가능 */
  remittanceEnabled?: boolean;
}

export interface UsdtCurrencyTradeFlags {
  transfer: boolean;
  card: boolean;
}

export type UsdtServiceFlags = {
  transfer: boolean;
  card: boolean;
  remittance: boolean;
};

export type UsdtServiceCustomerType = 'INDIVIDUAL' | 'CORPORATE';

export type HqUsdtServiceMatrix = Record<
  UsdtServiceCustomerType,
  Record<'KRW' | 'JPY' | 'THB' | 'CNY' | 'USD' | 'EUR', UsdtServiceFlags>
>;

export interface UsdtExpressOption {
  tier: string;
  feeUsdt: number;
  feePercent?: number;
  maxHours: number;
}

export interface UsdtDepositContext {
  receivingAccounts: Partial<Record<'KRW' | 'JPY' | 'THB' | 'CNY' | 'USD' | 'EUR', DepositReceivingAccountInfo>>;
  currencyTrade?: Record<'KRW' | 'JPY' | 'THB' | 'CNY' | 'USD' | 'EUR', UsdtCurrencyTradeFlags>;
  curfexEnabledCurrencies?: Array<'JPY' | 'KRW' | 'THB' | 'CNY'>;
  usdtCollectionMode?: UsdtCollectionMode;
  hqDefaultCollectionMode?: 'FIXED' | 'VIRTUAL' | 'DIRECT';
  /** 직접송금(DIRECT) 적용 시 true — HQ 지정 통화만 이체 */
  individualDirectRemit?: boolean;
  individualDirectRemitCurrencies?: Array<'KRW' | 'JPY' | 'THB' | 'CNY' | 'USD' | 'EUR'>;
  directRemitCurrencies?: Array<'KRW' | 'JPY' | 'THB' | 'CNY' | 'USD' | 'EUR'>;
  /** 송금거래 결제수단 통화 (USD/EUR…) — 입력·한도 모두 해당 통화 */
  remittancePaymentCurrencies?: Array<'KRW' | 'JPY' | 'THB' | 'CNY' | 'USD' | 'EUR'>;
  remittancePaymentAvailable?: boolean;
  bankPaymentAvailable?: boolean;
  cardPaymentCustomerAllowed?: boolean;
  usdtPayBankMode?: UsdtPayMethodAccess;
  usdtPayRemittanceMode?: UsdtPayMethodAccess;
  usdtPayCardMode?: UsdtPayMethodAccess;
  preferRemittancePayment?: boolean;
  /** 개인 한도 국가·등록 통장에 맞춘 계좌이체 기본 통화 */
  preferredBankCurrency?: string | null;
  /** 실제 매입 1회 USDT 한도 */
  usdtRiskLimit?: { code: string; minUsdt: number; maxUsdt: number } | null;
  /** 시뮬레이터 전용 1회 USDT 한도 */
  simulatorUsdtRiskLimit?: { code: string; minUsdt: number; maxUsdt: number } | null;
  /** 개인 국가 기준 한도 */
  individualCountryLimit?: {
    country: string;
    source: string;
    homeCurrency: string;
    maxFiat: number;
    maxUsd: number;
    minUsdt: number;
    maxUsdt: number;
  } | null;
  /** HQ 한도 설정 — 고객유형별 통화 한도 */
  applicationLimits?: {
    enabled: boolean;
    customerType: 'INDIVIDUAL' | 'CORPORATE';
    byCurrency: Record<
      'KRW' | 'JPY' | 'THB' | 'CNY' | 'USD' | 'EUR',
      {
        perTransactionMin: number;
        perTransactionMax: number;
        dailyMin: number;
        dailyMax: number;
        monthlyMin: number;
        monthlyMax: number;
      }
    >;
    byMethod?: Partial<
      Record<
        'BANK_TRANSFER' | 'REMITTANCE' | 'CARD',
        Record<
          'KRW' | 'JPY' | 'THB' | 'CNY' | 'USD' | 'EUR',
          {
            perTransactionMin: number;
            perTransactionMax: number;
            dailyMin: number;
            dailyMax: number;
            monthlyMin: number;
            monthlyMax: number;
          }
        >
      >
    >;
  } | null;
  registeredBank: { bankName: string; accountNumber: string; accountHolder: string } | null;
  depositWindowHours: number;
  /** 신청 페이지 무동작(분) */
  applyIdleMinutes?: number;
  /** 신청 페이지 최대 체류(분) */
  applyMaxMinutes?: number;
  /** 견적 확정 후 유효(분) */
  quoteValidMinutes?: number;
  dailyTicketCount?: number;
  maxDailyTicketsPerCustomer?: number;
  dailyTicketLimitReached?: boolean;
  quoteResponse?: {
    enabled: boolean;
    mode: 'AUTO' | 'MANUAL';
    autoDelayMinutes: number;
    manualSlaHours: number;
    applyIdleMinutes?: number;
    applyMaxMinutes?: number;
    quoteValidMinutes?: number;
  };
  usdtQuoteResponseMode?: UsdtQuoteResponseMode;
  express?: {
    enabled: boolean;
    tier: string | null;
    feeUsdt: number;
    feePercent?: number;
    maxHours?: number;
    options: UsdtExpressOption[];
    source?: string;
  };
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
    expressFeeUsdt?: number;
    expressFeePercent?: number;
    expressTier?: string;
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
    expressFeeUsdt?: number;
    expressFeePercent?: number;
    expressTier?: string;
    netUsdt: number;
    requiredFiat: number;
    fairExchangeRate?: number;
  };
  localPremium?: LocalPremiumInfo;
  kimchiPremium?: KimchiPremiumInfo;
  transactionLimits?: TransactionLimitSummary;
  feeDiagramDisplay?: FeeDiagramDisplayConfig;
  currencyAmountDisplay?: HqCurrencyAmountDisplayPolicy;
  /** 금액 범위 표시 비율 — 거래신청 8, 시뮬 5 */
  amountRangePct?: number;
  /** 시뮬/매입 시 적용된 USDT 1회 한도 */
  riskLimit?: { code: string; minUsdt: number; maxUsdt: number } | null;
  paymentMethod?: 'CARD';
  cardFeePercent?: number;
  cardFeeFiat?: number;
  cardChargeFiat?: number;
  fiatForConversion?: number;
  /** ICOPAY settlement (THB) */
  cardPayCurrency?: string;
  cardPayAmount?: number;
  cardPayCrossRate?: number;
  cardPayUsdtRate?: number;
  express?: {
    enabled: boolean;
    tier: ExpressTier | string | null;
    feeUsdt: number;
    feePercent?: number;
    maxHours?: number;
    options: UsdtExpressOption[];
    source?: string;
  };
}

export interface UsdtCardPaymentContext {
  cardPaymentEnabled: boolean;
  enabled: boolean;
  cardFeePercent: number;
  cardFeeMode?: CardFeeMode;
  cardFeeByBrand?: Record<CardFeeBrand, number>;
  limits: Record<SymbolFeeCurrency, { min: number; max: number }>;
  currencyTrade?: Record<'KRW' | 'JPY' | 'THB' | 'CNY' | 'USD' | 'EUR', UsdtCurrencyTradeFlags>;
  icopayConfigured: boolean;
  webhookUrl?: string;
  resultUrl?: string;
  userPhone: string | null;
  userPhoneCountryCode: string | null;
  userEmail: string | null;
  userName: string | null;
  legalFirstName?: string | null;
  legalLastName?: string | null;
  legalNameLocked?: boolean;
}

/** Buyer prefill for ICOPAY hosted checkout (no PAN on TINPASS). */
export interface CardPaymentInput {
  cardholderName: string;
  email: string;
  phone: string;
  phoneCountryCode: string;
  firstName?: string;
  lastName?: string;
}

export interface IcopayCheckoutInfo {
  payUrl: string;
  sessionId: string;
  sessionToken: string;
  embedScriptUrl?: string;
  expiresAt?: string;
  integrationMode?: string;
  orderNo: string;
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
  /** 금일 활성 티켓 건수 (견적대기 포함) */
  dailyTicketCount?: number;
  /** 본사 리스크: 고객 일일 최대 거래 건수 (0=무제한) */
  maxDailyTicketsPerCustomer?: number;
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
  paymentMethod?: 'BANK_TRANSFER' | 'CARD' | 'REMITTANCE';
  expressTier?: string | null;
  expressFeeUsdt?: number | null;
  expressDueAt?: string | null;
  memberGrade?: string | null;
  expressActualTier?: string | null;
  expressFeeSettledUsdt?: number | null;
  expressSlaMet?: boolean | null;
  expressElapsedHours?: number | null;
  expressRefundUsdt?: number | null;
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
  quoteMode?: string | null;
  quoteDueAt?: string | null;
  quoteConfirmedAt?: string | null;
  confirmedFiatAmount?: number | null;
  confirmedUsdtAmount?: number | null;
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
  cardPayCurrency?: string | null;
  cardPayAmount?: number | null;
  cardPayCrossRate?: number | null;
  cardPayUsdtRate?: number | null;
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
  sandboxInvoice?: boolean;
  commissionSettled: boolean;
  createdAt: string;
  expectedCompleteAt?: string | null;
  expectedCompleteBaseAt?: string | null;
  scheduleDelayHoursTotal?: number;
  scheduleDelays?: {
    id: string;
    delayHours: number;
    reason: string;
    createdAt: string;
    createdBy?: { id: string; name: string; email: string };
  }[];
  completedAt?: string | null;
  attachments: Attachment[];
  statusHistory: StatusHistory[];
  wallet?: Wallet;
  registeredBank?: BankAccountInfo | null;
  customer?: { user: { name: string; email: string } };
  feeDiagramDisplay?: FeeDiagramDisplayConfig;
  tradeReceipt?: { archive: boolean; email: boolean; adminUi: boolean; merchantUi: boolean };
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
  expectedCompleteBaseAt?: string | null;
  scheduleDelayHoursTotal?: number;
  scheduleDelays?: {
    id: string;
    delayHours: number;
    reason: string;
    createdAt: string;
    createdBy?: { id: string; name: string; email: string };
  }[];
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
    accountType?: string;
    bankCountry?: string;
    routingNumber?: string;
    bic?: string;
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
  listUserAccess: () => request<{ users: HqUserPageAccessRow[] }>('/api/hq-policy/user-access'),
  getUserAccess: (userId: string) =>
    request<HqUserPageAccessDetail>(`/api/hq-policy/user-access/${userId}`),
  saveUserAccess: (userId: string, overrides: Record<string, string> | null) =>
    request<HqUserPageAccessDetail>(`/api/hq-policy/user-access/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({ overrides }),
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
  saveSymbolFeeTiers: (feeTiersByCustomerType: SymbolFeeTiersByCustomerType) =>
    request<HqCommissionPayload>('/api/hq-policy/commission/fee-tiers', {
      method: 'PUT',
      body: JSON.stringify({ feeTiersByCustomerType }),
    }),
  saveExpressFee: (expressFee: HqExpressPolicy) =>
    request<HqCommissionPayload>('/api/hq-policy/commission/express-fee', {
      method: 'PUT',
      body: JSON.stringify({ expressFee }),
    }),
  saveMemberGrade: (memberGrade: HqMemberGradePolicy) =>
    request<HqCommissionPayload>('/api/hq-policy/commission/member-grade', {
      method: 'PUT',
      body: JSON.stringify({ memberGrade }),
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
  saveUsdtQuoteResponse: (usdtQuoteResponse: {
    enabled: boolean;
    mode: 'AUTO' | 'MANUAL';
    autoDelayMinutes: number;
    manualSlaHours: number;
    applyIdleMinutes: number;
    applyMaxMinutes: number;
    quoteValidMinutes: number;
  }) =>
    request<HqCommissionPayload>('/api/hq-policy/commission/usdt-quote-response', {
      method: 'PUT',
      body: JSON.stringify({ usdtQuoteResponse }),
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
  uploadPlatformRegisterBackground: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<HqPlatformPayload>('/api/hq-policy/platform/register-background', {
      method: 'POST',
      body: form,
    });
  },
  clearPlatformRegisterBackground: () =>
    request<HqPlatformPayload>('/api/hq-policy/platform/register-background', {
      method: 'DELETE',
    }),
  uploadPlatformOgImage: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<HqPlatformPayload>('/api/hq-policy/platform/og', {
      method: 'POST',
      body: form,
    });
  },
  getUsdtServices: () =>
    request<{ config: HqUsdtServiceMatrix }>('/api/hq-policy/usdt-services'),
  saveUsdtServices: (config: HqUsdtServiceMatrix) =>
    request<{ config: HqUsdtServiceMatrix }>('/api/hq-policy/usdt-services', {
      method: 'PUT',
      body: JSON.stringify({ config }),
    }),
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
  pageGroups?: string[];
  orgLevels: string[];
  permissionLevels: HqPermissionLevel[];
  matrix: HqAccessMatrix;
}

export interface HqUserPageAccessRow {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  organization: { id: string; name: string; type: string } | null;
  hasOverrides: boolean;
}

export interface HqUserPageAccessDetail {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    organization: { id: string; name: string; type: string } | null;
  };
  pages: { path: string; label: string; group: string }[];
  permissionLevels: HqPermissionLevel[];
  base: Record<string, HqPermissionLevel>;
  overrides: Record<string, HqPermissionLevel> | null;
  effective: Record<string, HqPermissionLevel>;
  locked: boolean;
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

export type UsdtRiskLimitTier = 'LR' | 'MR' | 'HR' | 'XR' | 'SR';

export type UsdtRiskLimitBand = {
  minUsdt: number;
  maxUsdt: number;
};

export type HqUsdtRiskLimitTiers = Record<UsdtRiskLimitTier, UsdtRiskLimitBand>;

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
  /** 시뮬레이터 SAND 전용 도식 (없으면 LIVE feeDiagramDisplay와 동일하게 취급) — 고객용 */
  sandboxFeeDiagramDisplay?: FeeDiagramDisplayConfig;
  /** 본사·운영자용 LIVE 도식 (기본 전부 ON) */
  hqFeeDiagramDisplay?: FeeDiagramDisplayConfig;
  /** 본사·운영자용 Sandbox 도식 */
  hqSandboxFeeDiagramDisplay?: FeeDiagramDisplayConfig;
  /** 총 수수료 노출 — LIVE·Sandbox 공통 */
  showTotalFee?: boolean;
  /** USDT 기준 리스크 한도 5종 (LR/MR/HR/XR/SR) */
  usdtRiskLimitTiers?: HqUsdtRiskLimitTiers;
  maxTicketAmountKrw: number;
  riskEnabled: boolean;
  maxDailyTicketsPerCustomer: number;
  /** @deprecated methodTransactionLimits.BANK_TRANSFER */
  transactionLimits: CustomerTransactionLimitsPolicy;
  /** 이체 / 송금 / 카드 결제수단별 한도 */
  methodTransactionLimits?: MethodTransactionLimitsPolicy;
  notes?: string;
  defaultPlatformFeeUsdt?: number;
}

export type LimitPaymentMethod = 'BANK_TRANSFER' | 'REMITTANCE' | 'CARD';

export type MethodTransactionLimitsPolicy = Record<
  LimitPaymentMethod,
  CustomerTransactionLimitsPolicy
>;

export type SymbolFeeCurrency = 'KRW' | 'JPY' | 'THB' | 'CNY' | 'USD' | 'EUR';

export interface SymbolFeeTierRow extends TransactionFees {
  id: string;
  currency: SymbolFeeCurrency;
  maxAmount: number;
}

export type SymbolFeeTiersByCustomerType = {
  INDIVIDUAL: SymbolFeeTierRow[];
  CORPORATE: SymbolFeeTierRow[];
};

export const EXPRESS_TIERS = [
  'ULTRA',
  'PRIORITY',
  'HALF',
  'DAY',
  'T1',
  'T2',
  'BASIC',
] as const;
export type ExpressTier = (typeof EXPRESS_TIERS)[number];

export type ExpressTierFeeConfig = {
  feeUsdt: number | null;
  feePercent: number | null;
  /** 등급별 사용(관리). 미사용이어도 수수료 값은 유지 */
  enabled: boolean;
};
export type HqExpressCustomerTypePolicy = {
  enabled: boolean;
  tiers: Record<ExpressTier, ExpressTierFeeConfig>;
};
export type HqExpressPolicy = {
  INDIVIDUAL: HqExpressCustomerTypePolicy;
  CORPORATE: HqExpressCustomerTypePolicy;
};

export function defaultExpressCustomerTypePolicy(): HqExpressCustomerTypePolicy {
  return {
    enabled: false,
    tiers: {
      ULTRA: { feeUsdt: null, feePercent: null, enabled: false },
      PRIORITY: { feeUsdt: null, feePercent: null, enabled: false },
      HALF: { feeUsdt: null, feePercent: null, enabled: false },
      DAY: { feeUsdt: null, feePercent: null, enabled: false },
      T1: { feeUsdt: null, feePercent: null, enabled: false },
      T2: { feeUsdt: null, feePercent: null, enabled: false },
      BASIC: { feeUsdt: 0, feePercent: null, enabled: true },
    },
  };
}

export function defaultExpressPolicy(): HqExpressPolicy {
  return {
    INDIVIDUAL: defaultExpressCustomerTypePolicy(),
    CORPORATE: defaultExpressCustomerTypePolicy(),
  };
}

export type MemberGradeExpressBenefit = {
  tierFees: Record<ExpressTier, number | null>;
  tierFeePercents: Record<ExpressTier, number | null>;
  discountPercent: number;
  discountUsdt: number;
};

export type HqMemberGradeCustomerTypePolicy = {
  grades: Record<MemberGrade, MemberGradeExpressBenefit>;
};

/** 법인·개인 각각 회원등급 EXPRESS 추가 수수료 */
export type HqMemberGradePolicy = {
  INDIVIDUAL: HqMemberGradeCustomerTypePolicy;
  CORPORATE: HqMemberGradeCustomerTypePolicy;
};

function defaultMemberGradeBenefit(
  discountPercent = 0,
  discountUsdt = 0,
  ultraFeeUsdt: number | null = null,
): MemberGradeExpressBenefit {
  return {
    tierFees: {
      ULTRA: ultraFeeUsdt,
      PRIORITY: null,
      HALF: null,
      DAY: null,
      T1: null,
      T2: null,
      BASIC: null,
    },
    tierFeePercents: {
      ULTRA: null,
      PRIORITY: null,
      HALF: null,
      DAY: null,
      T1: null,
      T2: null,
      BASIC: null,
    },
    discountPercent,
    discountUsdt,
  };
}

function defaultMemberGradeCustomerTypePolicy(): HqMemberGradeCustomerTypePolicy {
  // 1차 보수안: % 할인 위주, Black만 ULTRA 0 + 소액 USDT
  return {
    grades: {
      STANDARD: defaultMemberGradeBenefit(0, 0),
      PREMIUM: defaultMemberGradeBenefit(3, 0),
      VIP: defaultMemberGradeBenefit(5, 0),
      VVIP: defaultMemberGradeBenefit(8, 0),
      PRESTIGE: defaultMemberGradeBenefit(12, 0),
      BLACK: defaultMemberGradeBenefit(15, 1, 0),
    },
  };
}

export function defaultMemberGradePolicy(): HqMemberGradePolicy {
  return {
    INDIVIDUAL: defaultMemberGradeCustomerTypePolicy(),
    CORPORATE: defaultMemberGradeCustomerTypePolicy(),
  };
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
  /** USDT 매입 견적 응답 (고객 프로필). TRADE_ESCROW 행에도 동일 값 포함 */
  usdtQuoteResponseMode?: UsdtQuoteResponseMode;
  usdtQuoteAutoDelayMinutes?: number | null;
  usdtQuoteManualSlaHours?: number | null;
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
  feeTiersByCustomerType?: SymbolFeeTiersByCustomerType;
  expressFee?: HqExpressPolicy;
  memberGrade?: HqMemberGradePolicy;
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
  usdtQuoteResponse?: {
    enabled: boolean;
    mode: 'AUTO' | 'MANUAL';
    autoDelayMinutes: number;
    manualSlaHours: number;
    applyIdleMinutes?: number;
    applyMaxMinutes?: number;
    quoteValidMinutes?: number;
  };
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
  EUR?: HqCurrencyAmountRule;
};

export interface BrandingResponse {
  siteName: string;
  currencyAmountDisplay?: unknown;
  tabTitle?: string;
  logoUrl: string | null;
  authLogoUrl: string | null;
  faviconUrl: string | null;
  authBackgroundUrl: string | null;
  registerBackgroundUrl: string | null;
  authMainText: string;
  footerText: string;
  loginNoticeEnabled: boolean;
  loginNoticeI18n: Partial<
    Record<'KR' | 'JP' | 'US' | 'CH' | 'TH', { title: string; body: string }>
  >;
  customerRegistrationEnabled: boolean;
  accountRecoveryEnabled?: boolean;
  individualRegisterNoticeEnabled?: boolean;
  individualRegisterNoticeI18n?: Partial<
    Record<'KR' | 'JP' | 'US' | 'CH' | 'TH', { title: string; body: string }>
  >;
  defaultUsdtFiatCurrency?: 'KRW' | 'JPY' | 'THB' | 'CNY' | 'USD' | 'EUR';
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
  /** LINE·WhatsApp 미리보기 이미지 */
  ogImageUrl?: string;
  /** LINE·WhatsApp 미리보기 제목. 비우면 사이트 이름 */
  ogTitle?: string;
  /** LINE·WhatsApp 미리보기 설명. 로그인 배경 문구와 별도 */
  ogDescription?: string;
  logoUrl?: string;
  authLogoUrl?: string;
  faviconUrl?: string;
  authBackgroundUrl?: string;
  registerBackgroundUrl?: string;
  authMainText?: string;
  footerText?: string;
  loginNoticeEnabled?: boolean;
  loginNoticeI18n?: Partial<
    Record<'KR' | 'JP' | 'US' | 'CH' | 'TH', { title: string; body: string }>
  >;
  customerRegistrationEnabled?: boolean;
  accountRecoveryEnabled?: boolean;
  individualRegisterNoticeEnabled?: boolean;
  individualRegisterNoticeI18n?: Partial<
    Record<'KR' | 'JP' | 'US' | 'CH' | 'TH', { title: string; body: string }>
  >;
  idleTimeoutMinutes?: number;
  /** 비활성 계정 로그인 기본 안내 (다국어) */
  inactiveLoginNoticeI18n?: Partial<Record<'KR' | 'JP' | 'US' | 'CH' | 'TH', string>>;
  /** 비활성 사유 빠른 선택 프리셋 */
  inactiveLoginNoticePresets?: Array<{
    id: 'BASIC' | 'INCONVENIENCE' | 'WARNING';
    title?: string;
    bodyI18n?: Partial<Record<'KR' | 'JP' | 'US' | 'CH' | 'TH', string>>;
  }>;
  defaultUsdtFiatCurrency?: 'KRW' | 'JPY' | 'THB' | 'CNY' | 'USD' | 'EUR';
  simulatorRetentionMonths?: number;
  /** Issue Invoice on simulator runs (tinpass-sim). Default true when configured. */
  simulatorInvoiceEnabled?: boolean;
  depositReceivingAccounts?: Partial<Record<'KRW' | 'JPY' | 'THB' | 'CNY' | 'USD' | 'EUR', DepositReceivingAccountInfo>>;
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
  tradeReceiptEmailMode?: 'ENABLED' | 'DISABLED' | 'HQ_ONLY';
  tradeReceiptAdminUiEnabled?: boolean;
  tradeReceiptMerchantUiEnabled?: boolean;
}

export type IcopayBrokerEnv = 'LIVE' | 'SANDBOX' | 'LOCAL_MOCK';

export interface HqIcopayConfig {
  enabled: boolean;
  mid: string;
  compId?: string;
  /** Active broker secret used by API (synced from selected env slot) */
  bracketSecret: string;
  brokerSecretLive?: string;
  brokerSecretSandbox?: string;
  /** masked response only — last 3 of LIVE secret */
  brokerSecretLiveTail?: string;
  /** masked response only — last 3 of SANDBOX secret */
  brokerSecretSandboxTail?: string;
  bracketSecretTail?: string;
  activeBrokerEnv?: IcopayBrokerEnv;
  apiBaseUrl?: string;
  sandbox?: boolean;
  channel?: 'IN' | 'RE';
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
  /** @deprecated use defaultCollectionModeCorporate */
  defaultCollectionMode?: 'FIXED' | 'VIRTUAL' | 'DIRECT';
  /** Corporate FOLLOW_HQ default */
  defaultCollectionModeCorporate?: 'FIXED' | 'VIRTUAL' | 'DIRECT';
  /** Individual FOLLOW_HQ default (seed DIRECT = remittance account) */
  defaultCollectionModeIndividual?: 'FIXED' | 'VIRTUAL' | 'DIRECT';
  /** @deprecated source of truth is deposit account remittanceEnabled */
  directRemitCurrencies?: Array<'KRW' | 'JPY' | 'THB' | 'CNY' | 'USD' | 'EUR'>;
}

export type CardCurrencyLimits = { min: number; max: number };

export type CardFeeBrand = 'VISA' | 'MASTERCARD' | 'AMEX' | 'JCB' | 'UNIONPAY' | 'OTHER';
export type CardFeeMode = 'UNIFORM' | 'BY_BRAND';

export interface HqCardPaymentConfig {
  enabled: boolean;
  cardFeeMode?: CardFeeMode;
  cardFeePercent: number;
  cardFeeByBrand?: Record<CardFeeBrand, number>;
  limits: Record<SymbolFeeCurrency, CardCurrencyLimits>;
}
