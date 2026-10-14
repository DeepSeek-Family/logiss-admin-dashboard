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
import { AUTH_TOKEN_KEY, ROLE_STORAGE_KEY } from '@/constants/auth-storage';
import { isTokenExpired, clearAuthStorage, initCrossTabAuthSync } from '@/utils/authSession';
import {
  AppRouteConfig,
  SessionRole,
  authenticatedRoutes,
  getDefaultRoute,
  isAppRole,
  loginRoute,
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
  const token = reduxToken || (typeof localStorage !== 'undefined' ? localStorage.getItem(AUTH_TOKEN_KEY) : null);

  const [role, setRole] = useState<SessionRole>(() => {
    try {
      const savedRole = window.localStorage.getItem(ROLE_STORAGE_KEY);
      return isAppRole(savedRole) ? savedRole : null;
    } catch {
      return null;
    }
  });

  const isExpired = Boolean(token && isTokenExpired(token));
  const isAuthenticated = Boolean(token && role && !isExpired);

  const handleRoleSet = (newRole: string | null) => {
    const safeRole = isAppRole(newRole) ? newRole : null;
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

  // Sync token expiration on mount or token change
  useEffect(() => {
    if (token && isTokenExpired(token)) {
      dispatch(logout());
      handleRoleSet(null);
    }
  }, [token, dispatch]);

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
    const pageElement = <Page role={role} />;
    if (!route.allowedRoles) return pageElement;
    return (
      <PrivateRoute role={role} allowedRoles={route.allowedRoles}>
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

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Toaster position="top-right" toastOptions={{ duration: 3000, style: { fontWeight: '600', fontSize: '14px' } }} />
      <Router>
        <ErrorBoundary>
          <Routes>
            <Route path={loginRoute.path} element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage setRole={handleRoleSet} />} />
            <Route path="/" element={<PrivateRoute role={role}><MainLayout role={role} onLogout={handleLogout} /></PrivateRoute>}>
              <Route index element={<Navigate to={getDefaultRoute(role)} replace />} />
              {authenticatedRoutes.map(renderAppRoute)}
              <Route path="*" element={
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <h1 className="text-6xl font-semibold text-ink opacity-20 mb-4">404</h1>
                  <p className="text-lg text-ink-4 mb-6">Resource not found</p>
                  <Button variant="primary" onClick={() => window.history.back()}>Go Back</Button>
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
