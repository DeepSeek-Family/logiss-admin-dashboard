import { useState } from 'react';
import { Truck, ShieldAlert, Navigation, ArrowRight, Mail, Lock } from 'lucide-react';
import { Button } from '../components/UI';

const Login = ({ setRole }) => {
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password');

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setEmail(role === 'admin' ? 'admin@logiss.com' : 'dispatcher@logiss.com');
    setStep(2);
  };

  const handleAuth = (e) => {
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
            <img src="/logo.png" alt="Logiss Rides" className="h-24 w-auto drop-shadow-lg bg-white/80 p-2 rounded-xl backdrop-blur-sm" />
          </div>
          <h1 className="font-display font-black text-5xl tracking-tight text-white mb-4 leading-tight">
            Logistics &<br/>Fleet Operations
          </h1>
          <p className="text-white/70 text-lg max-w-md">
            Authorized passenger programs and source-based transportation management for LOGISS operations.
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
            <div className="animate-fade-in">
              <div className="mb-8">
                <h2 className="text-2xl font-extrabold text-ink tracking-tight mb-2">Select your role</h2>
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
                      <h3 className="text-base font-bold text-ink mb-0.5">Dispatcher</h3>
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
                      <h3 className="text-base font-bold text-ink mb-0.5">System Admin</h3>
                      <p className="text-xs font-medium text-ink-4">Manage fleet, drivers & reports</p>
                    </div>
                  </div>
                  <ArrowRight size={20} className="text-accent opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-300" />
                </button>
              </div>
            </div>
          ) : (
            <div className="animate-fade-in">
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${selectedRole === 'admin' ? 'bg-accent-light text-accent' : 'bg-primary-light text-primary'}`}>
                    {selectedRole === 'admin' ? <ShieldAlert size={20} /> : <Navigation size={20} />}
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold text-ink tracking-tight capitalize">{selectedRole} Login</h2>
                    <p className="text-ink-3 text-xs font-bold uppercase tracking-wider">Accessing {selectedRole} Portal</p>
                  </div>
                </div>
                <p className="text-ink-3 text-sm font-medium">Enter your credentials to continue to the dashboard.</p>
              </div>

              <form onSubmit={handleAuth} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-ink-3 uppercase tracking-wider mb-2">Email Address</label>
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
                    <label className="block text-xs font-bold text-ink-3 uppercase tracking-wider">Password</label>
                    <a href="#" className="text-xs font-bold text-primary hover:text-primary-dark">Forgot?</a>
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
                  onClick={() => setStep(1)} 
                  className="w-full text-center py-2 text-xs font-bold text-ink-4 hover:text-ink transition-colors mt-2"
                >
                  &larr; Switch role
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
