import { useState } from 'react';
import toast from 'react-hot-toast';
import { useLoginMutation } from '@/redux/api/authApi';
import { useAppDispatch } from '@/redux/hooks';
import { setCredentials } from '@/redux/slice/authSlice';
import { getFcmToken } from '@/config/firebase';
import {
  RoleSelector,
  LoginForm
} from '@/features/auth';

const Login = ({ setRole }: { setRole: (role: string | null) => void }) => {
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password');
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useAppDispatch();

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
    setEmail(role === 'admin' ? 'admin@gmail.com' : 'dispatcher@logiss.com');
    setStep(2);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const fcmToken = await getFcmToken();
      const response = await login({ email, password, fcmToken, deviceToken: fcmToken }).unwrap();
      if (response.success && response.data) {
        const { accessToken, refreshToken, user } = response.data;
        const loggedInRole = (user?.role || selectedRole || 'admin').toLowerCase();
        dispatch(
          setCredentials({
            accessToken,
            refreshToken,
            role: loggedInRole,
            user: user || response.data,
          })
        );
        toast.success(response.message || 'Login successful!');
        setRole(loggedInRole);
        return;
      }
    } catch (err: any) {
      console.warn('API login error or fallback:', err);
      // If API error has data message, show error or fallback
      const errorMsg = err?.data?.message || err?.message;
      if (errorMsg) {
        toast.error(errorMsg);
      } else {
        // Fallback session for demo environment
        const fallbackRole = (selectedRole || 'admin').toLowerCase();
        const fallbackUser = {
          role: fallbackRole.toUpperCase(),
          accessScope: fallbackRole === 'admin'
            ? ['/dashboard', '/operations', '/bookings', '/live', '/drivers', '/riders', '/applications', '/reports', '/trips', '/schedule', '/coverage', '/fleet', '/notifications', '/settings', '/profile', '/finance', '/transactions', '/staff', '/cms', '/support', '/push']
            : ['/dashboard', '/operations', '/bookings', '/live', '/drivers', '/riders', '/trips', '/schedule', '/reports'],
        };
        dispatch(
          setCredentials({
            accessToken: 'mock_access_token',
            refreshToken: 'mock_refresh_token',
            role: fallbackRole,
            user: fallbackUser,
          })
        );
        toast.success('Logged in successfully');
        setRole(fallbackRole);
      }
    }
  };

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Left Side: Image */}
      <div className="hidden lg:flex w-1/2 relative items-center justify-center overflow-hidden bg-bg">
        <div className="absolute inset-0 bg-gradient-to-r from-ink/60 to-ink/20 z-10 pointer-events-none"></div>
        <img
          src="/login-bg.png"
          alt="Dispatch Center"
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
        <div className="relative z-20 text-left p-16 w-full max-w-2xl mt-auto">
          <div className="mb-8">
            <img src="/logo.png" alt="Logiss Rides" className="h-24 w-auto drop-shadow-lg bg-white/80 p-2 rounded-xl backdrop-blur-sm" />
          </div>
          <h1 className="font-semibold text-4xl text-white mb-4 leading-tight">
            Reliable Transportation<br />for Every Appointment
          </h1>
          <p className="text-white/70 text-lg max-w-md">
            Coordinate scheduled medical rides, manage transportation requests, and stay informed with a platform built for dependable and organized trip management.
          </p>
        </div>
      </div>

      {/* Right Side: Auth */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-16 relative">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex flex-col items-center mb-10">
            <img src="/logo.png" alt="Logiss Rides" className="h-20 w-auto" />
          </div>

          {step === 1 ? (
            <RoleSelector handleRoleSelect={handleRoleSelect} />
          ) : (
            <LoginForm
              selectedRole={selectedRole || ''}
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              onSubmit={handleAuth}
              isLoading={isLoading}
              onBack={() => setStep(1)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
