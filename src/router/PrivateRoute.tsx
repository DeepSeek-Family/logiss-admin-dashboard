import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import type { SessionRole } from '@/types/common.types';
import { ROUTES } from '@/constants/routes';
import { AUTH_TOKEN_KEY, ROLE_STORAGE_KEY, LEGACY_AUTH_TOKEN_KEY } from '@/constants/auth-storage';
import { useAppSelector } from '@/redux/hooks';

interface PrivateRouteProps {
  children: ReactNode;
  role: SessionRole;
  allowedRoles?: string[];
}

export const PrivateRoute = ({ children, role, allowedRoles }: PrivateRouteProps) => {
  const reduxToken = useAppSelector((state) => state.auth.token);
  const token =
    reduxToken ||
    (typeof localStorage !== 'undefined'
      ? localStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem(LEGACY_AUTH_TOKEN_KEY)
      : null);
  const effectiveRole =
    role ||
    (typeof localStorage !== 'undefined'
      ? (localStorage.getItem(ROLE_STORAGE_KEY) as SessionRole)
      : null);

  // Guard: Must have both valid token and role to access private routes
  if (!token || !effectiveRole) {
    return <Navigate to={ROUTES.login} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(effectiveRole)) {
    toast.error('Access restricted: You do not have permission for this section.', {
      id: 'route-unauthorized',
    });
    return <Navigate to={effectiveRole === 'admin' ? ROUTES.dashboard : ROUTES.operations} replace />;
  }

  return <>{children}</>;
};
