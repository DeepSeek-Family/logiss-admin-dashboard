import { useState } from 'react';

import {
  RoleSelector,
  LoginForm
} from '@/features/auth';

const Login = ({ setRole }: { setRole: (role: string | null) => void }) => {
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password');

  const handleRoleSelect = (role: string) => {
    setSelectedRole(role);
    setEmail(role === 'admin' ? 'admin@kabir.com' : 'dispatcher@kabir.com');
    setStep(2);
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setRole(selectedRole);
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
            <img src="/logo.png" alt="Kabir Dashboard" className="h-24 w-auto drop-shadow-lg bg-white/80 p-2 rounded-xl backdrop-blur-sm" />
          </div>
          <h1 className="font-semibold text-4xl text-white mb-4 leading-tight">
            Kabir Dashboard &<br />Fleet Operations
          </h1>
          <p className="text-white/70 text-lg max-w-md">
            The market-standard SaaS platform for modern NEMT and fleet dispatching. Manage routes, drivers, and bookings in one place.
          </p>
        </div>
      </div>

      {/* Right Side: Auth */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-16 relative">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex flex-col items-center mb-10">
            <img src="/logo.png" alt="Kabir Dashboard" className="h-20 w-auto" />
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
              onBack={() => setStep(1)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
