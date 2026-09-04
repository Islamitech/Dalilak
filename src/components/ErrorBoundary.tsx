import React, { ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  declare props: Readonly<ErrorBoundaryProps>;
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  constructor(props: ErrorBoundaryProps) {
    super(props);
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React error:', error, errorInfo);

    // Auto-recover from stale chunks after new deployments without showing crash UI
    const msg = error?.message || String(error || '');
    const isChunkLoadError =
      msg.includes('Failed to fetch dynamically imported module') ||
      msg.includes('Importing a module script failed') ||
      msg.includes('error loading dynamically imported module') ||
      msg.includes('Loading chunk');

    if (isChunkLoadError && typeof window !== 'undefined') {
      const lastReload = sessionStorage.getItem('dalelak_eb_chunk_reload');
      const now = Date.now();
      if (!lastReload || now - Number(lastReload) > 15000) {
        sessionStorage.setItem('dalelak_eb_chunk_reload', String(now));
        window.location.reload();
        return;
      }
    }

    // Save crash report for admin review
    try {
      const report = {
        message: error.message,
        stack: error.stack?.substring(0, 500),
        componentStack: errorInfo.componentStack?.substring(0, 300),
        timestamp: new Date().toISOString(),
        url: window.location.href,
      };
      const existing = JSON.parse(localStorage.getItem('dalelak_crash_reports') || '[]');
      existing.unshift(report);
      // Keep only last 10 reports
      localStorage.setItem('dalelak_crash_reports', JSON.stringify(existing.slice(0, 10)));
    } catch {
      // Silently fail if storage is full
    }
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
                try {
                  localStorage.removeItem('dalelak_logged_user');
                  localStorage.removeItem('dalelak_cached_businesses');
                  localStorage.removeItem('dalelak_cached_reps');
                  localStorage.removeItem('dalelak_custom_reps');
                  sessionStorage.clear();
                } catch {}
                window.location.reload();
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
