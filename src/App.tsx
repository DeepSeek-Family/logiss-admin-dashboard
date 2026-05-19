import React, { useState, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import MainLayout from '@/shared/components/layout/MainLayout';
import ErrorBoundary from './components/ErrorBoundary';
import {
  AppRouteConfig,
  SessionRole,
  authenticatedRoutes,
  getDefaultRoute,
  isAppRole,
  loginRoute,
} from './routes/appRoutes';

// Shared Loading Component
const LoadingScreen = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] w-full gap-4 animate-in fade-in duration-500">
    <Loader2 className="w-10 h-10 text-primary animate-spin" />
    <p className="text-sm text-ink-4">Initializing module...</p>
  </div>
);

interface ProtectedRouteProps {
  children: React.ReactNode;
  role: SessionRole;
  allowedRoles?: string[];
}

// Protected Route Component with extra safety
const ProtectedRoute = ({ children, role, allowedRoles }: ProtectedRouteProps) => {
  if (!role) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

function App() {
  const [role, setRole] = useState<SessionRole>(() => {
    try {
      const savedRole = window.localStorage.getItem('logiss-role');
      return isAppRole(savedRole) ? savedRole : null;
    } catch {
      return null;
    }
  }); // 'admin' | 'dispatcher' | null

  const handleRoleSet = (newRole: string | null) => {
    const safeRole = isAppRole(newRole) ? newRole : null;
    setRole(safeRole);

    try {
      if (safeRole) {
        window.localStorage.setItem('logiss-role', safeRole);
      } else {
        window.localStorage.removeItem('logiss-role');
      }
    } catch {
      // Ignore storage failures so auth navigation never blank-screens.
    }
  };

  const handleLogout = () => {
    handleRoleSet(null);
  };

  const renderRouteElement = (route: AppRouteConfig) => {
    if (!route.Component) return undefined;

    const Page = route.Component;
    const pageElement = <Page role={role} />;

    if (!route.allowedRoles) {
      return pageElement;
    }

    return (
      <ProtectedRoute role={role} allowedRoles={route.allowedRoles}>
        {pageElement}
      </ProtectedRoute>
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
            <Route path={loginRoute.path} element={role ? <Navigate to="/" replace /> : <LoginPage setRole={handleRoleSet} />} />

            {/* Main Layout containing the Sidebar and Topbar */}
            <Route path="/" element={<ProtectedRoute role={role}><MainLayout role={role} onLogout={handleLogout} /></ProtectedRoute>}>

              {/* Default Route based on role */}
              <Route index element={<Navigate to={getDefaultRoute(role)} replace />} />

              {/* Application routes are defined in src/routes/appRoutes.tsx. */}
              {authenticatedRoutes.map(renderAppRoute)}

              {/* 404 Fallback */}
              <Route path="*" element={
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <h1 className="text-6xl font-semibold text-ink opacity-20 mb-4">404</h1>
                  <p className="text-lg text-ink-4 mb-6">Resource not found</p>
                  <button onClick={() => window.history.back()} className="px-6 py-2.5 bg-primary text-white rounded-xl font-medium shadow-md shadow-primary/20 hover:scale-105 transition-transform">Go Back</button>
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
