import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useLoginMutation } from '@/redux/api/authApi';
import { useAppDispatch } from '@/redux/hooks';
import { setCredentials } from '@/redux/slice/authSlice';
import { getFcmToken } from '@/config/firebase';
import { REDIRECT_AFTER_LOGIN_KEY } from '@/constants/auth-storage';
import { ROUTES } from '@/constants/routes';
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
  const navigate = useNavigate();

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
    setEmail('');
    setPassword('');
    setStep(2);
  };

  const getPostLoginDestination = (currentRole: string) => {
    try {
      const savedRedirect = window.sessionStorage.getItem(REDIRECT_AFTER_LOGIN_KEY);
      window.sessionStorage.removeItem(REDIRECT_AFTER_LOGIN_KEY);
      if (
        savedRedirect &&
        savedRedirect.startsWith('/') &&
        !savedRedirect.startsWith('//') &&
        savedRedirect !== ROUTES.login &&
        savedRedirect !== ROUTES.forgotPassword &&
        savedRedirect !== ROUTES.verifyEmail &&
        savedRedirect !== ROUTES.resetPassword
      ) {
        return savedRedirect;
      }
    } catch {
      /* ignore */
    }
    return currentRole === 'admin' ? ROUTES.dashboard : ROUTES.operations;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const fcmToken = await getFcmToken();
      const response = await login({ email, password, fcmToken, deviceToken: fcmToken }).unwrap();
      if (response && (response.success || response.data)) {
        const data = response.data;
        const dataObj =
          typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : null;
        const nested =
          dataObj && typeof dataObj.data === 'object' && dataObj.data !== null
            ? (dataObj.data as Record<string, unknown>)
            : null;
        const accessToken =
          (typeof data === 'string' && data.length > 20 ? data : null) ||
          (dataObj?.accessToken as string | undefined) ||
          (dataObj?.token as string | undefined) ||
          (dataObj?.access_token as string | undefined) ||
          (nested?.accessToken as string | undefined) ||
          (nested?.token as string | undefined) ||
          (nested?.access_token as string | undefined) ||
          response.accessToken ||
          response.token;

        const refreshToken =
          (dataObj?.refreshToken as string | undefined) ||
          (dataObj?.refresh_token as string | undefined) ||
          (nested?.refreshToken as string | undefined) ||
          response.refreshToken;

        const user =
          (dataObj?.user as { role?: string } | undefined) ||
          (nested?.user as { role?: string } | undefined) ||
          (dataObj as { role?: string } | null) ||
          response.user;

        const rawRole = (
          user?.role ||
          (dataObj?.role as string | undefined) ||
          response.role ||
          selectedRole ||
          'admin'
        )
          ?.toString()
          ?.toLowerCase() || 'admin';
        const loggedInRole = rawRole.includes('dispatch') ? 'dispatcher' : 'admin';

        if (!accessToken) {
          toast.error(response?.message || 'Authentication failed: Server did not return an access token.');
          return;
        }

        dispatch(
          setCredentials({
            accessToken,
            refreshToken,
            role: loggedInRole,
            user,
          })
        );
        toast.success(response.message || 'Login successful!');
        setRole(loggedInRole);

        const destination = getPostLoginDestination(loggedInRole);
        navigate(destination, { replace: true });
        return;
      } else {
        toast.error(response?.message || 'Login failed. Please check your credentials.');
      }
    } catch (err: any) {
      console.warn('API login error:', err);
      let errorMsg =
        err?.data?.message ||
        err?.data?.errorMessages?.[0]?.message ||
        err?.message;

      if (!errorMsg && (err?.status === 'FETCH_ERROR' || err?.error?.includes('Failed to fetch'))) {
        errorMsg = 'Cannot connect to server. Connection timed out or server is offline.';
      }

      toast.error(errorMsg || 'Login failed. Please check your credentials and try again.');
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
