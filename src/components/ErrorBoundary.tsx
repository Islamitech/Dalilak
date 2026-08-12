import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 font-['Cairo',sans-serif]">
          <div className="bg-slate-800 border border-amber-500/30 rounded-3xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 bg-amber-500/20 text-amber-400 rounded-2xl mx-auto flex items-center justify-center text-2xl font-black border border-amber-500/40">
              ⚠️
            </div>
            <h2 className="text-lg font-black text-white">حدث خطأ أثناء تحميل الصفحة</h2>
            {this.state.error && (
              <div className="bg-slate-950 p-3 rounded-xl border border-rose-500/30 text-rose-300 font-mono text-[11px] dir-ltr text-left overflow-x-auto max-h-32">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}
            <p className="text-xs text-slate-300 font-bold leading-relaxed">
              يرجى إعادة تحميل الصفحة لتنشيط التطبيق. إذا استمرت المشكلة قم بمسح الذاكرة المؤقتة للمتصفح.
            </p>
            <button
              onClick={() => {
                localStorage.removeItem('dalelak_logged_user');
                window.location.href = '/';
              }}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black py-3 rounded-xl shadow-lg transition-all active:scale-95 text-xs cursor-pointer"
            >
              إعادة تحميل المنصة الآن
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
