import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Business, AdditionalServiceInvoice, ElectronicPaymentMethod, PaymentStatus } from '../../types';
import { 
  FilePlus, 
  X, 
  DollarSign, 
  CheckCircle2, 
  CreditCard, 
  Calendar, 
  FileText, 
  Sparkles, 
  ShieldCheck,
  Zap,
  Tag
} from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

interface AddServiceInvoiceModalProps {
  business: Business;
  isOpen: boolean;
  onClose: () => void;
  onSaveInvoice: (invoice: AdditionalServiceInvoice) => void;
  currentUserName?: string;
  currentUserRole?: string;
}

const COMMON_SERVICE_TEMPLATES = [
  { title: 'تصوير فوتوسيشن وجولة افتراضية 360°', defaultPrice: 750 },
  { title: 'بطاقات تقييم Google الذكية NFC (3 قطع)', defaultPrice: 600 },
  { title: 'حملة إعلانات ممولة على منصات التواصل', defaultPrice: 1200 },
  { title: 'تصميم هوية رقمية وقوائم طعام إلكترونية QR', defaultPrice: 500 },
  { title: 'دعم فني متقدم واستعادة وتوثيق رسمي', defaultPrice: 850 },
  { title: 'تجديد سنوي وإدارة محتوى ونشر دوري', defaultPrice: 1500 },
];

export const AddServiceInvoiceModal: React.FC<AddServiceInvoiceModalProps> = ({
  business,
  isOpen,
  onClose,
  onSaveInvoice,
  currentUserName,
  currentUserRole = 'admin',
}) => {
  const [serviceTitle, setServiceTitle] = useState('');
  const [amount, setAmount] = useState<number | ''>(500);
  const [amountPaid, setAmountPaid] = useState<number | ''>(500);
  const [paymentMethod, setPaymentMethod] = useState<ElectronicPaymentMethod>('vodafone_cash');
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const numAmount = typeof amount === 'number' ? amount : 0;
  const numPaid = typeof amountPaid === 'number' ? amountPaid : 0;

  const handlePriceChange = (val: number | '') => {
    setAmount(val);
    const numericVal = typeof val === 'number' ? val : 0;
    if (numPaid > numericVal || numPaid === numAmount) {
      setAmountPaid(numericVal);
    }
  };

  const handleApplyTemplate = (tmpl: { title: string; defaultPrice: number }) => {
    triggerHaptic('light');
    setServiceTitle(tmpl.title);
    setAmount(tmpl.defaultPrice);
    setAmountPaid(tmpl.defaultPrice);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!serviceTitle.trim()) {
      setError('يرجى كتابة اسم أو وصف الخدمة الإضافية.');
      return;
    }

    if (numAmount <= 0) {
      setError('يرجى إدخال قيمة صحيحة للفاتورة أكبر من صفر.');
      return;
    }

    if (numPaid < 0) {
      setError('المبلغ المسدد لا يمكن أن يكون سالباً.');
      return;
    }

    if (numPaid > numAmount) {
      setError('المبلغ المسدد لا يمكن أن يتجاوز إجمالي قيمة الفاتورة.');
      return;
    }

    const paymentStatus: PaymentStatus =
      numPaid >= numAmount ? 'fully_paid' : numPaid > 0 ? 'partially_paid' : 'unpaid';

    const timestamp = Date.now();
    const invoiceNumber = `ADD-${new Date().getFullYear()}-${timestamp.toString(36).toUpperCase().slice(-5)}${Math.floor(10 + Math.random() * 90)}`;

    const newInvoice: AdditionalServiceInvoice = {
      id: `inv_add_${timestamp}_${Math.floor(Math.random() * 1000)}`,
      businessId: business.id,
      businessName: business.nameAr,
      invoiceNumber,
      serviceTitle: serviceTitle.trim(),
      amount: numAmount,
      amountPaid: numPaid,
      paymentStatus,
      paymentMethod,
      issueDate: issueDate || new Date().toISOString().split('T')[0],
      issuedByRole: (currentUserRole === 'supervisor' || currentUserRole === 'accountant') ? currentUserRole : 'admin',
      issuedByName: currentUserName || 'إدارة منصة دليلك',
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    triggerHaptic('success');
    onSaveInvoice(newInvoice);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[10040] bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto" dir="rtl">
      <div className="bg-[var(--modal-bg)] border border-[var(--modal-border)] rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-4 my-0 sm:my-auto text-[var(--text-primary)] modal-content overflow-y-auto max-h-[94vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center font-bold">
              <FilePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-[var(--text-primary)]">
                إصدار فاتورة خدمة إضافية 🧾
              </h3>
              <p className="text-xs text-[var(--text-muted)] font-bold">
                {business.nameAr} - صادرة رسمياً عن إدارة المنصة
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1.5 rounded-xl hover:bg-[var(--input-bg)] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informative Platform Notice */}
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 p-3 rounded-2xl text-xs font-bold leading-relaxed flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>تنبيه نظام: هذه الفاتورة تصدر رسمياً عن إدارة المنصة، ويتم تحصيلها إلكترونياً فقط لحسابات المنصة، وتُسجل فورياً ضمن التحصيل العام للتطبيق.</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 p-3 rounded-2xl text-xs font-bold">
              {error}
            </div>
          )}

          {/* Quick Templates */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-[var(--text-muted)] flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>اقتراحات ونماذج خدمات سريعة (انقر للاختيار):</span>
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1">
              {COMMON_SERVICE_TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyTemplate(tmpl)}
                  className="text-[11px] font-bold bg-[var(--input-bg)] hover:bg-amber-500/15 hover:text-amber-600 border border-[var(--border-color)] px-2.5 py-1 rounded-xl transition-all cursor-pointer shrink-0"
                >
                  {tmpl.title} ({tmpl.defaultPrice} ج)
                </button>
              ))}
            </div>
          </div>

          {/* Service Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--text-secondary)] flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-amber-500" />
              <span>اسم أو وصف الخدمة الإضافية: <span className="text-rose-500">*</span></span>
            </label>
            <input
              type="text"
              required
              value={serviceTitle}
              onChange={(e) => setServiceTitle(e.target.value)}
              placeholder="مثال: تصوير احترافي فوتوسيشن 360° للمحل"
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold text-xs sm:text-sm rounded-2xl p-3 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Amount and Amount Paid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--text-secondary)] flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                <span>إجمالي قيمة الخدمة (ج.م): <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={amount}
                onChange={(e) => handlePriceChange(Number(e.target.value) || '')}
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-black text-sm rounded-2xl p-3 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--text-secondary)] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>المبلغ المسدد إلكترونياً (ج.م):</span>
              </label>
              <input
                type="number"
                min="0"
                value={amountPaid}
                onChange={(e) => setAmountPaid(Number(e.target.value) || 0)}
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-emerald-600 dark:text-emerald-400 font-black text-sm rounded-2xl p-3 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* Quick Payment Preset Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAmountPaid(numAmount)}
              className="text-[11px] font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-xl cursor-pointer flex-1"
            >
              ✓ مسدد بالكامل ({numAmount} ج)
            </button>
            <button
              type="button"
              onClick={() => setAmountPaid(Math.round(numAmount / 2))}
              className="text-[11px] font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-xl cursor-pointer flex-1"
            >
              ⏳ نصف المبلغ ({Math.round(numAmount / 2)} ج)
            </button>
            <button
              type="button"
              onClick={() => setAmountPaid(0)}
              className="text-[11px] font-bold bg-slate-500/15 hover:bg-slate-500/25 text-slate-400 border border-slate-500/30 px-3 py-1.5 rounded-xl cursor-pointer flex-1"
            >
              ⏱️ غير مسدد (آجل)
            </button>
          </div>

          {/* Electronic Payment Method */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--text-secondary)] flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-blue-500" />
              <span>طريقة التحصيل الإلكتروني للمنصة:</span>
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as ElectronicPaymentMethod)}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold text-xs sm:text-sm rounded-2xl p-3 focus:outline-none focus:border-amber-500 cursor-pointer"
            >
              <option value="vodafone_cash">📱 فودافون كاش المنصة (01143888355 / 01556221141)</option>
              <option value="instapay">⚡ إنستاباي InstaPay المنصة (@daz31181)</option>
              <option value="bank_transfer">🏦 تحويل بنكي رسمي لحسابات المنصة</option>
              <option value="gateway_online">💳 دفع إلكتروني أونلاين عبر البوابة</option>
              <option value="platform_collected">🌐 تحصيل مباشر لحسابات منصة دليلك</option>
            </select>
          </div>

          {/* Issue Date & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--text-secondary)] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>تاريخ إصدار الفاتورة:</span>
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold text-xs sm:text-sm rounded-2xl p-3 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--text-secondary)] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>ملاحظات إضافية (اختياري):</span>
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أي شروط أو تفاصيل إضافية"
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold text-xs sm:text-sm rounded-2xl p-3 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-color)]">
            <button
              type="button"
              onClick={onClose}
              className="bg-[var(--input-bg)] hover:bg-slate-700/30 text-[var(--text-secondary)] font-bold text-xs sm:text-sm px-5 py-3 rounded-2xl transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs sm:text-sm px-6 py-3 rounded-2xl transition-all shadow-md shadow-amber-500/20 flex items-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>إصدار واعتماد الفاتورة رسمياً</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
