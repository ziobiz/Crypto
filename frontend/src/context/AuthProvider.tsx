'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError, clearToken, MeResponse, setToken } from '@/lib/api';
import { clearMaskedPaths } from '@/lib/auth-session';
import { touchActivity, useIdleTimeout } from '@/hooks/useIdleTimeout';

interface AuthContextValue {
  user: MeResponse | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  completeLogin: (token: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function hasStoredToken(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(sessionStorage.getItem('token'));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const idleMinutes = user?.sessionPolicy?.idleTimeoutMinutes ?? 30;

  const logout = useCallback(
    (reason?: 'idle') => {
      const uid = user?.id;
      clearToken();
      sessionStorage.removeItem('crypto-sensitive-token');
      localStorage.removeItem('crypto-nav-tabs');
      if (uid) localStorage.removeItem(`crypto-nav-tabs:${uid}`);
      setUser(null);
      if (reason === 'idle') {
        sessionStorage.setItem('crypto_idle_minutes', String(idleMinutes));
      }
      sessionStorage.removeItem('crypto_last_activity');
      clearMaskedPaths();
      router.push(reason === 'idle' ? '/login?idle=1' : '/login');
    },
    [router, idleMinutes, user?.id],
  );

  useIdleTimeout(() => logout('idle'), Boolean(user), idleMinutes);

  /** 401/403만 세션 폐기. 일시적 5xx·네트워크는 유지 (PM2 재시작·배포 직후 보호) */
  const refresh = useCallback(async () => {
    try {
      const me = await api.me();
      setUser(me);
      touchActivity();
    } catch (e) {
      const status = e instanceof ApiError ? e.status : 0;
      if (status === 401 || status === 403) {
        clearToken();
        setUser(null);
        return;
      }
      if (!hasStoredToken()) setUser(null);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const completeLogin = async (token: string) => {
    setToken(token);
    touchActivity();
    for (let i = 0; i < 3; i++) {
      try {
        const me = await api.me();
        setUser(me);
        clearMaskedPaths();
        router.push('/dashboard');
        return;
      } catch (e) {
        const status = e instanceof ApiError ? e.status : 0;
        if (status === 401 || status === 403) {
          clearToken();
          setUser(null);
          throw e;
        }
        await new Promise((r) => setTimeout(r, 400 * (i + 1)));
      }
    }
    clearMaskedPaths();
    router.push('/dashboard');
  };

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    if ('otpRequired' in res && res.otpRequired) {
      throw new Error('OTP_REQUIRED');
    }
    if ('mustChangePassword' in res && res.mustChangePassword) {
      throw new Error('MUST_CHANGE_PASSWORD');
    }
    if ('mustSetupOtp' in res && res.mustSetupOtp) {
      throw new Error('MUST_SETUP_OTP');
    }
    if ('token' in res) {
      await completeLogin(res.token);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, completeLogin, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
