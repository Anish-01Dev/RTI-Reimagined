import { Component, type ErrorInfo, type ReactNode } from "react";
import { useLocation } from "react-router-dom";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

class ErrorBoundaryInner extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(
      "Render error caught by ErrorBoundary:",
      error,
      info.componentStack,
    );
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-lg">
          <div className="max-w-md w-full bg-surface-container-lowest border border-outline-variant rounded-xl shadow-lg p-xl text-center flex flex-col gap-md">
            <span className="material-symbols-outlined text-error text-4xl mx-auto">
              error
            </span>
            <h1 className="font-headline-md text-headline-md text-on-surface">
              Something went wrong on this screen
            </h1>
            <p className="text-body-sm text-body-sm text-on-surface-variant">
              {this.state.error.message}
            </p>
            <a
              href="/dashboard"
              className="px-lg py-sm bg-primary text-on-primary rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Back to Dashboard
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/** Resets on every route change (keyed by pathname) so a render error on one
 * screen never permanently blanks the app — navigating away recovers it. */
export function ErrorBoundary({ children }: Props) {
  const location = useLocation();
  return (
    <ErrorBoundaryInner key={location.pathname}>{children}</ErrorBoundaryInner>
  );
}
