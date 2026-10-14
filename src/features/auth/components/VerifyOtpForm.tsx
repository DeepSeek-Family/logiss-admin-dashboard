import React, { useState, useEffect, useRef } from "react";
import { ShieldCheck, ArrowRight, Loader2, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/shared/components/ui";
import { useVerifyEmailMutation, useResendOtpMutation } from "@/redux/api/authApi";
import { RESET_PASSWORD_TOKEN_KEY } from "@/constants/auth-storage";

interface VerifyOtpFormProps {
  email: string;
  onSuccess: (resetToken: string) => void;
  onBack: () => void;
  onChangeEmail: () => void;
}

export const VerifyOtpForm = ({
  email,
  onSuccess,
  onBack,
  onChangeEmail,
}: VerifyOtpFormProps) => {
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState<number>(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [verifyEmail, { isLoading: isVerifying }] = useVerifyEmailMutation();
  const [resendOtp, { isLoading: isResending }] = useResendOtpMutation();

  // 60-second countdown timer for Resend OTP
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Focus the first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only accept numeric characters
    const numericValue = value.replace(/\D/g, "");
    if (!numericValue) {
      const nextOtp = [...otp];
      nextOtp[index] = "";
      setOtp(nextOtp);
      return;
    }

    const nextOtp = [...otp];
    // If user pasted multiple digits into one field
    if (numericValue.length > 1) {
      const chars = numericValue.slice(0, 6).split("");
      chars.forEach((char, i) => {
        if (index + i < 6) {
          nextOtp[index + i] = char;
        }
      });
      setOtp(nextOtp);
      const nextFocusIndex = Math.min(index + chars.length, 5);
      inputRefs.current[nextFocusIndex]?.focus();
      return;
    }

    nextOtp[index] = numericValue.slice(-1);
    setOtp(nextOtp);

    // Auto-advance to next input
    if (index < 5 && numericValue) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pastedData) return;

    const nextOtp = [...otp];
    pastedData.split("").forEach((char, i) => {
      nextOtp[i] = char;
    });
    setOtp(nextOtp);
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleResend = async () => {
    if (countdown > 0 || isResending) return;

    try {
      const res = await resendOtp({ email }).unwrap();
      toast.success(res.message || "A new OTP code has been sent to your email!");
      setCountdown(60);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      console.warn("Resend OTP error:", err);
      const msg = err?.data?.message || err?.message || "Failed to resend code. Please try again.";
      toast.error(msg);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const codeString = otp.join("").trim();

    if (codeString.length !== 6) {
      toast.error("Please enter the complete 6-digit verification code.");
      return;
    }

    try {
      const response = await verifyEmail({
        email,
        oneTimeCode: Number(codeString),
      }).unwrap();

      if (response.success && response.data) {
        // Save token to localStorage as required
        const resetToken = response.data;
        try {
          localStorage.setItem(RESET_PASSWORD_TOKEN_KEY, resetToken);
        } catch {
          /* ignore */
        }

        toast.success(response.message || "Email verified successfully!");
        onSuccess(resetToken);
      } else {
        toast.error(response.message || "Invalid verification code.");
      }
    } catch (err: any) {
      console.warn("Verify email error:", err);
      const msg =
        err?.data?.message || err?.message || "Invalid or expired verification code.";
      toast.error(msg);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-accent-light text-accent">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-ink">Verify Email</h2>
            <p className="text-xs text-ink-4">Enter 6-digit Code</p>
          </div>
        </div>
        <p className="text-ink-3 text-sm font-medium">
          We have sent a 6-digit verification code to{" "}
          <span className="font-semibold text-ink break-all">{email}</span>.
        </p>
        <button
          type="button"
          onClick={onChangeEmail}
          className="text-xs font-semibold text-primary hover:text-primary-dark mt-1 inline-block"
        >
          Wrong email? Change
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs font-medium text-ink-4 mb-3 text-center">
            Verification Code
          </label>
          <div className="flex items-center justify-between gap-2 sm:gap-2.5">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={idx === 0 ? handlePaste : undefined}
                className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold font-mono bg-white border border-line rounded-xl text-ink focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs font-medium">
          <span className="text-ink-4">Didn't receive the code?</span>
          {countdown > 0 ? (
            <span className="text-ink-3 font-mono">
              Resend in <span className="font-semibold text-primary">{countdown}s</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="text-primary hover:text-primary-dark flex items-center gap-1 font-semibold transition-colors"
            >
              <RotateCcw size={12} className={isResending ? "animate-spin" : ""} />
              Resend Code
            </button>
          )}
        </div>

        <Button
          type="submit"
          disabled={isVerifying || otp.join("").length !== 6}
          variant="primary"
          className="w-full h-12 text-sm flex items-center justify-center"
        >
          {isVerifying ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...
            </>
          ) : (
            <>
              Verify Code <ArrowRight size={16} className="ml-2" />
            </>
          )}
        </Button>

        <button
          type="button"
          onClick={onBack}
          className="w-full text-center py-2 text-xs font-medium text-ink-4 hover:text-ink transition-colors"
        >
          &larr; Back
        </button>
      </form>
    </div>
  );
};
