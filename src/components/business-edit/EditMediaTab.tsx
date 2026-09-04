import React from 'react';
import { Business } from '../../types';
import { UploadCloud, Film } from 'lucide-react';
import { VideoWatermarkBadge } from '../VideoWatermarkBadge';

interface EditMediaTabProps {
  formData: Business;
  totalMediaCount: number;
  isUploading: boolean;
  isUploadingVideo: boolean;
  handlePhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleVideoUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleRemovePhoto: (idx: number) => void;
  handleRemoveVideo: (idx: number) => void;
  setSelectedPhotoPreview: (photo: string | null) => void;
}

export const EditMediaTab: React.FC<EditMediaTabProps> = ({
  formData,
  totalMediaCount,
  isUploading,
  isUploadingVideo,
  handlePhotoUpload,
  handleVideoUpload,
  handleRemovePhoto,
  handleRemoveVideo,
  setSelectedPhotoPreview,
}) => {
  return (
    <div className="space-y-3.5 text-right">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[var(--input-bg)] p-3 rounded-2xl border border-[var(--border-color)]">
        <div>
          <h4 className="font-black text-xs sm:text-sm text-[var(--text-primary)]">
            معرض صور وفيديوهات النشاط ({totalMediaCount})
          </h4>
          <p className="text-[10.5px] text-[var(--text-muted)] font-bold mt-0.5">
            الصور موثقة بعلامة دليلك المائية الرسمية
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="flex-1 sm:flex-none bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 text-xs font-black py-2 px-3 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-95">
            <UploadCloud className="w-4 h-4" />
            <span>{isUploading ? 'جاري الرفع...' : 'إضافة صور'}</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              className="hidden"
              disabled={isUploading}
            />
          </label>

          <label className="flex-1 sm:flex-none bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-bold py-2 px-3 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs hover:bg-amber-500/10">
            <Film className="w-4 h-4 text-amber-500" />
            <span>{isUploadingVideo ? 'جاري رفع الفيديو...' : 'فيديو قصير'}</span>
            <input
              type="file"
              accept="video/*"
              capture="environment"
              onChange={handleVideoUpload}
              className="hidden"
              disabled={isUploadingVideo}
            />
          </label>
        </div>
      </div>

      {/* Photos Grid */}
      {formData.photos && formData.photos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {formData.photos.map((photo, idx) => (
            <div
              key={idx}
              className="relative group rounded-2xl overflow-hidden border border-[var(--border-color)] bg-slate-950 h-28 sm:h-32 shadow-sm"
            >
              <img
                src={photo}
                alt={`صورة ${idx + 1}`}
                onClick={() => setSelectedPhotoPreview(photo)}
                className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
              />
              <button
                type="button"
                onClick={() => handleRemovePhoto(idx)}
                className="absolute top-1.5 right-1.5 bg-rose-600/90 hover:bg-rose-700 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shadow cursor-pointer transition-transform active:scale-90"
                title="حذف الصورة"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-[var(--border-color)] rounded-2xl p-6 text-center text-xs text-[var(--text-muted)] font-bold">
          لم يتم رفع صور لهذا النشاط بعد.
        </div>
      )}

      {/* Videos Grid */}
      {formData.videos && formData.videos.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-[var(--border-color)]">
          <h5 className="font-black text-xs text-[var(--text-primary)]">الفيديوهات الترويجية:</h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {formData.videos.map((vid, idx) => (
              <div
                key={idx}
                className="relative rounded-2xl overflow-hidden border border-[var(--border-color)] bg-slate-950 shadow-md"
              >
                <video
                  src={vid}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full h-40 object-cover bg-black"
                />
                <VideoWatermarkBadge position="bottom-right" />
                <button
                  type="button"
                  onClick={() => handleRemoveVideo(idx)}
                  className="absolute top-2 right-2 bg-rose-600 hover:bg-rose-700 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shadow cursor-pointer"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
