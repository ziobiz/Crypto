'use client';

import type { ReactNode } from 'react';
import type { MessageKey } from '@/i18n/messages';

export type SessionIdentityKind =
  | 'customer_individual'
  | 'customer_corporate'
  | 'operator_individual'
  | 'operator_corporate'
  | 'super_admin'
  | 'org_head_office'
  | 'org_master'
  | 'org_branch'
  | 'org_agency'
  | 'org_sales'
  | 'organizer'
  | 'settlement'
  | 'default';

type Tone = { bg: string; fg: string };

const TONES: Record<SessionIdentityKind, Tone> = {
  customer_individual: { bg: 'bg-sky-100', fg: 'text-sky-600' },
  customer_corporate: { bg: 'bg-rose-100', fg: 'text-rose-600' },
  operator_individual: { bg: 'bg-sky-100', fg: 'text-sky-700' },
  operator_corporate: { bg: 'bg-rose-100', fg: 'text-rose-700' },
  super_admin: { bg: 'bg-violet-100', fg: 'text-violet-700' },
  org_head_office: { bg: 'bg-indigo-100', fg: 'text-indigo-700' },
  org_master: { bg: 'bg-amber-100', fg: 'text-amber-700' },
  org_branch: { bg: 'bg-teal-100', fg: 'text-teal-700' },
  org_agency: { bg: 'bg-orange-100', fg: 'text-orange-700' },
  org_sales: { bg: 'bg-emerald-100', fg: 'text-emerald-700' },
  organizer: { bg: 'bg-purple-100', fg: 'text-purple-700' },
  settlement: { bg: 'bg-lime-100', fg: 'text-lime-700' },
  default: { bg: 'bg-slate-100', fg: 'text-slate-600' },
};

export type SessionIdentityUser = {
  role: string;
  organization?: { type?: string } | null;
  customerProfile?: { customerType?: string } | null;
};

export function resolveSessionIdentityKind(user: SessionIdentityUser): SessionIdentityKind {
  const role = user.role;
  const customerType = String(user.customerProfile?.customerType ?? '').toUpperCase();
  const isCorporate = customerType === 'CORPORATE';

  if (role === 'CUSTOMER') {
    return isCorporate ? 'customer_corporate' : 'customer_individual';
  }
  if (role === 'CUSTOMER_OPERATOR') {
    return isCorporate ? 'operator_corporate' : 'operator_individual';
  }
  if (role === 'SUPER_ADMIN') return 'super_admin';
  if (role === 'ORGANIZER') return 'organizer';
  if (role === 'SETTLEMENT_ADMIN') return 'settlement';
  if (role === 'ORG_STAFF') {
    const orgType = String(user.organization?.type ?? '').toUpperCase();
    if (orgType === 'HEAD_OFFICE') return 'org_head_office';
    if (orgType === 'MASTER_DISTRIBUTOR') return 'org_master';
    if (orgType === 'REGIONAL_BRANCH' || orgType === 'BRANCH') return 'org_branch';
    if (orgType === 'AGENCY') return 'org_agency';
    if (orgType === 'SALES_OFFICE') return 'org_sales';
    return 'org_sales';
  }
  return 'default';
}

export function sessionIdentityAriaKey(kind: SessionIdentityKind): MessageKey {
  switch (kind) {
    case 'customer_individual':
    case 'operator_individual':
      return 'session.identity.individual';
    case 'customer_corporate':
    case 'operator_corporate':
      return 'session.identity.corporate';
    case 'super_admin':
      return 'role.SUPER_ADMIN';
    case 'org_head_office':
      return 'org.HEAD_OFFICE';
    case 'org_master':
      return 'org.MASTER_DISTRIBUTOR';
    case 'org_branch':
      return 'org.REGIONAL_BRANCH';
    case 'org_agency':
      return 'org.AGENCY';
    case 'org_sales':
      return 'org.SALES_OFFICE';
    case 'organizer':
      return 'role.ORGANIZER';
    case 'settlement':
      return 'role.SETTLEMENT_ADMIN';
    default:
      return 'session.roleCustomer';
  }
}

function Svg({
  children,
  className = 'h-3.5 w-3.5',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20" aria-hidden>
      {children}
    </svg>
  );
}

/** 접속시간 — 시계 (사람/조직 아이콘과 형태 구분) */
export function SessionClockIcon() {
  return (
    <span
      className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600"
      aria-hidden
    >
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <circle cx="12" cy="12" r="8" />
        <path strokeLinecap="round" d="M12 8v4l2.5 1.5" />
      </svg>
    </span>
  );
}

function Glyph({ kind }: { kind: SessionIdentityKind }) {
  switch (kind) {
    case 'customer_individual':
      // 단일 인물
      return (
        <Svg>
          <path
            fillRule="evenodd"
            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
            clipRule="evenodd"
          />
        </Svg>
      );
    case 'operator_individual':
      // 인물 + 점 (운영자)
      return (
        <Svg>
          <path d="M10 8a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM4.5 16.5a5.5 5.5 0 0111 0v.5h-11v-.5z" />
          <circle cx="15.5" cy="6.5" r="1.5" />
        </Svg>
      );
    case 'customer_corporate':
      // 건물
      return (
        <Svg>
          <path d="M4 18V6.5A1.5 1.5 0 015.5 5H9v13H4zm6 0V3.5A1.5 1.5 0 0111.5 2H16a1.5 1.5 0 011.5 1.5V18H10zM7 8H6v1.5h1V8zm0 3H6v1.5h1V11zm6-5h-1v1.5h1V6zm0 3h-1v1.5h1V9zm0 3h-1v1.5h1V12z" />
        </Svg>
      );
    case 'operator_corporate':
      // 건물 + 인물
      return (
        <Svg>
          <path d="M3 17V7a1 1 0 011-1h4v11H3zm6 0V4.5A1.5 1.5 0 0110.5 3H15a1.5 1.5 0 011.5 1.5V17H9z" />
          <circle cx="16.5" cy="12.5" r="1.4" />
          <path d="M14.2 17c.3-1.3 1.3-2.2 2.3-2.2s2 .9 2.3 2.2H14.2z" />
        </Svg>
      );
    case 'super_admin':
      // 방패
      return (
        <Svg>
          <path d="M10 2l6 2.5v5.2c0 3.7-2.4 6.2-6 7.3-3.6-1.1-6-3.6-6-7.3V4.5L10 2zm0 3.2l-3.8 1.5v3c0 2.3 1.4 3.9 3.8 4.7 2.4-.8 3.8-2.4 3.8-4.7v-3L10 5.2z" />
        </Svg>
      );
    case 'org_head_office':
      // 본사 빌딩
      return (
        <Svg>
          <path d="M3 17h14v-1.2H3V17zm1.2-2.4h11.6V5.5A1.3 1.3 0 0014.5 4.2H5.5A1.3 1.3 0 004.2 5.5v9.1zM7 7h1.4v1.4H7V7zm0 2.8h1.4v1.4H7V9.8zm3.2-2.8H11.6v1.4H10.2V7zm0 2.8H11.6v1.4H10.2V9.8z" />
        </Svg>
      );
    case 'org_master':
      // 계층/네트워크
      return (
        <Svg>
          <circle cx="10" cy="4.2" r="2.1" />
          <circle cx="4.2" cy="15" r="2.1" />
          <circle cx="15.8" cy="15" r="2.1" />
          <rect x="9.2" y="6.4" width="1.6" height="4.2" rx="0.6" />
          <rect x="6.4" y="10.2" width="3.2" height="1.5" rx="0.5" transform="rotate(35 8 11)" />
          <rect x="10.4" y="10.2" width="3.2" height="1.5" rx="0.5" transform="rotate(-35 12 11)" />
        </Svg>
      );
    case 'org_branch':
      // 지점 핀
      return (
        <Svg>
          <path d="M10 2.5a5 5 0 00-5 5c0 3.5 5 9.5 5 9.5s5-6 5-9.5a5 5 0 00-5-5zm0 7a2 2 0 110-4 2 2 0 010 4z" />
        </Svg>
      );
    case 'org_agency':
      // 상점
      return (
        <Svg>
          <path d="M3 8.5l1.5-4h11L17 8.5H3zm0 1.2h14V16a1 1 0 01-1 1H4a1 1 0 01-1-1V9.7zm4 1.5v5h2v-5H7z" />
        </Svg>
      );
    case 'org_sales':
      // 서류가방
      return (
        <Svg>
          <path d="M6 6.5V5a2 2 0 012-2h4a2 2 0 012 2v1.5h3A1.5 1.5 0 0118.5 8v7A1.5 1.5 0 0117 16.5H3A1.5 1.5 0 011.5 15V8A1.5 1.5 0 013 6.5h3zm2 0h4V5H8v1.5z" />
        </Svg>
      );
    case 'organizer':
      // 차트
      return (
        <Svg>
          <path d="M3 16.5h14v1.5H3v-1.5zM5 14V9h2.2v5H5zm4 0V6h2.2v8H9zm4 0v-3.5H15.2V14H13z" />
        </Svg>
      );
    case 'settlement':
      // 정산(원)
      return (
        <Svg>
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.75a.75.75 0 00-1.5 0V7.5H8a.75.75 0 000 1.5h1.25v1H8a.75.75 0 000 1.5h1.25v1.25a.75.75 0 001.5 0V11.5H12a.75.75 0 000-1.5h-1.25v-1H12a.75.75 0 000-1.5h-1.25V6.25z"
            clipRule="evenodd"
          />
        </Svg>
      );
    default:
      return (
        <Svg>
          <path
            fillRule="evenodd"
            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
            clipRule="evenodd"
          />
        </Svg>
      );
  }
}

export function SessionIdentityIcon({
  user,
  className = '',
  title,
}: {
  user: SessionIdentityUser;
  className?: string;
  title?: string;
}) {
  const kind = resolveSessionIdentityKind(user);
  const tone = TONES[kind];
  return (
    <span
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${tone.bg} ${tone.fg} ${className}`}
      title={title}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      aria-label={title}
    >
      <Glyph kind={kind} />
    </span>
  );
}
