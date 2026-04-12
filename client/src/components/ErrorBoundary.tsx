import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="bg-surface rounded-2xl border border-border p-4 card-glow">
          <p className="text-secondary text-sm font-sans">Something went wrong rendering this section.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-2 text-accent text-sm font-sans underline"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}