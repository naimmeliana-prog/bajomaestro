import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'Ha ocurrido un error inesperado.',
    };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('ErrorBoundary capturó un error:', error, info);
  }

  override render(): React.ReactNode {
    if (this.state.hasError) {
      let parsedMsg = this.state.message;
      try {
        const parsed = JSON.parse(this.state.message);
        if (parsed?.error) {
          parsedMsg = `Error de sincronización (${parsed.operationType}): ${parsed.error}`;
        }
      } catch {
        // Keep raw message if not JSON
      }

      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h2 className="text-lg font-semibold">Se produjo un inconveniente</h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed break-words">
              {parsedMsg}
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, message: '' });
                window.location.reload();
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Recargar aplicación
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
