import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { apiFetch } from '@/lib/api-client';
import { AuthContext, type AuthUser } from './auth-context';

type AuthState = {
  token: string;
  user: AuthUser;
};

// Keeping the session in localStorage (not just memory) avoids re-logging
// in on every page refresh; there's no refresh-token flow, so the token
// simply stays valid until it expires (7d, see token.service.ts).
const STORAGE_KEY = 'eventos:auth';

function readStoredAuth(): AuthState | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthState;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState | null>(readStoredAuth);

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiFetch<AuthState>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
    setAuth(result);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setAuth(null);
  }, []);

  const value = useMemo(
    () => ({
      token: auth?.token ?? null,
      user: auth?.user ?? null,
      login,
      logout,
    }),
    [auth, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
