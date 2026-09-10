import React, { useState } from 'react';
import { InteractiveMap } from '../InteractiveMap';
import { triggerHaptic } from '../../utils/haptics';
import { extractGooglePlaceData, isGoogleMapsUrl } from '../../utils/googlePlaceExtractor';
import {
  MapPin,
  Loader2,
  Navigation,
  EyeOff,
  Map as MapIcon,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  Sparkles,
  Zap,
} from 'lucide-react';

interface FormLocationSectionProps {
  registrationType: 'new_verification' | 'already_on_google' | 'interested_lead';
  alreadyGoogleMapsUrl: string;
  setAlreadyGoogleMapsUrl: (url: string) => void;
  lat: number;
  setLat: (lat: number) => void;
  lng: number;
  setLng: (lng: number) => void;
  isLocating: boolean;
  handleGetLocation: () => void;
  showMap: boolean;
  setShowMap: (show: boolean) => void;
  autoFillNotice: string | null;
  setAutoFillNotice: (notice: string | null) => void;
  setGovernorate: (gov: string) => void;
  setCity: (city: string) => void;
  setLandmark: (landmark: string) => void;
  setNameAr?: (name: string) => void;
  setOwnerPhone?: (phone: string) => void;
  setCategory?: (cat: string) => void;
  setSelectedGroup?: (group: string) => void;
  setStreet?: (street: string) => void;
  setPhotos?: React.Dispatch<React.SetStateAction<string[]>>;
  setWorkingHours?: (hours: string) => void;
}

export const FormLocationSection: React.FC<FormLocationSectionProps> = ({
  registrationType,
  alreadyGoogleMapsUrl,
  setAlreadyGoogleMapsUrl,
  lat,
  setLat,
  lng,
  setLng,
  isLocating,
  handleGetLocation,
  showMap,
  setShowMap,
  autoFillNotice,
  setAutoFillNotice,
  setGovernorate,
  setCity,
  setLandmark,
  setNameAr,
  setOwnerPhone,
  setCategory,
  setSelectedGroup,
  setStreet,
  setPhotos,
  setWorkingHours,
}) => {
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractedNotice, setExtractedNotice] = useState<string | null>(null);

  const handleAutoExtract = async (urlToExtract = alreadyGoogleMapsUrl) => {
    const trimmed = (urlToExtract || '').trim();
    if (!trimmed) {
      alert('يرجى لصق رابط خرائط Google أولاً');
      return;
    }
    triggerHaptic('medium');
    setIsExtracting(true);
    setExtractedNotice('جاري الاتصال بخرائط Google وفك الرابط واستخراج البيانات وسحب الصور...');

    try {
      const data = await extractGooglePlaceData(trimmed);
      if (data) {
        if (data.name && setNameAr) setNameAr(data.name);
        if (data.phone && setOwnerPhone) setOwnerPhone(data.phone);
        if (data.group && setSelectedGroup) setSelectedGroup(data.group);
        if (data.category && setCategory) setCategory(data.category);
        if (data.governorate) setGovernorate(data.governorate);
        if (data.city) setCity(data.city);
        if (data.street && setStreet) setStreet(data.street);
        if (data.lat && data.lng) {
          setLat(data.lat);
          setLng(data.lng);
        }
        if (data.resolvedUrl) {
          setAlreadyGoogleMapsUrl(data.resolvedUrl);
        }
        if (data.workingHours && setWorkingHours) {
          setWorkingHours(data.workingHours);
        }
        if (data.photos && data.photos.length > 0 && setPhotos) {
          setPhotos(data.photos.slice(0, 5));
        }

        const summaryParts = [
          data.name ? `الاسم: ${data.name}` : null,
          data.category ? `🏷️ تصنيف Google: ${data.category}${data.group ? ` (${data.group})` : ''}` : null,
          data.workingHours ? `⏰ المواعيد: ${data.workingHours}` : null,
          data.photos && data.photos.length > 0 ? `الصور: تم سحب ${Math.min(data.photos.length, 5)} صور من Google` : null,
          data.city ? `المنطقة: ${data.city}` : null,
          data.phone ? `الهاتف: ${data.phone}` : null,
        ]
          .filter(Boolean)
          .join(' • ');

        setExtractedNotice(
          `✅ تم استيراد بيانات النشاط بنجاح (${summaryParts || 'تم تحديث الإحداثيات'})`
        );
        setTimeout(() => setExtractedNotice(null), 8000);
      } else {
        setExtractedNotice('⚠️ تعذر استخراج كامل البيانات تلقائياً، يمكنك إكمال الحقول يدوياً.');
        setTimeout(() => setExtractedNotice(null), 5000);
      }
    } catch {
      setExtractedNotice('⚠️ حدث خطأ أثناء الاتصال، يمكنك إدخال البيانات يدوياً.');
      setTimeout(() => setExtractedNotice(null), 5000);
    } finally {
      setIsExtracting(false);
    }
  };

  if (registrationType === 'already_on_google') {
    return (
      <div className="bg-gradient-to-br from-blue-500/10 via-[var(--bg-card)] to-indigo-500/10 border-2 border-blue-500/50 rounded-3xl p-4 sm:p-5 space-y-3.5 shadow-md text-right animate-fade-in">
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2 text-blue-500">
            <Zap className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-sm text-[var(--text-primary)]">
              2. رابط خرائط Google والاستيراد اللحظي التلقائي *
            </h3>
          </div>
          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-600 border border-blue-500/30">
            استيراد في 4 ثوانٍ ⚡
          </span>
        </div>

        <div>
          <label className="block text-xs font-black text-[var(--text-primary)] mb-1.5">
            ادخل أو الصق الرابط الدقيق للنشاط من خرائط Google (Google Maps Link) *:
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="url"
              placeholder="مثال: https://maps.app.goo.gl/xxxxxx أو https://www.google.com/maps/place/..."
              value={alreadyGoogleMapsUrl}
              onChange={(e) => {
                const val = e.target.value;
                setAlreadyGoogleMapsUrl(val);
                if (isGoogleMapsUrl(val) && val.length > 20) {
                  handleAutoExtract(val);
                }
              }}
              className="flex-1 bg-[var(--input-bg)] border-2 border-blue-500 text-[var(--text-primary)] font-bold text-xs sm:text-sm rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dir-ltr text-right placeholder:text-slate-400 shadow-sm"
              required
            />
            <button
              type="button"
              onClick={() => handleAutoExtract()}
              disabled={isExtracting || !alreadyGoogleMapsUrl.trim()}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
            >
              {isExtracting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>{isExtracting ? 'جاري السحب...' : 'استيراد فوري ⚡'}</span>
            </button>
          </div>
        </div>

        {extractedNotice && (
          <div className="bg-blue-500/15 border border-blue-500/40 text-blue-700 p-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
            <span>{extractedNotice}</span>
          </div>
        )}

        {/* Coordinates pill */}
        <div className="flex items-center gap-2 pt-1 text-[11px] text-[var(--text-muted)]">
          <span>الإحداثيات المسحوبة:</span>
          <span className="font-mono text-blue-600 dir-ltr font-bold text-xs bg-blue-500/10 px-2.5 py-0.5 rounded-md border border-blue-500/20">
            {lat.toFixed(6)}, {lng.toFixed(6)}
          </span>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3 text-[11px] text-[var(--text-secondary)] font-bold flex items-start gap-2">
          <MapPin className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <span>
            <strong>طبيعة هذا التسجيل:</strong> هذا النشاط مسجل ومفعل بالفعل على خرائط Google في
            الشارع، لذا لا يتطلب تحديد موقع ميداني جديد أو إظهار خريطة، ويكتفى فقط بلصق رابطه
            الدقيق لاستيراد كامل بياناته وتوثيقه فورياً بالمنظومة.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-4 sm:p-5 space-y-3 shadow-md transition-colors duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2 text-amber-500">
          <MapPin className="w-5 h-5" />
          <h3 className="font-bold text-sm text-[var(--text-primary)]">
            2. موقع النشاط الجغرافي (GPS Coordinates)
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {/* GPS Locator Button */}
          <button
            type="button"
            onClick={handleGetLocation}
            disabled={isLocating}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-yellow-600 text-slate-950 text-xs font-black px-3.5 py-2 rounded-xl shadow transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
          >
            {isLocating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Navigation className="w-4 h-4 fill-slate-950" />
            )}
            <span>{isLocating ? 'جاري تحديد موقعك...' : 'تحديد موقعي الحالي'}</span>
          </button>

          {/* Map Toggle Button */}
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setShowMap(!showMap);
            }}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border transition-all cursor-pointer shadow-xs ${
              showMap
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                : 'bg-[var(--input-bg)] text-[var(--text-secondary)] border-[var(--border-color)] hover:text-[var(--text-primary)]'
            }`}
          >
            {showMap ? <EyeOff className="w-3.5 h-3.5" /> : <MapIcon className="w-3.5 h-3.5" />}
            <span>{showMap ? 'إخفاء الخريطة' : 'إظهار الخريطة'}</span>
            {showMap ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Coordinates pill */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-2">
          <span className="text-[var(--text-muted)] text-[11px]">الإحداثيات المسجلة:</span>
          <span className="font-mono text-amber-600 dir-ltr font-bold text-xs bg-amber-500/10 px-2.5 py-0.5 rounded-md border border-amber-500/20">
            {lat.toFixed(6)}, {lng.toFixed(6)}
          </span>
        </div>
        <span className="text-[11px] text-[var(--text-muted)] font-medium">
          {showMap
            ? 'اسحب الخريطة أو الدبوس للتعديل اليدوي الدقيق'
            : 'اضغط "تحديد موقعي الحالي" للتحديد الفوري أو "إظهار الخريطة" للضبط اليدوي'}
        </span>
      </div>

      {autoFillNotice && (
        <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 p-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{autoFillNotice}</span>
        </div>
      )}

      {/* Collapsible Interactive Map */}
      {showMap && (
        <div className="animate-fade-in pt-1">
          <InteractiveMap
            mode="picker"
            lat={lat}
            lng={lng}
            onLocationSelect={(newLat, newLng, details) => {
              setLat(newLat);
              setLng(newLng);
              if (details) {
                if (details.governorate) setGovernorate(details.governorate);
                if (details.city) setCity(details.city);
                if (details.landmark) setLandmark(details.landmark);
                setAutoFillNotice(
                  `تم تحديد النطاق الجغرافي: ${details.governorate || 'الجيزة'} - ${
                    details.city || 'حدائق الأهرام'
                  }`
                );
                setTimeout(() => setAutoFillNotice(null), 5000);
              }
            }}
            heightClass="h-[280px]"
          />
        </div>
      )}
    </div>
  );
};
