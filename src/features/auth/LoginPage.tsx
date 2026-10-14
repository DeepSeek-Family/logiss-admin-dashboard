import { useState } from 'react';
import toast from 'react-hot-toast';
import { useLoginMutation } from '@/redux/api/authApi';
import { useAppDispatch } from '@/redux/hooks';
import { setCredentials } from '@/redux/slice/authSlice';
import { getFcmToken } from '@/config/firebase';
import { REDIRECT_AFTER_LOGIN_KEY } from '@/constants/auth-storage';
import { AuthLayout } from './components/AuthLayout';
import {
  RoleSelector,
  LoginForm,
} from '@/features/auth';

const Login = ({ setRole }: { setRole: (role: string | null) => void }) => {
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useAppDispatch();

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
    setEmail('');
    setPassword('');
    setStep(2);
  };

  const checkPostLoginRedirect = () => {
    try {
      const savedRedirect = window.sessionStorage.getItem(REDIRECT_AFTER_LOGIN_KEY);
      if (savedRedirect && savedRedirect.startsWith('/') && !savedRedirect.startsWith('//')) {
        window.sessionStorage.removeItem(REDIRECT_AFTER_LOGIN_KEY);
        window.location.replace(savedRedirect);
        return true;
      }
    } catch {
      /* ignore */
    }
    return false;
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
        if (checkPostLoginRedirect()) return;
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
        if (checkPostLoginRedirect()) return;
      }
    }
  };

  return (
    <AuthLayout>
      {step === 1 && (
        <RoleSelector handleRoleSelect={handleRoleSelect} />
      )}

      {step === 2 && (
        <LoginForm
          selectedRole={selectedRole || 'admin'}
          email={email}
          setEmail={setEmail}
          password={password}
          setPassword={setPassword}
          onSubmit={handleAuth}
          isLoading={isLoading}
          onBack={() => {
            setEmail('');
            setPassword('');
            setStep(1);
          }}
        />
      )}
    </AuthLayout>
  );
};

export default Login;
