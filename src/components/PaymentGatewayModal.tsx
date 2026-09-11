import React, { useState, useEffect } from 'react';
import { Business, PaymentGatewayConfig } from '../types';
import { compressImageFile } from '../utils/imageCompressor';
import { BaseModal, Button, Badge } from './ui';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';
import { 
  CheckCircle2, 
  ShieldCheck, 
  Copy, 
  Check, 
  Smartphone, 
  Clock, 
  Camera, 
  FileCheck, 
  Trash2, 
  Loader2,
  Info,
  AlertCircle,
  HelpCircle,
  ArrowLeft
} from 'lucide-react';

interface PaymentGatewayModalProps {
  business: Business;
  config: PaymentGatewayConfig;
  onClose: () => void;
  onPaymentSuccess: (amountPaid: number, method?: Business['paymentMethod'], receiptPhoto?: string) => void;
}

export const PaymentGatewayModal: React.FC<PaymentGatewayModalProps> = ({
  business,
  config,
  onClose,
  onPaymentSuccess,
}) => {
  const { copy, copied } = useCopyToClipboard();

  useEffect(() => {
    if (business) {
      const p = business.packagePrice || 0;
      const a = business.amountPaid || 0;
      setSimulatedPayAmount(Math.max(0, p - a) || p);
    }
  }, [business]);

  // Default to vodafone cash as it is the only active payment method
  const [selectedMethod, setSelectedMethod] = useState<'vodafone' | 'instapay' | 'fawry' | 'card' | 'aman'>('vodafone');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [simulatedPayAmount, setSimulatedPayAmount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [receiptPhoto, setReceiptPhoto] = useState<string>(business?.paymentReceiptPhoto || '');
  const [isCompressingReceipt, setIsCompressingReceipt] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>('');

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    try {
      setIsCompressingReceipt(true);
      const compressed = await compressImageFile(file, 1400, 1400, 0.82, { applyWatermark: false });
      setReceiptPhoto(compressed);
    } catch (err) {
      console.error('Error compressing receipt image:', err);
      setUploadError('حدث خطأ أثناء معالجة الصورة، حاول مرة أخرى.');
    } finally {
      setIsCompressingReceipt(false);
    }
  };

  if (!business) return null;

  const pkgPrice = business.packagePrice || 0;
  const amtPaid = business.amountPaid || 0;
  const remaining = Math.max(0, pkgPrice - amtPaid);

  const activeVodafoneNumber = config.vodafoneCashNumber || '01143888355';
  const activeVodafoneNumber2 = config.vodafoneCashNumber2 || '01556221141';
  const activeInstaPayHandle = config.instaPayHandle || '@daz31181';

  const handleCopyText = async (text: string, key: string) => {
    await copy(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getMethodName = () => {
    switch (selectedMethod) {
      case 'instapay':
        return 'إنستاباي';
      case 'fawry':
        return 'فوري';
      case 'card':
        return 'البطاقة البنكية';
      case 'aman':
        return 'أمان';
      default:
        return 'فودافون كاش';
    }
  };

  const handleConfirmSimulatedPayment = () => {
    if (simulatedPayAmount <= 0) return;
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      const method: Business['paymentMethod'] = selectedMethod === 'instapay' ? 'platform_collected' : 'gateway_online';
      onPaymentSuccess(amtPaid + Number(simulatedPayAmount), method, receiptPhoto || undefined);
      onClose();
    }, 600);
  };

  const modalFooter = (
    <div className="w-full">
      <Button
        variant="success"
        size="lg"
        onClick={handleConfirmSimulatedPayment}
        disabled={isProcessing || remaining === 0 || simulatedPayAmount <= 0}
        loading={isProcessing}
        icon={<CheckCircle2 className="w-4 h-4" />}
        className="w-full font-black text-xs sm:text-sm"
      >
        {isProcessing
          ? 'جاري تأكيد التحويل وتحديث الفاتورة...'
          : remaining === 0
          ? 'الفاتورة مسددة بالكامل'
          : `تأكيد استلام تحويل ${simulatedPayAmount} ج.م عبر ${getMethodName()}`}
      </Button>
    </div>
  );

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title="بوابة الدفع والتحصيل المعتمدة"
      subtitle={`${business.nameAr} • باقة ${business.packageName}`}
      icon={<Smartphone className="w-5 h-5 text-emerald-500" />}
      footer={modalFooter}
      size="md"
      zIndex={10040}
    >
      <div className="space-y-3.5 text-xs" dir="rtl">
        {/* Total remaining breakdown */}
        <div className="bg-[var(--payment-surface)] p-3.5 rounded-2xl border border-[var(--payment-border)] flex items-center justify-between text-xs">
          <div>
            <span className="text-[var(--text-muted)] block text-[10px]">المبلغ المتبقي للتحصيل:</span>
            <span className="font-black text-rose-500 text-base">{remaining} جنيه مصري</span>
          </div>

          <div className="text-left">
            <span className="text-[var(--text-muted)] block text-[10px]">قيمة الباقة الكاملة:</span>
            <span className="font-bold text-[var(--text-secondary)]">{pkgPrice} ج.م</span>
          </div>
        </div>

        {/* Notice: Active Wallets & InstaPay */}
        <div className="bg-emerald-500/10 border border-emerald-500/25 p-2.5 rounded-xl flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
          <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>طرق التحصيل الميداني المعتمدة حالياً: <strong>المحافظ الإلكترونية (فودافون كاش)</strong> وشبكة <strong>إنستاباي اللحظية ({activeInstaPayHandle})</strong>.</span>
        </div>

        {/* Admin Integration Note */}
        <div className="bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
          <p className="font-extrabold flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>توجيه لمسؤول المنظومة والمحاسب:</span>
          </p>
          <p className="text-[10px] leading-relaxed text-[var(--text-muted)]">
            يتم تحصيل المبالغ ميدانياً عبر تحويل مباشر لرقم المحفظة أو عنوان إنستاباي، ثم يقوم المندوب أو المحاسب بتأكيد استلام الحوالة لتحديث الفاتورة. ولتفعيل الدفع الإلكتروني التلقائي الفوري يلزم تزويد النظام بمفاتيح الربط البنكي عبر لوحة الإدارة.
          </p>
        </div>

        {/* Payment Methods Tabs */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1 bg-[var(--payment-surface)] p-1.5 rounded-2xl border border-[var(--payment-border)] text-[10px] font-bold">
          {/* 1. Vodafone Cash */}
          <button
            type="button"
            onClick={() => setSelectedMethod('vodafone')}
            className={`py-2 px-1 rounded-xl transition-all cursor-pointer flex flex-col items-center gap-1 ${
              selectedMethod === 'vodafone'
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 font-black shadow-md'
                : 'text-[var(--text-primary)] hover:bg-[var(--input-bg)]'
            }`}
          >
            <div className="flex items-center gap-1">
              <span>فودافون كاش</span>
              <span className={`text-[8px] px-1 py-0.2 rounded font-black ${
                selectedMethod === 'vodafone' ? 'bg-slate-950 text-emerald-300' : 'bg-emerald-500/20 text-emerald-600'
              }`}>مفعل</span>
            </div>
          </button>

          {/* 2. InstaPay */}
          <button
            type="button"
            onClick={() => setSelectedMethod('instapay')}
            className={`py-2 px-1 rounded-xl transition-all cursor-pointer flex flex-col items-center gap-1 ${
              selectedMethod === 'instapay'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black shadow-md'
                : 'text-[var(--text-primary)] hover:bg-[var(--input-bg)]'
            }`}
          >
            <div className="flex items-center gap-1">
              <span>إنستاباي</span>
              <span className={`text-[8px] px-1 py-0.2 rounded font-black ${
                selectedMethod === 'instapay' ? 'bg-white/20 text-white' : 'bg-purple-500/20 text-purple-600'
              }`}>مفعل</span>
            </div>
          </button>

          {/* 3. Fawry */}
          <button
            type="button"
            onClick={() => setSelectedMethod('fawry')}
            className={`py-2 px-1 rounded-xl transition-all cursor-pointer flex flex-col items-center gap-1 ${
              selectedMethod === 'fawry'
                ? 'bg-amber-500/20 border border-amber-500/40 text-amber-600 font-black'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] opacity-75'
            }`}
          >
            <div className="flex items-center gap-1">
              <span>فوري</span>
              <span className="text-[8px] bg-amber-500/20 text-amber-600 px-1 py-0.2 rounded">تطوير</span>
            </div>
          </button>

          {/* 4. Card */}
          <button
            type="button"
            onClick={() => setSelectedMethod('card')}
            className={`py-2 px-1 rounded-xl transition-all cursor-pointer flex flex-col items-center gap-1 ${
              selectedMethod === 'card'
                ? 'bg-blue-500/20 border border-blue-500/40 text-blue-600 font-black'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] opacity-75'
            }`}
          >
            <div className="flex items-center gap-1">
              <span>فيزا / كارت</span>
              <span className="text-[8px] bg-blue-500/20 text-blue-600 px-1 py-0.2 rounded">تطوير</span>
            </div>
          </button>

          {/* 5. Aman */}
          <button
            type="button"
            onClick={() => setSelectedMethod('aman')}
            className={`py-2 px-1 rounded-xl transition-all cursor-pointer flex flex-col items-center gap-1 ${
              selectedMethod === 'aman'
                ? 'bg-orange-500/20 border border-orange-500/40 text-orange-600 font-black'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] opacity-75'
            }`}
          >
            <div className="flex items-center gap-1">
              <span>أمان</span>
              <span className="text-[8px] bg-orange-500/20 text-orange-600 px-1 py-0.2 rounded">تطوير</span>
            </div>
          </button>
        </div>

        {/* Method details */}
        <div className="bg-[var(--payment-surface)] p-4 rounded-2xl border border-[var(--payment-border)] space-y-3 text-xs">
          {/* 1. VODAFONE CASH */}
          {selectedMethod === 'vodafone' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="text-[var(--text-secondary)] font-bold">التحويل المباشر عبر المحافظ الإلكترونية المعتمدة:</p>
                <span className="bg-emerald-500/20 text-emerald-600 text-[10px] font-black px-2 py-0.5 rounded-md">
                  مفعلة للاستلام
                </span>
              </div>

              {/* Wallet 1 */}
              <div className="flex items-center justify-between bg-[var(--input-bg)] p-3 rounded-xl border border-emerald-500/30 font-mono text-emerald-600 shadow-sm">
                <div className="text-right">
                  <span className="text-[10px] text-[var(--text-muted)] block font-sans font-bold">رقم المحفظة الرئيسي (1):</span>
                  <span className="text-base font-black tracking-wider dir-ltr inline-block">{activeVodafoneNumber}</span>
                </div>
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => handleCopyText(activeVodafoneNumber, 'voda1')}
                  icon={copiedKey === 'voda1' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  className="text-xs font-bold"
                >
                  {copiedKey === 'voda1' ? 'تم النسخ' : 'نسخ الرقم'}
                </Button>
              </div>

              {/* Wallet 2 */}
              <div className="flex items-center justify-between bg-[var(--input-bg)] p-3 rounded-xl border border-emerald-500/30 font-mono text-emerald-600 shadow-sm">
                <div className="text-right">
                  <span className="text-[10px] text-[var(--text-muted)] block font-sans font-bold">رقم المحفظة الإضافي (2):</span>
                  <span className="text-base font-black tracking-wider dir-ltr inline-block">{activeVodafoneNumber2}</span>
                </div>
                <Button
                  variant="success"
                  size="sm"
                  onClick={() => handleCopyText(activeVodafoneNumber2, 'voda2')}
                  icon={copiedKey === 'voda2' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  className="text-xs font-bold"
                >
                  {copiedKey === 'voda2' ? 'تم النسخ' : 'نسخ الرقم'}
                </Button>
              </div>

              <div className="bg-[var(--input-bg)] p-2.5 rounded-xl border border-[var(--border-color)] space-y-1 text-[11px] text-[var(--text-secondary)]">
                <p className="font-bold text-[var(--text-primary)] flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                  <span>خطوات التحويل والتأكيد:</span>
                </p>
                <p>1. قم بالتحويل من محفظتك إلى أي من الرقمين أعلاه: <strong>*9*7*{activeVodafoneNumber}*المبلغ#</strong></p>
                <p>2. أو قم بالتحويل المباشر من تطبيق المحفظة (أنا فودافون / My Orange / My Etisalat / My WE).</p>
                <p>3. احتفظ برسالة التأكيد، وأدخل المبلغ المحصل أدناه لتحديث حالة النشاط فورياً.</p>
              </div>
            </div>
          )}

          {/* 2. INSTAPAY */}
          {selectedMethod === 'instapay' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="text-[var(--text-secondary)] font-bold">التحويل اللحظي عبر شبكة إنستاباي (InstaPay):</p>
                <span className="bg-purple-500/20 text-purple-600 text-[10px] font-black px-2 py-0.5 rounded-md">
                  مفعلة للاستلام
                </span>
              </div>

              <div className="flex items-center justify-between bg-[var(--input-bg)] p-3 rounded-xl border border-purple-500/30 font-mono text-purple-600 shadow-sm">
                <div className="text-right">
                  <span className="text-[10px] text-[var(--text-muted)] block font-sans font-bold">معرف إنستاباي المعتمد (IPA):</span>
                  <span className="text-base font-black tracking-wider dir-ltr inline-block">{activeInstaPayHandle}</span>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleCopyText(activeInstaPayHandle, 'instapay')}
                  icon={copiedKey === 'instapay' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold"
                >
                  {copiedKey === 'instapay' ? 'تم النسخ' : 'نسخ المعرف'}
                </Button>
              </div>

              <div className="bg-[var(--input-bg)] p-2.5 rounded-xl border border-[var(--border-color)] space-y-1 text-[11px] text-[var(--text-secondary)]">
                <p className="font-bold text-[var(--text-primary)] flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-purple-500" />
                  <span>خطوات التحويل عبر تطبيق إنستاباي:</span>
                </p>
                <p>1. افتح تطبيق <strong>InstaPay</strong> على هاتفك واختر <strong>"إرسال نقود"</strong>.</p>
                <p>2. اختر التحويل عبر <strong>عنوان الدفع اللحظي (IPA)</strong> وأدخل المعرف: <strong className="text-purple-600 font-mono">{activeInstaPayHandle}</strong>.</p>
                <p>3. أدخل المبلغ المطلوب واضغط تأكيد، ثم أدخل المبلغ المحصل بالأسفل لتحديث الفاتورة فورياً.</p>
              </div>
            </div>
          )}

          {/* 3. FAWRY */}
          {selectedMethod === 'fawry' && (
            <div className="space-y-2.5">
              <div className="bg-amber-500/15 border border-amber-500/30 p-3.5 rounded-xl space-y-1.5 text-amber-900 dark:text-amber-300">
                <div className="flex items-center gap-1.5 font-black text-xs">
                  <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>خدمة الدفع عبر فوري (Fawry) قيد التطوير والربط البرمجي</span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                  يتم حالياً استكمال الربط المباشر مع كود التاجر بشبكة فوري. يرجى استخدام المحافظ الإلكترونية المعتمدة (<strong>{activeVodafoneNumber}</strong> أو <strong>{activeVodafoneNumber2}</strong>) حالياً.
                </p>
              </div>

              <Button
                variant="secondary"
                size="md"
                onClick={() => setSelectedMethod('vodafone')}
                icon={<ArrowLeft className="w-3.5 h-3.5" />}
                className="w-full text-emerald-600 dark:text-emerald-400 font-bold text-xs"
              >
                التحويل الآن عبر المحافظ الإلكترونية المعتمدة
              </Button>
            </div>
          )}

          {/* 4. CARD */}
          {selectedMethod === 'card' && (
            <div className="space-y-2.5">
              <div className="bg-blue-500/15 border border-blue-500/30 p-3.5 rounded-xl space-y-1.5 text-blue-900 dark:text-blue-300">
                <div className="flex items-center gap-1.5 font-black text-xs">
                  <Clock className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>الدفع ببطاقات فيزا / ميزة / ماستركارد قيد التطوير</span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                  بوابة الدفع الإلكتروني المباشر بالبطاقات البنكية قيد المراجعة والاعتماد المصرفي. يرجى استخدام المحافظ الإلكترونية المعتمدة حالياً.
                </p>
              </div>

              <Button
                variant="secondary"
                size="md"
                onClick={() => setSelectedMethod('vodafone')}
                icon={<ArrowLeft className="w-3.5 h-3.5" />}
                className="w-full text-emerald-600 dark:text-emerald-400 font-bold text-xs"
              >
                التحويل الآن عبر المحافظ الإلكترونية المعتمدة
              </Button>
            </div>
          )}

          {/* 5. AMAN */}
          {selectedMethod === 'aman' && (
            <div className="space-y-2.5">
              <div className="bg-orange-500/15 border border-orange-500/30 p-3.5 rounded-xl space-y-1.5 text-orange-900 dark:text-orange-300">
                <div className="flex items-center gap-1.5 font-black text-xs">
                  <Clock className="w-4 h-4 text-orange-500 shrink-0" />
                  <span>خدمات التحصيل عبر منافذ أمان (Aman) قيد التجهيز</span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                  جاري إعداد الربط التقني مع شبكة منافذ أمان للدفع الإلكتروني في المحافظات. يرجى استخدام المحافظ الإلكترونية المعتمدة حالياً.
                </p>
              </div>

              <Button
                variant="secondary"
                size="md"
                onClick={() => setSelectedMethod('vodafone')}
                icon={<ArrowLeft className="w-3.5 h-3.5" />}
                className="w-full text-emerald-600 dark:text-emerald-400 font-bold text-xs"
              >
                التحويل الآن عبر المحافظ الإلكترونية المعتمدة
              </Button>
            </div>
          )}

          {/* Amount to register payment */}
          <div className="pt-2 border-t border-[var(--border-color)] space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-[var(--text-secondary)]">أدخل المبلغ المحول عبر {getMethodName()} (ج.م):</label>
              {remaining === 0 && (
                <Badge variant="success" size="sm">
                  مسددة بالكامل
                </Badge>
              )}
            </div>
            <input
              type="number"
              min="1"
              max={remaining > 0 ? remaining : pkgPrice}
              value={simulatedPayAmount}
              disabled={remaining === 0}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleConfirmSimulatedPayment();
                }
              }}
              onChange={(e) => setSimulatedPayAmount(Math.max(0, Number(e.target.value)))}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-emerald-600 font-black rounded-xl p-2.5 text-sm focus:outline-none focus:border-emerald-500 disabled:opacity-50 shadow-inner"
            />
          </div>

          {/* Receipt Photo Upload in Payment Gateway Modal */}
          <div className="pt-2 border-t border-[var(--border-color)] space-y-2">
            <label className="block text-xs font-bold text-[var(--text-secondary)]">
              إرفاق صورة إيصال / لقطة شاشة التحويل (اختياري):
            </label>

            {receiptPhoto ? (
              <div className="bg-[var(--input-bg)] border border-emerald-500/40 p-2.5 rounded-2xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <img
                    src={receiptPhoto}
                    alt="إيصال التحويل"
                    className="w-12 h-12 object-cover rounded-xl border border-slate-600"
                  />
                  <div>
                    <p className="text-xs font-black text-emerald-500 flex items-center gap-1">
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>تم إرفاق صورة الإيصال</span>
                    </p>
                    <p className="text-[10px] text-[var(--text-muted)]">ستسجل في قسم المالية للنشاط</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setReceiptPhoto('')}
                  className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 p-1.5 rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>إزالة</span>
                </button>
              </div>
            ) : (
              <label className="border border-dashed border-amber-500/40 hover:border-amber-500 rounded-xl p-3 flex items-center justify-center gap-2 cursor-pointer bg-[var(--input-bg)]/60 hover:bg-amber-500/5 transition-colors">
                {isCompressingReceipt ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                    <span className="text-xs text-amber-500 font-bold">جارٍ معالجة الصورة...</span>
                  </div>
                ) : (
                  <>
                    <Camera className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="text-xs font-bold text-[var(--text-primary)]">
                      اضغط لرفع لقطة شاشة أو صورة إيصال التحويل
                    </span>
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

            {/* Inline error message */}
            {uploadError && (
              <p className="text-xs text-rose-500 font-bold flex items-center gap-1.5 mt-1" role="alert">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{uploadError}</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </BaseModal>
  );
};
