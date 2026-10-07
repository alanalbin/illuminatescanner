import React, { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark-950 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md p-6 rounded-2xl bg-dark-900 border border-purple-500/40 shadow-glow-purple space-y-4">
            <h2 className="text-xl font-bold text-purple-300">Illuminate 2026 Entry Desk</h2>
            <p className="text-sm text-slate-300">
              Something encountered an issue while loading. Tap below to reload.
            </p>
            <p className="text-xs font-mono text-rose-400 bg-rose-950/40 p-2 rounded border border-rose-900/50">
              {this.state.error?.message || 'Unknown error'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.href = '/scanner';
              }}
              className="w-full py-2.5 rounded-xl font-bold text-sm bg-purple-600 hover:bg-purple-500 text-white shadow-glow-purple transition-all"
            >
              Open Pass Scanner
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
