import { logger } from '../../utils/logger';
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

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('[CelebrAI ErrorBoundary caught an error]', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  override render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-wrap">
          <div className="error-boundary-card">
            <div className="error-boundary-icon">
              <AlertTriangle size={28} />
            </div>

            <h1 className="error-boundary-title">
              Something went wrong
            </h1>

            <p className="error-boundary-desc">
              We encountered an unexpected display error. The application recovered safely, but this view could not finish loading.
            </p>

            {this.state.error && (
              <div className="error-boundary-pre">
                {this.state.error.message}
              </div>
            )}

            <div className="error-boundary-actions">
              <button
                onClick={this.handleReload}
                className="error-btn-dark"
              >
                <RotateCcw size={16} />
                <span>Reload Page</span>
              </button>

              <button
                onClick={this.handleGoHome}
                className="error-btn-outline"
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
