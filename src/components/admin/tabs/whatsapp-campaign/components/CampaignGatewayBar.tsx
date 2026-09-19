import React from 'react';
import {
  Laptop,
  Smartphone,
  Terminal,
  Copy,
  RefreshCw,
  Repeat,
  QrCode,
  RotateCw,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Check,
  Sliders,
  Zap,
  Sparkles,
} from 'lucide-react';
import { SlotId, WhatsAppSlotStatus, PacingPreset } from '../types';
import { PRIMARY_WHATSAPP_SENDER_PHONE } from '../constants';

interface CampaignGatewayBarProps {
  slot1: WhatsAppSlotStatus;
  slot2: WhatsAppSlotStatus;
  connectingSlot: SlotId | null;
  disconnectingSlot: SlotId | null;
  isCampaignRunning: boolean;
  isBothConnected: boolean;
  isAnyConnected: boolean;
  enableRotation: boolean;
  setEnableRotation: (val: boolean) => void;
  rotationBatchSize: number;
  setRotationBatchSize: (size: number) => void;
  pacingPreset: PacingPreset;
  onSelectPreset: (preset: PacingPreset) => void;
  minDelaySeconds: number;
  setMinDelaySeconds: (sec: number) => void;
  maxDelaySeconds: number;
  setMaxDelaySeconds: (sec: number) => void;
  enableStealthRandomMode: boolean;
  setEnableStealthRandomMode: (val: boolean) => void;
  stealthMinMinutes: number;
  setStealthMinMinutes: (min: number) => void;
  stealthMaxMinutes: number;
  setStealthMaxMinutes: (max: number) => void;
  onConnect: (slotId: SlotId) => void;
  onDisconnect: (slotId: SlotId) => void;
  serverNoticeMessage: string | null;
  isDesktop: boolean;
  onModeChange: (mode: 'server_gateway' | 'mobile_direct') => void;
  hasCopiedCommand: boolean;
  setHasCopiedCommand: (val: boolean) => void;
  onRefreshStatus: () => void;
}

export const CampaignGatewayBar: React.FC<CampaignGatewayBarProps> = ({
  slot1,
  slot2,
  connectingSlot,
  disconnectingSlot,
  isCampaignRunning,
  isBothConnected,
  isAnyConnected,
  enableRotation,
  setEnableRotation,
  rotationBatchSize,
  setRotationBatchSize,
  pacingPreset,
  onSelectPreset,
  minDelaySeconds,
  setMinDelaySeconds,
  maxDelaySeconds,
  setMaxDelaySeconds,
  enableStealthRandomMode,
  setEnableStealthRandomMode,
  stealthMinMinutes,
  setStealthMinMinutes,
  stealthMaxMinutes,
  setStealthMaxMinutes,
  onConnect,
  onDisconnect,
  serverNoticeMessage,
  isDesktop,
  onModeChange,
  hasCopiedCommand,
  setHasCopiedCommand,
  onRefreshStatus,
}) => {
  return (
    <div className="space-y-5">
      {/* Vercel vs Local Node Notice Banner */}
      {serverNoticeMessage && (
        <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/15 via-slate-900 to-slate-950 border-2 border-amber-500/30 text-xs text-slate-200 space-y-4 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
              {isDesktop ? <Laptop className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="font-black text-sm text-amber-400">
                  دليل تشغيل سيرفر الواتساب الآلي (Vercel vs Local Node.js)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold">
                  بنية الاستضافة السحابية
                </span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                موقع دليلك مرفوع على Vercel كواجهة ساكنة (Static Web App)، بينما يحتاج محرك Baileys الآلي إلى بيئة تشغيل Node.js حقيقية للحفاظ على جلسة الواتساب في الخلفية. اختر الخيار الأنسب لك:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-4 flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-400 font-black text-xs">
                  {isDesktop ? <Laptop className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                  <span>المسار الأول (فوري وبدون أي تشغيل سيرفر):</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {isDesktop
                    ? 'إرسال مباشر من متصفح الكمبيوتر عبر WhatsApp Web الرسمي؛ يفتح لك المحادثة المعبأة فوراً بنقرة واحدة دون الحاجة لتشغيل أي سيرفر.'
                    : 'إرسال مباشر من الهاتف عبر تطبيق WhatsApp المباشر دون الحاجة لأي خوادم خارجية.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onModeChange('mobile_direct')}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md active:scale-98"
              >
                {isDesktop ? <Laptop className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                <span>{isDesktop ? 'التبديل الآن إلى WhatsApp Web للكمبيوتر 💻' : 'التبديل للوضع المباشر للجوال 📲'}</span>
              </button>
            </div>

            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-amber-400 font-black text-xs">
                  <Terminal className="w-4 h-4" />
                  <span>المسار الثاني (تشغيل السيرفر الآلي على جهازك):</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  إذا كنت على جهاز الكمبيوتر وتريد الإرسال الجماعي الآلي بالخلفية: اضغط مرتين على ملف <span className="font-mono text-amber-300 font-bold">تشغيل_سيرفر_الواتساب.bat</span> (المنفذ 3005) في مجلد المشروع، أو نفّذ الأمر التالي:
                </p>
                <div className="flex items-center justify-between gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800 font-mono text-emerald-400 text-xs">
                  <span>npm run whatsapp</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText('npm run whatsapp');
                      setHasCopiedCommand(true);
                      setTimeout(() => setHasCopiedCommand(false), 2000);
                    }}
                    className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{hasCopiedCommand ? 'تم النسخ!' : 'نسخ'}</span>
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={onRefreshStatus}
                className="w-full py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-white/10 active:scale-98"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>إعادة فحص الاتصال بالسيرفر الآن 🔄</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Status & Overview Banner */}
      <div
        className={`p-4 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm transition-all ${
          isBothConnected
            ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
            : isAnyConnected
            ? 'bg-amber-950/20 border-amber-500/40 text-amber-300'
            : 'bg-slate-900/60 border-white/10 text-slate-300'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
              isBothConnected
                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                : isAnyConnected
                ? 'bg-amber-500/20 border-amber-500/30 text-amber-400'
                : 'bg-white/5 border-white/10 text-slate-400'
            }`}
          >
            <Repeat className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h3 className="font-black text-sm text-white">نظام التناوب الذكي بين رقمين (Dual-Sender Rotation)</h3>
              {isBothConnected ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black animate-pulse">
                  🟢 الهاتفان متصلان وجاهزان للتناوب
                </span>
              ) : isAnyConnected ? (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-black">
                  🟡 هاتف واحد متصل (جاهز للإرسال)
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-400 border border-slate-500/30 text-[10px] font-black">
                  ⚪ غير متصل
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {isBothConnected
                ? `يعمل النظام بتبديل الإرسال تلقائياً بين الهاتفين كل ${rotationBatchSize} رسالة لإتاحة فترة راحة طبيعية لكل رقم وتفادي فلاتر الحظر بنسبة 100%.`
                : isAnyConnected
                ? 'يمكنك بدء الحملة بالهاتف المتصل حالياً، أو مسح رمز QR للهاتف الثاني لتفعيل التناوب التلقائي بينهما.'
                : 'امسح رمز QR لهاتف واحد على الأقل لتفعيل إطلاق الحملات الجماعية الآلية.'}
            </p>
          </div>
        </div>

        {/* Quick Rotation Batch Switcher */}
        <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-200 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={enableRotation}
              onChange={(e) => setEnableRotation(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-900 border-white/20 cursor-pointer"
            />
            <span className="font-bold">تفعيل التناوب</span>
          </label>
          {enableRotation && (
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
              {[10, 15, 20].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setRotationBatchSize(size)}
                  className={`px-2.5 py-1 rounded-lg font-bold font-mono text-[11px] transition-all cursor-pointer ${
                    rotationBatchSize === size
                      ? 'bg-emerald-500 text-slate-950 font-black shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {size} ر
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* TWO SENDER CARDS: SLOT 1 & SLOT 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* SLOT 1 CARD */}
        <div
          className={`rounded-3xl p-5 border shadow-sm flex flex-col justify-between space-y-4 transition-all ${
            slot1.state === 'connected'
              ? 'bg-gradient-to-br from-emerald-950/20 to-[var(--bg-card)] border-emerald-500/40'
              : slot1.state === 'qr_ready'
              ? 'bg-gradient-to-br from-blue-950/20 to-[var(--bg-card)] border-blue-500/40'
              : 'bg-[var(--bg-card)] border-[var(--border-color)]'
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-black text-sm text-white">الهاتف الأساسي (رقم 1)</h4>
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                      Slot 1
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)]">هاتف الإدارة الرئيسي المعتمد</p>
                </div>
              </div>

              <div>
                {slot1.state === 'connected' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-black">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    متصل ونشط
                  </span>
                ) : slot1.state === 'qr_ready' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 text-xs font-black">
                    <QrCode className="w-3.5 h-3.5" />
                    امسح رمز QR
                  </span>
                ) : slot1.state === 'connecting' || connectingSlot === '1' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs font-black">
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    جارٍ الاتصال...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-500/15 text-slate-400 border border-slate-500/30 text-xs font-black">
                    <span className="w-2 h-2 rounded-full bg-slate-500" />
                    غير متصل
                  </span>
                )}
              </div>
            </div>

            {slot1.state === 'connected' && slot1.connectedUser ? (
              <div className="bg-white/5 rounded-2xl p-3.5 space-y-2 border border-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-emerald-400 font-bold">الحساب المتصل حالياً:</p>
                    <p className="text-base font-black text-white font-mono" dir="ltr">
                      {slot1.connectedUser.phone}
                    </p>
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      {slot1.connectedUser.phone.includes(PRIMARY_WHATSAPP_SENDER_PHONE) ||
                      slot1.connectedUser.phone.includes('1556221141')
                        ? '⭐ هاتف إدارة المنصة الأساسي'
                        : slot1.connectedUser.name || 'إدارة دليلك'}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-inner">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>
                {slot1.lastActive && (
                  <div className="text-[10px] text-[var(--text-secondary)] border-t border-white/5 pt-1.5 flex items-center justify-between">
                    <span>آخر نشاط موثق:</span>
                    <span className="font-mono" dir="ltr">
                      {new Date(slot1.lastActive).toLocaleTimeString('ar-EG')}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-[10px] text-slate-300 border-t border-white/5 pt-1.5 flex-wrap gap-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-emerald-300 font-bold">النبض: متصل ومستقر</span>
                    {slot1.lastHeartbeat && (
                      <span className="font-mono text-[9px] text-slate-400" dir="ltr">
                        ({new Date(slot1.lastHeartbeat).toLocaleTimeString('ar-EG')})
                      </span>
                    )}
                  </div>
                  {typeof slot1.uptimeSeconds === 'number' && slot1.uptimeSeconds > 0 && (
                    <div className="text-slate-400 font-mono">
                      استمرار: {Math.floor(slot1.uptimeSeconds / 60)}د
                    </div>
                  )}
                </div>
              </div>
            ) : slot1.state === 'qr_ready' && slot1.qrCodeUrl ? (
              <div className="flex flex-col items-center justify-center p-3 bg-white/5 border border-blue-500/30 rounded-2xl space-y-2 text-center">
                <div className="p-2.5 bg-white rounded-2xl shadow-xl border-2 border-emerald-500">
                  <img
                    src={slot1.qrCodeUrl}
                    alt="WhatsApp QR Code Slot 1"
                    className="w-44 h-44 object-contain"
                  />
                </div>
                <p className="text-xs font-bold text-white">
                  افتح واتساب على الهاتف الأساسي ({PRIMARY_WHATSAPP_SENDER_PHONE}) &gt; الأجهزة المرتبطة &gt; ربط جهاز
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1.5 text-[var(--text-secondary)]">
                <div className="flex items-center justify-between text-amber-400 font-bold">
                  <span>هاتف الإدارة الأساسي</span>
                  <span className="font-mono text-[11px]" dir="ltr">
                    {PRIMARY_WHATSAPP_SENDER_PHONE}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  اضغط على زر الربط بالأسفل لمسح رمز الـ QR وحفظ الجلسة محلياً على السيرفر.
                </p>
                {slot1.disconnectReason && (
                  <div className="text-[10px] text-rose-300 font-mono bg-rose-500/15 px-2 py-1 rounded-lg border border-rose-500/30">
                    سبب الانقطاع: {slot1.disconnectReason}
                    {slot1.autoReconnectAttempts ? ` (محاولات إعادة الربط: ${slot1.autoReconnectAttempts})` : ''}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-white/10">
            {slot1.state === 'connected' ? (
              <button
                type="button"
                onClick={() => onDisconnect('1')}
                disabled={disconnectingSlot === '1' || isCampaignRunning}
                className="w-full py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 transition-all font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>{disconnectingSlot === '1' ? 'جارٍ قطع الاتصال...' : 'قطع اتصال هاتف 1'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onConnect('1')}
                disabled={connectingSlot === '1' || isCampaignRunning}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>{connectingSlot === '1' ? 'جارٍ توليد الرمز...' : 'ربط هاتف 1 (مسح QR)'}</span>
              </button>
            )}
          </div>
        </div>

        {/* SLOT 2 CARD */}
        <div
          className={`rounded-3xl p-5 border shadow-sm flex flex-col justify-between space-y-4 transition-all ${
            slot2.state === 'connected'
              ? 'bg-gradient-to-br from-blue-950/20 to-[var(--bg-card)] border-blue-500/40'
              : slot2.state === 'qr_ready'
              ? 'bg-gradient-to-br from-cyan-950/20 to-[var(--bg-card)] border-cyan-500/40'
              : 'bg-[var(--bg-card)] border-[var(--border-color)]'
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-black text-sm text-white">الهاتف المساند (رقم 2)</h4>
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold">
                      Slot 2
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)]">هاتف التناوب وتوزيع الحمل والردود</p>
                </div>
              </div>

              <div>
                {slot2.state === 'connected' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 text-xs font-black">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    متصل ونشط
                  </span>
                ) : slot2.state === 'qr_ready' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 text-xs font-black">
                    <QrCode className="w-3.5 h-3.5" />
                    امسح رمز QR
                  </span>
                ) : slot2.state === 'connecting' || connectingSlot === '2' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs font-black">
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    جارٍ الاتصال...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-500/15 text-slate-400 border border-slate-500/30 text-xs font-black">
                    <span className="w-2 h-2 rounded-full bg-slate-500" />
                    غير متصل
                  </span>
                )}
              </div>
            </div>

            {slot2.state === 'connected' && slot2.connectedUser ? (
              <div className="bg-white/5 rounded-2xl p-3.5 space-y-2 border border-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-blue-400 font-bold">الحساب المتصل حالياً:</p>
                    <p className="text-base font-black text-white font-mono" dir="ltr">
                      {slot2.connectedUser.phone}
                    </p>
                    <p className="text-[11px] text-[var(--text-secondary)]">
                      {slot2.connectedUser.name || 'هاتف المساند الثاني (دليلك)'}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30 shadow-inner">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>
                {slot2.lastActive && (
                  <div className="text-[10px] text-[var(--text-secondary)] border-t border-white/5 pt-1.5 flex items-center justify-between">
                    <span>آخر نشاط موثق:</span>
                    <span className="font-mono" dir="ltr">
                      {new Date(slot2.lastActive).toLocaleTimeString('ar-EG')}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-[10px] text-slate-300 border-t border-white/5 pt-1.5 flex-wrap gap-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                    <span className="text-blue-300 font-bold">النبض: متصل ومستقر</span>
                    {slot2.lastHeartbeat && (
                      <span className="font-mono text-[9px] text-slate-400" dir="ltr">
                        ({new Date(slot2.lastHeartbeat).toLocaleTimeString('ar-EG')})
                      </span>
                    )}
                  </div>
                  {typeof slot2.uptimeSeconds === 'number' && slot2.uptimeSeconds > 0 && (
                    <div className="text-slate-400 font-mono">
                      استمرار: {Math.floor(slot2.uptimeSeconds / 60)}د
                    </div>
                  )}
                </div>
              </div>
            ) : slot2.state === 'qr_ready' && slot2.qrCodeUrl ? (
              <div className="flex flex-col items-center justify-center p-3 bg-white/5 border border-cyan-500/30 rounded-2xl space-y-2 text-center">
                <div className="p-2.5 bg-white rounded-2xl shadow-xl border-2 border-blue-500">
                  <img
                    src={slot2.qrCodeUrl}
                    alt="WhatsApp QR Code Slot 2"
                    className="w-44 h-44 object-contain"
                  />
                </div>
                <p className="text-xs font-bold text-white">
                  افتح واتساب على هاتف المساند 2 &gt; الأجهزة المرتبطة &gt; ربط جهاز
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs space-y-1.5 text-[var(--text-secondary)]">
                <div className="flex items-center justify-between text-blue-400 font-bold">
                  <span>هاتف التناوب الإضافي</span>
                  <span className="text-[11px]">مستحسن للأمان التام</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  اربط هاتفك الإضافي ليتبادل الإرسال كل {rotationBatchSize} رسالة، مما يريح هاتف الإدارة الأساسي ويمنع الحظر نهائياً.
                </p>
                {slot2.disconnectReason && (
                  <div className="text-[10px] text-rose-300 font-mono bg-rose-500/15 px-2 py-1 rounded-lg border border-rose-500/30">
                    سبب الانقطاع: {slot2.disconnectReason}
                    {slot2.autoReconnectAttempts ? ` (محاولات إعادة الربط: ${slot2.autoReconnectAttempts})` : ''}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-white/10">
            {slot2.state === 'connected' ? (
              <button
                type="button"
                onClick={() => onDisconnect('2')}
                disabled={disconnectingSlot === '2' || isCampaignRunning}
                className="w-full py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 transition-all font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>{disconnectingSlot === '2' ? 'جارٍ قطع الاتصال...' : 'قطع اتصال هاتف 2'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onConnect('2')}
                disabled={connectingSlot === '2' || isCampaignRunning}
                className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>{connectingSlot === '2' ? 'جارٍ توليد الرمز...' : 'ربط هاتف 2 (مسح QR)'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CARD 2: ANTI-BAN THROTTLING VALVE SETTINGS */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-sm sm:text-base">صمام الأمان الذكي ضد الحظر (Anti-Ban Jitter & Auto-Cooldown)</h2>
              <p className="text-[11px] text-[var(--text-secondary)]">محاكاة السلوك البشري الطبيعي، فواصل عشوائية، وتهدئة ذاتية</p>
            </div>
          </div>

          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
            حماية مفعلة 🛡️
          </span>
        </div>

        {/* Pacing Presets */}
        <div className="space-y-2">
          <label className="text-xs font-black text-[var(--text-secondary)]">اختر معدل التباعد الزمني بين الرسائل:</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => onSelectPreset('balanced')}
              className={`p-3 rounded-2xl border text-right transition-all cursor-pointer ${
                pacingPreset === 'balanced'
                  ? 'bg-amber-500/15 border-amber-500 text-[var(--text-primary)] shadow-sm'
                  : 'bg-white/5 border-[var(--border-color)] text-[var(--text-secondary)] hover:border-amber-500/40'
              }`}
            >
              <div className="flex items-center justify-between font-black text-xs">
                <span>متزن وآمن (موصى به)</span>
                {pacingPreset === 'balanced' && <Check className="w-3.5 h-3.5 text-amber-500" />}
              </div>
              <p className="text-[11px] text-amber-400 mt-1 font-mono font-bold">10 - 20 ثانية عشوائي</p>
              <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">الحل الأمثل للحملات المعتادة</p>
            </button>

            <button
              type="button"
              onClick={() => onSelectPreset('ultra_safe')}
              className={`p-3 rounded-2xl border text-right transition-all cursor-pointer ${
                pacingPreset === 'ultra_safe'
                  ? 'bg-emerald-500/15 border-emerald-500 text-[var(--text-primary)] shadow-sm'
                  : 'bg-white/5 border-[var(--border-color)] text-[var(--text-secondary)] hover:border-emerald-500/40'
              }`}
            >
              <div className="flex items-center justify-between font-black text-xs">
                <span>فائق الأمان</span>
                {pacingPreset === 'ultra_safe' && <Check className="w-3.5 h-3.5 text-emerald-500" />}
              </div>
              <p className="text-[11px] text-emerald-400 mt-1 font-mono font-bold">15 - 30 ثانية عشوائي</p>
              <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">للحملات الضخمة &gt; 500 منشأة</p>
            </button>

            <button
              type="button"
              onClick={() => onSelectPreset('fast')}
              className={`p-3 rounded-2xl border text-right transition-all cursor-pointer ${
                pacingPreset === 'fast'
                  ? 'bg-blue-500/15 border-blue-500 text-[var(--text-primary)] shadow-sm'
                  : 'bg-white/5 border-[var(--border-color)] text-[var(--text-secondary)] hover:border-blue-500/40'
              }`}
            >
              <div className="flex items-center justify-between font-black text-xs">
                <span>سريع نسبي</span>
                {pacingPreset === 'fast' && <Check className="w-3.5 h-3.5 text-blue-500" />}
              </div>
              <p className="text-[11px] text-blue-400 mt-1 font-mono font-bold">6 - 12 ثانية عشوائي</p>
              <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">للقوائم الصغيرة والمستعجلة</p>
            </button>
          </div>
        </div>

        {/* Custom Delay Sliders */}
        <div className="p-4 rounded-2xl bg-white/5 border border-[var(--border-color)] space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-500" />
              <span>الحد الأدنى للانتظار (ثوانٍ):</span>
            </span>
            <span className="font-black text-amber-400 font-mono">{minDelaySeconds} ثانية</span>
          </div>
          <input
            type="range"
            min="5"
            max="30"
            value={minDelaySeconds}
            onChange={(e) => {
              const val = Number(e.target.value);
              setMinDelaySeconds(val);
              if (maxDelaySeconds < val + 2) setMaxDelaySeconds(val + 5);
            }}
            className="w-full accent-amber-500 cursor-pointer"
          />

          <div className="flex items-center justify-between text-xs pt-1">
            <span className="font-bold flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-500" />
              <span>الحد الأقصى للانتظار (ثوانٍ):</span>
            </span>
            <span className="font-black text-amber-400 font-mono">{maxDelaySeconds} ثانية</span>
          </div>
          <input
            type="range"
            min={minDelaySeconds + 2}
            max="60"
            value={maxDelaySeconds}
            onChange={(e) => setMaxDelaySeconds(Number(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer"
          />
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 flex items-start gap-2.5">
          <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed space-y-1">
            <p>
              <strong>كيف يعمل صمام الحماية والتهدئة التلقائية؟</strong> يُرسل المحرك كل رسالة بفاصل زمني عشوائي بشري (مثلاً: 10-20 ثانية)، ثم يتناوب تلقائياً بين الهاتف 1 والهاتف 2 كل {rotationBatchSize} رسالة مع مهلة انتقال ناعمة 4 ثوانٍ.
            </p>
            <p className="text-cyan-300 font-bold">
              🧊 صمام التهدئة الاحترازي (Anti-Ban Cooldown): يتوقف الإرسال تلقائياً لمدة 10 دقائق بعد كل 20 رسالة ناجحة لمنع تصنيف الأرقام كروبوت، ثم يستأنف ذاتياً.
            </p>
          </div>
        </div>
      </div>

      {/* CARD 3: FULL ORGANIC STEALTH RANDOM MODE */}
      <div
        className={`p-6 rounded-3xl border transition-all space-y-4 ${
          enableStealthRandomMode
            ? 'bg-gradient-to-br from-emerald-950/30 via-slate-900 to-slate-950 border-emerald-500/40 shadow-lg'
            : 'bg-white/5 border-[var(--border-color)] text-[var(--text-secondary)]'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center border shrink-0 ${
                enableStealthRandomMode
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-white/5 text-slate-400 border-white/10'
              }`}
            >
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-sm sm:text-base text-white">
                  وضع التبادل البشري العشوائي (Organic Alternating Mode)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black">
                  تبديل مباشر بين الهاتفين (1 ⬅️ 2)
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                إرسال رسالة من هاتف (1) ثم رسالة من هاتف (2) بالتناوب التبادلي المباشر، مع فاصل عشوائي طبيعي (من 1 إلى 5 دقائق) بين كل رسالة والأخرى لحماية الأرقام وتوزيع الجهد بالتساوي.
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
            <input
              type="checkbox"
              checked={enableStealthRandomMode}
              onChange={(e) => setEnableStealthRandomMode(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>
        </div>

        {enableStealthRandomMode && (
          <div className="space-y-3 pt-2 border-t border-white/10">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300">الحد الأدنى للفاصل العشوائي:</span>
                  <span className="font-mono font-black text-emerald-400">{stealthMinMinutes} دقيقة</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={stealthMinMinutes}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setStealthMinMinutes(val);
                    if (stealthMaxMinutes < val + 1) setStealthMaxMinutes(val + 2);
                  }}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <p className="text-[10px] text-[var(--text-secondary)]">
                  (الافتراضي: 1 دقيقة كحد أدنى)
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300">الحد الأقصى للفاصل العشوائي:</span>
                  <span className="font-mono font-black text-emerald-400">{stealthMaxMinutes} دقيقة</span>
                </div>
                <input
                  type="range"
                  min={stealthMinMinutes + 1}
                  max="15"
                  step="1"
                  value={stealthMaxMinutes}
                  onChange={(e) => setStealthMaxMinutes(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <p className="text-[10px] text-[var(--text-secondary)]">
                  (الافتراضي: 5 دقائق كحد أقصى)
                </p>
              </div>
            </div>

            <div className="p-3 bg-emerald-950/40 border border-emerald-500/20 rounded-2xl text-[11px] text-emerald-200 leading-relaxed flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>توازن مثالي بين الأمان والسرعة:</strong> يتم التبديل مباشرة بين الهاتفين رسالة برسالة بالتناوب، مع فاصل عشوائي طبيعي من 1 إلى 5 دقائق لحماية الأرقام بنسبة تفوق 90%. وتظل جلسة تسجيل الدخول نشطة ومحمية تماماً طوال تشغيل الحملة دون انقطاع.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
