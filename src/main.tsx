import React, { StrictMode, Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static override getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in TalentMatch App:', error, errorInfo);
  }

  public override render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#0a0a0c',
          color: '#f4f4f6',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{
            maxWidth: '600px',
            width: '100%',
            backgroundColor: '#161618',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '1.5rem',
            padding: '2rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <h1 style={{ color: '#00ff41', fontSize: '1.5rem', fontWeight: 900, marginBottom: '1rem', textTransform: 'uppercase' }}>
              ⚡ TalentMatch - Error de Ejecución
            </h1>
            <p style={{ color: '#a1a1aa', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Se produjo una excepción durante la inicialización de la interfaz:
            </p>
            <pre style={{
              backgroundColor: '#0a0a0c',
              padding: '1rem',
              borderRadius: '0.75rem',
              overflowX: 'auto',
              fontSize: '0.8rem',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              marginBottom: '1.5rem'
            }}>
              {this.state.error?.message || 'Error desconocido de React'}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#00ff41',
                color: '#000',
                fontWeight: 900,
                padding: '0.75rem 1.5rem',
                borderRadius: '0.75rem',
                border: 'none',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              Reiniciar Aplicación
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
