import type { NavIconId } from './nav-config';

const iconClass = 'h-[18px] w-[18px] shrink-0';

export function NavIcon({ id, className = iconClass }: { id: NavIconId; className?: string }) {
  const props = { className, fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor', strokeWidth: 1.75 };
  switch (id) {
    case 'dashboard':
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h10M4 18h16" />
        </svg>
      );
    case 'usdt':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="8" />
          <path strokeLinecap="round" d="M9 12h6M12 9v6" />
        </svg>
      );
    case 'escrow':
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'ledger':
      return (
        <svg {...props}>
          <path strokeLinecap="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
        </svg>
      );
    case 'users':
      return (
        <svg {...props}>
          <path strokeLinecap="round" d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
        </svg>
      );
    case 'hq':
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case 'wallets':
      return (
        <svg {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1M5 6h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z" />
        </svg>
      );
    default:
      return null;
  }
}
