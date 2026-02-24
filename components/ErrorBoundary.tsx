
import React, { Component, ErrorInfo, ReactNode } from 'react';

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

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-8 text-center font-sans">
          <div className="bg-red-500/20 p-6 rounded-3xl border border-red-500/30 max-w-lg">
            <h1 className="text-2xl font-black mb-4 text-red-500 uppercase tracking-tighter">Erro Crítico Detetado</h1>
            <p className="text-slate-300 mb-6 font-medium">
              Ocorreu um erro inesperado no Angolife. Por favor, tente recarregar a página.
            </p>
            <div className="bg-black/50 p-4 rounded-xl text-left text-xs font-mono text-red-300 overflow-auto max-h-40 mb-6">
              {this.state.error?.toString()}
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="bg-brand-gold text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-xl"
            >
              Recarregar Aplicação
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
