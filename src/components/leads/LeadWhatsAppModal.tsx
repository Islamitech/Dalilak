import { OverlayLayer } from '../ui/OverlayLayer';
import React, { useState } from 'react';
import { MessageSquare, X, Copy, Check, Send } from 'lucide-react';
import { InterestedLead } from '../../types';

interface LeadWhatsAppModalProps {
  lead: InterestedLead | null;
  onClose: () => void;
  onUpdateLead?: (lead: InterestedLead) => void;
}

export const LeadWhatsAppModal: React.FC<LeadWhatsAppModalProps> = ({ lead, onClose, onUpdateLead }) => {
  const [pitchType, setPitchType] = useState<'intro' | 'proposal' | 'trending'>('intro');
  const [copied, setCopied] = useState(false);

  if (!lead) return null;

  const getMessageText = () => {
    const biz = lead.businessName || 'نشاطكم التجاري';
    const client = lead.clientName || 'عزيزي العميل';
    const gov = lead.governorate ? `بمحافظة ${lead.governorate}` : 'بمصر';

    if (pitchType === 'intro') {
      return `السلام عليكم ورحمة الله وبركاته،\nأهلاً بحضرتك أستاذ ${client}،\nمعك ممثل منصة دليلك الميدانية.\nيسعدنا توثيق وإبراز «${biz}» ${gov} على خرائط Google وتطبيق الدليل الموحد لزيادة ظهورك أمام آلاف العملاء بالمنطقة.\n\nيسرنا تزويدكم بكافة التفاصيل والخدمات المتاحة.`;
    }

    if (pitchType === 'proposal') {
      return `السلام عليكم أستاذ ${client}،\nبخصوص انضمام «${biz}» إلى منصة دليلك:\nنوفر لحضرتكم:\n1. توثيق رسمي معتمد وتثبيت دبابيس الموقع على خرائط Google\n2. صفحة إلكترونية رسمية مع رابط ذكي مخصص للنشاط\n3. دعم فني ميداني متواصل وربط فوري بأرقام واتساب النشاط\n\nالباقة السنوية المعتمدة شاملة كافة الميزات بقيمة رمزية واشتراك سنوي. يسعدنا تأكيد التوثيق اليوم.`;
    }

    return `السلام عليكم أستاذ ${client}،\nنظراً للسمعة الطيبة والإقبال الملحوظ على «${biz}» ${gov}، يسر إدارة منصة دليلك ترشيح منشأتكم ضمن قائمة الأنشطة الرائجة والشرفية بالمنطقة.\n\nنرجو تأكيد رغبتكم في اعتماد الإدراج المجاني ليتم توثيق بياناتكم بالدليل العام فوراً.`;
  };

  const messageText = getMessageText();

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = () => {
    let clean = (lead.phone || '').replace(/\D/g, '');
    if (clean.startsWith('0')) {
      clean = '2' + clean;
    } else if (!clean.startsWith('20') && clean.length === 10) {
      clean = '20' + clean;
    }
    const url = `https://wa.me/${clean}?text=${encodeURIComponent(messageText)}`;
    window.open(url, '_blank');
  };

  return (
    <OverlayLayer className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs font-['Cairo',sans-serif]">
      <div className="bg-[var(--bg-card)] rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-[var(--border-color)] animate-fade-in flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-[var(--text-primary)]">مراسلة العميل عبر واتساب</h3>
              <p className="text-xs text-[var(--text-muted)] font-medium">
                {lead.clientName} {lead.businessName ? `( ${lead.businessName} )` : ''} • {lead.phone}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-4 overflow-y-auto flex-1">
          {/* Pitch Type Selector */}
          <div className="flex items-center gap-1.5 bg-[var(--bg-secondary)] p-1 rounded-2xl border border-[var(--border-color)]">
            <button
              type="button"
              onClick={() => setPitchType('intro')}
              className={`flex-1 py-2 px-2 text-center text-xs font-bold rounded-xl transition-all cursor-pointer ${
                pitchType === 'intro'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              رسالة التعريف
            </button>
            <button
              type="button"
              onClick={() => setPitchType('proposal')}
              className={`flex-1 py-2 px-2 text-center text-xs font-bold rounded-xl transition-all cursor-pointer ${
                pitchType === 'proposal'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              عرض التوثيق
            </button>
            <button
              type="button"
              onClick={() => setPitchType('trending')}
              className={`flex-1 py-2 px-2 text-center text-xs font-bold rounded-xl transition-all cursor-pointer ${
                pitchType === 'trending'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              إدراج رائج (مجاني)
            </button>
          </div>

          {/* Message Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[var(--text-secondary)]">معاينة نص الرسالة الرسمي:</span>
              <span className="text-[11px] text-[var(--text-muted)]">معايير مؤسسية راقية</span>
            </div>
            <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-4 text-xs leading-relaxed text-[var(--text-primary)] whitespace-pre-wrap font-sans select-all min-h-[140px]">
              {messageText}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-[var(--border-color)] gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className={`py-2 px-3 sm:px-4 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border cursor-pointer ${
              copied
                ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500'
                : 'bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]'
            }`}
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'تم النسخ' : 'نسخ النص'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-3 rounded-xl bg-[var(--input-bg)] hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] font-bold text-xs transition-colors cursor-pointer border border-[var(--border-color)]"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleSend}
              className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition-all active:scale-95 flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>إرسال عبر واتساب</span>
            </button>
          </div>
        </div>
      </div>
    </OverlayLayer>
  );
};
