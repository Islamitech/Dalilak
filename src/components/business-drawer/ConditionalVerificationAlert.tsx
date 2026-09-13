import React from 'react';
import { AlertTriangle, Banknote, Gift } from 'lucide-react';

interface ConditionalVerificationAlertProps {
  isOpen: boolean;
  remaining: number;
  onRecordPayment: () => void;
  onConfirmConditional: () => void;
  onMarkAsFeeExempt: () => void;
  onClose: () => void;
}

export const ConditionalVerificationAlert: React.FC<ConditionalVerificationAlertProps> = ({
  isOpen,
  remaining,
  onRecordPayment,
  onConfirmConditional,
  onMarkAsFeeExempt,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="p-4 bg-amber-500/10 border-2 border-amber-500/50 rounded-2xl text-amber-900 space-y-3 animate-in fade-in duration-200 mb-4 shadow-sm">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h5 className="font-black text-xs text-amber-900">
            تنبيه رقابي: اعتماد منشأة بدون سداد كامل!
          </h5>
          <p className="text-[11px] text-amber-800 font-bold mt-0.5 leading-relaxed">
            هذه المنشأة غير معفاة ورسوم اشتراكها غير مسددة بالكامل (المتبقي: {remaining} ج.م). ما الإجراء المطلوب؟
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="button"
          onClick={onRecordPayment}
          className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Banknote className="w-3.5 h-3.5" />
          <span>تسجيل سداد وتحصيل الآن</span>
        </button>

        <button
          type="button"
          onClick={onConfirmConditional}
          className="py-2 px-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black transition-transform active:scale-95 cursor-pointer shadow-xs"
        >
          <span>اعتماد مشروط مع وسم متأخرات</span>
        </button>

        <button
          type="button"
          onClick={onMarkAsFeeExempt}
          className="py-2 px-3 rounded-xl bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 text-xs font-black transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
        >
          <Gift className="w-3.5 h-3.5 text-indigo-600" />
          <span>إعفاء رسمي (مكان رائج مجاني)</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          className="py-1.5 px-3 text-slate-500 hover:text-slate-800 text-xs font-bold transition-colors cursor-pointer"
        >
          إلغاء
        </button>
      </div>
    </div>
  );
};
