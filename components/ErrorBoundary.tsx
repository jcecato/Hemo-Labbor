import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  declare props: Readonly<ErrorBoundaryProps>;
  declare setState: (state: Partial<ErrorBoundaryState>) => void;
  state: ErrorBoundaryState = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error?.message || 'Erro inesperado ao renderizar a interface.',
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary capturou erro:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false, message: '' });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-lg p-8 text-center space-y-4">
            <h2 className="text-lg font-bold text-slate-800">Algo deu errado na tela</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Ocorreu uma falha inesperada na exibição deste painel. Seus dados salvos no banco permanecem seguros.
            </p>
            {this.state.message && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-3 break-words">
                {this.state.message}
              </p>
            )}
            <button
              type="button"
              onClick={this.handleReload}
              className="px-6 py-2.5 bg-medical-600 hover:bg-medical-700 text-white text-sm font-bold rounded-xl transition-colors"
            >
              Recarregar Aplicativo
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
