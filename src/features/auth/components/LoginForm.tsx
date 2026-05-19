import React from 'react';
import { ShieldAlert, Navigation, Mail, Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/shared/components/ui';

interface LoginFormProps {
  selectedRole: string;
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}

export const LoginForm = ({
  selectedRole,
  email,
  setEmail,
  password,
  setPassword,
  onSubmit,
  onBack
}: LoginFormProps) => {
  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedRole === 'admin' ? 'bg-accent-light text-accent' : 'bg-primary-light text-primary'}`}>
            {selectedRole === 'admin' ? <ShieldAlert size={20} /> : <Navigation size={20} />}
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-ink capitalize">{selectedRole} Login</h2>
            <p className="text-xs text-ink-4">Accessing {selectedRole} Portal</p>
          </div>
        </div>
        <p className="text-ink-3 text-sm font-medium">Enter your credentials to continue to the dashboard.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-medium text-ink-4 mb-2">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" size={18} />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white border border-line rounded-xl py-3 pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
            />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-medium text-ink-4">Password</label>
            <a href="#" className="text-xs font-medium text-primary hover:text-primary-dark">Forgot?</a>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" size={18} />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white border border-line rounded-xl py-3 pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
            />
          </div>
        </div>

        <Button type="submit" variant={selectedRole === 'admin' ? 'accent' : 'primary'} className="w-full h-12 text-sm mt-4">
          Log In <ArrowRight size={16} className="ml-2" />
        </Button>

        <button
          type="button"
          onClick={onBack}
          className="w-full text-center py-2 text-xs font-medium text-ink-4 hover:text-ink transition-colors mt-2"
        >
          &larr; Switch role
        </button>
      </form>
    </div>
  );
};
