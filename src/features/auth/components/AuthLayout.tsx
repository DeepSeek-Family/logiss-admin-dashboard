import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="flex min-h-screen bg-bg">
      {/* Left Side: Brand Imagery & Messaging */}
      <div className="relative items-center justify-center hidden w-1/2 overflow-hidden lg:flex bg-bg">
        <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-r from-ink/60 to-ink/20"></div>
        <img
          src="/login-bg.png"
          alt="Dispatch Center"
          className="absolute inset-0 z-0 object-cover w-full h-full"
        />
        <div className="relative z-20 w-full max-w-2xl p-16 mt-auto text-left">
          <div className="mb-8">
            <img
              src="/logo.png"
              alt="Logiss Rides"
              className="w-auto h-24 p-2 drop-shadow-lg bg-white/80 rounded-xl backdrop-blur-sm"
            />
          </div>
          <h1 className="mb-4 text-4xl font-semibold leading-tight text-white">
            Reliable Transportation
            <br />
            for Every Appointment
          </h1>
          <p className="max-w-md text-lg text-white/70">
            Coordinate scheduled medical rides, manage transportation requests, and stay informed
            with a platform built for dependable and organized trip management.
          </p>
        </div>
      </div>

      {/* Right Side: Authentication Forms */}
      <div className="relative flex flex-col items-center justify-center flex-1 p-8 lg:p-16">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex flex-col items-center mb-10 lg:hidden">
            <img src="/logo.png" alt="Logiss Rides" className="w-auto h-20" />
          </div>

          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
