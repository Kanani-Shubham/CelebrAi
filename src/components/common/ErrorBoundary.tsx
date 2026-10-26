import React, { Component, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[CelebrAI ErrorBoundary caught an error]', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-soft-satin, #F7F1E8)',
          padding: '24px',
          fontFamily: 'var(--font-sans, system-ui, sans-serif)',
          color: 'var(--color-tuxedo-black, #171F20)',
        }}>
          <div style={{
            maxWidth: '480px',
            width: '100%',
            background: '#FFFFFF',
            borderRadius: '24px',
            padding: '36px 32px',
            border: '1px solid var(--border-default, #ECE6DE)',
            boxShadow: '0 8px 30px rgba(23, 31, 32, 0.08)',
            textAlign: 'center',
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#FEF3C7',
              color: '#D97706',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
            }}>
              <AlertTriangle size={28} />
            </div>

            <h1 style={{
              fontFamily: 'var(--font-serif, "Playfair Display", Georgia, serif)',
              fontSize: '24px',
              margin: '0 0 12px 0',
              fontWeight: 600,
            }}>
              Something went wrong
            </h1>

            <p style={{
              fontSize: '14px',
              color: 'var(--text-secondary, #827A76)',
              lineHeight: '1.6',
              margin: '0 0 24px 0',
            }}>
              We encountered an unexpected display error. The application recovered safely, but this view could not finish loading.
            </p>

            {this.state.error && (
              <div style={{
                background: '#F9FAFB',
                borderRadius: '12px',
                padding: '12px',
                fontSize: '12px',
                color: '#EF4444',
                fontFamily: 'monospace',
                textAlign: 'left',
                margin: '0 0 24px 0',
                wordBreak: 'break-word',
                maxHeight: '120px',
                overflowY: 'auto',
              }}>
                {this.state.error.message}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={this.handleReload}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '9999px',
                  background: 'var(--color-tuxedo-black, #171F20)',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                <RotateCcw size={16} />
                <span>Reload Page</span>
              </button>

              <button
                onClick={this.handleGoHome}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '9999px',
                  background: 'transparent',
                  color: 'var(--color-tuxedo-black, #171F20)',
                  border: '1px solid var(--border-default, #ECE6DE)',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                <Home size={16} />
                <span>Return to Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
