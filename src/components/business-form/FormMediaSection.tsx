import React, { useState } from 'react';
import { Camera, Loader2, UploadCloud, Zap } from 'lucide-react';
import { PhotoWatermarkBadge } from '../PhotoWatermarkBadge';
import { extractGooglePlaceData } from '../../utils/googlePlaceExtractor';
import { triggerHaptic } from '../../utils/haptics';

interface FormMediaSectionProps {
  photos: string[];
  setPhotos: React.Dispatch<React.SetStateAction<string[]>>;
  isUploadingPhoto: boolean;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  googleMapsUrl?: string;
}

export const FormMediaSection: React.FC<FormMediaSectionProps> = ({
  photos,
  setPhotos,
  isUploadingPhoto,
  handleFileUpload,
  googleMapsUrl,
}) => {
  const [isPullingGooglePhotos, setIsPullingGooglePhotos] = useState<boolean>(false);
  const [pullNotice, setPullNotice] = useState<string | null>(null);

  const handlePullGooglePhotos = async () => {
    if (!googleMapsUrl?.trim()) {
      alert('يرجى كتابة أو لصق رابط خرائط Google في قسم الموقع أولاً');
      return;
    }
    triggerHaptic('medium');
    setIsPullingGooglePhotos(true);
    setPullNotice('جاري سحب الصور من خرائط Google...');

    try {
      const data = await extractGooglePlaceData(googleMapsUrl);
      const rawIncoming = (data && data.photos && data.photos.length > 0)
        ? data.photos
        : (data && data.photo ? [data.photo] : []);
      const incomingPhotos = rawIncoming.slice(0, 5);

      if (incomingPhotos.length > 0) {
        setPhotos((prev) => Array.from(new Set([...prev, ...incomingPhotos])).slice(0, 10));
        setPullNotice(`✅ تم سحب أول ${incomingPhotos.length} صور من خرائط Google وإضافتها للمعرض!`);
        setTimeout(() => setPullNotice(null), 5000);
      } else {
        setPullNotice('⚠️ لم يتم العثور على صور إضافية على رابط خرائط Google');
        setTimeout(() => setPullNotice(null), 4000);
      }
    } catch {
      setPullNotice('⚠️ حدث خطأ أثناء الاتصال بمحرك استخراج الصور');
      setTimeout(() => setPullNotice(null), 4000);
    } finally {
      setIsPullingGooglePhotos(false);
    }
  };

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-4 sm:p-5 space-y-4 shadow-md transition-colors duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2 text-amber-500">
          <Camera className="w-5 h-5" />
          <h3 className="font-bold text-sm text-[var(--text-primary)]">
            4. صور النشاط المرفقة (اللوجو / اليافطة / الداخلي)
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Pull Photos from Google Maps */}
          {Boolean(googleMapsUrl && googleMapsUrl.trim().length > 0) && (
            <button
              type="button"
              disabled={isPullingGooglePhotos}
              onClick={handlePullGooglePhotos}
              className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-black px-3.5 py-2 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-transform active:scale-95 shadow-md"
            >
              {isPullingGooglePhotos ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              <span>{isPullingGooglePhotos ? 'جاري السحب...' : 'سحب صور Google ⚡'}</span>
            </button>
          )}

          {/* Direct Camera Capture */}
          <label className="flex-1 sm:flex-none bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 text-xs font-black px-3.5 py-2 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-transform active:scale-95 shadow-md">
            {isUploadingPhoto ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Camera className="w-4 h-4 stroke-[2.5]" />
            )}
            <span>{isUploadingPhoto ? 'جاري معالجة الصورة...' : 'التقاط بكاميرا الهاتف'}</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {/* Gallery Upload */}
          <label className="flex-1 sm:flex-none bg-[var(--input-bg)] hover:bg-amber-500/10 text-[var(--text-primary)] border border-[var(--border-color)] text-xs font-bold px-3 py-2 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-colors shadow-sm">
            <UploadCloud className="w-4 h-4 text-amber-500" />
            <span>معرض الصور</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {pullNotice && (
        <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-900 dark:text-blue-200 border border-blue-500/30 text-xs font-bold flex items-center gap-2 animate-fade-in">
          {isPullingGooglePhotos && <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500 shrink-0" />}
          <span>{pullNotice}</span>
        </div>
      )}

      {photos.length === 0 ? (
        <div className="border-2 border-dashed border-[var(--border-color)] rounded-2xl p-6 text-center space-y-2 bg-[var(--input-bg)]/50">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
            <Camera className="w-6 h-6" />
          </div>
          <h4 className="font-black text-sm text-[var(--text-primary)]">
            لم يتم التقاط صور حقيقية للنشاط بعد
          </h4>
          <p className="text-xs text-[var(--text-secondary)] font-bold max-w-md mx-auto">
            اضغط على زر{' '}
            <strong className="text-amber-600 dark:text-amber-400">
              "التقاط بكاميرا الهاتف"
            </strong>{' '}
            لفتح كاميرا الجوال مباشرة وتصوير واجهة المحل أو اليافطة ميدانياً!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {photos.map((photo, i) => (
            <div
              key={i}
              className="relative group rounded-xl overflow-hidden border border-[var(--border-color)] bg-slate-950 h-28 shadow-sm"
            >
              <img
                src={photo}
                alt={`صورة النشاط ${i + 1}`}
                className="w-full h-full object-cover"
              />
              <PhotoWatermarkBadge position="bottom-right" className="scale-75 origin-bottom-right" />
              <button
                type="button"
                onClick={() => setPhotos(photos.filter((_, idx) => idx !== i))}
                className="absolute top-1 right-1 bg-rose-600 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold shadow cursor-pointer transition-transform active:scale-95"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
