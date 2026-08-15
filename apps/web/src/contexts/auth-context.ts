import { createContext, useContext } from 'react';

export type Role = 'ORGANIZER' | 'CUSTOMER' | 'GATEKEEPER';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type AuthContextValue = {
  token: string | null;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
