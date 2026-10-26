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
            const errorMsg = this.state.error?.message || String(this.state.error || '');
            const isChunkError = errorMsg.includes('dynamically imported module') ||
                                 errorMsg.includes('Loading chunk') ||
                                 this.state.error?.name === 'ChunkLoadError';

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
                    <div style={{ fontSize: '48px', marginBottom: '20px' }}>{isChunkError ? '🔄' : '⚠️'}</div>
                    <h2 style={{ marginBottom: '10px' }}>
                        {isChunkError ? 'App Update Available' : 'Something went wrong'}
                    </h2>
                    <p style={{ opacity: 0.8, marginBottom: '20px', maxWidth: '500px', margin: '0 auto 20px' }}>
                        {isChunkError
                            ? 'A new version of the application has been deployed. Please reload the page to load the latest components.'
                            : "The component failed to render. Don't worry, the rest of the application is still running."
                        }
                    </p>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                        <button 
                            onClick={() => window.location.reload()}
                            className="vibrant-button"
                            style={{
                                padding: '10px 24px',
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                border: 'none',
                                borderRadius: '8px',
                                color: 'white',
                                cursor: 'pointer',
                                fontWeight: '600'
                            }}
                        >
                            {isChunkError ? 'Update & Reload' : 'Reload Application'}
                        </button>
                    </div>

                    {this.state.error && (
                        <details style={{ marginTop: '24px', textAlign: 'left', maxWidth: '650px', margin: '24px auto 0' }}>
                            <summary style={{ cursor: 'pointer', opacity: 0.7, fontSize: '12px', marginBottom: '8px', textAlign: 'center' }}>
                                View Technical Error Details
                            </summary>
                            <pre style={{
                                padding: '16px',
                                background: 'rgba(0,0,0,0.6)',
                                borderRadius: '8px',
                                fontSize: '11px',
                                overflow: 'auto',
                                maxHeight: '200px',
                                color: '#fca5a5',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word'
                            }}>
                                <strong>{errorMsg}</strong>
                                {'\n\n'}
                                {this.state.error?.stack}
                            </pre>
                        </details>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
