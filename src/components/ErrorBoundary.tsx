import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RotateCcw, Home, Copy, Check } from "lucide-react";
import { ROUTES } from "@/constants/routes";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  copied: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, copied: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an unhandled error:", error, errorInfo);

    // If dynamic chunk loading failed (e.g. after a redeploy with new asset hashes)
    const errorMsg = error.message || "";
    if (
      errorMsg.includes("Failed to fetch dynamically imported module") ||
      errorMsg.includes("Importing a module script failed")
    ) {
      // Automatic reload if not previously attempted in this session
      const hasReloaded = sessionStorage.getItem("chunk_reload_attempted");
      if (!hasReloaded) {
        sessionStorage.setItem("chunk_reload_attempted", "true");
        window.location.reload();
      }
    }
  }

  private handleCopy = () => {
    if (this.state.error) {
      navigator.clipboard.writeText(
        `${this.state.error.name}: ${this.state.error.message}\n${this.state.error.stack || ""}`,
      );
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    }
  };

  public render() {
    if (this.state.hasError) {
      const isChunkError =
        this.state.error?.message?.includes("Failed to fetch dynamically imported module") ||
        this.state.error?.message?.includes("Importing a module script failed");

      return (
        <div className="flex flex-col items-center justify-center min-h-[450px] w-full p-8 text-center bg-white rounded-3xl border border-line-2 shadow-sm animate-in fade-in duration-500 max-w-xl mx-auto my-12">
          <div className="w-16 h-16 bg-urgent-light text-urgent rounded-2xl flex items-center justify-center mb-6 shadow-sm">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-xl font-semibold text-ink mb-2 tracking-normal">
            {isChunkError ? "Application Update Available" : "Something went wrong"}
          </h2>
          <p className="text-sm text-ink-3 mb-8 max-w-md mx-auto">
            {isChunkError
              ? "A newer version of the dashboard has been deployed. Please reload the page to load the latest updates."
              : "The application encountered an unexpected error. Don't worry, your data is safe."}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                sessionStorage.removeItem("chunk_reload_attempted");
                window.location.reload();
              }}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl font-medium shadow-md shadow-primary/20 hover:opacity-95 transition-all"
            >
              <RotateCcw size={18} />
              Reload Page
            </button>

            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.replace(ROUTES.dashboard);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-line-1 text-ink rounded-xl font-medium hover:bg-line-2 transition-colors"
            >
              <Home size={18} />
              Dashboard
            </button>

            <button
              type="button"
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-5 py-2.5 bg-bg text-ink rounded-xl font-medium hover:bg-line-1 transition-colors"
            >
              Try Again
            </button>
          </div>

          {this.state.error && (
            <div className="mt-8 p-4 bg-bg rounded-xl border border-line-2 text-left w-full overflow-auto max-h-40 relative group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-ink-3 uppercase tracking-wider">
                  Error Details
                </span>
                <button
                  type="button"
                  onClick={this.handleCopy}
                  className="text-xs text-ink-4 hover:text-ink flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-line-2 shadow-2xs"
                >
                  {this.state.copied ? (
                    <Check size={12} className="text-green-600" />
                  ) : (
                    <Copy size={12} />
                  )}
                  {this.state.copied ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="text-xs text-urgent font-mono break-all">
                {this.state.error.toString()}
              </p>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
