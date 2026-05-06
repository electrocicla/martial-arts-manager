import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Vite SPAs ship code-split chunks with a content hash in the filename.
    // After a deploy the previous index.html still cached in the browser may
    // reference a chunk that no longer exists on the CDN, surfacing as
    // "Failed to fetch dynamically imported module" or "Importing a module
    // script failed". Auto-reload once to pick up the fresh manifest.
    const message = error?.message ?? '';
    const isStaleChunk =
      message.includes('Failed to fetch dynamically imported module') ||
      message.includes('Importing a module script failed') ||
      message.includes('error loading dynamically imported module');
    if (isStaleChunk && typeof window !== 'undefined') {
      const RELOADED_KEY = '__chunkReloadedAt';
      const last = Number(sessionStorage.getItem(RELOADED_KEY) ?? '0');
      // Guard against an infinite reload loop — only auto-reload once per minute.
      if (Date.now() - last > 60_000) {
        sessionStorage.setItem(RELOADED_KEY, String(Date.now()));
        window.location.reload();
        return;
      }
    }
    console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full text-center">
            <h2 className="text-xl font-bold text-red-400 mb-2">Something went wrong</h2>
            <p className="text-gray-400 mb-4 text-sm">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="btn btn-primary btn-sm"
              >
                Try again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="btn btn-ghost btn-sm"
              >
                Reload page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
