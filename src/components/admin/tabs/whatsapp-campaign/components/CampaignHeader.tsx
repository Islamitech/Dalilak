import React from 'react';
import {
  Sparkles,
  Download,
  Settings2,
  RefreshCw,
  Laptop,
  Smartphone,
  Zap,
} from 'lucide-react';
import { DispatchMode } from '../types';

interface CampaignHeaderProps {
  dispatchMode: DispatchMode;
  onModeChange: (mode: DispatchMode) => void;
  showServerSettings: boolean;
  setShowServerSettings: (show: boolean) => void;
  gatewayCustomUrl: string;
  setGatewayCustomUrl: (url: string) => void;
  onSaveGatewayUrl: (url: string) => void;
  isServerReachable: boolean | null;
  isLoadingStatus: boolean;
  onRefreshStatus: () => void;
  onOpenExportContacts: () => void;
  isDesktop: boolean;
}

export const CampaignHeader: React.FC<CampaignHeaderProps> = ({
  dispatchMode,
  onModeChange,
  showServerSettings,
  setShowServerSettings,
  gatewayCustomUrl,
  setGatewayCustomUrl,
  onSaveGatewayUrl,
  isServerReachable,
  isLoadingStatus,
  onRefreshStatus,
  onOpenExportContacts,
  isDesktop,
}) => {
  return (
    <div className="space-y-4">
      {/* ── HEADER BANNER ── */}
      <div className="bg-gradient-to-r from-emerald-950/90 via-slate-900 to-slate-950 border border-emerald-500/30 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-amber-500/10 rounded-full blur-2xl pointer-events-none -ml-10 -mb-10" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-black">
              <Sparkles className="w-3.5 h-3.5" />
              <span>نظام المراسلة السيادي المباشر • 0.00$ مجاني بالكامل</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>📢 حملات WhatsApp الجماعية الذكية</span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
              إرسال مباشر بنقرة واحدة لكافة المنشآت المسجلة والشرفية المستوردة مع{' '}
              <strong className="text-amber-400">صمام الأمان الذكي ضد الحظر (Anti-Ban Jitter)</strong> أو عبر{' '}
              <strong className="text-emerald-400">الوضع المباشر السريع للجوال</strong> بدون تكاليف.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <button
              type="button"
              onClick={onOpenExportContacts}
              className="p-2.5 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition-all cursor-pointer flex items-center gap-2 text-xs font-bold shadow-xs"
              title="تصدير جهات الاتصال إلى Google Contacts لمزامنة الأسماء على WhatsApp"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">تصدير جهات اتصال Google (VCF)</span>
              <span className="sm:hidden">تصدير VCF</span>
            </button>

            <button
              type="button"
              onClick={() => setShowServerSettings(!showServerSettings)}
              className="p-2.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
              title="إعدادات خادم البوابة"
            >
              <Settings2 className="w-4 h-4" />
              <span className="hidden sm:inline">إعدادات السيرفر</span>
            </button>

            <button
              type="button"
              onClick={onRefreshStatus}
              disabled={isLoadingStatus}
              className="p-2.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all cursor-pointer flex items-center gap-2 text-xs font-bold"
              title="تحديث الحالة لحظياً"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingStatus ? 'animate-spin' : ''}`} />
              <span>تحديث</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── COLLAPSIBLE SERVER CONNECTIVITY SETTINGS ── */}
      {showServerSettings && (
        <div className="p-5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl shadow-sm space-y-4 animate-slideDown text-xs">
          <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
            <div className="flex items-center gap-2 font-black text-sm">
              <Settings2 className="w-4 h-4 text-amber-500" />
              <span>إعدادات اتصال سيرفر الواتساب (Remote Gateway URL)</span>
            </div>
            <div className="flex items-center gap-2">
              {isServerReachable ? (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-black border border-emerald-500/30">
                  🟢 السيرفر متصل وجاهز
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[11px] font-black border border-amber-500/30">
                  🔴 السيرفر غير نشط محلياً
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="font-bold text-[var(--text-secondary)] block">
              رابط خادم Node.js المخصص (إذا كنت تتصفح من الجوال عبر Wi-Fi أو نفق سحابي):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={gatewayCustomUrl}
                onChange={(e) => setGatewayCustomUrl(e.target.value)}
                placeholder="مثال: http://192.168.1.15:3001 أو اتركه فارغاً للافتراضي"
                className="flex-1 bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl px-3 py-2 text-xs font-mono text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-emerald-500"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => onSaveGatewayUrl(gatewayCustomUrl)}
                className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black cursor-pointer text-xs"
              >
                حفظ واختبار
              </button>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
              * استضافة Vercel تعمل كواجهة ساكنة؛ محرك Baileys يعمل داخل خادم المنصة (`server.ts`). عند استخدام الحاسوب أو الجوال،
              يمكنك كتابة IP أو تشغيل الخادم محلياً للربط الآلي، أو التبديل للوضع المباشر (WhatsApp Web / الجوال) بدون خادم.
            </p>
          </div>
        </div>
      )}

      {/* ── DUAL-ENGINE MODE TOGGLE SELECTOR ── */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-3 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 px-2 text-xs font-black text-[var(--text-secondary)]">
          <span>اختر مسار الإرسال المفضل:</span>
        </div>

        <div className="grid grid-cols-2 gap-2 flex-1 sm:max-w-xl">
          <button
            type="button"
            onClick={() => onModeChange('mobile_direct')}
            className={`py-2.5 px-3 rounded-2xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
              dispatchMode === 'mobile_direct'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                : 'bg-white/5 text-[var(--text-secondary)] hover:text-white border border-[var(--border-color)]'
            }`}
          >
            {isDesktop ? <Laptop className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
            <span>{isDesktop ? 'الوضع المباشر للكمبيوتر (WhatsApp Web • فوري) 💻' : 'الوضع المباشر للجوال (100% بدون خادم) 📲'}</span>
          </button>

          <button
            type="button"
            onClick={() => onModeChange('server_gateway')}
            className={`py-2.5 px-3 rounded-2xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
              dispatchMode === 'server_gateway'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'bg-white/5 text-[var(--text-secondary)] hover:text-white border border-[var(--border-color)]'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>سيرفر Baileys الآلي (صمام الأمان) ⚡</span>
          </button>
        </div>
      </div>
    </div>
  );
};
