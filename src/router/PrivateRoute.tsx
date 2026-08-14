import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import type { SessionRole } from '@/types/common.types';
import { ROUTES } from '@/constants/routes';

interface PrivateRouteProps {
  children: ReactNode;
  role: SessionRole;
  allowedRoles?: string[];
}

export const PrivateRoute = ({ children, role, allowedRoles }: PrivateRouteProps) => {
  if (!role) {
    return <Navigate to={ROUTES.login} replace />;
  }
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};
