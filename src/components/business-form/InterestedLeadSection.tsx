import React, { useState, useMemo } from 'react';
import { InterestedLead, LeadInterestLevel, Representative, Business } from '../../types';
import { saveLeadToDb } from '../../services/db';
import { InteractiveMap } from '../InteractiveMap';
import { triggerHaptic } from '../../utils/haptics';
import {
  EGYPT_GOVERNORATES,
  CATEGORY_GROUPS,
  BUSINESS_CATEGORIES,
  findClosestCategory,
  getGroupFromCategory,
} from '../../data/mockData';
import { getCategoryGroupFor } from '../../utils/categoryMatcher';
import {
  UserCheck,
  CheckCircle2,
  MapPin,
  Loader2,
  Navigation,
  EyeOff,
  Map as MapIcon,
  ChevronUp,
  ChevronDown,
  ExternalLink,
  Sparkles,
  Zap,
  AlertTriangle,
  Tag,
} from 'lucide-react';
import { getTrendingVenuePermissionWhatsAppUrl } from '../../utils/whatsapp';
import { extractGooglePlaceData, isGoogleMapsUrl } from '../../utils/googlePlaceExtractor';
import { findDuplicatePhoneEntity } from '../../utils/phoneValidator';

interface InterestedLeadSectionProps {
  currentRep?: Representative | null;
  onSaveLead?: (lead: InterestedLead) => void;
  businesses?: Business[];
  leads?: InterestedLead[];
}

export const InterestedLeadSection: React.FC<InterestedLeadSectionProps> = ({
  currentRep,
  onSaveLead,
  businesses = [],
  leads = [],
}) => {
  const [leadClientName, setLeadClientName] = useState<string>('');
  const [leadBizName, setLeadBizName] = useState<string>('');
  const [leadPhone, setLeadPhone] = useState<string>('');
  const [leadGov, setLeadGov] = useState<string>('الجيزة');
  const [leadCity, setLeadCity] = useState<string>('');
  const [leadStreet, setLeadStreet] = useState<string>('');
  const [isSavingLead, setIsSavingLead] = useState<boolean>(false);
  const [isTrendingLead, setIsTrendingLead] = useState<boolean>(false);
  const [leadInterest, setLeadInterest] = useState<LeadInterestLevel>('medium');
  const [leadFollowDate, setLeadFollowDate] = useState<string>(
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [leadNotes, setLeadNotes] = useState<string>('');
  const [leadSuccessMsg, setLeadSuccessMsg] = useState<string | null>(null);

  const [leadLat, setLeadLat] = useState<number>(29.9753);
  const [leadLng, setLeadLng] = useState<number>(31.112);
  const [hasLeadLocation, setHasLeadLocation] = useState<boolean>(false);
  const [showLeadMap, setShowLeadMap] = useState<boolean>(false);
  const [isLocatingLead, setIsLocatingLead] = useState<boolean>(false);
  const [leadLocationNotice, setLeadLocationNotice] = useState<string | null>(null);

  // 🏷️ Category Selection & Mapping State
  const [leadCategory, setLeadCategory] = useState<string>('نشاط تجاري / خدمي آخر');
  const [leadSelectedGroup, setLeadSelectedGroup] = useState<string>('أنشطة وخدمات عامة أخرى');
  const [leadGoogleCategoryRaw, setLeadGoogleCategoryRaw] = useState<string | null>(null);

  const [leadGoogleUrl, setLeadGoogleUrl] = useState<string>('');
  const [isExtractingLead, setIsExtractingLead] = useState<boolean>(false);
  const [leadExtractNotice, setLeadExtractNotice] = useState<string | null>(null);

  const handleAutoExtractLead = async (urlToExtract = leadGoogleUrl) => {
    const trimmed = (urlToExtract || '').trim();
    if (!trimmed) {
      alert('يرجى لصق رابط خرائط Google أولاً');
      return;
    }
    triggerHaptic('medium');
    setIsExtractingLead(true);
    setLeadExtractNotice('جاري فك الرابط والتقاط بيانات المنشأة من خرائط Google...');

    try {
      const data = await extractGooglePlaceData(trimmed);
      if (data) {
        if (data.name) {
          setLeadBizName(data.name);
          if (!leadClientName.trim()) {
            setLeadClientName(`مسؤول ${data.name}`);
          }
        }
        // Keep current trending choice; do not force isTrendingLead to true (Fixes Hidden Bug #2)
        if (isTrendingLead) {
          setLeadInterest('trending_free');
        }
        if (data.phone) setLeadPhone(data.phone);

        // 🏷️ Smart Category Extraction & Authentic Preservation
        let resolvedCategory = '';
        if (data.category) {
          const cleanCat = data.category.trim();
          setLeadCategory(cleanCat);
          const inferredGroup = getCategoryGroupFor(cleanCat);
          setLeadSelectedGroup(inferredGroup);
          setLeadGoogleCategoryRaw(null);
          resolvedCategory = cleanCat;
        }
        if (data.governorate) setLeadGov(data.governorate);
        if (data.city) setLeadCity(data.city);
        if (data.street || data.address) setLeadStreet(data.street || data.address || '');
        if (data.lat && data.lng) {
          setLeadLat(data.lat);
          setLeadLng(data.lng);
          setHasLeadLocation(true);
        }
        if (data.resolvedUrl) {
          setLeadGoogleUrl(data.resolvedUrl);
        }

        const summaryParts = [
          data.name ? `الاسم: ${data.name}` : null,
          data.category ? `🏷️ التصنيف: ${resolvedCategory || data.category}` : null,
          data.phone ? `الهاتف: ${data.phone}` : null,
          data.city ? `المنطقة: ${data.city}` : null,
        ]
          .filter(Boolean)
          .join(' • ');

        setLeadExtractNotice(`✅ تم استيراد البيانات بنجاح (${summaryParts || 'تم تحديث الإحداثيات'})`);
        setTimeout(() => setLeadExtractNotice(null), 8000);
      } else {
        setLeadExtractNotice('⚠️ تعذر استخراج كامل البيانات تلقائياً، يمكنك إكمال الحقول يدوياً.');
        setTimeout(() => setLeadExtractNotice(null), 5000);
      }
    } catch {
      setLeadExtractNotice('⚠️ حدث خطأ أثناء الاتصال، يمكنك إدخال البيانات يدوياً.');
      setTimeout(() => setLeadExtractNotice(null), 5000);
    } finally {
      setIsExtractingLead(false);
    }
  };

  const handleGetLeadLocation = () => {
    if (!navigator.geolocation) {
      alert('متصفحك لا يدعم تحديد الموقع الجغرافي');
      return;
    }

    triggerHaptic('medium');
    setIsLocatingLead(true);
    setLeadLocationNotice('جاري الاتصال بالأقمار الصناعية...');

    let bestPosition: GeolocationPosition | null = null;
    let watchId: number | null = null;

    const stopTracking = () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }
      setIsLocatingLead(false);
    };

    const applyLocation = (pos: GeolocationPosition) => {
      const userLat = pos.coords.latitude;
      const userLng = pos.coords.longitude;
      const acc = Math.round(pos.coords.accuracy);

      setLeadLat(userLat);
      setLeadLng(userLng);
      setHasLeadLocation(true);
      setLeadLocationNotice(`تم تحديد موقع العميل بدقة (±${acc}م) - الإحداثيات: ${userLat}, ${userLng}`);
      setTimeout(() => setLeadLocationNotice(null), 6000);
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        bestPosition = pos;
        applyLocation(pos);
        stopTracking();
      },
      (err) => {
        console.warn('getCurrentPosition failed, falling back to watchPosition:', err.message);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (!bestPosition || pos.coords.accuracy < bestPosition.coords.accuracy) {
          bestPosition = pos;
          applyLocation(pos);
          if (pos.coords.accuracy <= 20) {
            stopTracking();
          }
        }
      },
      (err) => {
        console.error('Lead watchPosition error:', err);
        setLeadLocationNotice('⚠️ تعذر جلب GPS تلقائياً، يمكنك فتح الخريطة لتحديد الموقع يدوياً.');
        setTimeout(() => setLeadLocationNotice(null), 5000);
        stopTracking();
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );

    setTimeout(() => {
      if (isLocatingLead && bestPosition) {
        applyLocation(bestPosition);
      } else if (isLocatingLead) {
        setLeadLocationNotice('⚠️ انتهت مهلة GPS، يرجى تحديد الموقع يدوياً من الخريطة.');
        setTimeout(() => setLeadLocationNotice(null), 5000);
      }
      stopTracking();
    }, 15000);
  };

  const duplicatePhone = useMemo(() => {
    return findDuplicatePhoneEntity(leadPhone, { businesses, leads });
  }, [leadPhone, businesses, leads]);

  const handleSaveLeadSubmit = async () => {
    if (!leadClientName.trim() && !leadBizName.trim()) {
      alert('يرجى إدخال اسم العميل أو اسم النشاط على الأقل');
      return;
    }
    if (!leadPhone.trim()) {
      alert('يرجى إدخال رقم الهاتف للتواصل');
      return;
    }

    if (duplicatePhone) {
      const entityTypeStr = duplicatePhone.type === 'business' ? 'نشاط تجاري مسجل' : 'عميل مهتم / مراجعة مسجلة';
      alert(`⛔ رقم الهاتف (${duplicatePhone.phone}) مسجل بالفعل مسبقاً مع ${entityTypeStr}: "${duplicatePhone.name}" ${duplicatePhone.location ? `(${duplicatePhone.location})` : ''}.\nلا يمكن تكرار تسجيل نفس رقم الهاتف.`);
      return;
    }

    setIsSavingLead(true);
    try {
      const locationMapUrl = leadGoogleUrl.trim()
        ? leadGoogleUrl.trim()
        : hasLeadLocation
        ? `https://www.google.com/maps?q=${leadLat},${leadLng}`
        : undefined;
      // Store only clean notes text — do NOT embed raw URL in notes (Update 34: prevents card overflow)
      const combinedNotes = leadNotes.trim() || undefined;

      const finalBizName = leadBizName.trim() || leadClientName.trim() || 'منشأة تجارية';
      const rawClient = leadClientName.trim();
      const finalClientName = (rawClient && rawClient !== finalBizName)
        ? rawClient
        : (finalBizName ? `مسؤول ${finalBizName}` : 'صاحب المنشأة');

      // Retain authentic category as extracted or chosen
      const finalCategory = leadCategory.trim() || leadGoogleCategoryRaw?.trim() || 'نشاط تجاري / خدمي آخر';

      const lead: InterestedLead = {
        id: `lead_${Date.now()}`,
        clientName: finalClientName,
        businessName: finalBizName,
        businessCategory: finalCategory,
        phone: leadPhone.trim(),
        governorate: leadGov,
        city: leadCity.trim() || undefined,
        street: leadStreet.trim() || undefined,
        lat: hasLeadLocation ? leadLat : undefined,
        lng: hasLeadLocation ? leadLng : undefined,
        locationUrl: locationMapUrl,
        interestLevel: isTrendingLead ? 'trending_free' : leadInterest,
        isTrending: isTrendingLead,
        followUpDate: leadFollowDate || undefined,
        notes: combinedNotes,
        createdDate: new Date().toISOString(),
        repId: currentRep?.id || 'rep_1',
        repName: currentRep?.name || 'مندوب معتمد',
        status: 'pending_followup',
      };

      if (onSaveLead) {
        onSaveLead(lead);
      } else {
        await saveLeadToDb(lead);
      }

      setLeadSuccessMsg(
        isTrendingLead
          ? `🌟 تم حفظ المنشأة الرائجة "${lead.businessName || lead.clientName}" بنجاح في سجل المراجعات (جاهزة للاستئذان عبر واتساب)!`
          : `✅ تم حفظ بيانات العميل "${lead.clientName}" بنجاح في مركز المراجعات والمتابعة!`
      );
      setLeadClientName('');
      setLeadBizName('');
      setLeadPhone('');
      setLeadGov('الجيزة');
      setLeadCity('');
      setLeadStreet('');
      setLeadNotes('');
      setLeadGoogleUrl('');
      setLeadExtractNotice(null);
      setHasLeadLocation(false);
      setShowLeadMap(false);
      setLeadLocationNotice(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingLead(false);
    }
  };

  return (
    <div className={`border-2 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl animate-fade-in text-right transition-all duration-300 ${
      isTrendingLead
        ? 'bg-gradient-to-br from-amber-500/10 via-[var(--bg-card)] to-yellow-500/10 border-amber-500/50 shadow-amber-500/10'
        : 'bg-gradient-to-br from-emerald-500/10 via-[var(--bg-card)] to-teal-500/10 border-emerald-500/40'
    }`}>
      <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-3">
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
          isTrendingLead ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500'
        }`}>
          {isTrendingLead ? <Sparkles className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
        </div>
        <div>
          <h3 className="font-black text-sm sm:text-base text-[var(--text-primary)]">
            {isTrendingLead ? 'استقطاب منشأة رائجة (طلب سماح وإدراج مجاني)' : 'تسجيل بيانات عميل مهتم / زيارة ميدانية للمتابعة'}
          </h3>
          <p className="text-[11px] text-[var(--text-muted)] font-bold">
            {isTrendingLead
              ? 'تسجيل الأماكن الأكثر رواجاً وشهرة لطلب الإذن بعرضها مجاناً في الدليل بدون أي اشتراكات'
              : 'سجّل بيانات المنشأة وصاحب المكان لحفظه ومتابعته والتواصل معه لاحقاً'}
          </p>
        </div>
      </div>

      {/* 🌟 Lead Classification: Standard Lead vs. Trending Free Listing */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-[var(--input-bg)] p-1.5 rounded-2xl border border-[var(--border-color)]">
        <button
          type="button"
          onClick={() => {
            setIsTrendingLead(false);
            setLeadInterest('medium');
            triggerHaptic('light');
          }}
          className={`p-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 border transition-all cursor-pointer ${
            !isTrendingLead
              ? 'bg-[var(--bg-card)] text-[var(--text-primary)] border-emerald-500 shadow-sm'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <UserCheck className="w-4 h-4 text-emerald-500" />
          <span>💼 عميل مهتم عادي (متابعة بيعية)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setIsTrendingLead(true);
            setLeadInterest('trending_free');
            if (!leadNotes.trim()) {
              setLeadNotes('منشأة مميزة رائجة بالمنطقة - مرشحة للإدراج الشرفي المجاني بدون رسوم');
            }
            triggerHaptic('medium');
          }}
          className={`p-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 border transition-all cursor-pointer ${
            isTrendingLead
              ? 'bg-gradient-to-r from-amber-500/25 via-yellow-500/25 to-amber-500/25 text-amber-900 border-amber-500 shadow-md scale-[1.01]'
              : 'border-transparent text-[var(--text-muted)] hover:text-amber-500'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>منشأة رائجة (طلب سماح بإدراج مجاني)</span>
        </button>
      </div>

      {isTrendingLead && (
        <div className="bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 border-2 border-amber-500/40 p-3.5 rounded-2xl space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>ميزة استقطاب المنشآت الأكثر رواجاً (إدراج مجاني 0 ج.م)</span>
            </span>
            <span className="text-[10px] bg-amber-500/20 text-amber-800 px-2 py-0.5 rounded-full font-black border border-amber-500/30">
              طلب السماح أولاً
            </span>
          </div>
          <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-bold">
            يتم حفظ المكان في «مركز المراجعات والمهتمين» دون إدراجه كنشاط تجاري مسجل، لتتمكن من إرسال رسالة الاستئذان المعتمدة. وعند موافقة صاحب المكان، يُحول فورياً للمنظومة بضغطة زر واحدة مجاناً تماماً.
          </p>
          {leadPhone.trim().length >= 10 && (
            <a
              href={getTrendingVenuePermissionWhatsAppUrl(leadPhone, { clientName: leadClientName, businessName: leadBizName })}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 px-3 rounded-xl shadow-md transition-transform active:scale-95 text-xs cursor-pointer"
            >
              <span>إرسال إشعار طلب السماح عبر واتساب</span>
            </a>
          )}
        </div>
      )}

      {leadSuccessMsg && (
        <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-800 p-3.5 rounded-2xl font-bold text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>{leadSuccessMsg}</span>
        </div>
      )}

      {/* ⚡ استيراد فوري مباشر عبر رابط خرائط Google (Link-First Architecture) */}
      <div className="bg-gradient-to-r from-blue-500/10 via-[var(--bg-card)] to-indigo-500/10 border-2 border-blue-500/30 rounded-2xl p-3.5 space-y-2.5 shadow-xs">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black text-blue-700 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-blue-500 fill-blue-500/30" />
            <span>استيراد تلقائي عبر رابط خرائط Google (بدون إرهاق الخريطة)</span>
          </label>
          <span className="text-[10px] bg-blue-500/15 text-blue-800 px-2 py-0.5 rounded-full font-black border border-blue-500/20">
            ⚡ تعبئة فورية
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="url"
            dir="ltr"
            value={leadGoogleUrl}
            onChange={(e) => {
              const val = e.target.value;
              setLeadGoogleUrl(val);
              if (isGoogleMapsUrl(val)) {
                handleAutoExtractLead(val);
              }
            }}
            placeholder="الصق رابط خرائط Google هنا (maps.app.goo.gl/...)"
            className="flex-1 bg-[var(--input-bg)] border border-[var(--border-color)] focus:border-blue-500 text-[var(--text-primary)] rounded-xl px-3 py-2 text-xs font-mono focus:outline-none text-right transition-colors"
          />
          <button
            type="button"
            disabled={isExtractingLead || !leadGoogleUrl.trim()}
            onClick={() => handleAutoExtractLead(leadGoogleUrl)}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shrink-0 shadow-sm transition-transform active:scale-95 cursor-pointer"
          >
            {isExtractingLead ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>جاري الاستيراد...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                <span>استيراد فوري ⚡</span>
              </>
            )}
          </button>
        </div>

        {leadExtractNotice && (
          <div className="text-[11px] font-bold p-2.5 rounded-xl bg-blue-500/15 text-blue-900 border border-blue-500/30 flex items-center gap-2 animate-fade-in">
            {isExtractingLead && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500 shrink-0" />}
            <span>{leadExtractNotice}</span>
          </div>
        )}
      </div>

      <div className="space-y-3.5 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-bold mb-1 text-[var(--text-primary)]">
              {isTrendingLead ? 'اسم المسؤول / صاحب المكان *' : 'اسم صاحب المكان / العميل *'}
            </label>
            <input
              type="text"
              placeholder="مثال: أ. محمود خالد"
              value={leadClientName}
              onChange={(e) => setLeadClientName(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl p-2.5 font-bold focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block font-bold mb-1 text-[var(--text-primary)]">
              اسم المنشأة / المكان التجاري
            </label>
            <input
              type="text"
              placeholder="مثال: مطعم أو كافيه الأصيل"
              value={leadBizName}
              onChange={(e) => setLeadBizName(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl p-2.5 font-bold focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* 🏷️ القسم والتصنيف المعتمد (مع تنبيه حالة التصنيف المستخرج من Google) */}
        <div className="space-y-2 bg-[var(--input-bg)] p-3 rounded-2xl border border-[var(--border-color)]">
          {leadGoogleCategoryRaw && (
            <div className="bg-amber-500/15 border border-amber-500/40 text-amber-800 p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>
                ⚠️ تصنيف Google المستخرج: <strong>"{leadGoogleCategoryRaw}"</strong> — يرجى اختيار التصنيف المعتمد من القائمة أدناه:
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold mb-1 text-[var(--text-primary)]">
                القسم الرئيسي للنشاط *
              </label>
              <select
                value={leadSelectedGroup}
                onChange={(e) => {
                  const newGrp = e.target.value;
                  setLeadSelectedGroup(newGrp);
                  const grpObj = CATEGORY_GROUPS.find((g) => g.group === newGrp);
                  if (grpObj && grpObj.items.length > 0) {
                    setLeadCategory(grpObj.items[0]);
                  }
                }}
                className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl p-2.5 font-bold focus:outline-none focus:border-emerald-500 cursor-pointer text-xs"
              >
                {CATEGORY_GROUPS.map((g) => (
                  <option key={g.group} value={g.group}>
                    {g.icon} {g.group}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold mb-1 text-[var(--text-primary)] flex items-center justify-between">
                <span>التخصص / التصنيف المعتمد *</span>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                  معتمد بدليلك
                </span>
              </label>
              {(() => {
                const grpObj = CATEGORY_GROUPS.find((g) => g.group === leadSelectedGroup) || CATEGORY_GROUPS[CATEGORY_GROUPS.length - 1];
                return (
                  <select
                    value={leadCategory}
                    onChange={(e) => setLeadCategory(e.target.value)}
                    className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] text-emerald-700 font-black rounded-xl p-2.5 focus:outline-none focus:border-emerald-500 cursor-pointer text-xs"
                  >
                    {leadCategory && !grpObj.items.includes(leadCategory) && (
                      <option value={leadCategory}>
                        {leadCategory} (تصنيف خرائط Google)
                      </option>
                    )}
                    {grpObj.items.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                );
              })()}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-bold mb-1 text-[var(--text-primary)]">
              رقم هاتف الواتساب / الاتصال *
            </label>
            <input
              type="tel"
              placeholder="010XXXXXXXX"
              value={leadPhone}
              onChange={(e) => setLeadPhone(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl p-2.5 font-mono font-bold focus:outline-none focus:border-emerald-500"
            />
            {duplicatePhone && (
              <div className="bg-rose-500/15 border border-rose-500/40 text-rose-700 p-2 rounded-xl text-[11px] font-bold flex items-center gap-1.5 mt-1.5 animate-fade-in">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>
                  ⛔ مسجل مسبقاً مع {duplicatePhone.type === 'business' ? 'نشاط' : 'مراجعة'}: {duplicatePhone.name} {duplicatePhone.location ? `(${duplicatePhone.location})` : ''}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block font-bold mb-1 text-[var(--text-primary)]">
              درجة اهتمام العميل
            </label>
            <select
              value={leadInterest}
              onChange={(e) => setLeadInterest(e.target.value as any)}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl p-2.5 font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="high">أولوية مرتفعة (جاهز للطلب)</option>
              <option value="medium">أولوية متوسطة (استشارة ومتابعة)</option>
              <option value="low">متابعة لاحقة</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block font-bold mb-1 text-[var(--text-primary)]">المحافظة</label>
            <select
              value={leadGov}
              onChange={(e) => setLeadGov(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl p-2.5 font-bold focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {leadGov && !EGYPT_GOVERNORATES.includes(leadGov) && (
                <option value={leadGov}>{leadGov}</option>
              )}
              {EGYPT_GOVERNORATES.map((gov) => (
                <option key={gov} value={gov}>
                  {gov}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold mb-1 text-[var(--text-primary)]">المدينة / المنطقة</label>
            <input
              type="text"
              placeholder="مثال: مدينة نصر"
              value={leadCity}
              onChange={(e) => setLeadCity(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl p-2.5 font-bold focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block font-bold mb-1 text-[var(--text-primary)]">تاريخ المتابعة القادمة</label>
            <input
              type="date"
              value={leadFollowDate}
              onChange={(e) => setLeadFollowDate(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl p-2.5 font-bold focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold mb-1 text-[var(--text-primary)]">
            عنوان الشارع / علامة مميزة
          </label>
          <input
            type="text"
            placeholder="مثال: شارع مصطفى النحاس بجوار بنك مصر"
            value={leadStreet}
            onChange={(e) => setLeadStreet(e.target.value)}
            className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl p-2.5 font-medium focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* 📍 GPS Coordinates & Interactive Map for Lead */}
        <div className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-3.5 sm:p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-2 text-emerald-600">
              <MapPin className="w-4 h-4" />
              <span className="font-extrabold text-xs text-[var(--text-primary)]">
                نقطة موقع المحل / النشاط على الخريطة (GPS)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleGetLeadLocation}
                disabled={isLocatingLead}
                className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[11px] font-black px-3 py-1.5 rounded-xl shadow transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
              >
                {isLocatingLead ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Navigation className="w-3.5 h-3.5" />
                )}
                <span>{isLocatingLead ? 'جاري التحديد...' : 'تحديد موقعي الحالي'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setShowLeadMap(!showLeadMap);
                  if (!hasLeadLocation) setHasLeadLocation(true);
                }}
                className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer shadow-xs ${
                  showLeadMap
                    ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/40'
                    : 'bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border-color)] hover:bg-emerald-500/10'
                }`}
              >
                {showLeadMap ? (
                  <EyeOff className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <MapIcon className="w-3.5 h-3.5 text-emerald-600" />
                )}
                <span>{showLeadMap ? 'إخفاء الخريطة' : 'تحديد على الخريطة'}</span>
                {showLeadMap ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Status / Coordinates pill */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="text-[var(--text-muted)] font-bold">حالة الموقع:</span>
              {hasLeadLocation ? (
                <span className="font-mono text-emerald-600 font-bold dir-ltr bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20">
                  {leadLat.toFixed(6)}, {leadLng.toFixed(6)}
                </span>
              ) : (
                <span className="text-[var(--text-muted)] font-medium">
                  لم يتم تثبيت نقطة GPS بعد (اختياري)
                </span>
              )}
            </div>
            {hasLeadLocation && (
              <a
                href={`https://www.google.com/maps?q=${leadLat},${leadLng}`}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-600 hover:underline font-bold text-[10.5px] inline-flex items-center gap-1"
              >
                <span>معاينة على Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {leadLocationNotice && (
            <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{leadLocationNotice}</span>
            </div>
          )}

          {/* Interactive Map Picker Container */}
          {showLeadMap && (
            <div className="animate-fade-in pt-1">
              <InteractiveMap
                mode="picker"
                lat={leadLat}
                lng={leadLng}
                onLocationSelect={(newLat, newLng, details) => {
                  setLeadLat(newLat);
                  setLeadLng(newLng);
                  setHasLeadLocation(true);
                  if (details) {
                    if (details.governorate) setLeadGov(details.governorate);
                    if (details.city) setLeadCity(details.city);
                    if (details.street && !leadStreet) setLeadStreet(details.street);
                    else if (details.landmark && !leadStreet) setLeadStreet(details.landmark);
                    setLeadLocationNotice(
                      `تم تحديد موقع النشاط: ${details.governorate || ''} - ${details.city || ''}`
                    );
                    setTimeout(() => setLeadLocationNotice(null), 5000);
                  }
                }}
                heightClass="h-[260px]"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block font-bold mb-1 text-[var(--text-primary)]">
            ملاحظات الزيارة وما تم مناقشته
          </label>
          <textarea
            rows={2}
            placeholder="مثال: تم شرح باقة الـ 250 ج وطلب التواصل معه يوم السبت القادم بعد موافقة الشريك..."
            value={leadNotes}
            onChange={(e) => setLeadNotes(e.target.value)}
            className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl p-2.5 font-medium focus:outline-none focus:border-emerald-500"
          />
        </div>

        <button
          type="button"
          onClick={handleSaveLeadSubmit}
          disabled={isSavingLead}
          className={`w-full font-black text-sm py-3.5 px-4 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer ${
            isTrendingLead
              ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 shadow-amber-500/20 text-slate-950'
              : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 shadow-emerald-500/20 text-white'
          }`}
        >
          {isSavingLead ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isTrendingLead ? (
            <Sparkles className="w-5 h-5 stroke-[2.5]" />
          ) : (
            <UserCheck className="w-5 h-5" />
          )}
          <span>{isTrendingLead ? 'حفظ المنشأة الرائجة في سجل المراجعات' : 'حفظ العميل في سجل المراجعات والمتابعة'}</span>
        </button>
      </div>
    </div>
  );
};
