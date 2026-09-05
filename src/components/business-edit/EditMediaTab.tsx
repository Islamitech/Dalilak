import React from 'react';
import { Business } from '../../types';
import { UploadCloud, Film, Star, Check } from 'lucide-react';
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
  handleSetPrimaryPhoto?: (idx: number) => void;
  handleReorderPhoto?: (fromIndex: number, toIndex: number) => void;
  canEdit?: boolean;
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
  handleSetPrimaryPhoto,
  handleReorderPhoto,
  canEdit = true,
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
          {formData.photos.map((photo, idx) => {
            const isCover = formData.coverPhoto ? photo === formData.coverPhoto : idx === 0;

            return (
              <div
                key={idx}
                className={`relative group rounded-2xl overflow-hidden bg-slate-950 h-32 sm:h-36 transition-all duration-200 ${
                  isCover
                    ? 'border-2 border-amber-400 shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/30'
                    : 'border border-[var(--border-color)] shadow-sm hover:border-amber-500/50'
                }`}
              >
                <img
                  src={photo}
                  alt={`صورة ${idx + 1}`}
                  onClick={() => setSelectedPhotoPreview(photo)}
                  className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                />

                {/* Cover Photo Badge (Top-Left) */}
                {isCover ? (
                  <div className="absolute top-1.5 left-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 text-[9.5px] font-black px-2 py-0.5 rounded-lg shadow-sm flex items-center gap-1 z-10 pointer-events-none">
                    <Star className="w-3 h-3 fill-slate-950" />
                    <span>غلاف الدليل</span>
                  </div>
                ) : (
                  canEdit && handleReorderPhoto && formData.photos.length > 1 && (
                    <div className="absolute top-1.5 left-1.5 flex items-center gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReorderPhoto(idx, idx - 1);
                          }}
                          className="bg-slate-900/90 hover:bg-amber-500 hover:text-slate-950 text-white w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold border border-slate-700 cursor-pointer shadow-sm transition-transform active:scale-90"
                          title="تحريك لليمين (للأمام)"
                        >
                          ▶
                        </button>
                      )}
                      {idx < formData.photos.length - 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReorderPhoto(idx, idx + 1);
                          }}
                          className="bg-slate-900/90 hover:bg-amber-500 hover:text-slate-950 text-white w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold border border-slate-700 cursor-pointer shadow-sm transition-transform active:scale-90"
                          title="تحريك لليسار (للخلف)"
                        >
                          ◀
                        </button>
                      )}
                    </div>
                  )
                )}

                {/* Delete Photo Button (Top-Right) */}
                {canEdit && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemovePhoto(idx);
                    }}
                    className="absolute top-1.5 right-1.5 bg-rose-600/90 hover:bg-rose-700 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shadow cursor-pointer transition-transform active:scale-90 z-10"
                    title="حذف الصورة"
                  >
                    ✕
                  </button>
                )}

                {/* Bottom Cover Action / Indicator */}
                {isCover ? (
                  <div className="absolute bottom-1.5 inset-x-1.5 bg-slate-950/90 border border-amber-500/50 text-amber-400 text-[9.5px] font-black py-1 px-1.5 rounded-lg flex items-center justify-center gap-1 shadow backdrop-blur-xs z-10 pointer-events-none">
                    <Check className="w-3 h-3" />
                    <span>الصورة المعروضة بالدليل</span>
                  </div>
                ) : (
                  canEdit && handleSetPrimaryPhoto && (
                    <div className="absolute bottom-1.5 inset-x-1.5 z-10">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetPrimaryPhoto(idx);
                        }}
                        className="w-full bg-slate-950/85 hover:bg-amber-500 text-slate-200 hover:text-slate-950 border border-slate-700 hover:border-amber-400 text-[10px] font-black py-1 px-1.5 rounded-lg transition-all flex items-center justify-center gap-1 backdrop-blur-xs shadow-md cursor-pointer active:scale-95"
                        title="تعيين هذه الصورة لتظهر كغلاف رئيسي للنشاط في الدليل"
                      >
                        <Star className="w-3 h-3 text-amber-400" />
                        <span>تعيين كغلاف للدليل</span>
                      </button>
                    </div>
                  )
                )}
              </div>
            );
          })}
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
