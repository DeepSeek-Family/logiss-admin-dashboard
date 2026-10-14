import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthLayout } from "./components/AuthLayout";
import { ForgotPasswordForm } from "./components/ForgotPasswordForm";
import { ROUTES } from "@/constants/routes";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleSuccess = (submittedEmail: string) => {
    try {
      sessionStorage.setItem("recovery_email", submittedEmail);
    } catch {
      /* ignore */
    }
    navigate(`${ROUTES.verifyEmail}?email=${encodeURIComponent(submittedEmail)}`);
  };

  const handleBack = () => {
    navigate(ROUTES.login);
  };

  return (
    <AuthLayout>
      <ForgotPasswordForm
        email={email}
        setEmail={setEmail}
        onSuccess={handleSuccess}
        onBack={handleBack}
      />
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
