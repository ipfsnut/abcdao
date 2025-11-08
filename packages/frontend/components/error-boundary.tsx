'use client';

import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log React errors (like hook order violations)
    console.error('React Error Boundary caught an error:', error, errorInfo);
    
    // Check if it's a hook order violation (error #310)
    if (error.message?.includes('310') || error.message?.includes('hook')) {
      console.error('🚨 Hook order violation detected!');
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen bg-black text-green-400 font-mono flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-xl text-green-400 mb-2">Component Error</h2>
            <p className="text-green-600 mb-4">A React component error occurred</p>
            <button 
              onClick={() => this.setState({ hasError: false })}
              className="bg-green-950/20 border border-green-900/50 text-green-400 px-4 py-2 rounded font-mono hover:bg-green-900/30"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}