import React, { useState } from 'react';
import { Business } from '../../types';
import {
  MessageCircle,
  Zap,
  MapPin,
  FileText,
  AlertTriangle,
  DollarSign,
  Sparkles,
  Gift,
  Search,
  Eye,
  EyeOff,
  Copy,
  Check,
  Send,
  ShieldCheck,
  QrCode,
  TrendingUp,
  Clock,
} from 'lucide-react';
import {
  CATEGORY_MOTIVATIONAL_DATA,
  getMotivationalGroupByBusiness,
  getCategoryMotivationalWhatsAppUrl,
} from '../../utils/categoryMotivationalMessages';
import {
  getWelcomeAlreadyOnGoogleWhatsAppUrl,
  generateWelcomeAlreadyOnGoogleWhatsAppMessage,
  getInvoiceWhatsAppUrl,
  generateInvoiceWhatsAppMessage,
  getGoogleMapsVerifiedWhatsAppUrl,
  generateGoogleMapsVerifiedWhatsAppMessage,
  getPaymentReceiptWhatsAppUrl,
  generatePaymentReceiptWhatsAppMessage,
  getOverdueWarningWhatsAppUrl,
  generateOverdueWarningWhatsAppMessage,
  getLegalActionExecutedWhatsAppUrl,
  generateLegalActionExecutedWhatsAppMessage,
  getFreeQrGiftWhatsAppUrl,
  generateFreeQrGiftWhatsAppMessage,
  getQrImportanceWhatsAppUrl,
  generateQrImportanceWhatsAppMessage,
  getVisualConsultingWhatsAppUrl,
  generateVisualConsultingWhatsAppMessage,
  getBusinessCheckupWhatsAppUrl,
  generateBusinessCheckupWhatsAppMessage,
  getSocialProofUpgradeWhatsAppUrl,
  generateSocialProofUpgradeWhatsAppMessage,
} from '../../utils/whatsappMessages';

interface EditMarketingTabProps {
  formData: Business;
  isAdminOrFinancial: boolean;
  isAlreadyOnGoogle: boolean;
  hasVerifiedGoogleMap: boolean;
  isGoogleVerifiedAndUnpaid: boolean;
  copiedField: string | null;
  handleCopyText: (text: string, fieldName: string) => void;
}

export const EditMarketingTab: React.FC<EditMarketingTabProps> = ({
  formData,
  isAdminOrFinancial,
  isAlreadyOnGoogle,
  hasVerifiedGoogleMap,
  isGoogleVerifiedAndUnpaid,
  copiedField,
  handleCopyText,
}) => {
  const [waSubTab, setWaSubTab] = useState<'operational' | 'motivational' | 'marketing'>('operational');
  const [expandedWaPreview, setExpandedWaPreview] = useState<string | null>(null);
  const [waSearchQuery, setWaSearchQuery] = useState<string>('');
  const [selectedMotiGroupName, setSelectedMotiGroupName] = useState<string>('');

  if (!isAdminOrFinancial) return null;

  return (
    <div className="space-y-3 text-right">
      {/* Header Info */}
      <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-black shrink-0">
            <MessageCircle className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-black text-xs sm:text-sm text-[var(--text-primary)]">
              مركز رسائل WhatsApp المعتمدة
            </h4>
            <p className="text-[10px] text-[var(--text-muted)] font-bold">
              أزرار إرسال سريعة ومنظمة بحسب الحدث وحالة النشاط
            </p>
          </div>
        </div>

        <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20" dir="ltr">
          {formData.phone || formData.ownerPhone || 'لا يوجد هاتف'}
        </span>
      </div>

      {/* ── 🚀 SMART 1-TAP QUICK ACTIONS BAR ── */}
      <div className="bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/15 border border-emerald-500/30 rounded-2xl p-2.5 space-y-1.5 shadow-2xs">
        <div className="flex items-center justify-between text-[11px] font-black text-emerald-800 dark:text-emerald-300">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>إجراءات فورية سريعة (ضغطة واحدة):</span>
          </div>
          <span className="text-[9px] bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded-md font-bold">
            إرسال فوري
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-0.5">
          {/* 1. Quick Invoice or Welcome */}
          {isAlreadyOnGoogle ? (
            <a
              href={getWelcomeAlreadyOnGoogleWhatsAppUrl(formData)}
              target="_blank"
              rel="noreferrer"
              className="bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black py-2 px-2 rounded-xl flex items-center justify-center gap-1 shadow-xs transition-transform active:scale-95 text-center"
              title="إرسال رسالة الترحيب بالدليل"
            >
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">ترحيب الدليل 🎁</span>
            </a>
          ) : (
            <a
              href={getInvoiceWhatsAppUrl(formData)}
              target="_blank"
              rel="noreferrer"
              className="bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-black py-2 px-2 rounded-xl flex items-center justify-center gap-1 shadow-xs transition-transform active:scale-95 text-center"
              title="إرسال الفاتورة الأولية وتأكيد التسجيل"
            >
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">الفاتورة الأولية 📄</span>
            </a>
          )}

          {/* 2. Google Maps Verified Notice */}
          {hasVerifiedGoogleMap && (
            <a
              href={getGoogleMapsVerifiedWhatsAppUrl(formData)}
              target="_blank"
              rel="noreferrer"
              className="bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black py-2 px-2 rounded-xl flex items-center justify-center gap-1 shadow-xs transition-transform active:scale-95 text-center"
              title="إرسال إشعار التوثيق على خرائط Google"
            >
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">توثيق Google 🗺️</span>
            </a>
          )}

          {/* 3. Debt Warning / Judicial notice */}
          {isGoogleVerifiedAndUnpaid && (
            <a
              href={getOverdueWarningWhatsAppUrl(formData)}
              target="_blank"
              rel="noreferrer"
              className="bg-gradient-to-r from-rose-600 to-red-600 text-white text-[11px] font-black py-2 px-2 rounded-xl flex items-center justify-center gap-1 shadow-xs transition-transform active:scale-95 text-center animate-pulse"
              title="إرسال إنذار سداد المستحقات"
            >
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">إنذار سداد ⚠️</span>
            </a>
          )}

          {/* 4. Payment Receipt */}
          <a
            href={getPaymentReceiptWhatsAppUrl(formData)}
            target="_blank"
            rel="noreferrer"
            className="bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-black py-2 px-2 rounded-xl flex items-center justify-center gap-1 shadow-xs transition-transform active:scale-95 text-center"
            title="إرسال إيصال السداد المالي والمخالصة"
          >
            <DollarSign className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">إيصال السداد ✅</span>
          </a>
        </div>
      </div>

      {/* ── 🏷️ SEGMENTED INTERNAL SUB-TABS ── */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-[var(--input-bg)] rounded-2xl border border-[var(--border-color)] text-[11px] font-black shadow-inner">
        <button
          type="button"
          onClick={() => setWaSubTab('operational')}
          className={`py-2 px-1 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer ${
            waSubTab === 'operational'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>⚡ إجرائية ومالية</span>
        </button>
        <button
          type="button"
          onClick={() => setWaSubTab('motivational')}
          className={`py-2 px-1 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer ${
            waSubTab === 'motivational'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>🌟 نصائح وتحفيز</span>
        </button>
        <button
          type="button"
          onClick={() => setWaSubTab('marketing')}
          className={`py-2 px-1 rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer ${
            waSubTab === 'marketing'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Gift className="w-3.5 h-3.5" />
          <span>🎁 تسويق ومتابعة</span>
        </button>
      </div>

      {/* ── 🔍 QUICK SEARCH IN MESSAGES ── */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          type="text"
          value={waSearchQuery}
          onChange={(e) => setWaSearchQuery(e.target.value)}
          placeholder="بحث سريع في عناوين الرسائل (مثل: فاتورة، إنذار، باركود)..."
          className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl pr-8 pl-8 py-1.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-hidden focus:border-emerald-500/50 transition-colors"
        />
        {waSearchQuery && (
          <button
            type="button"
            onClick={() => setWaSearchQuery('')}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs font-bold"
          >
            ✕
          </button>
        )}
      </div>

      {/* ── 📑 SUB-TAB 1: OPERATIONAL & FINANCIAL MESSAGES ── */}
      {waSubTab === 'operational' && (
        <div className="space-y-2 pt-0.5">
          {/* Message 1: Welcome or Initial Invoice */}
          {isAlreadyOnGoogle ? (
            (!waSearchQuery || 'ترحيب الدليل إدراج مجانا'.includes(waSearchQuery)) && (
              <div className="bg-[var(--bg-card)] border border-blue-500/30 rounded-2xl p-2.5 space-y-2 transition-all shadow-2xs">
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 font-black text-xs text-[var(--text-primary)] truncate">
                    <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="truncate">1. الترحيب وإدراج النشاط بالدليل (مجاناً) 🎁</span>
                  </div>
                  <span className="text-[9px] bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold px-2 py-0.5 rounded-md shrink-0">
                    مسجل مسبقاً
                  </span>
                </div>

                {expandedWaPreview === 'wa_welcome' && (
                  <div className="bg-[var(--input-bg)] p-2.5 rounded-xl border border-blue-500/20 text-[11px] text-[var(--text-secondary)] whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto animate-fade-in font-sans">
                    {generateWelcomeAlreadyOnGoogleWhatsAppMessage(formData)}
                  </div>
                )}

                <div className="flex items-center gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setExpandedWaPreview(expandedWaPreview === 'wa_welcome' ? null : 'wa_welcome')}
                    className="bg-[var(--input-bg)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] text-xs font-bold py-1.5 px-2.5 rounded-xl border border-[var(--border-color)] flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                    title="معاينة نص الرسالة"
                  >
                    {expandedWaPreview === 'wa_welcome' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span className="text-[10px] hidden sm:inline">{expandedWaPreview === 'wa_welcome' ? 'إخفاء' : 'معاينة'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyText(generateWelcomeAlreadyOnGoogleWhatsAppMessage(formData), 'wa_welcome')}
                    className="bg-[var(--input-bg)] hover:bg-blue-500/15 text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-bold p-1.5 rounded-xl transition-colors cursor-pointer shrink-0"
                    title="نسخ نص الرسالة"
                  >
                    {copiedField === 'wa_welcome' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-blue-500" />}
                  </button>
                  <a
                    href={getWelcomeAlreadyOnGoogleWhatsAppUrl(formData)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 text-white font-black text-xs py-1.5 px-3 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 text-center"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>إرسال عبر WhatsApp</span>
                  </a>
                </div>
              </div>
            )
          ) : (
            (!waSearchQuery || 'فاتورة الكترونية تسجيل مبدئية'.includes(waSearchQuery)) && (
              <div className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-amber-500/40 rounded-2xl p-2.5 space-y-2 transition-all shadow-2xs">
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 font-black text-xs text-[var(--text-primary)] truncate">
                    <FileText className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="truncate">1. الفاتورة الإلكترونية الأولية وتأكيد التسجيل 📄</span>
                  </div>
                  <span className="text-[9px] bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold px-2 py-0.5 rounded-md shrink-0">
                    عند التسجيل
                  </span>
                </div>

                {expandedWaPreview === 'wa_inv' && (
                  <div className="bg-[var(--input-bg)] p-2.5 rounded-xl border border-[var(--border-color)] text-[11px] text-[var(--text-secondary)] whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto animate-fade-in font-sans">
                    {generateInvoiceWhatsAppMessage(formData)}
                  </div>
                )}

                <div className="flex items-center gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setExpandedWaPreview(expandedWaPreview === 'wa_inv' ? null : 'wa_inv')}
                    className="bg-[var(--input-bg)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] text-xs font-bold py-1.5 px-2.5 rounded-xl border border-[var(--border-color)] flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                    title="معاينة نص الرسالة"
                  >
                    {expandedWaPreview === 'wa_inv' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span className="text-[10px] hidden sm:inline">{expandedWaPreview === 'wa_inv' ? 'إخفاء' : 'معاينة'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopyText(generateInvoiceWhatsAppMessage(formData), 'wa_inv')}
                    className="bg-[var(--input-bg)] hover:bg-amber-500/15 text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-bold p-1.5 rounded-xl transition-colors cursor-pointer shrink-0"
                    title="نسخ نص الرسالة"
                  >
                    {copiedField === 'wa_inv' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-amber-500" />}
                  </button>
                  <a
                    href={getInvoiceWhatsAppUrl(formData)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs py-1.5 px-3 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 text-center"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>إرسال الفاتورة عبر WhatsApp</span>
                  </a>
                </div>
              </div>
            )
          )}

          {/* Message 2: Google Maps Verified Confirmation */}
          {hasVerifiedGoogleMap && (!waSearchQuery || 'توثيق خرائط جوجل معتمد رسميا'.includes(waSearchQuery)) && (
            <div className="bg-[var(--bg-card)] border border-blue-500/40 rounded-2xl p-2.5 space-y-2 transition-all shadow-2xs">
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 font-black text-xs text-[var(--text-primary)] truncate">
                  <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="truncate">2. إشعار التوثيق وظهور النشاط على Google Maps 🗺️</span>
                </div>
                <span className="text-[9px] bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold px-2 py-0.5 rounded-md shrink-0">
                  توثيق رسمي
                </span>
              </div>

              {expandedWaPreview === 'wa_gmap' && (
                <div className="bg-[var(--input-bg)] p-2.5 rounded-xl border border-blue-500/20 text-[11px] text-[var(--text-secondary)] whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto animate-fade-in font-sans">
                  {generateGoogleMapsVerifiedWhatsAppMessage(formData)}
                </div>
              )}

              <div className="flex items-center gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => setExpandedWaPreview(expandedWaPreview === 'wa_gmap' ? null : 'wa_gmap')}
                  className="bg-[var(--input-bg)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] text-xs font-bold py-1.5 px-2.5 rounded-xl border border-[var(--border-color)] flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                  title="معاينة نص الرسالة"
                >
                  {expandedWaPreview === 'wa_gmap' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span className="text-[10px] hidden sm:inline">{expandedWaPreview === 'wa_gmap' ? 'إخفاء' : 'معاينة'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyText(generateGoogleMapsVerifiedWhatsAppMessage(formData), 'wa_gmap')}
                  className="bg-[var(--input-bg)] hover:bg-blue-500/15 text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-bold p-1.5 rounded-xl transition-colors cursor-pointer shrink-0"
                  title="نسخ نص الرسالة"
                >
                  {copiedField === 'wa_gmap' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-blue-500" />}
                </button>
                <a
                  href={getGoogleMapsVerifiedWhatsAppUrl(formData)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 text-white font-black text-xs py-1.5 px-3 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 text-center"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>إرسال إشعار التوثيق للعميل</span>
                </a>
              </div>
            </div>
          )}

          {/* Message 3: Overdue Payment Warning */}
          {isGoogleVerifiedAndUnpaid && (!waSearchQuery || 'انذار مهلة سداد مستحقات ديون تاخير'.includes(waSearchQuery)) && (
            <div className="bg-rose-500/10 border border-rose-500/40 rounded-2xl p-2.5 space-y-2 transition-all shadow-2xs animate-pulse">
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 font-black text-xs text-rose-700 dark:text-rose-400 truncate">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span className="truncate">3. إنذار رسمي بانتهاء مهلة السداد بعد التوثيق ⚠️</span>
                </div>
                <span className="text-[9px] bg-rose-500/20 text-rose-700 dark:text-rose-300 font-bold px-2 py-0.5 rounded-md shrink-0">
                  مهلة 24 ساعة
                </span>
              </div>

              {expandedWaPreview === 'wa_warn' && (
                <div className="bg-[var(--input-bg)] p-2.5 rounded-xl border border-rose-500/30 text-[11px] text-[var(--text-secondary)] whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto animate-fade-in font-sans">
                  {generateOverdueWarningWhatsAppMessage(formData)}
                </div>
              )}

              <div className="flex items-center gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => setExpandedWaPreview(expandedWaPreview === 'wa_warn' ? null : 'wa_warn')}
                  className="bg-[var(--input-bg)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] text-xs font-bold py-1.5 px-2.5 rounded-xl border border-[var(--border-color)] flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                  title="معاينة نص الرسالة"
                >
                  {expandedWaPreview === 'wa_warn' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span className="text-[10px] hidden sm:inline">{expandedWaPreview === 'wa_warn' ? 'إخفاء' : 'معاينة'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyText(generateOverdueWarningWhatsAppMessage(formData), 'wa_warn')}
                  className="bg-[var(--bg-card)] hover:bg-rose-500/15 text-rose-600 border border-rose-500/30 text-xs font-bold p-1.5 rounded-xl transition-colors cursor-pointer shrink-0"
                  title="نسخ نص الإنذار"
                >
                  {copiedField === 'wa_warn' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-rose-500" />}
                </button>
                <a
                  href={getOverdueWarningWhatsAppUrl(formData)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 text-white font-black text-xs py-1.5 px-3 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 text-center"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>إرسال إنذار السداد الرسمي</span>
                </a>
              </div>
            </div>
          )}

          {/* Message 4: Post-Deadline Executed Actions & Judicial Escalation */}
          {isGoogleVerifiedAndUnpaid && (!waSearchQuery || 'إشعار تنفيذ إجراءات تحذير قضائي محكمة تروكلر'.includes(waSearchQuery)) && (
            <div className="bg-red-500/15 border border-red-500/50 rounded-2xl p-2.5 space-y-2 transition-all shadow-2xs">
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 font-black text-xs text-red-700 dark:text-red-400 truncate">
                  <ShieldCheck className="w-3.5 h-3.5 text-red-500 shrink-0 stroke-[2.5]" />
                  <span className="truncate">4. إشعار تنفيذ الإجراءات والتحذير القضائي 🛑</span>
                </div>
                <span className="text-[9px] bg-red-500/25 text-red-700 dark:text-red-300 font-black px-2 py-0.5 rounded-md animate-pulse shrink-0">
                  بعد انتهاء المهلة
                </span>
              </div>

              {expandedWaPreview === 'wa_legal' && (
                <div className="bg-[var(--input-bg)] p-2.5 rounded-xl border border-red-500/40 text-[11px] text-[var(--text-secondary)] whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto animate-fade-in font-sans">
                  {generateLegalActionExecutedWhatsAppMessage(formData)}
                </div>
              )}

              <div className="flex items-center gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => setExpandedWaPreview(expandedWaPreview === 'wa_legal' ? null : 'wa_legal')}
                  className="bg-[var(--input-bg)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] text-xs font-bold py-1.5 px-2.5 rounded-xl border border-[var(--border-color)] flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                  title="معاينة نص الرسالة"
                >
                  {expandedWaPreview === 'wa_legal' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span className="text-[10px] hidden sm:inline">{expandedWaPreview === 'wa_legal' ? 'إخفاء' : 'معاينة'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyText(generateLegalActionExecutedWhatsAppMessage(formData), 'wa_legal')}
                  className="bg-[var(--bg-card)] hover:bg-red-500/15 text-red-600 border border-red-500/30 text-xs font-bold p-1.5 rounded-xl transition-colors cursor-pointer shrink-0"
                  title="نسخ نص الإشعار القضائي"
                >
                  {copiedField === 'wa_legal' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-red-500" />}
                </button>
                <a
                  href={getLegalActionExecutedWhatsAppUrl(formData)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 bg-gradient-to-r from-red-700 to-rose-900 hover:from-red-600 text-white font-black text-xs py-1.5 px-3 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 text-center"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>إرسال إشعار التنفيذ والملاحقة</span>
                </a>
              </div>
            </div>
          )}

          {/* Message 5: Payment Receipt */}
          {(!waSearchQuery || 'إيصال سداد مخالصة دفع تحصيل'.includes(waSearchQuery)) && (
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-emerald-500/40 rounded-2xl p-2.5 space-y-2 transition-all shadow-2xs">
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 font-black text-xs text-[var(--text-primary)] truncate">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="truncate">5. إيصال السداد المالي والمخالصة ✅</span>
                </div>
                <span className="text-[9px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-md shrink-0">
                  المخالصة
                </span>
              </div>

              {expandedWaPreview === 'wa_pay' && (
                <div className="bg-[var(--input-bg)] p-2.5 rounded-xl border border-emerald-500/30 text-[11px] text-[var(--text-secondary)] whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto animate-fade-in font-sans">
                  {generatePaymentReceiptWhatsAppMessage(formData)}
                </div>
              )}

              <div className="flex items-center gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => setExpandedWaPreview(expandedWaPreview === 'wa_pay' ? null : 'wa_pay')}
                  className="bg-[var(--input-bg)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] text-xs font-bold py-1.5 px-2.5 rounded-xl border border-[var(--border-color)] flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                  title="معاينة نص الرسالة"
                >
                  {expandedWaPreview === 'wa_pay' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span className="text-[10px] hidden sm:inline">{expandedWaPreview === 'wa_pay' ? 'إخفاء' : 'معاينة'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyText(generatePaymentReceiptWhatsAppMessage(formData), 'wa_pay')}
                  className="bg-[var(--bg-card)] hover:bg-emerald-500/15 text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-bold p-1.5 rounded-xl transition-colors cursor-pointer shrink-0"
                  title="نسخ نص الإيصال"
                >
                  {copiedField === 'wa_pay' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-emerald-500" />}
                </button>
                <a
                  href={getPaymentReceiptWhatsAppUrl(formData)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 text-white font-black text-xs py-1.5 px-3 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 text-center"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>إرسال إيصال السداد المالي</span>
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 🌟 SUB-TAB 2: MOTIVATIONAL & CUSTOMER LOYALTY CAMPAIGNS ── */}
      {waSubTab === 'motivational' && (() => {
        const autoGroup = getMotivationalGroupByBusiness(formData);
        const currentGroupName = selectedMotiGroupName || autoGroup.groupName;
        const activeGroupObj = CATEGORY_MOTIVATIONAL_DATA.find((g) => g.groupName === currentGroupName) || autoGroup;

        return (
          <div className="space-y-2 pt-0.5">
            {/* Category Selector Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-[11px] font-bold">
              {CATEGORY_MOTIVATIONAL_DATA.map((grp) => {
                const isSelected = grp.groupName === currentGroupName;
                return (
                  <button
                    key={grp.groupName}
                    type="button"
                    onClick={() => setSelectedMotiGroupName(grp.groupName)}
                    className={`px-2.5 py-1 rounded-xl border whitespace-nowrap transition-all flex items-center gap-1 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white font-black border-emerald-500 shadow-xs'
                        : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-emerald-500/40'
                    }`}
                  >
                    <span>{grp.groupIcon}</span>
                    <span>{grp.groupName}</span>
                  </button>
                );
              })}
            </div>

            {/* Render Active Category Models */}
            <div className="space-y-2">
              {activeGroupObj.models.map((m, idx) => {
                const msgText = m.generateText(formData);
                const waUrl = getCategoryMotivationalWhatsAppUrl(m, formData);
                const copyKey = `wa_cat_${m.id}`;
                const isExpanded = expandedWaPreview === copyKey;

                if (waSearchQuery && !m.title.includes(waSearchQuery) && !msgText.includes(waSearchQuery)) {
                  return null;
                }

                return (
                  <div
                    key={m.id}
                    className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-emerald-500/40 rounded-2xl p-2.5 space-y-2 transition-all shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 font-black text-xs text-[var(--text-primary)] truncate">
                        <span>{m.icon}</span>
                        <span className="truncate">{idx + 1}. {m.title}</span>
                      </div>
                      <span className="text-[9px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-md shrink-0">
                        {m.badge}
                      </span>
                    </div>

                    {isExpanded && (
                      <div className="bg-[var(--input-bg)] p-2.5 rounded-xl border border-emerald-500/20 text-[11px] text-[var(--text-secondary)] whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto animate-fade-in font-sans">
                        {msgText}
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 pt-0.5">
                      <button
                        type="button"
                        onClick={() => setExpandedWaPreview(isExpanded ? null : copyKey)}
                        className="bg-[var(--input-bg)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] text-xs font-bold py-1.5 px-2.5 rounded-xl border border-[var(--border-color)] flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                        title="معاينة نص الرسالة"
                      >
                        {isExpanded ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span className="text-[10px] hidden sm:inline">{isExpanded ? 'إخفاء' : 'معاينة'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyText(msgText, copyKey)}
                        className="bg-[var(--input-bg)] hover:bg-emerald-500/15 text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-bold p-1.5 rounded-xl transition-colors cursor-pointer shrink-0"
                        title="نسخ نص الرسالة"
                      >
                        {copiedField === copyKey ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-emerald-500" />}
                      </button>
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 text-white font-black text-xs py-1.5 px-3 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-95 text-center"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>إرسال النموذج عبر WhatsApp</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* ── 🎁 SUB-TAB 3: MARKETING, LOYALTY & RETENTION CAMPAIGNS ── */}
      {waSubTab === 'marketing' && (
        <div className="space-y-2 pt-0.5">
          {/* Campaign 1: Free QR Code & Stand Gift */}
          {(!waSearchQuery || 'هدية باركود ستاند مجاني استلام طباعة'.includes(waSearchQuery)) && (
            <div className="bg-[var(--bg-card)] border border-emerald-500/40 rounded-2xl p-2.5 space-y-2 transition-all shadow-2xs">
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 font-black text-xs text-[var(--text-primary)] truncate">
                  <QrCode className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="truncate">الحملة 1: 🎁 إشعار هدية باركود الخريطة والستاند الذهبي</span>
                </div>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-md shrink-0">
                  هدية مجانية
                </span>
              </div>

              {expandedWaPreview === 'wa_gift' && (
                <div className="bg-[var(--input-bg)] p-2.5 rounded-xl border border-emerald-500/20 text-[11px] text-[var(--text-secondary)] whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto animate-fade-in font-sans">
                  {generateFreeQrGiftWhatsAppMessage(formData)}
                </div>
              )}

              <div className="flex items-center gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => setExpandedWaPreview(expandedWaPreview === 'wa_gift' ? null : 'wa_gift')}
                  className="bg-[var(--input-bg)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] text-xs font-bold py-1.5 px-2.5 rounded-xl border border-[var(--border-color)] flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                  title="معاينة نص الرسالة"
                >
                  {expandedWaPreview === 'wa_gift' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span className="text-[10px] hidden sm:inline">{expandedWaPreview === 'wa_gift' ? 'إخفاء' : 'معاينة'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyText(generateFreeQrGiftWhatsAppMessage(formData), 'wa_gift')}
                  className="bg-[var(--bg-card)] hover:bg-emerald-500/15 text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-bold p-1.5 rounded-xl transition-colors cursor-pointer shrink-0"
                  title="نسخ نص الرسالة"
                >
                  {copiedField === 'wa_gift' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-emerald-500" />}
                </button>
                <a
                  href={getFreeQrGiftWhatsAppUrl(formData)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 text-white font-black text-xs py-1.5 px-3 rounded-xl shadow-xs flex items-center justify-center gap-1 transition-transform active:scale-95 text-center"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>إرسال إشعار الهدية المجانية</span>
                </a>
              </div>
            </div>
          )}

          {/* Campaign 2: QR Code Business Importance & Review Boost */}
          {(!waSearchQuery || 'أهمية باركود تقييمات زيادة زبائن نجاح كاونتر'.includes(waSearchQuery)) && (
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-amber-500/40 rounded-2xl p-2.5 space-y-2 transition-all shadow-2xs">
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 font-black text-xs text-[var(--text-primary)] truncate">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="truncate">الحملة 2: 📊 أهمية الباركود لمضاعفة التقييمات والمبيعات</span>
                </div>
                <span className="text-[9px] bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold px-2 py-0.5 rounded-md shrink-0">
                  توعية وتطوير
                </span>
              </div>

              {expandedWaPreview === 'wa_qr_imp' && (
                <div className="bg-[var(--input-bg)] p-2.5 rounded-xl border border-[var(--border-color)] text-[11px] text-[var(--text-secondary)] whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto animate-fade-in font-sans">
                  {generateQrImportanceWhatsAppMessage(formData)}
                </div>
              )}

              <div className="flex items-center gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => setExpandedWaPreview(expandedWaPreview === 'wa_qr_imp' ? null : 'wa_qr_imp')}
                  className="bg-[var(--input-bg)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] text-xs font-bold py-1.5 px-2.5 rounded-xl border border-[var(--border-color)] flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                  title="معاينة نص الرسالة"
                >
                  {expandedWaPreview === 'wa_qr_imp' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span className="text-[10px] hidden sm:inline">{expandedWaPreview === 'wa_qr_imp' ? 'إخفاء' : 'معاينة'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyText(generateQrImportanceWhatsAppMessage(formData), 'wa_qr_imp')}
                  className="bg-[var(--bg-card)] hover:bg-amber-500/15 text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-bold p-1.5 rounded-xl transition-colors cursor-pointer shrink-0"
                  title="نسخ نص الرسالة"
                >
                  {copiedField === 'wa_qr_imp' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-amber-500" />}
                </button>
                <a
                  href={getQrImportanceWhatsAppUrl(formData)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 text-slate-950 font-black text-xs py-1.5 px-3 rounded-xl shadow-xs flex items-center justify-center gap-1 transition-transform active:scale-95 text-center"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>إرسال إرشادات الباركود</span>
                </a>
              </div>
            </div>
          )}

          {/* Campaign 3: Visual Identity & Storefront Consulting */}
          {(!waSearchQuery || 'استشارة بصرية واجهة يافطة ديكور تصوير هوية'.includes(waSearchQuery)) && (
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-purple-500/40 rounded-2xl p-2.5 space-y-2 transition-all shadow-2xs">
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 font-black text-xs text-[var(--text-primary)] truncate">
                  <Sparkles className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                  <span className="truncate">الحملة 3: 🎨 استشارة مجانية لتحسين واجهة المحل والتصوير</span>
                </div>
                <span className="text-[9px] bg-purple-500/15 text-purple-700 dark:text-purple-300 font-bold px-2 py-0.5 rounded-md shrink-0">
                  استشارة هوية
                </span>
              </div>

              {expandedWaPreview === 'wa_visual' && (
                <div className="bg-[var(--input-bg)] p-2.5 rounded-xl border border-[var(--border-color)] text-[11px] text-[var(--text-secondary)] whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto animate-fade-in font-sans">
                  {generateVisualConsultingWhatsAppMessage(formData)}
                </div>
              )}

              <div className="flex items-center gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => setExpandedWaPreview(expandedWaPreview === 'wa_visual' ? null : 'wa_visual')}
                  className="bg-[var(--input-bg)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] text-xs font-bold py-1.5 px-2.5 rounded-xl border border-[var(--border-color)] flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                  title="معاينة نص الرسالة"
                >
                  {expandedWaPreview === 'wa_visual' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span className="text-[10px] hidden sm:inline">{expandedWaPreview === 'wa_visual' ? 'إخفاء' : 'معاينة'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyText(generateVisualConsultingWhatsAppMessage(formData), 'wa_visual')}
                  className="bg-[var(--bg-card)] hover:bg-amber-500/15 text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-bold p-1.5 rounded-xl transition-colors cursor-pointer shrink-0"
                  title="نسخ نص الرسالة"
                >
                  {copiedField === 'wa_visual' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-amber-500" />}
                </button>
                <a
                  href={getVisualConsultingWhatsAppUrl(formData)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 text-white font-black text-xs py-1.5 px-3 rounded-xl border border-slate-700 shadow-xs flex items-center justify-center gap-1 transition-transform active:scale-95 text-center"
                >
                  <Send className="w-3.5 h-3.5 text-amber-400" />
                  <span>إرسال استشارة التنسيق البصري</span>
                </a>
              </div>
            </div>
          )}

          {/* Campaign 4: Business Checkup & Working Hours */}
          {(!waSearchQuery || 'فحص نبض النشاط تحديث مواعيد اطمئنان'.includes(waSearchQuery)) && (
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-blue-500/40 rounded-2xl p-2.5 space-y-2 transition-all shadow-2xs">
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 font-black text-xs text-[var(--text-primary)] truncate">
                  <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="truncate">الحملة 4: ☕ فحص نبض النشاط وتحديث المواعيد</span>
                </div>
                <span className="text-[9px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-md shrink-0">
                  اطمئنان ودعم
                </span>
              </div>

              {expandedWaPreview === 'wa_checkup' && (
                <div className="bg-[var(--input-bg)] p-2.5 rounded-xl border border-[var(--border-color)] text-[11px] text-[var(--text-secondary)] whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto animate-fade-in font-sans">
                  {generateBusinessCheckupWhatsAppMessage(formData)}
                </div>
              )}

              <div className="flex items-center gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => setExpandedWaPreview(expandedWaPreview === 'wa_checkup' ? null : 'wa_checkup')}
                  className="bg-[var(--input-bg)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] text-xs font-bold py-1.5 px-2.5 rounded-xl border border-[var(--border-color)] flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                  title="معاينة نص الرسالة"
                >
                  {expandedWaPreview === 'wa_checkup' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span className="text-[10px] hidden sm:inline">{expandedWaPreview === 'wa_checkup' ? 'إخفاء' : 'معاينة'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyText(generateBusinessCheckupWhatsAppMessage(formData), 'wa_checkup')}
                  className="bg-[var(--bg-card)] hover:bg-blue-500/15 text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-bold p-1.5 rounded-xl transition-colors cursor-pointer shrink-0"
                  title="نسخ نص الرسالة"
                >
                  {copiedField === 'wa_checkup' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-blue-500" />}
                </button>
                <a
                  href={getBusinessCheckupWhatsAppUrl(formData)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 text-white font-black text-xs py-1.5 px-3 rounded-xl border border-slate-700 shadow-xs flex items-center justify-center gap-1 transition-transform active:scale-95 text-center"
                >
                  <Send className="w-3.5 h-3.5 text-blue-400" />
                  <span>إرسال رسالة الاطمئنان</span>
                </a>
              </div>
            </div>
          )}

          {/* Campaign 5: Social Proof & VIP Upgrade */}
          {(!waSearchQuery || 'قصة نجاح ترقية باقة vip ارباح عملاء'.includes(waSearchQuery)) && (
            <div className="bg-[var(--bg-card)] border border-purple-500/30 rounded-2xl p-2.5 space-y-2 transition-all shadow-2xs">
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 font-black text-xs text-[var(--text-primary)] truncate">
                  <TrendingUp className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                  <span className="truncate">الحملة 5: 📈 قصة نجاح وترقية باقة VIP 🚀</span>
                </div>
                <span className="text-[9px] bg-purple-500/15 text-purple-700 dark:text-purple-300 font-bold px-2 py-0.5 rounded-md shrink-0">
                  ترقية باقات
                </span>
              </div>

              {expandedWaPreview === 'wa_social' && (
                <div className="bg-[var(--input-bg)] p-2.5 rounded-xl border border-purple-500/20 text-[11px] text-[var(--text-secondary)] whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto animate-fade-in font-sans">
                  {generateSocialProofUpgradeWhatsAppMessage(formData)}
                </div>
              )}

              <div className="flex items-center gap-1.5 pt-0.5">
                <button
                  type="button"
                  onClick={() => setExpandedWaPreview(expandedWaPreview === 'wa_social' ? null : 'wa_social')}
                  className="bg-[var(--input-bg)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] text-xs font-bold py-1.5 px-2.5 rounded-xl border border-[var(--border-color)] flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                  title="معاينة نص الرسالة"
                >
                  {expandedWaPreview === 'wa_social' ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span className="text-[10px] hidden sm:inline">{expandedWaPreview === 'wa_social' ? 'إخفاء' : 'معاينة'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCopyText(generateSocialProofUpgradeWhatsAppMessage(formData), 'wa_social')}
                  className="bg-[var(--bg-card)] hover:bg-purple-500/15 text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-bold p-1.5 rounded-xl transition-colors cursor-pointer shrink-0"
                  title="نسخ نص الرسالة"
                >
                  {copiedField === 'wa_social' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-purple-500" />}
                </button>
                <a
                  href={getSocialProofUpgradeWhatsAppUrl(formData)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-black text-xs py-1.5 px-3 rounded-xl shadow-xs flex items-center justify-center gap-1 transition-transform active:scale-95 text-center"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>إرسال قصة النجاح وباقة VIP</span>
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
