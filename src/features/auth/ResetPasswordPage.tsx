import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { AuthLayout } from "./components/AuthLayout";
import { ResetPasswordForm } from "./components/ResetPasswordForm";
import { ROUTES } from "@/constants/routes";
import { RESET_PASSWORD_TOKEN_KEY } from "@/constants/auth-storage";

const ResetPasswordPage = () => {
  const navigate = useNavigate();

  // Validate that a reset token exists from the verify-email step
  useEffect(() => {
    const token =
      typeof localStorage !== "undefined"
        ? localStorage.getItem(RESET_PASSWORD_TOKEN_KEY)
        : null;

    if (!token) {
      toast.error("Please verify your email first.");
      navigate(ROUTES.forgotPassword, { replace: true });
    }
  }, [navigate]);

  const handleSuccess = () => {
    navigate(ROUTES.login);
  };

  const handleBack = () => {
    navigate(ROUTES.login);
  };

  return (
    <AuthLayout>
      <ResetPasswordForm onSuccess={handleSuccess} onBack={handleBack} />
    </AuthLayout>
  );
};

export default ResetPasswordPage;
