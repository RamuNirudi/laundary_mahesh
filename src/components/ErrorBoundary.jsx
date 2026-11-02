import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

/**
 * Catches render errors so one broken page shows a message instead of blanking
 * the whole app. React has no hook equivalent, so this stays a class component.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Render error:", error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h1 className="mt-5 font-heading text-xl font-bold">Something went wrong on this page</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          The rest of the app is still working. Try reloading, or go back and open the page again.
        </p>
        <pre className="mt-4 max-w-lg overflow-x-auto rounded-xl bg-secondary/50 p-3 text-left text-xs text-muted-foreground">
          {this.state.error?.message || String(this.state.error)}
        </pre>
        <button
          onClick={() => window.location.reload()}
          className="mt-5 shine inline-flex h-11 items-center gap-2 rounded-full bg-gradient-brand px-6 text-sm font-semibold text-primary-foreground shadow-glow-sm transition-all duration-300 ease-swift hover:shadow-glow active:scale-[0.97]"
        >
          <RefreshCw className="h-4 w-4" /> Reload page
        </button>
      </div>
    );
  }
}
