import React, { useState } from "react";
import { KeyRound, Mail, ArrowRight, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/shared/components/ui";
import { useForgotPasswordMutation } from "@/redux/api/authApi";

interface ForgotPasswordFormProps {
  email: string;
  setEmail: (val: string) => void;
  onSuccess: (email: string) => void;
  onBack: () => void;
}

export const ForgotPasswordForm = ({
  email,
  setEmail,
  onSuccess,
  onBack,
}: ForgotPasswordFormProps) => {
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const [localEmail, setLocalEmail] = useState(email || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = localEmail.trim();

    if (!cleanEmail) {
      toast.error("Please enter your email address.");
      return;
    }

    try {
      const response = await forgotPassword({ email: cleanEmail }).unwrap();
      setEmail(cleanEmail);
      toast.success(response.message || "Verification code sent to your email!");
      onSuccess(cleanEmail);
    } catch (err: any) {
      console.warn("Forgot password error:", err);
      const errorMsg =
        err?.data?.message || err?.message || "Failed to send reset code. Please try again.";
      toast.error(errorMsg);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary-light text-primary">
            <KeyRound size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-ink">Forgot Password</h2>
            <p className="text-xs text-ink-4">Account Recovery</p>
          </div>
        </div>
        <p className="text-ink-3 text-sm font-medium">
          Enter your registered email address and we will send you a 6-digit verification code to
          reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-medium text-ink-4 mb-2">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" size={18} />
            <input
              type="email"
              required
              value={localEmail}
              placeholder="Enter your registered email"
              onChange={(e) => setLocalEmail(e.target.value)}
              className="w-full bg-white border border-line rounded-xl py-3 pl-10 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          variant="primary"
          className="w-full h-12 text-sm mt-4 flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending Code...
            </>
          ) : (
            <>
              Send Verification Code <ArrowRight size={16} className="ml-2" />
            </>
          )}
        </Button>

        <button
          type="button"
          onClick={onBack}
          className="w-full text-center py-2 text-xs font-medium text-ink-4 hover:text-ink transition-colors mt-2"
        >
          &larr; Back to Login
        </button>
      </form>
    </div>
  );
};
