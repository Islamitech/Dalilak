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
  Database,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { Business, InterestedLead } from '../types';
import {
  getOfflineBusinesses,
  getOfflineLeads,
  syncAllPendingOfflineData,
  exportOfflineBackupJson,
  removeOfflineLead,
  removeOfflineBusiness,
} from '../services/offlineSync';
import { BaseModal, Button, Badge, ConfirmDialog } from './ui';

interface OfflineSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncComplete?: () => void;
  currentUser?: any;
}

export const OfflineSyncModal: React.FC<OfflineSyncModalProps> = ({
  isOpen,
  onClose,
  onSyncComplete,
  currentUser,
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [offlineBusinesses, setOfflineBusinesses] = useState<Business[]>([]);
  const [offlineLeads, setOfflineLeads] = useState<InterestedLead[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number; message: string } | null>(null);
  const [syncResult, setSyncResult] = useState<{ success: boolean; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'biz' | 'lead'; id: string; name: string } | null>(null);

  const effectiveUid = currentUser?.id || currentUser?.email;

  const loadOfflineData = async () => {
    try {
      const [biz, leads] = await Promise.all([
        getOfflineBusinesses(effectiveUid),
        getOfflineLeads(effectiveUid),
      ]);
      setOfflineBusinesses(biz);
      setOfflineLeads(leads);
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
  }, [isOpen, effectiveUid]);

  if (!isOpen) return null;

  const totalPending = offlineBusinesses.length + offlineLeads.length;

  const handleStartManualSync = async () => {
    if (!navigator.onLine) {
      setSyncResult({
        success: false,
        text: 'هاتفك غير متصل بالإنترنت حالياً. يرجى تفعيل بيانات الهاتف أو شبكة الواي فاي ثم إعادة المحاولة.',
      });
      return;
    }

    setIsSyncing(true);
    setSyncResult(null);

    try {
      const result = await syncAllPendingOfflineData(effectiveUid, (current, total, message) => {
        setSyncProgress({ current, total, message });
      });

      await loadOfflineData();

      if (result.syncedCount > 0) {
        setSyncResult({
          success: true,
          text: `تم بنجاح مزامنة ورفع ${result.syncedCount} عنصراً إلى قاعدة البيانات السحابية!`,
        });
        if (onSyncComplete) onSyncComplete();
      } else if (result.failedCount > 0) {
        setSyncResult({
          success: false,
          text: 'تعذر مزامنة بعض العناصر لضعف الاتصال. سيتم تكرار المحاولة تلقائياً فور استقرار الشبكة.',
        });
      } else {
        setSyncResult({
          success: true,
          text: 'كافة بياناتك متزامنة ومحدثة بالكامل مع السيرفر السحابي.',
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

  const modalFooter = (
    <div className="w-full flex flex-col sm:flex-row gap-2.5">
      <Button
        variant="primary"
        size="md"
        onClick={handleStartManualSync}
        disabled={isSyncing || totalPending === 0}
        loading={isSyncing}
        icon={<CloudUpload className="w-4 h-4" />}
        className="flex-1 font-black"
      >
        {isSyncing ? 'جاري المزامنة السحابية...' : `مزامنة الآن (${totalPending})`}
      </Button>

      <Button
        variant="secondary"
        size="md"
        onClick={handleExportBackup}
        disabled={totalPending === 0}
        icon={<Download className="w-4 h-4" />}
        className="sm:flex-none"
      >
        تصدير نسخة احتياطية
      </Button>
    </div>
  );

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title="مركز المزامنة والعمل بدون إنترنت"
        subtitle={isOnline ? 'هاتفك متصل بالإنترنت وجاهز للمزامنة' : 'وضع عدم الاتصال (أوفلاين) - بياناتك محفوظة بأمان'}
        icon={isOnline ? <Wifi className="w-5 h-5 text-emerald-500" /> : <WifiOff className="w-5 h-5 text-amber-500" />}
        headerActions={
          <Badge variant="success" size="xs">
            IndexedDB
          </Badge>
        }
        footer={modalFooter}
        size="lg"
      >
        <div className="space-y-4 text-right">
          {/* Status Alert */}
          {syncResult && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-fade-in ${
                syncResult.success
                  ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-700'
                  : 'bg-rose-500/15 border border-rose-500/40 text-rose-700'
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
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-3.5 text-center">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center mx-auto mb-1.5">
                <Store className="w-4 h-4" />
              </div>
              <div className="font-black text-xl text-[var(--text-primary)]">{offlineBusinesses.length}</div>
              <div className="text-[11px] font-bold text-[var(--text-muted)]">أنشطة ميدانية بانتظار الرفع</div>
            </div>

            <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-3.5 text-center">
              <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-600 flex items-center justify-center mx-auto mb-1.5">
                <Users className="w-4 h-4" />
              </div>
              <div className="font-black text-xl text-[var(--text-primary)]">{offlineLeads.length}</div>
              <div className="text-[11px] font-bold text-[var(--text-muted)]">عملاء مهتمون</div>
            </div>
          </div>

          {/* Sync Progress Indicator */}
          {isSyncing && syncProgress && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-black text-amber-700">
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
                  <span>{syncProgress.message}</span>
                </span>
                <span>
                  {syncProgress.current} من {syncProgress.total}
                </span>
              </div>
              <div className="w-full bg-amber-200 rounded-full h-2 overflow-hidden">
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
                <p className="text-[var(--text-primary)] font-black">جميع الأنشطة متزامنة ومحفوظة سحابياً بنجاح</p>
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
                      <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0 font-black">
                        <Store className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-black text-[var(--text-primary)] truncate">{biz.nameAr}</div>
                        <div className="text-[10px] text-[var(--text-muted)] font-bold truncate">
                          {biz.governorate} • {biz.packageName} • ({biz.photos?.length || 0} صور)
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="warning" size="xs" dot>
                        بانتظار المزامنة
                      </Badge>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete({ type: 'biz', id: biz.id, name: biz.nameAr })}
                        className="text-rose-500 hover:text-rose-600 p-1 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        title="حذف من قائمة الانتظار"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detailed Offline Leads List */}
          {offlineLeads.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-black text-xs text-[var(--text-primary)] flex items-center justify-between">
                <span>قائمة العملاء المهتمين المحفوظة محلياً على الهاتف:</span>
                <span className="text-[11px] font-bold text-blue-600 font-mono">
                  {offlineLeads.length} عميل
                </span>
              </h4>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {offlineLeads.map((lead) => (
                  <div
                    key={lead.id}
                    className="p-3 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-600 flex items-center justify-center shrink-0 font-black">
                        <Users className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-black text-[var(--text-primary)] truncate">
                          {lead.clientName} {lead.businessName ? `(${lead.businessName})` : ''}
                        </div>
                        <div className="text-[10px] text-[var(--text-muted)] font-bold truncate">
                          {lead.phone} • {lead.governorate} {lead.city ? `- ${lead.city}` : ''}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="info" size="xs" dot>
                        بانتظار الرفع
                      </Badge>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete({ type: 'lead', id: lead.id, name: lead.clientName })}
                        className="text-rose-500 hover:text-rose-600 p-1 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        title="حذف من قائمة الانتظار"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Security Guarantee Note */}
          <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-emerald-800 font-bold">
            <Database className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>ضمان الأمان الميداني (Zero Data Loss):</strong> يتم حفظ جميع صور وبيانات النشاط داخل قاعدة بيانات المتصفح الدائمة <strong>IndexedDB</strong> على جهازك مباشرة، ولا يتم حذف أي نشاط محلياً حتى يتم استلام تأكيد الحفظ السحابي بنجاح.
            </div>
          </div>
        </div>
      </BaseModal>

      {/* Confirmation Dialog for Offline Items Deletion */}
      <ConfirmDialog
        isOpen={Boolean(confirmDelete)}
        title={confirmDelete?.type === 'biz' ? 'حذف النشاط من الانتظار' : 'حذف العميل من الانتظار'}
        message={`هل أنت متأكد من حذف ${confirmDelete?.type === 'biz' ? 'نشاط' : 'عميل'} "${confirmDelete?.name || ''}" من قائمة الانتظار المحلية؟`}
        confirmLabel="حذف من الانتظار"
        cancelLabel="إلغاء"
        variant="danger"
        onConfirm={async () => {
          if (!confirmDelete) return;
          if (confirmDelete.type === 'biz') {
            await removeOfflineBusiness(confirmDelete.id);
          } else {
            await removeOfflineLead(confirmDelete.id);
          }
          await loadOfflineData();
          setConfirmDelete(null);
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </>
  );
};
