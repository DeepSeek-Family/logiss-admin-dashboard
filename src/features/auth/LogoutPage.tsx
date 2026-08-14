import React from 'react';
import { LogOut, ArrowRight, Truck } from 'lucide-react';
import { Button, Card } from '@/shared/components/ui';

const Logout = ({ onBackToLogin }: { onBackToLogin: () => void }) => {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6 font-sans">
      <Card className="w-full max-w-md p-10 text-center shadow-2xl border-line-2 animate-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-primary-light rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/10">
          <LogOut size={40} className="text-primary" />
        </div>

        <h1 className="text-2xl font-semibold text-ink mb-2">Successfully Signed Out</h1>
        <p className="text-sm text-ink-4 mb-8">
          Your dispatch session has been securely ended. See you next time!
        </p>

        <div className="bg-bg/50 rounded-2xl p-6 border border-line-2 mb-8 flex items-center gap-4">
          <img src="/logo.png" alt="Logiss Rides" className="h-10 w-auto" />
          <div className="text-left">
            <p className="type-th leading-none mb-1">LOGISS Console</p>
            <p className="text-sm font-medium text-ink">v1.0.4 Production Build</p>
          </div>
        </div>

        <Button
          variant="primary"
          className="w-full h-12 text-lg shadow-lg shadow-primary/20"
          icon={ArrowRight}
          onClick={onBackToLogin}
        >
          Back to Login
        </Button>

        <p className="mt-8 text-xs text-ink-4">
          &copy; 2026 LOGISS Transportation Inc.
        </p>
      </Card>
    </div>
  );
};

export default Logout;
