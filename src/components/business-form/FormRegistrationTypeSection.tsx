import React from 'react';
import { Sparkles, MapPin, UserCheck } from 'lucide-react';
import { InterestedLead } from '../../types';

interface FormRegistrationTypeSectionProps {
  registrationType: 'new_verification' | 'already_on_google' | 'interested_lead';
  setRegistrationType: (type: 'new_verification' | 'already_on_google' | 'interested_lead') => void;
  initialLead?: InterestedLead | null;
}

export const FormRegistrationTypeSection: React.FC<FormRegistrationTypeSectionProps> = ({
  registrationType,
  setRegistrationType,
  initialLead,
}) => {
  return (
    <div className="bg-[var(--bg-card)] border-2 border-amber-500/30 rounded-3xl p-3 shadow-md space-y-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] font-black text-[var(--text-muted)] block text-right">
          اختر نوع وطبيعة التسجيل الميداني:
        </span>
        {initialLead?.isTrending && (
          <span className="text-[10px] text-blue-500 font-bold bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
            🔥 عميل منشأة رائجة (إدراج مجاني)
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {/* Mode 1: New Google Maps Verification */}
        <button
          type="button"
          onClick={() => setRegistrationType('new_verification')}
          className={`p-3 rounded-2xl font-black text-xs flex flex-col sm:flex-row items-center justify-center gap-2 border-2 transition-all cursor-pointer ${
            registrationType === 'new_verification'
              ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 border-amber-500 shadow-md scale-[1.02]'
              : 'bg-[var(--input-bg)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-amber-500/40'
          }`}
        >
          <Sparkles className="w-4 h-4 shrink-0" />
          <div className="text-center sm:text-right">
            <span className="block font-black leading-tight">باقة خرائط جديدة</span>
            <span className="text-[9.5px] opacity-80 block">توثيق كامل لأول مرة</span>
          </div>
        </button>

        {/* Mode 2: Already on Google */}
        <button
          type="button"
          onClick={() => setRegistrationType('already_on_google')}
          className={`p-3 rounded-2xl font-black text-xs flex flex-col sm:flex-row items-center justify-center gap-2 border-2 transition-all cursor-pointer ${
            registrationType === 'already_on_google'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500 shadow-md scale-[1.02]'
              : 'bg-[var(--input-bg)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-blue-500/40'
          }`}
        >
          <MapPin className="w-4 h-4 shrink-0" />
          <div className="text-center sm:text-right">
            <span className="block font-black leading-tight">مسجل بالفعل بـ Google</span>
            <span className="text-[9.5px] opacity-80 block">إدراج وتوثيق بالدليل</span>
          </div>
        </button>

        {/* Mode 3: Interested Lead */}
        <button
          type="button"
          onClick={() => setRegistrationType('interested_lead')}
          className={`p-3 rounded-2xl font-black text-xs flex flex-col sm:flex-row items-center justify-center gap-2 border-2 transition-all cursor-pointer ${
            registrationType === 'interested_lead'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-500 shadow-md scale-[1.02]'
              : 'bg-[var(--input-bg)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-indigo-500/40'
          }`}
        >
          <UserCheck className="w-4 h-4 shrink-0" />
          <div className="text-center sm:text-right">
            <span className="block font-black leading-tight">عميل مهتم / زيارة</span>
            <span className="text-[9.5px] opacity-80 block">تسجيل طلب متابعة ومراجعة</span>
          </div>
        </button>
      </div>
    </div>
  );
};
