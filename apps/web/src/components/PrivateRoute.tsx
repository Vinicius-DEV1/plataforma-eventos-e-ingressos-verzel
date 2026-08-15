import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuth, type Role } from '@/contexts/auth-context';

type PrivateRouteProps = {
  children: ReactNode;
  roles?: Role[];
};

export function PrivateRoute({ children, roles }: PrivateRouteProps) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
