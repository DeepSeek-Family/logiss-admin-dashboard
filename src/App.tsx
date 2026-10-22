import React, { useState, useEffect, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import MainLayout from '@/shared/components/layout/MainLayout';
import ErrorBoundary from './components/ErrorBoundary';
import { Button } from '@/shared/components/ui';
import { PrivateRoute } from '@/router/PrivateRoute';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { logout } from '@/redux/slice/authSlice';
import { AUTH_TOKEN_KEY, ROLE_STORAGE_KEY, LEGACY_AUTH_TOKEN_KEY } from '@/constants/auth-storage';
import { isTokenExpired, clearAuthStorage, initCrossTabAuthSync } from '@/utils/authSession';
import {
  AppRouteConfig,
  SessionRole,
  authenticatedRoutes,
  getDefaultRoute,
  isAppRole,
  loginRoute,
  forgotPasswordRoute,
  verifyEmailRoute,
  resetPasswordRoute,
} from './routes/appRoutes';

const LoadingScreen = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] w-full gap-4 animate-in fade-in duration-500">
    <Loader2 className="w-10 h-10 text-primary animate-spin" />
    <p className="text-sm text-ink-4">Initializing module...</p>
  </div>
);

function App() {
  const dispatch = useAppDispatch();
  const reduxToken = useAppSelector((state) => state.auth.token);
  const reduxRole = useAppSelector((state) => state.auth.role);
  const token =
    reduxToken ||
    (typeof localStorage !== 'undefined'
      ? localStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem(LEGACY_AUTH_TOKEN_KEY)
      : null);

  const [role, setRole] = useState<SessionRole>(() => {
    try {
      const savedRole = window.localStorage.getItem(ROLE_STORAGE_KEY)?.toLowerCase()?.trim();
      if (isAppRole(savedRole)) return savedRole;
      if (savedRole?.includes('dispatch')) return 'dispatcher';
      if (savedRole) return 'admin';
      return null;
    } catch {
      return null;
    }
  });

  const effectiveRole: SessionRole =
    role ||
    (reduxRole ? (reduxRole.toLowerCase().includes('dispatch') ? 'dispatcher' : 'admin') : null) ||
    (typeof localStorage !== 'undefined'
      ? (() => {
          const r = localStorage.getItem(ROLE_STORAGE_KEY)?.toLowerCase()?.trim();
          return r?.includes('dispatch') ? 'dispatcher' : r ? 'admin' : null;
        })()
      : null);

  const isAuthenticated = Boolean(token && effectiveRole);

  const handleRoleSet = (newRole: string | null) => {
    const normalized = newRole?.toLowerCase()?.trim();
    const safeRole: SessionRole = isAppRole(normalized)
      ? normalized
      : normalized?.includes('dispatch')
      ? 'dispatcher'
      : (normalized ? 'admin' : null);
    setRole(safeRole);
    try {
      if (safeRole) window.localStorage.setItem(ROLE_STORAGE_KEY, safeRole);
      else window.localStorage.removeItem(ROLE_STORAGE_KEY);
    } catch { /* ignore */ }
  };

  const handleLogout = () => {
    dispatch(logout());
    clearAuthStorage();
    handleRoleSet(null);
  };

  // Sync session state across tabs (e.g. multi-tab logout)
  useEffect(() => {
    const unbind = initCrossTabAuthSync(() => {
      dispatch(logout());
      handleRoleSet(null);
    });
    return unbind;
  }, [dispatch]);

  // Handle unhandled dynamic chunk script loading failures gracefully
  useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
      const message = event.reason?.message || String(event.reason || '');
      if (
        message.includes('Failed to fetch dynamically imported module') ||
        message.includes('Importing a module script failed')
      ) {
        toast.error('New application version detected. Reloading...', { id: 'chunk-load-error' });
        setTimeout(() => window.location.reload(), 1500);
      }
    };

    window.addEventListener('unhandledrejection', handleRejection);
    return () => window.removeEventListener('unhandledrejection', handleRejection);
  }, []);

  const renderRouteElement = (route: AppRouteConfig) => {
    if (!route.Component) return undefined;
    const Page = route.Component;
    const pageElement = <Page role={effectiveRole} />;
    if (!route.allowedRoles) return pageElement;
    return (
      <PrivateRoute role={effectiveRole} allowedRoles={route.allowedRoles}>
        {pageElement}
      </PrivateRoute>
    );
  };

  const renderAppRoute = (route: AppRouteConfig) => {
    if (route.index) {
      return <Route key="index" index element={renderRouteElement(route)} />;
    }
    return (
      <Route key={route.path} path={route.path} element={renderRouteElement(route)}>
        {route.children?.map(renderAppRoute)}
      </Route>
    );
  };

  const LoginPage = loginRoute.Component;
  const ForgotPasswordPage = forgotPasswordRoute.Component;
  const VerifyEmailPage = verifyEmailRoute.Component;
  const ResetPasswordPage = resetPasswordRoute.Component;

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Toaster position="top-right" toastOptions={{ duration: 3000, style: { fontWeight: '600', fontSize: '14px' } }} />
      <Router>
        <ErrorBoundary>
          <Routes>
            <Route path={loginRoute.path} element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage setRole={handleRoleSet} />} />
            <Route path={forgotPasswordRoute.path} element={isAuthenticated ? <Navigate to="/" replace /> : <ForgotPasswordPage />} />
            <Route path={verifyEmailRoute.path} element={isAuthenticated ? <Navigate to="/" replace /> : <VerifyEmailPage />} />
            <Route path={resetPasswordRoute.path} element={isAuthenticated ? <Navigate to="/" replace /> : <ResetPasswordPage />} />
            <Route path="/" element={<PrivateRoute role={effectiveRole}><MainLayout role={effectiveRole} onLogout={handleLogout} /></PrivateRoute>}>
              <Route index element={<Navigate to={getDefaultRoute(effectiveRole)} replace />} />
              {authenticatedRoutes.map(renderAppRoute)}
              <Route path="*" element={
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <h1 className="text-6xl font-semibold text-ink opacity-20 mb-4">404</h1>
                  <p className="text-lg text-ink-4 mb-6">This page does not exist or was moved.</p>
                  <div className="flex flex-wrap gap-3 justify-center">
                    <Button variant="outline" onClick={() => window.history.back()}>Go back</Button>
                    <Button variant="primary" onClick={() => window.location.assign(getDefaultRoute(effectiveRole))}>
                      Go to home
                    </Button>
                  </div>
                </div>
              } />
            </Route>
          </Routes>
        </ErrorBoundary>
      </Router>
    </Suspense>
  );
}

export default App;
