import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Business, PaymentGatewayConfig } from '../types';
import { compressImageFile } from '../utils/imageCompressor';
import { CheckCircle2, ShieldCheck, Copy, Check, Smartphone, Clock, Camera, FileCheck, Trash2, Loader2 } from 'lucide-react';

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
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    if (business) {
      const p = business.packagePrice || 0;
      const a = business.amountPaid || 0;
      setSimulatedPayAmount(Math.max(0, p - a) || p);
    }
  }, [business]);

  // Default to vodafone cash as it is the only active payment method
  const [selectedMethod, setSelectedMethod] = useState<'vodafone' | 'instapay' | 'fawry' | 'card' | 'aman'>('vodafone');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [simulatedPayAmount, setSimulatedPayAmount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [receiptPhoto, setReceiptPhoto] = useState<string>(business?.paymentReceiptPhoto || '');
  const [isCompressingReceipt, setIsCompressingReceipt] = useState<boolean>(false);

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsCompressingReceipt(true);
      const compressed = await compressImageFile(file, 1400, 1400, 0.82, { applyWatermark: false });
      setReceiptPhoto(compressed);
    } catch (err) {
      console.error('Error compressing receipt image:', err);
      alert('حدث خطأ أثناء معالجة الصورة');
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

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(label);
    setTimeout(() => setCopiedCode(null), 2000);
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

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 modal-overlay">
      <div 
        className="bg-[var(--modal-bg)] border border-[var(--modal-border)] rounded-t-3xl sm:rounded-3xl max-w-lg w-full shadow-2xl text-[var(--text-primary)] relative modal-content flex flex-col overflow-hidden max-h-[95vh] sm:max-h-[92vh] animate-fade-in"
      >
        {/* ── HEADER ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-[var(--modal-border)] shrink-0 bg-[var(--bg-card)]/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-emerald-500/15 text-emerald-500 rounded-2xl flex items-center justify-center font-bold border border-emerald-500/30 shrink-0">
              <Smartphone className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-sm sm:text-base text-[var(--text-primary)] truncate">
                بوابة الدفع والتحصيل المعتمدة 💳
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] truncate font-medium">
                {business.nameAr} • باقة {business.packageName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="bg-[var(--input-bg)] hover:bg-rose-500/20 text-[var(--text-muted)] hover:text-rose-500 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border border-[var(--border-color)] cursor-pointer transition-colors shrink-0"
            title="إغلاق"
          >
            ✕
          </button>
        </div>

        {/* ── SCROLLABLE BODY ──────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 text-xs">
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
              <span>ℹ️ توجيه لمسؤول المنظومة والمحاسب:</span>
            </p>
            <p className="text-[10px] leading-relaxed text-[var(--text-muted)]">
              يتم تحصيل المبالغ ميدانياً عبر تحويل مباشر لرقم المحفظة أو عنوان إنستاباي أعلاه، ثم يقوم المندوب أو المحاسب بتأكيد استلام الحوالة لتحديث الفاتورة. ولتفعيل الدفع الإلكتروني التلقائي الفوري (بطاقات Visa/Mastercard وماكينات فوري) يلزم تزويد النظام بمفاتيح الربط البنكي (Paymob API Keys أو Fawry Merchant Code) عبر لوحة إدارة بوابات الدفع.
            </p>
          </div>

          {/* Payment Methods Tabs */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1 bg-[var(--payment-surface)] p-1.5 rounded-2xl border border-[var(--payment-border)] text-[10px] font-bold">
            {/* 1. Vodafone Cash / Wallets - Active */}
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
                selectedMethod === 'vodafone' ? 'bg-slate-950 text-emerald-300' : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              }`}>مفعل</span>
            </div>
          </button>

          {/* 2. InstaPay - Active */}
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
                selectedMethod === 'instapay' ? 'bg-white/20 text-white' : 'bg-purple-500/20 text-purple-600 dark:text-purple-400'
              }`}>مفعل</span>
            </div>
          </button>

          {/* 3. Fawry - Under Development */}
          <button
            type="button"
            onClick={() => setSelectedMethod('fawry')}
            className={`py-2 px-1 rounded-xl transition-all cursor-pointer flex flex-col items-center gap-1 ${
              selectedMethod === 'fawry'
                ? 'bg-amber-500/20 border border-amber-500/40 text-amber-600 dark:text-amber-300 font-black'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] opacity-75'
            }`}
          >
            <div className="flex items-center gap-1">
              <span>فوري</span>
              <span className="text-[8px] bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1 py-0.2 rounded">تطوير</span>
            </div>
          </button>

          {/* 4. Card / Visa - Under Development */}
          <button
            type="button"
            onClick={() => setSelectedMethod('card')}
            className={`py-2 px-1 rounded-xl transition-all cursor-pointer flex flex-col items-center gap-1 ${
              selectedMethod === 'card'
                ? 'bg-blue-500/20 border border-blue-500/40 text-blue-600 dark:text-blue-300 font-black'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] opacity-75'
            }`}
          >
            <div className="flex items-center gap-1">
              <span>فيزا / كارت</span>
              <span className="text-[8px] bg-blue-500/20 text-blue-600 dark:text-blue-400 px-1 py-0.2 rounded">تطوير</span>
            </div>
          </button>

          {/* 5. Aman - Under Development */}
          <button
            type="button"
            onClick={() => setSelectedMethod('aman')}
            className={`py-2 px-1 rounded-xl transition-all cursor-pointer flex flex-col items-center gap-1 ${
              selectedMethod === 'aman'
                ? 'bg-orange-500/20 border border-orange-500/40 text-orange-600 dark:text-orange-300 font-black'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] opacity-75'
            }`}
          >
            <div className="flex items-center gap-1">
              <span>أمان</span>
              <span className="text-[8px] bg-orange-500/20 text-orange-600 dark:text-orange-400 px-1 py-0.2 rounded">تطوير</span>
            </div>
          </button>
        </div>

        {/* Method details */}
        <div className="bg-[var(--payment-surface)] p-4 rounded-2xl border border-[var(--payment-border)] space-y-3 text-xs">
          {/* 1. VODAFONE CASH (ACTIVE - DUAL WALLETS) */}
          {selectedMethod === 'vodafone' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="text-[var(--text-secondary)] font-bold">التحويل المباشر عبر المحافظ الإلكترونية المعتمدة:</p>
                <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-md">
                  مفعلة للاستلام
                </span>
              </div>

              {/* Wallet 1 */}
              <div className="flex items-center justify-between bg-[var(--input-bg)] p-3 rounded-xl border border-emerald-500/30 font-mono text-emerald-600 dark:text-emerald-400 shadow-sm">
                <div className="text-right">
                  <span className="text-[10px] text-[var(--text-muted)] block font-sans font-bold">رقم المحفظة الرئيسي (1):</span>
                  <span className="text-base font-black tracking-wider dir-ltr inline-block">{activeVodafoneNumber}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(activeVodafoneNumber, 'voda1')}
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-3 py-1.5 rounded-lg font-black text-xs flex items-center gap-1 cursor-pointer transition-all shadow active:scale-95"
                >
                  {copiedCode === 'voda1' ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>تم النسخ</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>نسخ الرقم</span>
                    </>
                  )}
                </button>
              </div>

              {/* Wallet 2 */}
              <div className="flex items-center justify-between bg-[var(--input-bg)] p-3 rounded-xl border border-emerald-500/30 font-mono text-emerald-600 dark:text-emerald-400 shadow-sm">
                <div className="text-right">
                  <span className="text-[10px] text-[var(--text-muted)] block font-sans font-bold">رقم المحفظة الإضافي (2):</span>
                  <span className="text-base font-black tracking-wider dir-ltr inline-block">{activeVodafoneNumber2}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(activeVodafoneNumber2, 'voda2')}
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-3 py-1.5 rounded-lg font-black text-xs flex items-center gap-1 cursor-pointer transition-all shadow active:scale-95"
                >
                  {copiedCode === 'voda2' ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>تم النسخ</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>نسخ الرقم</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-[var(--input-bg)] p-2.5 rounded-xl border border-[var(--border-color)] space-y-1 text-[11px] text-[var(--text-secondary)]">
                <p className="font-bold text-[var(--text-primary)]">📌 خطوات التحويل والتأكيد:</p>
                <p>1. قم بالتحويل من محفظتك إلى أي من الرقمين أعلاه: <strong>*9*7*{activeVodafoneNumber}*المبلغ#</strong></p>
                <p>2. أو قم بالتحويل المباشر من تطبيق المحفظة (أنا فودافون / My Orange / My Etisalat / My WE).</p>
                <p>3. احتفظ برسالة التأكيد، وأدخل المبلغ المحصل أدناه لتحديث حالة النشاط فورياً.</p>
              </div>
            </div>
          )}

          {/* 2. INSTAPAY (ACTIVE - DIRECT HANDLE @daz31181) */}
          {selectedMethod === 'instapay' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="text-[var(--text-secondary)] font-bold">التحويل اللحظي عبر شبكة إنستاباي (InstaPay):</p>
                <span className="bg-purple-500/20 text-purple-600 dark:text-purple-400 text-[10px] font-black px-2 py-0.5 rounded-md">
                  مفعلة للاستلام
                </span>
              </div>

              <div className="flex items-center justify-between bg-[var(--input-bg)] p-3 rounded-xl border border-purple-500/30 font-mono text-purple-600 dark:text-purple-400 shadow-sm">
                <div className="text-right">
                  <span className="text-[10px] text-[var(--text-muted)] block font-sans font-bold">معرف إنستاباي المعتمد (IPA):</span>
                  <span className="text-base font-black tracking-wider dir-ltr inline-block">{activeInstaPayHandle}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(activeInstaPayHandle, 'instapay')}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg font-black text-xs flex items-center gap-1 cursor-pointer transition-all shadow active:scale-95"
                >
                  {copiedCode === 'instapay' ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>تم النسخ</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>نسخ المعرف</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-[var(--input-bg)] p-2.5 rounded-xl border border-[var(--border-color)] space-y-1 text-[11px] text-[var(--text-secondary)]">
                <p className="font-bold text-[var(--text-primary)]">📌 خطوات التحويل عبر تطبيق إنستاباي:</p>
                <p>1. افتح تطبيق <strong>InstaPay</strong> على هاتفك واختر <strong>"إرسال نقود"</strong>.</p>
                <p>2. اختر التحويل عبر <strong>عنوان الدفع اللحظي (IPA)</strong> أو الحساب وأدخل المعرف: <strong className="text-purple-600 dark:text-purple-400 font-mono">{activeInstaPayHandle}</strong>.</p>
                <p>3. أدخل المبلغ المطلوب واضغط تأكيد، ثم أدخل المبلغ المحصل بالأسفل لتحديث الفاتورة فورياً.</p>
              </div>
            </div>
          )}

          {/* 3. FAWRY (UNDER DEVELOPMENT - NO FAKE DATA) */}
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

              <button
                type="button"
                onClick={() => setSelectedMethod('vodafone')}
                className="w-full bg-[var(--input-bg)] hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold p-2.5 rounded-xl border border-emerald-500/30 text-center cursor-pointer transition-colors text-xs"
              >
                التحويل الآن عبر المحافظ الإلكترونية المعتمدة ←
              </button>
            </div>
          )}

          {/* 4. VISA / MASTERCARD (UNDER DEVELOPMENT) */}
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

              <button
                type="button"
                onClick={() => setSelectedMethod('vodafone')}
                className="w-full bg-[var(--input-bg)] hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold p-2.5 rounded-xl border border-emerald-500/30 text-center cursor-pointer transition-colors text-xs"
              >
                التحويل الآن عبر المحافظ الإلكترونية المعتمدة ←
              </button>
            </div>
          )}

          {/* 5. AMAN (UNDER DEVELOPMENT) */}
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

              <button
                type="button"
                onClick={() => setSelectedMethod('vodafone')}
                className="w-full bg-[var(--input-bg)] hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold p-2.5 rounded-xl border border-emerald-500/30 text-center cursor-pointer transition-colors text-xs"
              >
                التحويل الآن عبر المحافظ الإلكترونية المعتمدة ←
              </button>
            </div>
          )}

          {/* Amount to register payment */}
          <div className="pt-2 border-t border-[var(--border-color)] space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-[var(--text-secondary)]">أدخل المبلغ المحول عبر {getMethodName()} (ج.م):</label>
              {remaining === 0 && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black px-2 py-0.5 rounded-full">
                  مسددة بالكامل
                </span>
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
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-emerald-600 dark:text-emerald-400 font-black rounded-xl p-2.5 text-sm focus:outline-none focus:border-emerald-500 disabled:opacity-50 shadow-inner"
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
          </div>
        </div>
      </div>

        {/* ── FOOTER ACTIONS ────────────────────────────────────── */}
        <div className="p-4 border-t border-[var(--modal-border)] shrink-0 bg-[var(--bg-card)]/40">
          <button
            type="button"
            onClick={handleConfirmSimulatedPayment}
            disabled={isProcessing || remaining === 0 || simulatedPayAmount <= 0}
            className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-slate-950 font-black text-xs py-3 rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            <span>
              {isProcessing
                ? 'جاري تأكيد التحويل وتحديث الفاتورة...'
                : remaining === 0
                ? 'الفاتورة مسددة بالكامل'
                : `تأكيد استلام تحويل ${simulatedPayAmount} ج.م عبر ${getMethodName()}`}
            </span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
