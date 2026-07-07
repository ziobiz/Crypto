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

  dashboardCharts: (range: ChartRange = '30d') =>
    request<DashboardChartsResponse>(`/api/dashboard/charts?range=${range}`),

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
    resetPassword: (id: string, password?: string) =>
      request<{ ok: boolean; initialPassword?: string }>(`/api/users/${id}/password`, {
        method: 'PATCH',
        body: JSON.stringify(password ? { password } : {}),
      }),
    resetOtp: (id: string) =>
      request<{ ok: boolean; totpEnabled: boolean }>(`/api/users/${id}/otp`, {
        method: 'PATCH',
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
      },
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
  sessionPolicy?: SessionPolicy;
  wallets: Wallet[];
  customerProfile?: {
    id: string;
    customerType: string;
    recruitingOrg?: { id: string; name: string; code: string };
  };
}

export interface SessionPolicy {
  idleTimeoutMinutes: number;
  defaultUsdtFiatCurrency: 'KRW' | 'JPY' | 'THB' | 'CNY';
}

export interface FeeDiagramDisplayConfig {
  gross: boolean;
  fxFee: boolean;
  gasFee: boolean;
  transferFee: boolean;
  otherFee: boolean;
  localPremium: boolean;
  net: boolean;
  requiredFiat: boolean;
  showRates: boolean;
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
}

export type UserRoleType = 'SUPER_ADMIN' | 'ORG_STAFF' | 'CUSTOMER';

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
    recruitingOrg?: { id: string; code: string; name: string };
  } | null;
  wallets?: { id: string; label?: string | null; address: string; network: string; isDefault: boolean }[];
  bankAccounts?: {
    id: string;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    isDefault: boolean;
  }[];
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
}

export interface UpdateUserInput {
  name?: string;
  phone?: string | null;
  role?: UserRoleType;
  organizationId?: string | null;
  isActive?: boolean;
  recruitingOrgId?: string;
  statusReason?: string;
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
  rates: Record<string, { rate: number; label: string; source?: string }>;
  source: string;
  fetchedAt: string;
  disclaimer: string;
}

export interface UsdtDepositContext {
  receivingAccounts: Partial<
    Record<'KRW' | 'JPY' | 'THB' | 'CNY', { bankName: string; accountNumber: string; accountHolder: string }>
  >;
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
    netUsdt: number;
    requiredFiat: number;
    fairExchangeRate?: number;
  };
  localPremium?: LocalPremiumInfo;
  kimchiPremium?: KimchiPremiumInfo;
  transactionLimits?: TransactionLimitSummary;
  feeDiagramDisplay?: FeeDiagramDisplayConfig;
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
  usdtTxId?: string;
  actualUsdtAmount?: number;
  adminNote?: string;
  commissionSettled: boolean;
  createdAt: string;
  attachments: Attachment[];
  statusHistory: StatusHistory[];
  wallet?: Wallet;
  registeredBank?: BankAccountInfo | null;
  customer?: { user: { name: string; email: string } };
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
  totalAmount: number;
  currency: string;
  totalAmountAll?: number;
  totalsByCurrency: Record<string, number>;
  byTicketType: Record<string, Record<string, number>>;
  count: number;
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

export interface HqCommissionPayload {
  risk: HqCommissionRiskConfig;
  feeTiers: SymbolFeeTierRow[];
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
  customerRegistrationEnabled: boolean;
  defaultUsdtFiatCurrency?: 'KRW' | 'JPY' | 'THB' | 'CNY';
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
  customerRegistrationEnabled?: boolean;
  idleTimeoutMinutes?: number;
  defaultUsdtFiatCurrency?: 'KRW' | 'JPY' | 'THB' | 'CNY';
  depositReceivingAccounts?: Partial<
    Record<'KRW' | 'JPY' | 'THB' | 'CNY', { bankName: string; accountNumber: string; accountHolder: string }>
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

export interface HqIcopayConfig {
  enabled: boolean;
  mid: string;
  bracketSecret: string;
  apiBaseUrl?: string;
  sandbox?: boolean;
}

export type CardCurrencyLimits = { min: number; max: number };

export interface HqCardPaymentConfig {
  enabled: boolean;
  cardFeePercent: number;
  limits: Record<SymbolFeeCurrency, CardCurrencyLimits>;
}
