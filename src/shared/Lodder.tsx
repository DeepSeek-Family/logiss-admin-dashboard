import { Loader2 } from 'lucide-react';

interface LoaderProps {
  message?: string;
  className?: string;
  /** Stretch to a page-sized area. Omit for an inline section loader. */
  fullScreen?: boolean;
}

export const Loader = ({
  message = 'Loading...',
  className = '',
  fullScreen = false,
}: LoaderProps) => (
  <div
    className={`flex flex-col items-center justify-center gap-4 animate-in fade-in duration-500 ${
      fullScreen ? 'min-h-[60vh] w-full' : 'py-12 w-full'
    } ${className}`}
    role="status"
    aria-live="polite"
    aria-busy="true"
  >
    <Loader2 className="w-10 h-10 text-primary animate-spin" />
    {message ? <p className="text-sm text-ink-4">{message}</p> : null}
  </div>
);

export default Loader;
