import { Component } from 'react';

/**
 * Top-level React error boundary to catch unexpected render errors.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled UI Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>
          <div className="card">
            <h2>Something went wrong</h2>
            <p style={{ marginTop: '0.75rem', color: '#6b7280' }}>
              An unexpected interface error occurred.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              style={{ marginTop: '1.25rem' }}
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
