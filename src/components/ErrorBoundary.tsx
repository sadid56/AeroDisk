import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';
import { Button } from "./ui/Button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className='h-screen w-screen flex flex-col items-center justify-center bg-background text-slate-100 p-6 text-center space-y-4'>
          <div className='w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400'>
            <AlertOctagon className='w-8 h-8' />
          </div>
          <div>
            <h2 className='text-lg font-bold text-slate-100'>Something went wrong</h2>
            <p className='text-xs text-rose-400 font-mono mt-2 max-w-md bg-surface p-3 rounded-lg border border-surface-border truncate'>
              {this.state.error?.message || "An unexpected error occurred"}
            </p>
          </div>
          <Button variant='primary' onClick={() => window.location.reload()} leftIcon={<RefreshCw className='w-4 h-4' />}>
            Reload Application
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
