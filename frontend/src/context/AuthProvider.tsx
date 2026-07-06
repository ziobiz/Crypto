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
import { api, clearToken, MeResponse, setToken } from '@/lib/api';
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    sessionStorage.removeItem('crypto_last_activity');
    router.push('/login');
  }, [router]);

  useIdleTimeout(logout, Boolean(user));

  const refresh = useCallback(async () => {
    try {
      const me = await api.me();
      setUser(me);
      touchActivity();
    } catch {
      clearToken();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const completeLogin = async (token: string) => {
    setToken(token);
    touchActivity();
    await refresh();
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
