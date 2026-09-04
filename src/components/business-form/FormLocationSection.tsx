import React from 'react';
import { InteractiveMap } from '../InteractiveMap';
import { triggerHaptic } from '../../utils/haptics';
import {
  MapPin,
  Loader2,
  Navigation,
  EyeOff,
  Map as MapIcon,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
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
}) => {
  if (registrationType === 'already_on_google') {
    return (
      <div className="bg-gradient-to-br from-blue-500/10 via-[var(--bg-card)] to-indigo-500/10 border-2 border-blue-500/50 rounded-3xl p-4 sm:p-5 space-y-3.5 shadow-md text-right animate-fade-in">
        <div className="flex items-center gap-2 text-blue-500 pb-2 border-b border-[var(--border-color)]">
          <MapPin className="w-5 h-5" />
          <h3 className="font-bold text-sm text-[var(--text-primary)]">
            2. رابط موقع النشاط على خرائط Google (الموقع القائم المعتمد) *
          </h3>
        </div>

        <div>
          <label className="block text-xs font-black text-[var(--text-primary)] mb-1.5">
            ادخل أو الصق الرابط الدقيق للنشاط من خرائط Google (Google Maps Link) *:
          </label>
          <input
            type="url"
            placeholder="مثال: https://maps.app.goo.gl/xxxxxx أو https://www.google.com/maps/place/..."
            value={alreadyGoogleMapsUrl}
            onChange={(e) => {
              const val = e.target.value;
              setAlreadyGoogleMapsUrl(val);
              const match =
                val.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || val.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/);
              if (match) {
                setLat(parseFloat(match[1]));
                setLng(parseFloat(match[2]));
              }
            }}
            className="w-full bg-[var(--input-bg)] border-2 border-blue-500 text-[var(--text-primary)] font-bold text-xs sm:text-sm rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dir-ltr text-right placeholder:text-slate-400 shadow-sm"
            required
          />
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3 text-[11px] text-[var(--text-secondary)] font-bold flex items-start gap-2">
          <span className="text-blue-500 text-sm shrink-0">📍</span>
          <span>
            <strong>طبيعة هذا التسجيل:</strong> هذا النشاط مسجل ومفعل بالفعل على خرائط Google في
            الشارع، لذا لا يتطلب تحديد موقع ميداني جديد أو إظهار خريطة، ويكتفى فقط بلصق رابطه
            الدقيق لإدراجه وتوثيقه فورياً بالمنظومة.
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
            <span>{isLocating ? 'جاري تحديد موقعك...' : '📍 تحديد موقعي الحالي'}</span>
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
          <span className="font-mono text-amber-600 dark:text-amber-400 dir-ltr font-bold text-xs bg-amber-500/10 px-2.5 py-0.5 rounded-md border border-amber-500/20">
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
        <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-600 dark:text-emerald-300 p-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in">
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
                  `✨ تم تحديد النطاق الجغرافي: ${details.governorate || 'الجيزة'} - ${
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
