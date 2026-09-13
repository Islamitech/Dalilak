import React, { useState } from 'react';
import { Business } from '../../types';
import {
  MessageCircle,
  Zap,
  Sparkles,
  Gift,
  Search,
  Copy,
  Check,
  Send,
  QrCode,
  TrendingUp,
  Eye,
  EyeOff,
  Star,
  Camera,
  CheckCircle2,
} from 'lucide-react';
import {
  CATEGORY_MOTIVATIONAL_DATA,
  CategoryMotivationalModel,
} from '../../utils/categoryMotivationalMessages';
import {
  formatWhatsAppPhone,
  safeWhatsAppEncode,
  cleanWhatsAppText,
  generateFreeQrGiftWhatsAppMessage,
  generateQrImportanceWhatsAppMessage,
  generateVisualConsultingWhatsAppMessage,
  generateBusinessCheckupWhatsAppMessage,
  generateSocialProofUpgradeWhatsAppMessage,
} from '../../utils/whatsapp';

interface DrawerWhatsAppTabProps {
  business: Business;
  onShowNotification?: (msg: string) => void;
}

export const DrawerWhatsAppTab: React.FC<DrawerWhatsAppTabProps> = ({
  business,
  onShowNotification,
}) => {
  const [subTab, setSubTab] = useState<'motivational' | 'proposals'>('motivational');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const rawPhone = business.phone || business.ownerPhone || '';
  const cleanPhone = formatWhatsAppPhone(rawPhone);
  const directChatUrl = cleanPhone ? `https://wa.me/${cleanPhone}` : undefined;

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(cleanWhatsAppText(text));
    setCopiedId(id);
    onShowNotification?.('تم نسخ نص الرسالة بنجاح');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleSendWa = (text: string) => {
    if (!cleanPhone) {
      onShowNotification?.('⚠️ لا يوجد رقم هاتف متاح للمنشأة لبدء محادثة');
      return;
    }
    const encoded = safeWhatsAppEncode(cleanWhatsAppText(text));
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
  };

  // Marketing Proposals definitions
  const proposals = [
    {
      id: 'prop_free_qr',
      title: 'هدية باركود QR مجاني للطاولات والكاونتر',
      badge: 'هدية مجانية 🎁',
      icon: Gift,
      color: 'from-emerald-500 to-teal-600',
      description: 'إهداء العميل ملصقات باركود QR مجانية لتسهيل وصول الزوار لقائمته وموقعه على الدليل.',
      getText: () => generateFreeQrGiftWhatsAppMessage(business),
    },
    {
      id: 'prop_qr_importance',
      title: 'أهمية ومزايا تفعيل باركود QR للمنشأة',
      badge: 'توعية تسويقية 📱',
      icon: QrCode,
      color: 'from-indigo-500 to-blue-600',
      description: 'شرح احترافي للعميل حول أهمية باركود QR في تسريع الخدمة وجمع تقييمات العملاء المباشرة.',
      getText: () => generateQrImportanceWhatsAppMessage(business),
    },
    {
      id: 'prop_visual_consulting',
      title: 'استشارة مرئية وتطوير المحتوى الاحترافي',
      badge: 'جلسة تصوير 📸',
      icon: Camera,
      color: 'from-purple-500 to-indigo-600',
      description: 'عرض تصوير احترافي وجولة فيديو ميدانية لتوثيق المكان ورفع جاذبية الصفحة.',
      getText: () => generateVisualConsultingWhatsAppMessage(business),
    },
    {
      id: 'prop_checkup',
      title: 'فحص وتحليل الأداء والظهور الميداني',
      badge: 'تقرير تدقيق 📊',
      icon: TrendingUp,
      color: 'from-amber-500 to-orange-600',
      description: 'تقرير دوري لمراجعة التقييمات وساعات العمل والظهور الجغرافي على الخرائط.',
      getText: () => generateBusinessCheckupWhatsAppMessage(business),
    },
    {
      id: 'prop_social_proof',
      title: 'ترقية الدليل الاجتماعي ومراجعات العملاء',
      badge: 'رفع الثقة ⭐',
      icon: Star,
      color: 'from-rose-500 to-pink-600',
      description: 'استراتيجية تحفيز الزبائن على ترك تقييمات 5 نجوم لرفع الثقة بالمكان.',
      getText: () => generateSocialProofUpgradeWhatsAppMessage(business),
    },
  ];

  // Flatten motivational messages
  const allMotivationalModels: Array<CategoryMotivationalModel & { groupName: string }> = [];
  CATEGORY_MOTIVATIONAL_DATA.forEach((group) => {
    group.models.forEach((m) => {
      allMotivationalModels.push({
        ...m,
        groupName: group.groupName,
      });
    });
  });

  const filteredMotivational = allMotivationalModels.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.title.toLowerCase().includes(q) ||
      m.summary.toLowerCase().includes(q) ||
      m.groupName.toLowerCase().includes(q)
    );
  });

  const filteredProposals = proposals.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4 animate-fade-in font-['Cairo',sans-serif]">
      {/* ── 1. INSTANT 1-TAP WHATSAPP BANNER ── */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/60 border border-emerald-500/40 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                <span>محادثة واتساب فورية مباشرة</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ضغطة واحدة
                </span>
              </h4>
              <p className="text-[11px] text-slate-300 font-medium">
                فتح شات واتساب حر ومباشر مع هاتف المسؤول / العميل
              </p>
            </div>
          </div>

          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/70 px-2.5 py-1 rounded-lg border border-emerald-800" dir="ltr">
            {rawPhone || 'لا يوجد رقم مسجل'}
          </span>
        </div>

        {directChatUrl ? (
          <a
            href={directChatUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-98 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 fill-white/20" />
            <span>بدء محادثة واتساب سريعة ومباشرة مع العميل 💬</span>
          </a>
        ) : (
          <div className="w-full py-2 px-3 rounded-xl bg-slate-900 text-slate-400 text-xs font-bold text-center border border-slate-800">
            ⚠️ لا يوجد رقم هاتف مسجل للمنشأة لبدء محادثة واتساب
          </div>
        )}
      </div>

      {/* ── 2. SUBTABS & SEARCH BAR ── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Subtabs Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setSubTab('motivational')}
              className={`py-1.5 px-3 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                subTab === 'motivational'
                  ? 'bg-white text-indigo-700 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>رسائل التحفيز القطاعية ({allMotivationalModels.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setSubTab('proposals')}
              className={`py-1.5 px-3 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                subTab === 'proposals'
                  ? 'bg-white text-indigo-700 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Gift className="w-3.5 h-3.5 text-emerald-600" />
              <span>عروض وهدايا التسويق ({proposals.length})</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في قوالب الرسائل..."
              className="w-full pr-8 pl-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* ── 3. CONTENT: MOTIVATIONAL CAMPAIGNS ── */}
      {subTab === 'motivational' && (
        <div className="space-y-3">
          {filteredMotivational.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs font-bold text-slate-500">
              لا توجد قوالب رسائل تطابق بحثك.
            </div>
          ) : (
            filteredMotivational.map((m) => {
              const fullText = m.generateText(business);
              const isExpanded = expandedMessageId === m.id;
              const isCopied = copiedId === m.id;

              return (
                <div
                  key={m.id}
                  className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5 transition-all hover:border-slate-300"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl shrink-0">{m.icon}</span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="font-extrabold text-xs sm:text-sm text-slate-900">
                            {m.title}
                          </h5>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                            {m.badge}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                          {m.groupName}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpandedMessageId(isExpanded ? null : m.id)}
                      className="text-slate-400 hover:text-slate-600 text-xs font-bold flex items-center gap-1 p-1 rounded-lg hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
                      title={isExpanded ? 'إخفاء المعاينة' : 'معاينة نص الرسالة'}
                    >
                      {isExpanded ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span className="text-[11px]">إخفاء</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span className="text-[11px]">معاينة</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                    {m.summary}
                  </p>

                  {/* Expanded Text Preview */}
                  {isExpanded && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed font-mono whitespace-pre-wrap select-all">
                      {fullText}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleSendWa(fullText)}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-98"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>إرسال عبر WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyText(fullText, m.id)}
                      className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      title="نسخ نص الرسالة"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">تم النسخ</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>نسخ</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── 4. CONTENT: MARKETING PROPOSALS ── */}
      {subTab === 'proposals' && (
        <div className="space-y-3">
          {filteredProposals.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs font-bold text-slate-500">
              لا توجد عروض تطابق بحثك.
            </div>
          ) : (
            filteredProposals.map((p) => {
              const fullText = p.getText();
              const isExpanded = expandedMessageId === p.id;
              const isCopied = copiedId === p.id;
              const Icon = p.icon;

              return (
                <div
                  key={p.id}
                  className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5 transition-all hover:border-slate-300"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0 border border-indigo-200">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="font-extrabold text-xs sm:text-sm text-slate-900">
                            {p.title}
                          </h5>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200">
                            {p.badge}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpandedMessageId(isExpanded ? null : p.id)}
                      className="text-slate-400 hover:text-slate-600 text-xs font-bold flex items-center gap-1 p-1 rounded-lg hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
                      title={isExpanded ? 'إخفاء المعاينة' : 'معاينة نص العرض'}
                    >
                      {isExpanded ? (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span className="text-[11px]">إخفاء</span>
                        </>
                      ) : (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span className="text-[11px]">معاينة</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                    {p.description}
                  </p>

                  {/* Expanded Text Preview */}
                  {isExpanded && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed font-mono whitespace-pre-wrap select-all">
                      {fullText}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleSendWa(fullText)}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-98"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>إرسال العرض عبر WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyText(fullText, p.id)}
                      className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      title="نسخ نص العرض"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">تم النسخ</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>نسخ</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
