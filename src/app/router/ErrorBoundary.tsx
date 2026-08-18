import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorState } from '@/shared/ui';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Last-resort boundary for render-time crashes.
 *
 * API failures are handled by `QueryBoundary`; this catches the programming
 * errors that would otherwise leave the user with a blank page.
 */
export class AppErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // TBD — BACKEND CONTRACT: forward to the error reporting service once one
    // is chosen. Logging is intentionally the only side effect for now.
    console.error('Unhandled UI error', error, info.componentStack);
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-dvh items-center justify-center">
          <ErrorState
            title="The page could not be displayed"
            description="An unexpected error occurred. Reloading usually resolves it."
            onRetry={() => window.location.reload()}
          />
        </div>
      );
    }
    return this.props.children;
  }
}
