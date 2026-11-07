import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            backgroundColor: 'var(--color-muted, #f9fafb)',
          }}
        >
          <div
            style={{
              maxWidth: '560px',
              width: '100%',
              backgroundColor: '#ffffff',
              border: '2px solid var(--color-danger, #ef4444)',
              borderRadius: 'var(--radius-lg, 12px)',
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              textAlign: 'center',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: '3.5rem',
                height: '3.5rem',
                borderRadius: '50%',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertCircle size={28} strokeWidth={2.4} />
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--fg-main, #111827)' }}>
              Something went wrong
            </h2>

            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                fontWeight: 800,
                fontSize: '0.9375rem',
                backgroundColor: 'var(--color-primary, #FF6F61)',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                marginTop: '0.5rem',
              }}
            >
              <RotateCcw size={16} strokeWidth={2.4} />
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
