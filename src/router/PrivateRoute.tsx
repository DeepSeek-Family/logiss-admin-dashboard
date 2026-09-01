import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import type { SessionRole } from '@/types/common.types';
import { ROUTES } from '@/constants/routes';
import { AUTH_TOKEN_KEY } from '@/constants/auth-storage';
import { useAppSelector } from '@/redux/hooks';

interface PrivateRouteProps {
  children: ReactNode;
  role: SessionRole;
  allowedRoles?: string[];
}

export const PrivateRoute = ({ children, role, allowedRoles }: PrivateRouteProps) => {
  const reduxToken = useAppSelector((state) => state.auth.token);
  const token = reduxToken || (typeof localStorage !== 'undefined' ? localStorage.getItem(AUTH_TOKEN_KEY) : null);

  // Guard: Must have both valid token and role to access private routes
  if (!token || !role) {
    return <Navigate to={ROUTES.login} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
