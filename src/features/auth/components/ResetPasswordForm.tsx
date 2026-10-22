import React, { useState } from "react";
import { Lock, Eye, EyeOff, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/shared/components/ui";
import { useResetPasswordMutation } from "@/redux/api/authApi";
import { RESET_PASSWORD_TOKEN_KEY } from "@/constants/auth-storage";

interface ResetPasswordFormProps {
  onSuccess: () => void;
  onBack: () => void;
}

export const ResetPasswordForm = ({
  onSuccess,
  onBack,
}: ResetPasswordFormProps) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const isLengthValid = newPassword.length >= 6;
  const isMatchValid = newPassword && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      const response = await resetPassword({
        newPassword,
        confirmPassword,
      }).unwrap();

      // Clear the temporary reset password token from storage
      try {
        localStorage.removeItem(RESET_PASSWORD_TOKEN_KEY);
      } catch {
        /* ignore */
      }

      toast.success(
        response.message || "Password reset successfully! Please log in with your new password."
      );
      onSuccess();
    } catch (err: any) {
      console.warn("Reset password error:", err);
      const msg =
        err?.data?.message || err?.message || "Failed to reset password. Please try again.";
      toast.error(msg);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary-light text-primary">
            <Lock size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-ink">Reset Password</h2>
            <p className="text-xs text-ink-4">Create New Password</p>
          </div>
        </div>
        <p className="text-ink-3 text-sm font-medium">
          Please enter and confirm your new password below.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-ink-4 mb-2">
            New Password
          </label>
          <div className="relative">
            <Lock
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4"
              size={18}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-4 hover:text-ink transition-colors focus:outline-none"
              aria-label={showNewPassword ? "Hide password" : "Show password"}
            >
              {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            <input
              type={showNewPassword ? "text" : "password"}
              required
              value={newPassword}
              placeholder="Enter new password"
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-white border border-line rounded-xl py-3 pl-10 pr-10 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-ink-4 mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <Lock
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4"
              size={18}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-4 hover:text-ink transition-colors focus:outline-none"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            <input
              type={showConfirmPassword ? "text" : "password"}
              required
              value={confirmPassword}
              placeholder="Confirm new password"
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-white border border-line rounded-xl py-3 pl-10 pr-10 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
            />
          </div>
        </div>

        {/* Realtime password helpers */}
        <div className="p-3 bg-bg rounded-xl border border-line-2 space-y-1.5 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2
              size={14}
              className={isLengthValid ? "text-green-600" : "text-ink-4"}
            />
            <span className={isLengthValid ? "text-ink font-medium" : "text-ink-4"}>
              At least 6 characters
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2
              size={14}
              className={isMatchValid ? "text-green-600" : "text-ink-4"}
            />
            <span className={isMatchValid ? "text-ink font-medium" : "text-ink-4"}>
              Passwords match
            </span>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading || !isLengthValid || !isMatchValid}
          variant="primary"
          className="w-full h-12 text-sm mt-4 flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Resetting Password...
            </>
          ) : (
            <>
              Reset Password <ArrowRight size={16} className="ml-2" />
            </>
          )}
        </Button>

        <button
          type="button"
          onClick={onBack}
          className="w-full text-center py-2 text-xs font-medium text-ink-4 hover:text-ink transition-colors"
        >
          &larr; Cancel and Back to Login
        </button>
      </form>
    </div>
  );
};
