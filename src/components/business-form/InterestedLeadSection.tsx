import React, { useState } from 'react';
import { InterestedLead, LeadInterestLevel, Representative } from '../../types';
import { saveLeadToDb } from '../../services/db';
import { InteractiveMap } from '../InteractiveMap';
import { triggerHaptic } from '../../utils/haptics';
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
} from 'lucide-react';

interface InterestedLeadSectionProps {
  currentRep?: Representative | null;
  onSaveLead?: (lead: InterestedLead) => void;
}

export const InterestedLeadSection: React.FC<InterestedLeadSectionProps> = ({
  currentRep,
  onSaveLead,
}) => {
  const [leadClientName, setLeadClientName] = useState<string>('');
  const [leadBizName, setLeadBizName] = useState<string>('');
  const [leadPhone, setLeadPhone] = useState<string>('');
  const [leadGov, setLeadGov] = useState<string>('القاهرة');
  const [leadCity, setLeadCity] = useState<string>('');
  const [leadStreet, setLeadStreet] = useState<string>('');
  const [isSavingLead, setIsSavingLead] = useState<boolean>(false);
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
      setLeadLocationNotice(`🎯 تم تحديد موقع العميل بدقة (±${acc}م) - الإحداثيات: ${userLat}, ${userLng}`);
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

  const handleSaveLeadSubmit = async () => {
    if (!leadClientName.trim() && !leadBizName.trim()) {
      alert('يرجى إدخال اسم العميل أو اسم النشاط على الأقل');
      return;
    }
    if (!leadPhone.trim()) {
      alert('يرجى إدخال رقم الهاتف للتواصل');
      return;
    }

    setIsSavingLead(true);
    try {
      const locationMapUrl = hasLeadLocation
        ? `https://www.google.com/maps?q=${leadLat},${leadLng}`
        : undefined;
      const cleanNotes = leadNotes.trim();
      const combinedNotes =
        hasLeadLocation && locationMapUrl
          ? cleanNotes
            ? `${cleanNotes}\n\n📍 موقع الخريطة: ${locationMapUrl}`
            : `📍 موقع الخريطة: ${locationMapUrl}`
          : cleanNotes || undefined;

      const lead: InterestedLead = {
        id: `lead_${Date.now()}`,
        clientName: leadClientName.trim() || 'عميل مهتم',
        businessName: leadBizName.trim() || undefined,
        phone: leadPhone.trim(),
        governorate: leadGov,
        city: leadCity.trim() || undefined,
        street: leadStreet.trim() || undefined,
        lat: hasLeadLocation ? leadLat : undefined,
        lng: hasLeadLocation ? leadLng : undefined,
        locationUrl: locationMapUrl,
        interestLevel: leadInterest,
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

      setLeadSuccessMsg(`✅ تم حفظ بيانات العميل "${lead.clientName}" بنجاح في مركز المراجعات والمتابعة!`);
      setLeadClientName('');
      setLeadBizName('');
      setLeadPhone('');
      setLeadCity('');
      setLeadStreet('');
      setLeadNotes('');
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
    <div className="bg-gradient-to-br from-emerald-500/10 via-[var(--bg-card)] to-teal-500/10 border-2 border-emerald-500/40 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl animate-fade-in text-right">
      <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-3">
        <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold shrink-0">
          <UserCheck className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-black text-sm sm:text-base text-[var(--text-primary)]">
            تسجيل بيانات عميل مهتم / زيارة ميدانية للمتابعة
          </h3>
          <p className="text-[11px] text-[var(--text-muted)] font-bold">
            سجّل بيانات النشاط وصاحب المحل لحفظه ومتابعته والتواصل معه لاحقاً
          </p>
        </div>
      </div>

      {leadSuccessMsg && (
        <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-800 dark:text-emerald-300 p-3.5 rounded-2xl font-bold text-xs flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>{leadSuccessMsg} (تم حفظ العميل في سجل المراجعات)</span>
        </div>
      )}

      <div className="space-y-3.5 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-bold mb-1 text-[var(--text-primary)]">
              اسم صاحب النشاط / العميل *
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
              اسم المحل / النشاط التجاري
            </label>
            <input
              type="text"
              placeholder="مثال: سوبر ماركت البركة"
              value={leadBizName}
              onChange={(e) => setLeadBizName(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl p-2.5 font-bold focus:outline-none focus:border-emerald-500"
            />
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
              <option value="high">🔥 مهتم جداً (جاهز للطلب قريباً)</option>
              <option value="medium">⚡ مهتم (يحتاج تفاصيل واستشارة)</option>
              <option value="low">❄️ متابعة لاحقة / متردد</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block font-bold mb-1 text-[var(--text-primary)]">المحافظة</label>
            <input
              type="text"
              value={leadGov}
              onChange={(e) => setLeadGov(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl p-2.5 font-bold focus:outline-none focus:border-emerald-500"
            />
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
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
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
                <span>{isLocatingLead ? 'جاري التحديد...' : '📍 تحديد موقعي الحالي'}</span>
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
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/40'
                    : 'bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--border-color)] hover:bg-emerald-500/10'
                }`}
              >
                {showLeadMap ? (
                  <EyeOff className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <MapIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
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
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold dir-ltr bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20">
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
                className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold text-[10.5px] inline-flex items-center gap-1"
              >
                <span>معاينة على Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {leadLocationNotice && (
            <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in">
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
                      `✨ تم تحديد موقع النشاط: ${details.governorate || ''} - ${details.city || ''}`
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
          className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-sm py-3.5 px-4 rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
        >
          {isSavingLead ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <UserCheck className="w-5 h-5" />
          )}
          <span>حفظ العميل في سجل المراجعات والمتابعة 📋</span>
        </button>
      </div>
    </div>
  );
};
