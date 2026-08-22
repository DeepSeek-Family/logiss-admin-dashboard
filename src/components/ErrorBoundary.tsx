import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] w-full p-8 text-center bg-white rounded-3xl border-2 border-line-2 shadow-sm animate-in fade-in duration-500">
          <div className="w-16 h-16 bg-urgent-light text-urgent rounded-2xl flex items-center justify-center mb-6 shadow-sm">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-xl font-semibold text-ink mb-2 tracking-normal">Something went wrong</h2>
          <p className="text-sm text-ink-3 mb-8 max-w-md mx-auto">
            The application encountered an unexpected error. Don't worry, your data is safe.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl font-medium shadow-md shadow-primary/20 hover:scale-105 transition-transform"
            >
              <RotateCcw size={18} />
              Reload Page
            </button>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-6 py-2.5 bg-bg text-ink rounded-xl font-medium hover:bg-line-2 transition-colors"
            >
              Try Again
            </button>
          </div>
          {import.meta.env.DEV && (
            <div className="mt-8 p-4 bg-bg rounded-xl border border-line-2 text-left w-full overflow-auto max-h-40">
              <p className="text-xs text-urgent">{this.state.error?.toString()}</p>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
