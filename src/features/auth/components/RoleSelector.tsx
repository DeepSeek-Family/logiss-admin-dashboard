import { ShieldAlert, Navigation, ArrowRight } from 'lucide-react';

interface RoleSelectorProps {
  handleRoleSelect: (role: string) => void;
}

export const RoleSelector = ({ handleRoleSelect }: RoleSelectorProps) => {
  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-ink mb-2">Select your role</h2>
        <p className="text-ink-3 text-sm font-medium">Choose your workspace to continue.</p>
      </div>

      <div className="space-y-4">
        <button
          onClick={() => handleRoleSelect('dispatcher')}
          className="w-full flex items-center justify-between p-5 border-2 border-line hover:border-primary hover:bg-primary-tint/20 rounded-xl transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-bg rounded-lg flex items-center justify-center text-primary group-hover:bg-white transition-colors">
              <Navigation size={24} />
            </div>
            <div className="text-left">
              <h3 className="text-base font-medium text-ink mb-0.5">Dispatch</h3>
              <p className="text-xs font-medium text-ink-4">Manage bookings & live tracking</p>
            </div>
          </div>
          <ArrowRight size={20} className="text-primary opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-300" />
        </button>

        <button
          onClick={() => handleRoleSelect('admin')}
          className="w-full flex items-center justify-between p-5 border-2 border-line hover:border-accent hover:bg-accent-light/10 rounded-xl transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-bg rounded-lg flex items-center justify-center text-accent group-hover:bg-white transition-colors">
              <ShieldAlert size={24} />
            </div>
            <div className="text-left">
              <h3 className="text-base font-medium text-ink mb-0.5">System Admin</h3>
              <p className="text-xs font-medium text-ink-4">Manage fleet, drivers & reports</p>
            </div>
          </div>
          <ArrowRight size={20} className="text-accent opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-300" />
        </button>
      </div>
    </div>
  );
};
