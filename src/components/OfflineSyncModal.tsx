import React, { useState, useEffect } from 'react';
import {
  Wifi,
  WifiOff,
  CloudUpload,
  RefreshCw,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  Store,
  Users,
  Wallet,
  X,
  Database,
  ShieldCheck,
} from 'lucide-react';
import { Business, InterestedLead, PayoutRequest } from '../types';
import {
  getOfflineBusinesses,
  getOfflineLeads,
  getOfflinePayouts,
  syncAllPendingOfflineData,
  exportOfflineBackupJson,
} from '../services/offlineSync';

interface OfflineSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncComplete?: () => void;
}

export const OfflineSyncModal: React.FC<OfflineSyncModalProps> = ({
  isOpen,
  onClose,
  onSyncComplete,
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [offlineBusinesses, setOfflineBusinesses] = useState<Business[]>([]);
  const [offlineLeads, setOfflineLeads] = useState<InterestedLead[]>([]);
  const [offlinePayouts, setOfflinePayouts] = useState<PayoutRequest[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number; message: string } | null>(null);
  const [syncResult, setSyncResult] = useState<{ success: boolean; text: string } | null>(null);

  const loadOfflineData = async () => {
    try {
      const [biz, leads, payouts] = await Promise.all([
        getOfflineBusinesses(),
        getOfflineLeads(),
        getOfflinePayouts(),
      ]);
      setOfflineBusinesses(biz);
      setOfflineLeads(leads);
      setOfflinePayouts(payouts);
      setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
    } catch (err) {
      console.warn('Failed to load offline modal data:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadOfflineData();
      setSyncResult(null);
    }

    const handleStateChange = () => {
      loadOfflineData();
    };

    window.addEventListener('dalelak_offline_state_changed', handleStateChange);
    window.addEventListener('online', handleStateChange);
    window.addEventListener('offline', handleStateChange);

    return () => {
      window.removeEventListener('dalelak_offline_state_changed', handleStateChange);
      window.removeEventListener('online', handleStateChange);
      window.removeEventListener('offline', handleStateChange);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const totalPending = offlineBusinesses.length + offlineLeads.length + offlinePayouts.length;

  const handleStartManualSync = async () => {
    if (!navigator.onLine) {
      setSyncResult({
        success: false,
        text: '⚠️ هاتفك غير متصل بالإنترنت حالياً. يرجى تفعيل بيانات الهاتف أو شبكة الواي فاي ثم إعادة المحاولة.',
      });
      return;
    }

    setIsSyncing(true);
    setSyncResult(null);

    try {
      const result = await syncAllPendingOfflineData((current, total, message) => {
        setSyncProgress({ current, total, message });
      });

      await loadOfflineData();

      if (result.syncedCount > 0) {
        setSyncResult({
          success: true,
          text: `🎉 تم بنجاح مزامنة ورفع ${result.syncedCount} عنصراً إلى قاعدة البيانات السحابية!`,
        });
        if (onSyncComplete) onSyncComplete();
      } else if (result.failedCount > 0) {
        setSyncResult({
          success: false,
          text: `⚠️ تعذر مزامنة بعض العناصر لضعف الاتصال. سيتم تكرار المحاولة تلقائياً فور استقرار الشبكة.`,
        });
      } else {
        setSyncResult({
          success: true,
          text: '✨ كافة بياناتك متزامنة ومحدثة بالكامل مع السيرفر السحابي.',
        });
      }
    } catch {
      setSyncResult({
        success: false,
        text: 'حدث خطأ غير متوقع أثناء المزامنة. تم الاحتفاظ ببياناتك بأمان على هاتفك.',
      });
    } finally {
      setIsSyncing(false);
      setSyncProgress(null);
    }
  };

  const handleExportBackup = async () => {
    try {
      await exportOfflineBackupJson();
    } catch (err) {
      console.warn('Backup export notice:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in" dir="rtl">
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between border-b border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-inner ${isOnline ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
              {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base flex items-center gap-2">
                <span>مركز المزامنة والعمل بدون إنترنت</span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-500/30">
                  IndexedDB 🛡️
                </span>
              </h3>
              <p className="text-[11px] text-slate-300 font-bold mt-0.5">
                {isOnline ? '🟢 هاتفك متصل بالإنترنت وجاهز للمزامنة' : '🔴 وضع عدم الاتصال (أوفلاين) - بياناتك محفوظة بأمان'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-right">
          {/* Status Alert */}
          {syncResult && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-fade-in ${
                syncResult.success
                  ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-500/15 border border-rose-500/40 text-rose-700 dark:text-rose-300'
              }`}
            >
              {syncResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
              )}
              <span>{syncResult.text}</span>
            </div>
          )}

          {/* Pending Queue Statistics Cards */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-3 text-center">
              <div className="w-7 h-7 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-1">
                <Store className="w-4 h-4" />
              </div>
              <div className="font-black text-lg text-[var(--text-primary)]">{offlineBusinesses.length}</div>
              <div className="text-[10.5px] font-bold text-[var(--text-muted)]">أنشطة بانتظار الرفع</div>
            </div>

            <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-3 text-center">
              <div className="w-7 h-7 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-1">
                <Users className="w-4 h-4" />
              </div>
              <div className="font-black text-lg text-[var(--text-primary)]">{offlineLeads.length}</div>
              <div className="text-[10.5px] font-bold text-[var(--text-muted)]">عملاء مهتمون</div>
            </div>

            <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-3 text-center">
              <div className="w-7 h-7 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto mb-1">
                <Wallet className="w-4 h-4" />
              </div>
              <div className="font-black text-lg text-[var(--text-primary)]">{offlinePayouts.length}</div>
              <div className="text-[10.5px] font-bold text-[var(--text-muted)]">طلبات تسوية</div>
            </div>
          </div>

          {/* Sync Progress Indicator */}
          {isSyncing && syncProgress && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-black text-amber-700 dark:text-amber-300">
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
                  <span>{syncProgress.message}</span>
                </span>
                <span>
                  {syncProgress.current} من {syncProgress.total}
                </span>
              </div>
              <div className="w-full bg-amber-200 dark:bg-amber-950/60 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Detailed Offline Business List */}
          <div className="space-y-2">
            <h4 className="font-black text-xs text-[var(--text-primary)] flex items-center justify-between">
              <span>قائمة الأنشطة المحفوظة محلياً على الهاتف:</span>
              <span className="text-[11px] font-bold text-[var(--text-muted)]">{offlineBusinesses.length} نشاط</span>
            </h4>

            {offlineBusinesses.length === 0 ? (
              <div className="border border-dashed border-[var(--border-color)] rounded-2xl p-6 text-center text-xs text-[var(--text-muted)] font-bold bg-[var(--input-bg)]/40 space-y-1">
                <ShieldCheck className="w-6 h-6 text-emerald-500 mx-auto" />
                <p className="text-[var(--text-primary)] font-black">جميع الأنشطة متزامنة ومحفوظة سحابياً بنجاح! ☁️</p>
                <p className="text-[11px]">عند تسجيل نشاط في أي منطقة بدون شبكة، سيتم حفظه هنا تلقائياً دون أي فقدان.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {offlineBusinesses.map((biz) => (
                  <div
                    key={biz.id}
                    className="p-3 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 font-black">
                        🏪
                      </div>
                      <div className="min-w-0">
                        <div className="font-black text-[var(--text-primary)] truncate">{biz.nameAr}</div>
                        <div className="text-[10px] text-[var(--text-muted)] font-bold truncate">
                          {biz.governorate} • {biz.packageName} • ({biz.photos?.length || 0} صور)
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-500/25 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>بانتظار المزامنة</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Security Guarantee Note */}
          <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-300 font-bold">
            <Database className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>ضمان الأمان الميداني (Zero Data Loss):</strong> يتم حفظ جميع صور وبيانات النشاط داخل قاعدة بيانات المتصفح الدائمة <strong>IndexedDB</strong> على جهازك مباشرة، ولا يتم حذف أي نشاط محلياً حتى يتم استلام تأكيد الحفظ السحابي بنجاح.
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[var(--input-bg)] border-t border-[var(--border-color)] flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={handleStartManualSync}
            disabled={isSyncing || totalPending === 0}
            className="flex-1 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 disabled:opacity-50 text-white text-xs font-black py-3 px-4 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
            <span>{isSyncing ? 'جاري المزامنة السحابية...' : `مزامنة الآن (${totalPending}) ⚡`}</span>
          </button>

          <button
            onClick={handleExportBackup}
            disabled={totalPending === 0}
            className="flex-1 sm:flex-none bg-[var(--bg-card)] hover:bg-amber-500/10 text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-bold py-3 px-3.5 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="تصدير نسخة احتياطية محلية بصيغة JSON"
          >
            <Download className="w-4 h-4 text-amber-500" />
            <span>تصدير نسخة احتياطية 📥</span>
          </button>
        </div>
      </div>
    </div>
  );
};
