import { AlertTriangle } from "lucide-react";
import { Button } from "./Button";

interface QueryFeedbackProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const QueryFeedback = ({
  title = "Something went wrong",
  message,
  onRetry,
}: QueryFeedbackProps) => (
  <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
    <div className="w-14 h-14 rounded-2xl bg-urgent/10 flex items-center justify-center mb-4">
      <AlertTriangle className="text-urgent" size={28} />
    </div>
    <h3 className="text-base font-semibold text-ink mb-1">{title}</h3>
    <p className="text-sm text-ink-3 max-w-md mb-6">{message}</p>
    {onRetry ? (
      <Button type="button" variant="primary" onClick={onRetry}>
        Try again
      </Button>
    ) : null}
  </div>
);
