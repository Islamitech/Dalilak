import React, { useState } from 'react';
import { InterestedLead } from '../../types';
import { BaseModal, Button } from '../ui';
import { useWhatsAppAction } from '../../hooks/useWhatsAppAction';
import {
  MessageSquare,
  Sparkles,
  Send,
  Calendar,
  Gift,
  HelpCircle,
} from 'lucide-react';
import { getTrendingVenuePermissionWhatsAppUrl } from '../../utils/whatsapp';

interface LeadWhatsAppModalProps {
  lead: InterestedLead | null;
  onClose: () => void;
  onUpdateLead: (lead: InterestedLead) => void;
}

export type WhatsAppMsgType = 'intro' | 'followup' | 'offer' | 'permission';

export const LeadWhatsAppModal: React.FC<LeadWhatsAppModalProps> = ({
  lead,
  onClose,
  onUpdateLead,
}) => {
  const [msgType, setMsgType] = useState<WhatsAppMsgType>('intro');
  const { send } = useWhatsAppAction();

  if (!lead) return null;

  const bizTitle = lead.businessName
    ? `مكانكم الموقر "${lead.businessName}"`
    : 'منشأتكم الكريمة';
  const clientName = lead.clientName || 'عزيزنا العميل';

  const generateMessage = (type: WhatsAppMsgType) => {
    if (type === 'permission') {
      return (
        `السلام عليكم ورحمة الله،\n` +
        `أهلاً بحضرتك أستاذ ${clientName}، مع حضرتك فريق عمل منصة دليلك الشاملة لرقمنة وتنمية الأعمال بمصر.\n\n` +
        `نظراً لأن منشأتكم الكريمة "${lead.businessName || 'الموقرة'}" تعد من الأماكن الرائجة والمميزة بالمنطقة، نود إعلامكم بإدراج النشاط ضمن دليل الأنشطة المعتمدة في ${lead.governorate} مجاناً وبدون أي تكلفة تقديراً لمكانتكم.\n\n` +
        `يسعدنا تأكيد موافقتكم الكريمة لنشر الموقع وإتاحته للجمهور.`
      );
    }

    if (type === 'intro') {
      return (
        `السلام عليكم ورحمة الله،\n` +
        `أهلاً بحضرتك أستاذ ${clientName}، بخصوص ${bizTitle}:\n\n` +
        `قام مندوبنا بزيارة المنطقة المتواجد بها مكانكم وقام بعرض باقة التوثيق على سيادتكم.\n\n` +
        `الباقة تشمل تثبيت وتوثيق الموقع الجغرافي للمنشأة بدقة على خرائط Google، وإضافة أرقام التواصل ومواعيد العمل والصور الرسمية، برسوم 250 جنيه (سداد لمرة واحدة بدون اشتراكات، ويمكن السداد بعد إتمام التوثيق والظهور على الخريطة).\n\n` +
        `في حال رغبتكم في استكمال التوثيق أو وجود أي استفسار، يسعدنا تواصلكم معنا عبر هذه المحادثة.`
      );
    }

    if (type === 'followup') {
      return (
        `السلام عليكم ورحمة الله،\n` +
        `متابعة مع حضرتك بخصوص توثيق ${bizTitle} على خرائط Google.\n` +
        `هل نحدد موعداً مناسباً لزيارة المندوب والبدء في تسجيل ورفع البيانات؟ (مع العلم أن السداد يمكن أن يتم بعد التوثيق والظهور).`
      );
    }

    return (
      `السلام عليكم ورحمة الله،\n` +
      `توضيح لخدمات التوثيق المتاحة لـ ${bizTitle}:\n\n` +
      `1. باقة التوثيق الأساسي (250 ج): تثبيت وتوثيق المنشأة على خرائط Google مع إضافة بيانات الاتصال ومواعيد العمل والصور (ويمكن السداد بعد إتمام التوثيق والظهور على الخريطة).\n` +
      `2. باقة التأسيس والربط (750 ج): توثيق الخريطة + تأسيس وتنسيق الصفحات وتصميم الإعلان ومتابعة مستمرة.\n\n` +
      `متاحين لأي استفسار أو لترتيب موعد الزيارة والتنفيذ.`
    );
  };

  const handleSend = () => {
    if (msgType === 'permission') {
      const url = getTrendingVenuePermissionWhatsAppUrl(lead.phone, {
        clientName: lead.clientName,
        businessName: lead.businessName,
      });
      if (url) window.open(url, '_blank');
    } else {
      const msg = generateMessage(msgType);
      send(lead.phone, msg);
    }

    onUpdateLead({
      ...lead,
      lastContactedDate: new Date().toISOString(),
      status: lead.status === 'pending_followup' ? 'contacted' : lead.status,
    });
    onClose();
  };

  const currentText = generateMessage(msgType);

  const modalFooter = (
    <div className="w-full flex gap-2">
      <Button
        variant="success"
        size="md"
        onClick={handleSend}
        icon={<Send className="w-4 h-4" />}
        className="flex-1 font-black"
      >
        فتح واتساب والإرسال فوراً
      </Button>

      <Button
        variant="secondary"
        size="md"
        onClick={onClose}
      >
        إلغاء
      </Button>
    </div>
  );

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title="إرسال رسالة واتساب للشخص المهتم"
      subtitle={`إلى: ${lead.clientName} (${lead.phone})`}
      icon={<MessageSquare className="w-5 h-5 text-emerald-500" />}
      footer={modalFooter}
      size="md"
    >
      <div className="space-y-3.5 text-xs" dir="rtl">
        {/* Template Selector */}
        <div className="space-y-2">
          <label className="block font-bold text-[var(--text-primary)]">اختر نموذج الرسالة الجاهزة:</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setMsgType('permission')}
              className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                msgType === 'permission'
                  ? 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-400 font-black shadow-xs'
                  : 'bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-amber-500/40'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>طلب سماح (مجاني)</span>
            </button>

            <button
              type="button"
              onClick={() => setMsgType('intro')}
              className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                msgType === 'intro'
                  ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-400 font-black shadow-xs'
                  : 'bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-emerald-500/40'
              }`}
            >
              <HelpCircle className="w-4 h-4 text-emerald-500" />
              <span>تعريف بالخدمة</span>
            </button>

            <button
              type="button"
              onClick={() => setMsgType('followup')}
              className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                msgType === 'followup'
                  ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-400 font-black shadow-xs'
                  : 'bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-emerald-500/40'
              }`}
            >
              <Calendar className="w-4 h-4 text-blue-500" />
              <span>متابعة وتذكير</span>
            </button>

            <button
              type="button"
              onClick={() => setMsgType('offer')}
              className={`p-2.5 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                msgType === 'offer'
                  ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-400 font-black shadow-xs'
                  : 'bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-emerald-500/40'
              }`}
            >
              <Gift className="w-4 h-4 text-purple-500" />
              <span>عرض خاص وتأسيس</span>
            </button>
          </div>
        </div>

        {/* Message Preview Box */}
        <div className="space-y-1">
          <label className="block font-bold text-[var(--text-muted)] text-[11px]">معاينة نص الرسالة:</label>
          <div className="bg-[var(--input-bg)] p-3 rounded-2xl border border-[var(--border-color)] text-xs text-[var(--text-secondary)] whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto font-sans">
            {currentText}
          </div>
        </div>
      </div>
    </BaseModal>
  );
};
