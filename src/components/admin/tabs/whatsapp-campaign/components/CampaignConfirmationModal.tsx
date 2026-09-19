import React from 'react';
import { Send, ShieldAlert, Play } from 'lucide-react';
import { OverlayLayer } from '../../../../ui/OverlayLayer';
import { WhatsAppSlotStatus } from '../types';
import { PRIMARY_WHATSAPP_SENDER_PHONE } from '../constants';

export interface CampaignConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isStartingCampaign: boolean;
  targetBusinessesCount: number;
  validPhoneCount: number;
  landlineCount: number;
  dummyPhoneCount: number;
  minDelaySeconds: number;
  maxDelaySeconds: number;
  enableStealthRandomMode: boolean;
  stealthMinMinutes: number;
  stealthMaxMinutes: number;
  enableRotation: boolean;
  isBothConnected: boolean;
  rotationBatchSize: number;
  slot1: WhatsAppSlotStatus;
  slot2: WhatsAppSlotStatus;
  skipRecentlyContacted: boolean;
  setSkipRecentlyContacted: (val: boolean) => void;
}

export const CampaignConfirmationModal: React.FC<CampaignConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isStartingCampaign,
  targetBusinessesCount,
  validPhoneCount,
  landlineCount,
  dummyPhoneCount,
  minDelaySeconds,
  maxDelaySeconds,
  enableStealthRandomMode,
  stealthMinMinutes,
  stealthMaxMinutes,
  enableRotation,
  isBothConnected,
  rotationBatchSize,
  slot1,
  slot2,
  skipRecentlyContacted,
  setSkipRecentlyContacted,
}) => {
  if (!isOpen) return null;

  return (
    <OverlayLayer className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-scaleUp">
        <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center border border-emerald-500/30">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-base text-[var(--text-primary)]">تأكيد إطلاق حملة WhatsApp الجماعية</h3>
            <p className="text-xs text-[var(--text-secondary)]">مراجعة المعايير النهائية قبل التنفيذ</p>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-[var(--border-color)] space-y-2">
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">إجمالي المنشآت المشمولة بالفلاتر:</span>
              <span className="font-black text-white font-mono text-sm">{targetBusinessesCount} منشأة</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">منشآت بأرقام محمول صالحة للإرسال:</span>
              <span className="font-black text-emerald-400 font-mono text-sm">{validPhoneCount} منشأة</span>
            </div>
            {landlineCount > 0 && (
              <div className="flex justify-between text-blue-400">
                <span>أرقام أرضية وخطوط ساخنة (استبعاد آلي):</span>
                <span className="font-mono font-bold">{landlineCount} منشأة ☎️</span>
              </div>
            )}
            {dummyPhoneCount > 0 && (
              <div className="flex justify-between text-amber-400">
                <span>أرقام وهمية أو غير صالحة (استبعاد آلي):</span>
                <span className="font-mono font-bold">{dummyPhoneCount} منشأة ⚠️</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">معدل التباعد الزمني (صمام الأمان):</span>
              <span className="font-bold text-amber-400 font-mono">{minDelaySeconds} - {maxDelaySeconds} ثانية عشوائي</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[var(--text-secondary)]">نظام الإرسال:</span>
              <span className="font-bold text-white text-xs text-left max-w-[280px]">
                {enableStealthRandomMode
                  ? `🌿 تبادل بشري عشوائي (${stealthMinMinutes}-${stealthMaxMinutes} د بالتناوب بين الهاتفين)`
                  : enableRotation && isBothConnected
                  ? `🔄 تناوب دوري بين الهاتفين (كل ${rotationBatchSize} رسالة)`
                  : slot1.state === 'connected'
                  ? `هاتف 1 (${slot1.connectedUser?.phone || PRIMARY_WHATSAPP_SENDER_PHONE})`
                  : slot2.state === 'connected'
                  ? `هاتف 2 (${slot2.connectedUser?.phone || 'المساند'})`
                  : 'الهاتف المتصل'}
              </span>
            </div>
          </div>

          {/* Duplicate Prevention Toggle */}
          <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={skipRecentlyContacted}
              onChange={(e) => setSkipRecentlyContacted(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-900 border-white/20 cursor-pointer"
            />
            <span className="text-[11px] text-emerald-300 font-bold">
              استبعاد من تم مراسلتهم بنجاح مسبقاً (حماية ذكية ضد تكرار الإرسال) 🛡️
            </span>
          </label>

          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] leading-relaxed flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              ستعمل الحملة في الخلفية تلقائياً وبشكل متتابع عبر السيرفر لكل المنشآت المستهدفة ({targetBusinessesCount}). يمكنك إيقاف الحملة في أي لحظة عبر زر الطوارئ 🛑.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isStartingCampaign}
            className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{isStartingCampaign ? 'جارٍ الإطلاق...' : 'تأكيد وبدء الإرسال'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={isStartingCampaign}
            className="px-5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-[var(--text-secondary)] hover:text-white font-bold text-xs transition-all cursor-pointer"
          >
            إلغاء
          </button>
        </div>
      </div>
    </OverlayLayer>
  );
};
