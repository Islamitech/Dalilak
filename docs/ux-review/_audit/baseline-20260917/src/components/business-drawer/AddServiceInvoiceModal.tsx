import React, { useState } from 'react';
import { X, Receipt, Sparkles, CheckCircle2 } from 'lucide-react';
import { Business, AdditionalServiceInvoice, ElectronicPaymentMethod, PaymentStatus } from '../../types';

interface AddServiceInvoiceModalProps {
  isOpen: boolean;
  business: Business;
  onClose: () => void;
  onAddInvoice?: (
    bizId: string,
    invoiceData: Omit<AdditionalServiceInvoice, 'id' | 'invoiceNumber' | 'issueDate' | 'createdAt'>
  ) => void;
}

export const AddServiceInvoiceModal: React.FC<AddServiceInvoiceModalProps> = ({
  isOpen,
  business,
  onClose,
  onAddInvoice,
}) => {
  const [newServiceTitle, setNewServiceTitle] = useState('');
  const [newServiceAmount, setNewServiceAmount] = useState('500');
  const [newServicePaid, setNewServicePaid] = useState('500');
  const [newServiceMethod, setNewServiceMethod] = useState<ElectronicPaymentMethod>('vodafone_cash');
  const [newServiceRef, setNewServiceRef] = useState('');
  const [newServiceNotes, setNewServiceNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceTitle.trim()) return;
    const amt = parseFloat(newServiceAmount) || 0;
    const paid = parseFloat(newServicePaid) || 0;
    if (amt <= 0) {
      alert('يرجى إدخال قيمة صحيحة للخدمة');
      return;
    }

    const pStatus: PaymentStatus = paid >= amt ? 'fully_paid' : paid > 0 ? 'partially_paid' : 'unpaid';

    if (onAddInvoice) {
      onAddInvoice(business.id, {
        businessId: business.id,
        businessName: business.nameAr,
        serviceTitle: newServiceTitle.trim(),
        amount: amt,
        amountPaid: paid,
        paymentStatus: pStatus,
        paymentMethod: newServiceMethod,
        notes: newServiceNotes.trim() || undefined,
        issuedByName: business.repName || 'إدارة المنظومة',
        issuedByRole: 'admin',
      });
    }

    onClose();
    setNewServiceTitle('');
    setNewServiceAmount('500');
    setNewServicePaid('500');
    setNewServiceRef('');
    setNewServiceNotes('');
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs font-['Tajawal',sans-serif] animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 text-right">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900">إصدار فاتورة خدمة إضافية مخصصة</h3>
              <p className="text-xs text-slate-500">{business.nameAr} • سداد أو تحصيل مباشر</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4 text-xs">
          {/* Preset Buttons */}
          <div className="space-y-1.5">
            <span className="font-bold text-slate-700 block text-[11px]">خدمات سريعة جاهزة للاختيار:</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { title: 'جلسة تصوير احترافي وتصوير 360 افتراضي', price: 650 },
                { title: 'تصميم وطباعة ستاند QR باركود ذكي للمقر', price: 350 },
                { title: 'حملة ترويجية ممولة عبر منصات التواصل', price: 1200 },
                { title: 'تصميم هوية بصرية وكروت ترويجية للمنشأة', price: 500 },
              ].map((preset) => (
                <button
                  key={preset.title}
                  type="button"
                  onClick={() => {
                    setNewServiceTitle(preset.title);
                    setNewServiceAmount(String(preset.price));
                    setNewServicePaid(String(preset.price));
                  }}
                  className={`py-1.5 px-2.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                    newServiceTitle === preset.title
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <span>{preset.title}</span>
                  <span className="opacity-75 mr-1 font-mono">({preset.price} ج)</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">عنوان أو مسمى الخدمة المخصصة *</label>
            <input
              type="text"
              required
              value={newServiceTitle}
              onChange={(e) => setNewServiceTitle(e.target.value)}
              placeholder="مثال: تصوير فيديو درون جوي، تجهيز بوسترات..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-bold focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">إجمالي قيمة الخدمة (ج.م) *</label>
              <input
                type="number"
                min="1"
                required
                value={newServiceAmount}
                onChange={(e) => setNewServiceAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-bold focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">المبلغ المسدد الآن (ج.م) *</label>
              <input
                type="number"
                min="0"
                required
                value={newServicePaid}
                onChange={(e) => setNewServicePaid(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-bold focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">طريقة السداد والتحويل</label>
              <select
                value={newServiceMethod}
                onChange={(e) => setNewServiceMethod(e.target.value as ElectronicPaymentMethod)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-bold focus:outline-none focus:border-indigo-500"
              >
                <option value="vodafone_cash">فودافون كاش ومحافظ إلكترونية</option>
                <option value="instapay">إنستاباي (InstaPay)</option>
                <option value="bank_transfer">تحويل بنكي رسمي</option>
                <option value="platform_collected">بوابة دفع إلكتروني</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">رقم العملية أو كود التحويل</label>
              <input
                type="text"
                value={newServiceRef}
                onChange={(e) => setNewServiceRef(e.target.value)}
                placeholder="مثال: REF-92810"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-bold focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">ملاحظات الفاتورة أو شروط الخدمة</label>
            <textarea
              rows={2}
              value={newServiceNotes}
              onChange={(e) => setNewServiceNotes(e.target.value)}
              placeholder="أي تفاصيل خاصة بتسليم الخدمة أو الجدولة..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-bold focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl text-slate-500 hover:bg-slate-100 font-bold transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>إصدار الفاتورة واعتمادها رسمياً</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
