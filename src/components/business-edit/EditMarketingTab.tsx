import React, { useState } from 'react';
import { Business, AdminFollowUpCategory } from '../../types';
import { ContextualFollowUpStrip } from './ContextualFollowUpStrip';
import {
  MessageCircle,
  Zap,
  Sparkles,
  Gift,
  Search,
  Eye,
  EyeOff,
  Copy,
  Check,
  Send,
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
  formatWhatsAppPhone,
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
  isAlreadyOnGoogle?: boolean;
  hasVerifiedGoogleMap?: boolean;
  isGoogleVerifiedAndUnpaid?: boolean;
  copiedField: string | null;
  handleCopyText: (text: string, fieldName: string) => void;
  onSave?: (biz: Business) => void;
  setFormData?: React.Dispatch<React.SetStateAction<Business | null>>;
  currentUserName?: string;
  currentUserId?: string;
  userRole?: string;
  onOpenMasterDrawer?: (category?: AdminFollowUpCategory) => void;
  onShowNotification?: (msg: string) => void;
}

export const EditMarketingTab: React.FC<EditMarketingTabProps> = ({
  formData,
  isAdminOrFinancial,
  copiedField,
  handleCopyText,
  onSave,
  setFormData,
  currentUserName,
  currentUserId,
  userRole,
  onOpenMasterDrawer,
  onShowNotification,
}) => {
  const [waSubTab, setWaSubTab] = useState<'motivational' | 'marketing'>('motivational');
  const [expandedWaPreview, setExpandedWaPreview] = useState<string | null>(null);
  const [waSearchQuery, setWaSearchQuery] = useState<string>('');
  const [selectedMotiGroupName, setSelectedMotiGroupName] = useState<string>('');

  if (!isAdminOrFinancial) return null;

  const rawPhone = formData.phone || formData.ownerPhone || '';
  const cleanPhone = formatWhatsAppPhone(rawPhone);
  const directChatUrl = cleanPhone ? `https://wa.me/${cleanPhone}` : undefined;

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
              مركز رسائل WhatsApp التسويقية وخدمة العملاء
            </h4>
            <p className="text-[10px] text-[var(--text-muted)] font-bold">
              رسائل توعية وتحفيز، هدايا وعروض تسويقية، ومحادثة مباشرة مع العميل
            </p>
          </div>
        </div>

        <span className="text-xs font-mono font-black text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20" dir="ltr">
          {rawPhone || 'لا يوجد هاتف'}
        </span>
      </div>

      {/* ── 🚀 SMART 1-TAP DIRECT WHATSAPP CHAT BUTTON ── */}
      <div className="bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/15 border border-emerald-500/30 rounded-2xl p-2.5 space-y-2 shadow-2xs">
        <div className="flex items-center justify-between text-[11px] font-black text-emerald-800">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>محادثة فورية مباشرة (ضغطة واحدة):</span>
          </div>
          <span className="text-[9px] bg-emerald-500/20 text-emerald-800 px-2 py-0.5 rounded-md font-bold">
            محادثة مخصصة
          </span>
        </div>

        {directChatUrl ? (
          <a
            href={directChatUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-black py-2.5 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-transform active:scale-98 text-center"
            title="بدء محادثة واتساب حرة ومباشرة مع العميل"
          >
            <MessageCircle className="w-4 h-4 fill-white/20 shrink-0" />
            <span>فتح محادثة واتساب سريعة ومباشرة مع العميل 💬</span>
          </a>
        ) : (
          <div className="w-full bg-[var(--input-bg)] text-[var(--text-muted)] text-xs font-bold py-2.5 px-4 rounded-xl border border-[var(--border-color)] text-center">
            ⚠️ لا يوجد رقم هاتف مسجل لهذا النشاط لبدء محادثة
          </div>
        )}
      </div>

      {/* ── 🏷️ SEGMENTED INTERNAL SUB-TABS ── */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-[var(--input-bg)] rounded-2xl border border-[var(--border-color)] text-[11px] font-black shadow-inner">
        <button
          type="button"
          onClick={() => setWaSubTab('motivational')}
          className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            waSubTab === 'motivational'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>🌟 نصائح وتحفيز النشاط (حسب النشاط)</span>
        </button>
        <button
          type="button"
          onClick={() => setWaSubTab('marketing')}
          className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            waSubTab === 'marketing'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Gift className="w-3.5 h-3.5 text-emerald-300" />
          <span>🎁 عروض وحملات تسويقية (ما بعد البيع)</span>
        </button>
      </div>

      {/* ── 🔍 QUICK SEARCH IN MESSAGES ── */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          type="text"
          value={waSearchQuery}
          onChange={(e) => setWaSearchQuery(e.target.value)}
          placeholder="بحث سريع في الرسائل التسويقية والتحفيزية (باركود، ديكور، فحص، VIP)..."
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
                      <span className="text-[9px] bg-emerald-500/15 text-emerald-700 font-bold px-2 py-0.5 rounded-md shrink-0">
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
                <span className="text-[9px] bg-emerald-500/20 text-emerald-700 font-bold px-2 py-0.5 rounded-md shrink-0">
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
                <span className="text-[9px] bg-amber-500/15 text-amber-700 font-bold px-2 py-0.5 rounded-md shrink-0">
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
                <span className="text-[9px] bg-purple-500/15 text-purple-700 font-bold px-2 py-0.5 rounded-md shrink-0">
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
                <span className="text-[9px] bg-emerald-500/15 text-emerald-700 font-bold px-2 py-0.5 rounded-md shrink-0">
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
                <span className="text-[9px] bg-purple-500/15 text-purple-700 font-bold px-2 py-0.5 rounded-md shrink-0">
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

      {/* ── CONTEXTUAL CRM FOLLOW-UP STRIP FOR WHATSAPP & MARKETING ── */}
      {onSave && setFormData && (
        <ContextualFollowUpStrip
          category="whatsapp"
          categoryLabel="التواصل والرسائل التسويقية"
          categoryIcon={<MessageCircle className="w-3.5 h-3.5 text-emerald-500" />}
          business={formData}
          onSave={onSave}
          setFormData={setFormData}
          currentUserName={currentUserName}
          currentUserId={currentUserId}
          userRole={userRole}
          onOpenMasterDrawer={onOpenMasterDrawer}
          onShowNotification={onShowNotification}
        />
      )}
    </div>
  );
};
