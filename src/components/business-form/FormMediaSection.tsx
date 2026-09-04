import React from 'react';
import { Camera, Loader2, UploadCloud } from 'lucide-react';

interface FormMediaSectionProps {
  photos: string[];
  setPhotos: React.Dispatch<React.SetStateAction<string[]>>;
  isUploadingPhoto: boolean;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const FormMediaSection: React.FC<FormMediaSectionProps> = ({
  photos,
  setPhotos,
  isUploadingPhoto,
  handleFileUpload,
}) => {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-4 sm:p-5 space-y-4 shadow-md transition-colors duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2 text-amber-500">
          <Camera className="w-5 h-5" />
          <h3 className="font-bold text-sm text-[var(--text-primary)]">
            4. صور النشاط المرفقة (اللوجو / اليافطة / الداخلي)
          </h3>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Direct Camera Capture */}
          <label className="flex-1 sm:flex-none bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 text-xs font-black px-3.5 py-2 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-transform active:scale-95 shadow-md">
            {isUploadingPhoto ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Camera className="w-4 h-4 stroke-[2.5]" />
            )}
            <span>{isUploadingPhoto ? 'جاري ضغط ومعالجة الصورة...' : '📸 التقاط كاميرا الهاتف'}</span>
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
            <span>📁 الاستوديو</span>
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
              "📸 التقاط كاميرا الهاتف"
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
