'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode; label?: string };
type State = { error: Error | null };

/** 대시보드 렌더 오류 시 빈 화면 대신 복구 UI */
export class DashboardErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[DashboardErrorBoundary]', this.props.label ?? 'dashboard', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="mx-auto flex min-h-[40vh] max-w-lg flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-sm font-semibold text-slate-800">화면을 불러오지 못했습니다.</p>
        <p className="text-xs text-slate-500">
          배포 직후 캐시가 꼬였거나 일시 오류일 수 있습니다. 새로고침 후 다시 시도해 주세요.
        </p>
        <button
          type="button"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
          onClick={() => {
            try {
              sessionStorage.removeItem('tinpass_chunk_reload');
            } catch {
              /* ignore */
            }
            window.location.assign('/dashboard');
          }}
        >
          대시보드 새로고침
        </button>
      </div>
    );
  }
}
