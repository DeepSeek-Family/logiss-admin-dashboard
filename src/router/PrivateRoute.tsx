import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import type { SessionRole } from '@/types/common.types';
import { ROUTES } from '@/constants/routes';
import { AUTH_TOKEN_KEY } from '@/constants/auth-storage';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { isTokenExpired, handleAuthSessionExpired } from '@/utils/authSession';
import { logout } from '@/redux/slice/authSlice';

interface PrivateRouteProps {
  children: ReactNode;
  role: SessionRole;
  allowedRoles?: string[];
}

export const PrivateRoute = ({ children, role, allowedRoles }: PrivateRouteProps) => {
  const dispatch = useAppDispatch();
  const reduxToken = useAppSelector((state) => state.auth.token);
  const token = reduxToken || (typeof localStorage !== 'undefined' ? localStorage.getItem(AUTH_TOKEN_KEY) : null);

  const tokenExpired = Boolean(token && isTokenExpired(token));

  // Guard: Must have both valid, unexpired token and role to access private routes
  if (!token || !role || tokenExpired) {
    if (tokenExpired) {
      dispatch(logout());
      handleAuthSessionExpired({ reason: 'Your session has expired. Please log in again.' });
    }
    return <Navigate to={ROUTES.login} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    toast.error('Access restricted: You do not have permission for this section.', {
      id: 'route-unauthorized',
    });
    return <Navigate to={role === 'admin' ? ROUTES.dashboard : ROUTES.operations} replace />;
  }

  return <>{children}</>;
};
