import React, { useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import MainLayout from './layouts/MainLayout';
import ErrorBoundary from './components/ErrorBoundary';

// Shared Loading Component
const LoadingScreen = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] w-full gap-4 animate-in fade-in duration-500">
    <Loader2 className="w-10 h-10 text-primary animate-spin" />
    <p className="text-sm font-bold text-ink-3 tracking-tight">Initializing module...</p>
  </div>
);

// Lazy Load Pages for Production Optimization
const Login = lazy(() => import('./pages/Login'));
const Operations = lazy(() => import('./pages/Operations'));
const Bookings = lazy(() => import('./pages/Bookings'));
const LiveTrips = lazy(() => import('./pages/LiveTrips'));
const Drivers = lazy(() => import('./pages/Drivers'));
const Applications = lazy(() => import('./pages/Applications'));
const Reports = lazy(() => import('./pages/Reports'));
const TripHistory = lazy(() => import('./pages/TripHistory'));
const Settings = lazy(() => import('./pages/Settings'));
const Fleet = lazy(() => import('./pages/Fleet'));
const FleetDetails = lazy(() => import('./pages/FleetDetails'));
const Schedule = lazy(() => import('./pages/Schedule'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Profile = lazy(() => import('./pages/Profile'));
const CMS = lazy(() => import('./pages/CMS'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const Transactions = lazy(() => import('./pages/Transactions'));
const UserAccess = lazy(() => import('./pages/UserAccess'));
const Riders = lazy(() => import('./pages/Riders'));
const CreateBooking = lazy(() => import('./pages/CreateBooking'));

interface ProtectedRouteProps {
  children: React.ReactNode;
  role: string | null;
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
  const [role, setRole] = useState<string | null>(() => {
    try {
      const savedRole = window.localStorage.getItem('logiss-role');
      return savedRole === 'admin' || savedRole === 'dispatcher' ? savedRole : null;
    } catch {
      return null;
    }
  }); // 'admin' | 'dispatcher' | null

  const handleRoleSet = (newRole: string | null) => {
    const safeRole = newRole === 'admin' || newRole === 'dispatcher' ? newRole : null;
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

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Toaster position="top-right" toastOptions={{ duration: 3000, style: { fontWeight: '600', fontSize: '14px' } }} />
      <Router>
        <ErrorBoundary>
          <Routes>
          <Route path="/login" element={role ? <Navigate to="/" replace /> : <Login setRole={handleRoleSet} />} />

          {/* Main Layout containing the Sidebar and Topbar */}
          <Route path="/" element={<ProtectedRoute role={role}><MainLayout role={role} onLogout={handleLogout} /></ProtectedRoute>}>

            {/* Default Route based on role */}
            <Route index element={<Navigate to={role === 'admin' ? "/dashboard" : "/operations"} replace />} />

            {/* Application Routes wraped in Suspense for smooth loading */}
            <Route path="operations" element={<Operations role={role} />} />
            <Route path="bookings" element={<Bookings role={role} />} />
            <Route path="live" element={<LiveTrips role={role} />} />
            <Route path="drivers" element={<Drivers role={role} />} />
            <Route path="riders" element={<Riders role={role} />} />
            <Route path="create-booking" element={<CreateBooking />} />
            <Route path="applications" element={<Applications role={role} />} />
            <Route path="reports" element={<Reports role={role} />} />
            <Route path="trips" element={<TripHistory role={role} />} />
            <Route path="settings" element={<Settings role={role} />} />
            <Route path="profile" element={<Profile role={role} />} />
            <Route path="fleet">
              <Route index element={<Fleet role={role} />} />
              <Route path=":id" element={<FleetDetails role={role} />} />
            </Route>
            <Route path="schedule" element={<Schedule role={role} />} />
            <Route path="notifications" element={<Notifications role={role} />} />

            {/* Admin Only Routes */}
            <Route path="dashboard" element={
              <ProtectedRoute role={role} allowedRoles={['admin']}><AdminDashboard role={role} /></ProtectedRoute>
            } />
            <Route path="transactions" element={
              <ProtectedRoute role={role} allowedRoles={['admin']}><Transactions role={role} /></ProtectedRoute>
            } />
            <Route path="staff" element={
              <ProtectedRoute role={role} allowedRoles={['admin']}><UserAccess role={role} /></ProtectedRoute>
            } />
            <Route path="cms" element={
              <ProtectedRoute role={role} allowedRoles={['admin']}><CMS role={role} /></ProtectedRoute>
            } />
            <Route path="support" element={
              <ProtectedRoute role={role} allowedRoles={['admin']}><CMS role={role} /></ProtectedRoute>
            } />

            {/* 404 Fallback */}
            <Route path="*" element={
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <h1 className="text-6xl font-extrabold text-ink opacity-20 mb-4 font-display">404</h1>
                <p className="text-lg font-bold text-ink-3 mb-6 tracking-tight">Resource not found</p>
                <button onClick={() => window.history.back()} className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold shadow-md shadow-primary/20 hover:scale-105 transition-transform">Go Back</button>
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
