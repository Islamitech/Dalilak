import React from 'react';
import {
  Business,
  AdditionalServiceInvoice,
  ElectronicPaymentMethod,
  VerificationStatus,
  AdminFollowUpCategory,
} from '../../types';
import { formatEGP } from '../../utils/formatCurrency';
import { getAdditionalInvoiceWhatsAppUrl } from '../../utils/whatsapp';
import {
  CheckCircle2,
  ShieldCheck,
  Receipt,
  Plus,
  Check,
  Send,
  Trash2,
} from 'lucide-react';

export interface EditPackagePaymentTabProps {
  formData: Business;
  business?: Business | null;
  handleChange?: (field: keyof Business, value: any) => void;
  setFormData?: React.Dispatch<React.SetStateAction<any>>;
  handleInstantApprove?: () => void;
  isAddInvoiceOpen?: boolean;
  setIsAddInvoiceOpen?: (open: boolean) => void;
  newInvoiceTitle?: string;
  setNewInvoiceTitle?: (title: string) => void;
  newInvoiceAmount?: string;
  setNewInvoiceAmount?: (amount: string) => void;
  newInvoicePaid?: string;
  setNewInvoicePaid?: (paid: string) => void;
  newInvoiceMethod?: ElectronicPaymentMethod;
  setNewInvoiceMethod?: (method: ElectronicPaymentMethod) => void;
  newInvoiceRef?: string;
  setNewInvoiceRef?: (ref: string) => void;
  handleCreateAdditionalInvoice?: (e: React.FormEvent) => void;
  handleMarkInvoicePaid?: (invoiceId: string) => void;
  handleDeleteAdditionalInvoice?: (invoiceId: string) => void;
  // Legacy optional props
  isEditMode?: boolean;
  isAdminOrFinancial?: boolean;
  canEdit?: boolean;
  remainingDebt?: number;
  handleToggleFeeExempt?: (isExempt: boolean) => void;
  onShowInvoice?: (business: Business, additionalInvoiceId?: string) => void;
  onSaveAdditionalInvoice?: (newInv: AdditionalServiceInvoice) => void;
  onDeleteAdditionalInvoice?: (invoiceId: string) => void;
  onPayAdditionalInvoice?: (invoiceId: string) => void;
  copiedField?: string | null;
  handleCopyText?: (text: string, fieldName: string) => void;
  currentUserName?: string;
  currentUserId?: string;
  currentUserRole?: string;
  onSave?: (biz: Business) => void;
  onOpenMasterDrawer?: (category?: AdminFollowUpCategory) => void;
  onShowNotification?: (msg: string) => void;
}

export const EditPackagePaymentTab: React.FC<EditPackagePaymentTabProps> = ({
  formData,
  business,
  handleChange: customHandleChange,
  setFormData,
  handleInstantApprove,
  isAddInvoiceOpen = false,
  setIsAddInvoiceOpen,
  newInvoiceTitle = '',
  setNewInvoiceTitle,
  newInvoiceAmount = '500',
  setNewInvoiceAmount,
  newInvoicePaid = '500',
  setNewInvoicePaid,
  newInvoiceMethod = 'vodafone_cash',
  setNewInvoiceMethod,
  newInvoiceRef = '',
  setNewInvoiceRef,
  handleCreateAdditionalInvoice,
  handleMarkInvoicePaid,
  handleDeleteAdditionalInvoice,
}) => {
  const onChange = (field: keyof Business, value: any) => {
    if (customHandleChange) {
      customHandleChange(field, value);
    } else if (setFormData) {
      setFormData((prev: any) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const targetBusiness = business || formData;

  return (
    <div className="space-y-4 text-right">
      {/* 🟢 Instant Acceptance & Verification Hub */}
      <div
        className={`p-4 rounded-2xl border space-y-3 transition-all ${
          formData.verificationStatus === 'verified'
            ? 'bg-emerald-50 border-emerald-300'
            : 'bg-amber-50/70 border-amber-300'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-200/60 pb-3">
          <div>
            <h4 className="font-black text-xs sm:text-sm text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>حالة توثيق واعتماد المنشأة بالدليل العام</span>
            </h4>
            <p className="text-[11px] text-slate-600 mt-0.5">
              التحكم المباشر في قبول وتفعيل ظهور المنشأة ببطاقتها على الدليل العام
            </p>
          </div>

          {formData.verificationStatus !== 'verified' && handleInstantApprove ? (
            <button
              type="button"
              onClick={handleInstantApprove}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>قبول واعتماد المنشأة فوراً ✅</span>
            </button>
          ) : (
            <span className="bg-emerald-600 text-white font-black text-xs px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>المنشأة معتمدة ومقبولة رسمياً</span>
            </span>
          )}
        </div>

        {/* Verification Status Selector */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-slate-700 block">تحديد حالة التوثيق:</span>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
            {[
              { id: 'verified', label: 'معتمد وموثق ✅', color: 'emerald' },
              { id: 'pending', label: 'قيد المراجعة ⏳', color: 'amber' },
              { id: 'in_progress', label: 'جاري الفحص 🔍', color: 'blue' },
              { id: 'needs_action', label: 'يتطلب إجراء ⚠️', color: 'orange' },
              { id: 'rejected', label: 'مرفوض ✕', color: 'rose' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => onChange('verificationStatus', st.id as VerificationStatus)}
                className={`py-2 px-2 rounded-xl text-[11px] font-bold border transition-all cursor-pointer text-center ${
                  formData.verificationStatus === st.id
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Conditional Verification Toggle */}
        <label className="flex items-center gap-2 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={Boolean(formData.isConditionalVerification)}
            onChange={(e) => onChange('isConditionalVerification', e.target.checked)}
            className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
          />
          <span className="font-bold text-slate-800 text-xs">
            اعتماد مشروط مع وسم متأخرات مالية (يسمح بنشر المنشأة بالدليل مع جدولة المتبقي)
          </span>
        </label>
      </div>

      {/* Package & Payment Basics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-slate-700 font-bold mb-1">سعر الباقة المقررة (ج.م)</label>
          <input
            type="number"
            value={formData.packagePrice ?? 750}
            onChange={(e) => onChange('packagePrice', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-slate-700 font-bold mb-1">المبلغ المحصل فعلياً (ج.م)</label>
          <input
            type="number"
            value={formData.amountPaid ?? 0}
            onChange={(e) => onChange('amountPaid', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-bold text-emerald-600 focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(formData.isFeeExempt)}
            onChange={(e) => onChange('isFeeExempt', e.target.checked)}
            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
          />
          <span className="font-bold text-slate-800 text-xs">
            مكان رائج معفى رسمياً من الرسوم (إدراج مجاني معتمد)
          </span>
        </label>

        {formData.isFeeExempt && (
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              سبب الإعفاء الرسمي
            </label>
            <input
              type="text"
              placeholder="مثال: منشأة تاريخية رائدة بالمنطقة، إدراج شرفي..."
              value={formData.feeExemptionReason || ''}
              onChange={(e) => onChange('feeExemptionReason', e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-slate-700 font-bold mb-1">المندوب الميداني المسؤول</label>
          <input
            type="text"
            value={formData.repName || ''}
            onChange={(e) => onChange('repName', e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-slate-700 font-bold mb-1">كود المندوب (repId)</label>
          <input
            type="text"
            value={formData.repId || ''}
            onChange={(e) => onChange('repId', e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-xs focus:ring-2 focus:ring-indigo-500 dir-ltr text-right"
          />
        </div>
      </div>

      {/* 🧾 Additional Service Invoices Hub */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <h4 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-indigo-600" />
              <span>فواتير الخدمات الإضافية المخصصة ({formData.additionalInvoices?.length || 0})</span>
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              جلسات تصوير 360، ستاندات QR الذكية، الحملات الإعلانية الممولة، والخدمات الخاصة
            </p>
          </div>

          {setIsAddInvoiceOpen && (
            <button
              type="button"
              onClick={() => setIsAddInvoiceOpen(!isAddInvoiceOpen)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1 shadow-2xs active:scale-95 cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAddInvoiceOpen ? 'إغلاق النموذج ✕' : '+ إصدار فاتورة إضافية'}</span>
            </button>
          )}
        </div>

        {/* Inline Add Additional Invoice Form */}
        {isAddInvoiceOpen && handleCreateAdditionalInvoice && (
          <div className="p-3.5 bg-white rounded-2xl border-2 border-indigo-200 shadow-sm space-y-3 animate-fade-in">
            <span className="font-bold text-indigo-900 text-xs block">
              إصدار فاتورة خدمة إضافية جديدة للمنشأة:
            </span>

            {/* Quick Presets */}
            {setNewInvoiceTitle && setNewInvoiceAmount && setNewInvoicePaid && (
              <div className="space-y-1">
                <span className="text-[10.5px] text-slate-500 font-bold block">نماذج خدمات سريعة:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { title: 'جلسة تصوير احترافي وتصوير 360 افتراضي', price: 650 },
                    { title: 'تصميم وطباعة ستاند QR باركود ذكي للمقر', price: 350 },
                    { title: 'حملة ترويجية ممولة عبر منصات التواصل', price: 1200 },
                    { title: 'تصميم هوية بصرية وبانرات دعائية', price: 500 },
                  ].map((preset) => (
                    <button
                      key={preset.title}
                      type="button"
                      onClick={() => {
                        setNewInvoiceTitle(preset.title);
                        setNewInvoiceAmount(String(preset.price));
                        setNewInvoicePaid(String(preset.price));
                      }}
                      className={`py-1 px-2 rounded-lg border text-[10.5px] font-bold transition-all cursor-pointer ${
                        newInvoiceTitle === preset.title
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <span>{preset.title}</span>
                      <span className="opacity-75 mr-1 font-mono">({preset.price} ج)</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                عنوان أو مسمى الخدمة الإضافية *
              </label>
              <input
                type="text"
                value={newInvoiceTitle}
                onChange={(e) => setNewInvoiceTitle && setNewInvoiceTitle(e.target.value)}
                placeholder="مثال: تصوير جوي، تصميم منيو ديجيتال..."
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-bold focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                  إجمالي قيمة الخدمة (ج.م) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={newInvoiceAmount}
                  onChange={(e) => setNewInvoiceAmount && setNewInvoiceAmount(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-bold focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                  المبلغ المسدد الآن (ج.م) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={newInvoicePaid}
                  onChange={(e) => setNewInvoicePaid && setNewInvoicePaid(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-bold focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                  طريقة السداد والتحصيل
                </label>
                <select
                  value={newInvoiceMethod}
                  onChange={(e) =>
                    setNewInvoiceMethod &&
                    setNewInvoiceMethod(e.target.value as ElectronicPaymentMethod)
                  }
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-bold focus:outline-none focus:border-indigo-500"
                >
                  <option value="vodafone_cash">فودافون كاش ومحافظ إلكترونية</option>
                  <option value="instapay">إنستاباي (InstaPay)</option>
                  <option value="bank_transfer">تحويل بنكي رسمي</option>
                  <option value="platform_collected">تحصيل إلكتروني</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1 text-[11px]">
                  رقم التحويل أو العملية (اختياري)
                </label>
                <input
                  type="text"
                  value={newInvoiceRef}
                  onChange={(e) => setNewInvoiceRef && setNewInvoiceRef(e.target.value)}
                  placeholder="REF-..."
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-bold focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddInvoiceOpen && setIsAddInvoiceOpen(false)}
                className="py-1.5 px-3 rounded-lg text-slate-500 hover:bg-slate-100 font-bold transition-colors cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleCreateAdditionalInvoice}
                className="py-1.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>إصدار الفاتورة واعتمادها</span>
              </button>
            </div>
          </div>
        )}

        {/* Additional Invoices List */}
        {formData.additionalInvoices && formData.additionalInvoices.length > 0 ? (
          <div className="space-y-2">
            {formData.additionalInvoices.map((inv) => {
              const isPaid =
                inv.paymentStatus === 'fully_paid' || (inv.amountPaid || 0) >= (inv.amount || 0);
              const waUrl = getAdditionalInvoiceWhatsAppUrl(targetBusiness, inv);

              return (
                <div
                  key={inv.id}
                  className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900">{inv.serviceTitle}</span>
                      <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                        {inv.invoiceNumber}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isPaid
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : (inv.amountPaid || 0) > 0
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {isPaid ? 'مسدد بالكامل ✓' : (inv.amountPaid || 0) > 0 ? 'مسدد جزئياً' : 'غير مسدد ✕'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      القيمة: <strong>{formatEGP(inv.amount)}</strong> • المسدد:{' '}
                      <strong>{formatEGP(inv.amountPaid)}</strong>
                      {inv.paymentMethod && ` • طريقة السداد: ${inv.paymentMethod}`}
                    </p>
                    {inv.notes && <p className="text-[10px] text-slate-400">ملاحظات: {inv.notes}</p>}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    {!isPaid && handleMarkInvoicePaid && (
                      <button
                        type="button"
                        onClick={() => handleMarkInvoicePaid(inv.id)}
                        className="py-1 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10.5px] flex items-center gap-1 transition-colors cursor-pointer"
                        title="تسجيل سداد الفاتورة بالكامل"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>سداد كامل</span>
                      </button>
                    )}
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="py-1 px-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-bold text-[10.5px] flex items-center gap-1 transition-colors"
                      title="إرسال إشعار الفاتورة عبر واتساب"
                    >
                      <Send className="w-3 h-3" />
                      <span>واتساب</span>
                    </a>
                    {handleDeleteAdditionalInvoice && (
                      <button
                        type="button"
                        onClick={() => handleDeleteAdditionalInvoice(inv.id)}
                        className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="حذف الفاتورة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-slate-400 text-xs py-2">
            لا توجد فواتير خدمات إضافية حالياً لهذا النشاط. اضغط على "+ إصدار فاتورة إضافية" لإضافة واحدة.
          </p>
        )}
      </div>
    </div>
  );
};
