import React from 'react';
import { User } from 'lucide-react';

interface FormOwnerInfoSectionProps {
  ownerName: string;
  setOwnerName: (val: string) => void;
  ownerPhone: string;
  setOwnerPhone: (val: string) => void;
  secondaryPhone: string;
  setSecondaryPhone: (val: string) => void;
}

export const FormOwnerInfoSection: React.FC<FormOwnerInfoSectionProps> = ({
  ownerName,
  setOwnerName,
  ownerPhone,
  setOwnerPhone,
  secondaryPhone,
  setSecondaryPhone,
}) => {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-4 sm:p-5 space-y-4 shadow-md transition-colors duration-300">
      <div className="flex items-center gap-2 text-amber-500 pb-2 border-b border-[var(--border-color)]">
        <User className="w-5 h-5" />
        <h3 className="font-bold text-sm text-[var(--text-primary)]">3. بيانات صاحب النشاط للتواصل والفاتورة</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div>
          <label className="block text-[var(--text-primary)] font-bold mb-1">اسم صاحب النشاط / المسؤول *</label>
          <input
            type="text"
            required
            placeholder="اسم صاحب المحل أو المدير المسؤول"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-slate-400 font-bold rounded-xl p-3 focus:outline-none focus:border-amber-500 shadow-sm"
          />
        </div>

        <div>
          <label className="block text-[var(--text-primary)] font-bold mb-1">رقم هاتف الواتساب (لإرسال الفاتورة) *</label>
          <input
            type="tel"
            required
            placeholder="مثال: 01012345678"
            value={ownerPhone}
            onChange={(e) => setOwnerPhone(e.target.value)}
            className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-slate-400 font-bold rounded-xl p-3 focus:outline-none focus:border-amber-500 font-mono dir-ltr text-right shadow-sm"
          />
        </div>

        <div>
          <label className="block text-[var(--text-primary)] font-bold mb-1">رقم هاتف آخر (اختياري)</label>
          <input
            type="tel"
            placeholder="مثال: 01123456789 أو رقم أرضي"
            value={secondaryPhone}
            onChange={(e) => setSecondaryPhone(e.target.value)}
            className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder-slate-400 font-bold rounded-xl p-3 focus:outline-none focus:border-amber-500 font-mono dir-ltr text-right shadow-sm"
          />
        </div>
      </div>
    </div>
  );
};
