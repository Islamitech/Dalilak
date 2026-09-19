import React from 'react';
import {
  Eye,
  Send,
  Play,
  QrCode,
  Smartphone,
  Repeat,
  Sparkles,
  Clock,
  Zap,
  ShieldCheck,
  Square,
  AlertTriangle,
  MessageCircle,
  SkipForward,
  ArrowRight,
  ArrowLeft,
  MapPin,
} from 'lucide-react';
import { Business } from '../../../../../types';
import { isWithinHadayekAlAhramScope } from '../../../../../utils/geoBoundaryGuard';
import { WhatsAppSessionStatus, DispatchMode } from '../types';

interface CampaignLiveRadarProps {
  dispatchMode: DispatchMode;
  sessionStatus: WhatsAppSessionStatus;
  targetBusinesses: Business[];
  validPhoneCount: number;
  minDelaySeconds: number;
  maxDelaySeconds: number;
  isAnyConnected: boolean;
  isConnecting: boolean;
  isCampaignRunning: boolean;
  isStartingCampaign: boolean;
  onLaunchClick: () => void;
  onConnectSlot1: () => void;
  sampleBiz: Business;
  previewBizIndex: number;
  setPreviewBizIndex: (updater: (i: number) => number) => void;
  setSpintaxSeed: (updater: (s: number) => number) => void;
  previewMessage: string;
  onSkipDelay: () => void;
  isSkippingDelay: boolean;
  onAbortCampaign: () => void;
  isAbortingCampaign: boolean;
  onResumeCampaign: () => void;
  isResumingCampaign: boolean;
  currentMobileBiz: Business | undefined;
  currentMobilePhone: string | undefined;
  isCurrentMobilePhoneValid: boolean;
  isCurrentMobilePhoneLandline: boolean;
  mobileQueueIndex: number;
  setMobileQueueIndex: (updater: (i: number) => number) => void;
  sentBusinessIds: Set<string>;
  skippedBusinessIds: Set<string>;
  onMobileSendCurrent: () => void;
  onMobileSkipCurrent: () => void;
  compileMessageForBiz: (b: Business) => string;
  selectedTemplate: string;
  isDesktop: boolean;
}

export const CampaignLiveRadar: React.FC<CampaignLiveRadarProps> = ({
  dispatchMode,
  sessionStatus,
  targetBusinesses,
  validPhoneCount,
  minDelaySeconds,
  maxDelaySeconds,
  isAnyConnected,
  isConnecting,
  isCampaignRunning,
  isStartingCampaign,
  onLaunchClick,
  onConnectSlot1,
  sampleBiz,
  previewBizIndex,
  setPreviewBizIndex,
  setSpintaxSeed,
  previewMessage,
  onSkipDelay,
  isSkippingDelay,
  onAbortCampaign,
  isAbortingCampaign,
  onResumeCampaign,
  isResumingCampaign,
  currentMobileBiz,
  currentMobilePhone,
  isCurrentMobilePhoneValid,
  isCurrentMobilePhoneLandline,
  mobileQueueIndex,
  setMobileQueueIndex,
  sentBusinessIds,
  skippedBusinessIds,
  onMobileSendCurrent,
  onMobileSkipCurrent,
  compileMessageForBiz,
  selectedTemplate,
  isDesktop,
}) => {
  const campaign = sessionStatus.activeCampaign;
  const isCampaignPaused = campaign?.status === 'paused';
  const isCampaignCooldown = campaign?.status === 'cooldown';
  const progressPercent = campaign && campaign.total > 0 ? Math.round((campaign.current / campaign.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* ── LIVE ACTIVE CAMPAIGN PROGRESS MONITOR (IF RUNNING, PAUSED, OR COMPLETED) ── */}
      {dispatchMode === 'server_gateway' && campaign && campaign.status !== 'idle' && (
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-5 animate-slideDown">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  {isCampaignRunning ? (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
                    </>
                  ) : isCampaignCooldown ? (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500" />
                    </>
                  ) : isCampaignPaused ? (
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400" />
                  ) : (
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-slate-400" />
                  )}
                </span>
                <h3 className="font-black text-lg text-white">
                  {isCampaignRunning ? (
                    'حملة إرسال نشطة قيد التنفيذ الآن...'
                  ) : isCampaignCooldown ? (
                    <span className="text-cyan-400">🧊 فترة تهدئة احترازية (استراحة 10 دقائق بعد 20 رسالة)</span>
                  ) : isCampaignPaused ? (
                    <span className="text-amber-400">الحملة متوقفة مؤقتاً (جاهزة للاستئناف) ⏸️</span>
                  ) : (
                    'نتائج آخر حملة إرسال'
                  )}
                </h3>
                <span className="text-xs text-[var(--text-secondary)] font-mono">[{campaign.id}]</span>
              </div>
              {isCampaignRunning && campaign.currentBusinessName && (
                <p className="text-xs text-amber-400">
                  جارٍ معالجة الآن: <strong>{campaign.currentBusinessName}</strong>
                </p>
              )}
              {campaign.currentSenderSlot && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-bold mt-1">
                  <Repeat className="w-3.5 h-3.5 text-purple-400" />
                  <span>
                    المرسل النشط الآن: <strong>هاتف {campaign.currentSenderSlot === '1' ? '1 (الأساسي)' : '2 (المساند)'}</strong>
                    {campaign.rotationBatchCount !== undefined && (
                      <span className="font-mono text-white mr-1.5 font-normal">
                        ({campaign.rotationBatchCount} / {campaign.rotationBatchSize || 15} في الدفعة الحالية)
                      </span>
                    )}
                  </span>
                </div>
              )}
              {campaign.stealthModeActive && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold mt-1 mr-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    🌿 <strong>وضع التبادل البشري (Organic Alternating):</strong> هاتف 1: ({campaign.slot1SentCount || 0}) • هاتف 2: ({campaign.slot2SentCount || 0})
                  </span>
                </div>
              )}
              {isCampaignRunning && campaign.nextDispatchInSeconds !== undefined && campaign.nextDispatchInSeconds > 0 && (
                <div className="p-3.5 bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-950 border-2 border-emerald-500/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-2 shadow-xl">
                  <div className="text-xs text-slate-200 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                      </span>
                      <p className="font-black text-emerald-300 flex items-center gap-1.5 text-sm">
                        <Clock className="w-4 h-4 text-emerald-400 animate-spin" />
                        <span>فاصل زمني بشري عشوائي:</span>
                        <span className="font-mono text-white text-base font-black px-2 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
                          {Math.floor(campaign.nextDispatchInSeconds / 60)}:
                          {(campaign.nextDispatchInSeconds % 60).toString().padStart(2, '0')} دقيقة
                        </span>
                      </p>
                    </div>
                    <p className="text-[11px] text-slate-300/80">
                      {campaign.nextSlotTarget
                        ? `الرسالة القادمة ستُرسل عبر: هاتف (${campaign.nextSlotTarget === '1' ? '1 الأساسي' : '2 المساند'}).`
                        : 'يتم الإرسال بفواصل إنسانية واسعة لمحاكاة النشاط الطبيعي وحماية الحسابات.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onSkipDelay}
                    disabled={isSkippingDelay}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50 shrink-0 self-start sm:self-center"
                    title="تخطي فترة الانتظار وإرسال الرسالة القادمة فوراً دون انتظار"
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>{isSkippingDelay ? 'جارٍ التخطي...' : '⚡ إرسال الرسالة القادمة فوراً (تخطي)'}</span>
                  </button>
                </div>
              )}
              {isCampaignCooldown && (
                <div className="p-3 bg-cyan-950/60 border border-cyan-500/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-2">
                  <div className="text-xs text-cyan-200 space-y-0.5">
                    <p className="font-bold flex items-center gap-1.5 text-cyan-300">
                      <ShieldCheck className="w-4 h-4 text-cyan-400" />
                      <span>صمام الأمان النشط: تم إرسال {campaign.successful} رسالة بنجاح حتى الآن</span>
                    </p>
                    <p className="text-[11px] text-cyan-300/80">
                      المحرك يستريح تلقائياً لمدة 10 دقائق لحماية رقم هاتفك من فلاتر Meta، وسيستأنف الإرسال ذاتياً بعد انتهاء العد.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {campaign.cooldownRemainingSeconds !== undefined && (
                      <div className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-mono font-black text-sm flex items-center gap-2 shrink-0 self-start sm:self-center shadow-xs">
                        <Clock className="w-4 h-4 text-cyan-400 animate-spin" />
                        <span>
                          {Math.floor(campaign.cooldownRemainingSeconds / 60)
                            .toString()
                            .padStart(2, '0')}
                          :
                          {(campaign.cooldownRemainingSeconds % 60)
                            .toString()
                            .padStart(2, '0')}{' '}
                          متبقية
                        </span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={onSkipDelay}
                      disabled={isSkippingDelay}
                      className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold text-xs border border-cyan-400/40 transition-all flex items-center gap-1 cursor-pointer"
                      title="تخطي فترة التهدئة واستئناف الإرسال فوراً"
                    >
                      <Zap className="w-3 h-3 fill-current" />
                      <span>{isSkippingDelay ? 'جارٍ...' : 'تخطي ⚡'}</span>
                    </button>
                  </div>
                </div>
              )}
              {isCampaignPaused && (
                <p className="text-xs text-amber-300">
                  توقفت الحملة عند المنشأة رقم <strong>{(campaign.lastIndex ?? 0) + 1}</strong> من أصل{' '}
                  <strong>{campaign.total}</strong>. يمكنك استئنافها بعد مسح رمز QR أو تأكيد الاتصال.
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isCampaignPaused && (
                <button
                  type="button"
                  onClick={onResumeCampaign}
                  disabled={isResumingCampaign || !isAnyConnected}
                  className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm transition-all shadow-lg flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                  title={!isAnyConnected ? 'يرجى مسح رمز QR والاتصال أولاً' : 'استئناف الحملة من حيث توقفت'}
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>
                    {isResumingCampaign
                      ? 'جارٍ الاستئناف...'
                      : `استئناف الحملة من المنشأة ${(campaign.lastIndex ?? 0) + 1} ⏯️`}
                  </span>
                </button>
              )}

              {(isCampaignRunning || isCampaignCooldown || isCampaignPaused) && (
                <button
                  type="button"
                  onClick={onAbortCampaign}
                  disabled={isAbortingCampaign}
                  className="px-4 py-2.5 rounded-2xl bg-rose-600/90 hover:bg-rose-600 text-white font-black text-xs sm:text-sm transition-all shadow-lg flex items-center gap-2 cursor-pointer active:scale-95"
                  title="إلغاء الحملة نهائياً"
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span>{isAbortingCampaign ? 'جارٍ الإلغاء...' : isCampaignPaused ? 'إلغاء نهائي 🛑' : '🛑 إيقاف الحملة فوراً (طوارئ)'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Alert Guidance when paused due to disconnect */}
          {isCampaignPaused && !isAnyConnected && (
            <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">انقطع اتصال WhatsApp أثناء الحملة وتم حفظ التقدم بأمان (توقفت عند المنشأة {(campaign.lastIndex ?? 0) + 1})</p>
                <p className="text-[11px] text-slate-300">
                  يرجى مسح رمز الـ QR الجديد لأحد الهاتفين بالأعلى لإعادة الاتصال، وفور ظهور "متصل ونشط" اضغط على زر "استئناف الحملة" لتكمل عملها تلقائياً بدون أي تكرار.
                </p>
              </div>
            </div>
          )}

          {/* Progress Bar & Numerical Metrics */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span>التقدم الإجمالي:</span>
              <span className="font-mono text-amber-400 font-black text-sm">
                {campaign.current} / {campaign.total} ({progressPercent}%)
              </span>
            </div>
            <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
              <p className="text-[11px] text-[var(--text-secondary)]">الإجمالي المستهدف</p>
              <p className="text-xl font-black text-white font-mono mt-0.5">{campaign.total}</p>
            </div>
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
              <p className="text-[11px] text-emerald-400">تم الإرسال بنجاح ✅</p>
              <p className="text-xl font-black text-emerald-400 font-mono mt-0.5">{campaign.successful}</p>
            </div>
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
              <p className="text-[11px] text-amber-400">مستبعد (وهمية / مكررة) ⚠️</p>
              <p className="text-xl font-black text-amber-400 font-mono mt-0.5">{campaign.skipped}</p>
            </div>
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl">
              <p className="text-[11px] text-rose-400">فشل الإرسال ❌</p>
              <p className="text-xl font-black text-rose-400 font-mono mt-0.5">{campaign.failed}</p>
            </div>
          </div>

          {/* Live Dispatch Logs */}
          {campaign.logs && campaign.logs.length > 0 && (
            <div className="space-y-2 border-t border-white/10 pt-4">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>سجل الإرسال اللحظي (آخر العمليات):</span>
                <span className="text-[11px] text-[var(--text-secondary)]">{campaign.logs.length} سجل مسجل</span>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 text-xs">
                {campaign.logs.slice(0, 20).map((log, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-[11px]"
                  >
                    <div className="flex items-center gap-2">
                      {log.status === 'sent' ? (
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      ) : log.status === 'skipped' ? (
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                      )}
                      <span className="font-bold text-white">{log.businessName}</span>
                      <span className="text-[var(--text-secondary)] font-mono" dir="ltr">
                        ({log.phone})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {log.senderSlot && (
                        <span
                          className={`px-1.5 py-0.5 rounded font-mono font-bold text-[10px] ${
                            log.senderSlot === '1'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          {log.senderSlot === '1' ? '📱 هاتف 1' : '📱 هاتف 2'}
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          log.status === 'sent'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : log.status === 'skipped'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {log.status === 'sent'
                          ? 'تم الإرسال'
                          : log.status === 'skipped'
                          ? log.reason || 'مستبعد'
                          : log.reason || 'فشل'}
                      </span>
                      <span className="text-[10px] text-[var(--text-secondary)] font-mono">
                        {new Date(log.timestamp).toLocaleTimeString('ar-EG')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MOBILE DIRECT QUEUE STEP CARD (IF MODE === MOBILE_DIRECT) ── */}
      {dispatchMode === 'mobile_direct' && currentMobileBiz && (
        <div className="bg-[var(--bg-card)] border border-emerald-500/30 rounded-3xl p-6 shadow-md space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-color)] pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-mono font-black text-xs">
                  #{mobileQueueIndex + 1}
                </span>
                <h3 className="font-black text-lg text-white">
                  {currentMobileBiz.nameAr || currentMobileBiz.name}
                </h3>
              </div>
              <p className="text-xs text-[var(--text-secondary)] flex flex-wrap items-center gap-2">
                <span>المسؤول: {currentMobileBiz.ownerName || 'غير محدد'}</span>
                <span>•</span>
                <span>الموقع: {[currentMobileBiz.city, currentMobileBiz.governorate].filter(Boolean).join(' - ')}</span>
                {(() => {
                  const scope = isWithinHadayekAlAhramScope(currentMobileBiz, 8);
                  if (scope.matches) {
                    return (
                      <>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-500/30">
                          <MapPin className="w-3 h-3 text-emerald-400" />
                          <span>
                            {scope.distanceText
                              ? `${scope.distanceText} من منتصف حدائق الأهرام`
                              : 'ضمن نطاق حدائق الأهرام'}
                          </span>
                        </span>
                      </>
                    );
                  }
                  return null;
                })()}
              </p>
            </div>

            <div className="text-right sm:text-left">
              <p className="text-[11px] text-[var(--text-secondary)]">رقم هاتف المنشأة:</p>
              <p
                className={`font-mono text-base font-black ${
                  isCurrentMobilePhoneValid ? 'text-emerald-400' : 'text-amber-400'
                }`}
                dir="ltr"
              >
                {currentMobilePhone || 'لا يوجد هاتف'}
              </p>
              {!isCurrentMobilePhoneValid && (
                <span className="text-[10px] text-amber-400 font-bold">
                  {isCurrentMobilePhoneLandline
                    ? '☎️ رقم أرضي / خط ساخن لا يدعم واتساب - يفضل تخطيه'
                    : '⚠️ رقم وهمي أو غير صالح - يفضل تخطيه'}
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onMobileSendCurrent}
              disabled={!isCurrentMobilePhoneValid}
              className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-sm sm:text-base transition-all shadow-xl cursor-pointer flex items-center justify-center gap-2.5 active:scale-95 disabled:opacity-50"
            >
              <MessageCircle className="w-5 h-5 fill-current" />
              <span>
                {isDesktop
                  ? `إرسال إلى ${currentMobileBiz.nameAr || currentMobileBiz.name} عبر WhatsApp Web 💻`
                  : `إرسال إلى ${currentMobileBiz.nameAr || currentMobileBiz.name} عبر WhatsApp 💬`}
              </span>
            </button>

            <button
              type="button"
              onClick={onMobileSkipCurrent}
              className="py-4 px-5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-white/10"
            >
              <SkipForward className="w-4 h-4" />
              <span>تخطي للنشاط التالي ⏭️</span>
            </button>
          </div>

          {/* Queue Controls Bar */}
          <div className="flex items-center justify-between text-xs pt-3 border-t border-[var(--border-color)]">
            <button
              type="button"
              onClick={() => setMobileQueueIndex((i) => Math.max(0, i - 1))}
              disabled={mobileQueueIndex === 0}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-[var(--text-secondary)] hover:text-white transition-all disabled:opacity-30 cursor-pointer flex items-center gap-1"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>النشاط السابق</span>
            </button>

            <div className="flex items-center gap-3 font-mono text-[11px]">
              <span className="text-emerald-400 font-bold">تم إرساله بالجلسة: {sentBusinessIds.size}</span>
              <span>•</span>
              <span className="text-amber-400 font-bold">مستبعد: {skippedBusinessIds.size}</span>
            </div>

            <button
              type="button"
              onClick={() => setMobileQueueIndex((i) => Math.min(targetBusinesses.length - 1, i + 1))}
              disabled={mobileQueueIndex >= targetBusinesses.length - 1}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-[var(--text-secondary)] hover:text-white transition-all disabled:opacity-30 cursor-pointer flex items-center gap-1"
            >
              <span>النشاط التالي</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ── WHATSAPP REALISTIC CHAT BUBBLE CARD ── */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-emerald-500" />
            <h3 className="font-black text-xs sm:text-sm">معاينة الرسالة الحية كما تظهر للعميل</h3>
          </div>

          {/* Sample Biz Navigator */}
          {targetBusinesses.length > 1 && (
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-secondary)]">
              <span>نموذج:</span>
              <button
                type="button"
                onClick={() => setPreviewBizIndex((i) => (i > 0 ? i - 1 : targetBusinesses.length - 1))}
                className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                ‹
              </button>
              <span className="font-mono font-black">{previewBizIndex + 1}/{targetBusinesses.length}</span>
              <button
                type="button"
                onClick={() => setPreviewBizIndex((i) => (i < targetBusinesses.length - 1 ? i + 1 : 0))}
                className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                ›
              </button>
            </div>
          )}
        </div>

        {/* Target Sample Biz Info & Spintax Rotator */}
        <div className="p-3 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between text-xs gap-2">
          <div>
            <p className="font-black text-white">{sampleBiz.nameAr || sampleBiz.name}</p>
            <p className="text-[10px] text-[var(--text-secondary)]">{sampleBiz.city || sampleBiz.governorate}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSpintaxSeed((s) => s + 1)}
              title="تدوير واختبار صياغة الـ Spintax عشوائياً"
              className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
            >
              <span>🎲 تدوير الصياغة</span>
            </button>
            <span className="font-mono text-[11px] text-emerald-400 font-bold" dir="ltr">
              {sampleBiz.phone || sampleBiz.ownerPhone || 'لا يوجد هاتف'}
            </span>
          </div>
        </div>

        {/* WhatsApp Phone Mockup Container */}
        <div className="bg-[#0b141a] rounded-2xl p-4 border border-[#202c33] shadow-inner relative space-y-2 font-sans">
          <div className="bg-[#005c4b] text-white rounded-2xl rounded-tr-xs p-3.5 shadow-md space-y-2 text-xs leading-relaxed max-w-full">
            <div className="whitespace-pre-wrap font-sans text-emerald-50 text-[12px] leading-relaxed select-text">
              {previewMessage}
            </div>
            <div className="flex items-center justify-end gap-1 text-[10px] text-emerald-200/80 pt-1 font-mono" dir="ltr">
              <span>{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
              <span className="text-sky-300">✓✓</span>
            </div>
          </div>
        </div>
      </div>

      {/* FINAL LAUNCH CALL-TO-ACTION CARD (FOR SERVER GATEWAY MODE) */}
      {dispatchMode === 'server_gateway' && (
        <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 border border-emerald-500/40 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="space-y-1">
            <h4 className="font-black text-base text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-400" />
              <span>جاهز لإطلاق الحملة عبر خادم Baileys</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              سيتم إرسال الرسائل تلقائياً في الخلفية إلى{' '}
              <strong className="text-emerald-400">{validPhoneCount} منشأة</strong> مع فاصل زمني عشوائي من{' '}
              <strong className="text-amber-400">{minDelaySeconds} إلى {maxDelaySeconds} ثانية</strong>.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-[11px] space-y-1 text-slate-300">
            <div className="flex justify-between">
              <span>الوقت التقديري للحملة:</span>
              <span className="font-mono text-amber-400 font-bold">
                {Math.round((validPhoneCount * ((minDelaySeconds + maxDelaySeconds) / 2)) / 60)} دقيقة
              </span>
            </div>
            <div className="flex justify-between">
              <span>التكلفة المالية:</span>
              <span className="font-mono text-emerald-400 font-black">0.00 ج.م ($0.00 مجاني)</span>
            </div>
          </div>

          {!isAnyConnected ? (
            <button
              type="button"
              onClick={onConnectSlot1}
              disabled={isConnecting}
              className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
            >
              <QrCode className="w-5 h-5" />
              <span>اربط هاتفاً واحداً على الأقل عبر QR لتفعيل الإرسال</span>
            </button>
          ) : isCampaignRunning ? (
            <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-center text-xs text-amber-300 font-black">
              ⏳ توجد حملة قيد التنفيذ حالياً، يمكنك متابعة شريط التقدم بالأعلى.
            </div>
          ) : (
            <button
              type="button"
              onClick={onLaunchClick}
              disabled={validPhoneCount === 0 || isStartingCampaign}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-sm sm:text-base transition-all shadow-xl cursor-pointer flex items-center justify-center gap-2.5 active:scale-95 disabled:opacity-50"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>🚀 بدء حملة الإرسال الجماعي الآن</span>
            </button>
          )}
        </div>
      )}

      {/* QUICK SHORTCUT CARD FOR MOBILE DIRECT MODE */}
      {dispatchMode === 'mobile_direct' && (
        <div className="bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-950 border border-emerald-500/40 rounded-3xl p-5 shadow-xl space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-black text-sm">
            <Smartphone className="w-4 h-4" />
            <span>الوضع المباشر للجوال نشط</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            يمكنك استخدام زر <strong>«إرسال عبر WhatsApp 💬»</strong> لمراسلة المنشآت تباعاً بنقرة واحدة
            لكل منشأة بدون الحاجة لأي خادم خارجي.
          </p>
          <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>إجمالي المنشآت: {targetBusinesses.length}</span>
            <span>المتبقي في الطابور: {Math.max(0, targetBusinesses.length - mobileQueueIndex)}</span>
          </div>
        </div>
      )}
    </div>
  );
};
