import { useSearchParams, useNavigate } from "react-router-dom";
import { AuthLayout } from "./components/AuthLayout";
import { VerifyOtpForm } from "./components/VerifyOtpForm";
import { ROUTES } from "@/constants/routes";

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const queryEmail = searchParams.get("email");
  const storedEmail =
    typeof sessionStorage !== "undefined"
      ? sessionStorage.getItem("recovery_email")
      : null;
  const email = queryEmail || storedEmail || "";

  const handleSuccess = () => {
    navigate(ROUTES.resetPassword);
  };

  const handleBack = () => {
    navigate(ROUTES.forgotPassword);
  };

  const handleChangeEmail = () => {
    navigate(ROUTES.forgotPassword);
  };

  return (
    <AuthLayout>
      <VerifyOtpForm
        email={email}
        onSuccess={handleSuccess}
        onBack={handleBack}
        onChangeEmail={handleChangeEmail}
      />
    </AuthLayout>
  );
};

export default VerifyEmailPage;
