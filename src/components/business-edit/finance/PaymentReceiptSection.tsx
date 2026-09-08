import React, { useState } from 'react';
import { Business } from '../../../types';
import { compressImageFile } from '../../../utils/imageCompressor';
import { formatStandardDateTime } from '../../../utils/dateFormatters';
import { Camera, CheckCircle2, FileCheck, Eye, Trash2, Loader2 } from 'lucide-react';

export interface PaymentReceiptSectionProps {
  formData: Business;
  setFormData: React.Dispatch<React.SetStateAction<Business | null>>;
  canEdit: boolean;
  onPreviewReceipt: (url: string) => void;
  onRemoveReceiptClick: () => void;
}

export const PaymentReceiptSection: React.FC<PaymentReceiptSectionProps> = ({
  formData,
  setFormData,
  canEdit,
  onPreviewReceipt,
  onRemoveReceiptClick,
}) => {
  const [isCompressingReceipt, setIsCompressingReceipt] = useState(false);
  const [receiptError, setReceiptError] = useState<string>('');

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceiptError('');
    try {
      setIsCompressingReceipt(true);
      const compressed = await compressImageFile(file, 1400, 1400, 0.82, { applyWatermark: false });
      setFormData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          paymentReceiptPhoto: compressed,
          paymentReceiptDate: new Date().toISOString(),
        };
      });
    } catch (err) {
      console.error('Error compressing receipt image:', err);
      setReceiptError('حدث خطأ أثناء معالجة الصورة، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsCompressingReceipt(false);
    }
  };

  return (
    <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2.5">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-amber-500" />
          <h4 className="font-black text-xs sm:text-sm text-[var(--text-primary)]">
            صورة إيصال / لقطة شاشة سداد النشاط 🧾
          </h4>
        </div>
        {formData.paymentReceiptPhoto && (
          <span className="text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-black border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>مرفق ومسجل بالنظام</span>
          </span>
        )}
      </div>

      {formData.paymentReceiptPhoto ? (
        <div className="bg-[var(--bg-card)] border border-emerald-500/40 rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <img
              src={formData.paymentReceiptPhoto}
              alt="صورة إيصال التحصيل"
              className="w-16 h-16 object-cover rounded-xl border border-slate-600 bg-slate-900 cursor-pointer hover:opacity-85 transition-opacity shrink-0"
              onClick={() => onPreviewReceipt(formData.paymentReceiptPhoto!)}
              title="اضغط للتكبير والمعاينة"
            />
            <div className="space-y-0.5">
              <p className="text-xs font-black text-[var(--text-primary)] flex items-center gap-1">
                <FileCheck className="w-4 h-4 text-emerald-500" />
                <span>تم حفظ وتوثيق إيصال السداد المالي</span>
              </p>
              <p className="text-[11px] text-[var(--text-muted)]">
                {formData.paymentReceiptDate
                  ? `تاريخ الإرفاق: ${formatStandardDateTime(formData.paymentReceiptDate)}`
                  : 'صورة المعاملة والتحويل معتمدة في قسم المالية'}
              </p>
              <button
                type="button"
                onClick={() => onPreviewReceipt(formData.paymentReceiptPhoto!)}
                className="text-xs text-amber-600 dark:text-amber-400 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer pt-0.5"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>معاينة الإيصال بالحجم الكامل</span>
              </button>
            </div>
          </div>

          {canEdit && (
            <button
              type="button"
              onClick={onRemoveReceiptClick}
              className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 border border-rose-500/30 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>حذف الإيصال</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
            يرجى إرفاق صورة إيصال التحويل، لقطة شاشة إنستاباي، أو إيصال فودافون كاش لتوثيق وتأكيد
            سداد النشاط في السجلات المحاسبية.
          </p>

          {canEdit && (
            <label className="border-2 border-dashed border-amber-500/40 hover:border-amber-500 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer bg-[var(--bg-card)]/50 transition-colors hover:bg-amber-500/5">
              {isCompressingReceipt ? (
                <div className="flex flex-col items-center gap-1.5 py-2">
                  <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
                  <span className="text-xs text-amber-500 font-bold">
                    جارٍ معالجة وضغط الصورة...
                  </span>
                </div>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-amber-500/15 text-amber-500 flex items-center justify-center">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div className="text-center">
                    <span className="text-xs font-bold text-[var(--text-primary)] block">
                      اضغط هنا لرفع صورة إيصال أو لقطة شاشة السداد
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      يدعم ملفات الصور JPG و PNG
                    </span>
                  </div>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleReceiptUpload}
                disabled={isCompressingReceipt}
                className="hidden"
              />
            </label>
          )}

          {receiptError && (
            <p
              className="text-xs text-rose-500 font-bold flex items-center gap-1.5 mt-1"
              role="alert"
            >
              <span>⚠️</span>
              <span>{receiptError}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
};
