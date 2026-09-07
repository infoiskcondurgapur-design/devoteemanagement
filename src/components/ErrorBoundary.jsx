import React from 'react';
import apiService from '../services/api';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('[ErrorBoundary] Caught an error:', error, errorInfo);
        // We could also log this to our backend /api/system/logs
        try {
            apiService.post('/api/system/logs', {
                type: 'FRONTEND_CRASH',
                source: 'ErrorBoundary',
                message: error.message,
                stack: error.stack
            });
        } catch { /* ignore log failure */ }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="error-boundary-container" style={{
                    padding: '40px',
                    textAlign: 'center',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '16px',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    margin: '20px',
                    color: '#fff'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
                    <h2 style={{ marginBottom: '10px' }}>Something went wrong</h2>
                    <p style={{ opacity: 0.7, marginBottom: '20px' }}>
                        The component failed to render. Don't worry, the rest of the application is still running.
                    </p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="vibrant-button"
                        style={{
                            padding: '10px 24px',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            border: 'none',
                            borderRadius: '8px',
                            color: 'white',
                            cursor: 'pointer',
                            fontWeight: '600'
                        }}
                    >
                        Reload Application
                    </button>
                    {import.meta.env.DEV && (
                        <pre style={{
                            marginTop: '20px',
                            padding: '16px',
                            background: 'rgba(0,0,0,0.3)',
                            borderRadius: '8px',
                            textAlign: 'left',
                            fontSize: '12px',
                            overflow: 'auto',
                            maxHeight: '200px'
                        }}>
                            {this.state.error?.stack}
                        </pre>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
