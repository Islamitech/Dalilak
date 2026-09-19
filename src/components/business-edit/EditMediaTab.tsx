import React from 'react';
import { Business, AdminFollowUpCategory } from '../../types';
import {
  UploadCloud,
  Film,
  Star,
  Trash2,
  RotateCw,
  Zap,
  Loader2,
  ZoomIn,
  Image as ImageIcon,
} from 'lucide-react';

export interface EditMediaTabProps {
  formData: Business;
  handleChange?: (field: keyof Business, value: any) => void;
  setFormData?: React.Dispatch<React.SetStateAction<any>>;
  isUploadingPhotos?: boolean;
  isUploadingVideo?: boolean;
  isPullingGooglePhotos?: boolean;
  isRotatingGooglePhoto?: boolean;
  coverFitMode?: 'cover' | 'contain';
  setCoverFitMode?: (mode: 'cover' | 'contain') => void;
  setPreviewLightbox?: (url: string | null) => void;
  handlePhotoUpload?: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleVideoUpload?: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handlePullGooglePhotos?: () => Promise<void>;
  handleRotateGooglePhoto?: () => Promise<void>;
  handleSetCoverPhoto?: (photoUrl: string) => void;
  handleRemovePhoto?: (indexToRemove: number) => void;
  handleReorderPhoto?: (fromIndex: number, toIndex: number) => void;
  // Legacy optional props
  totalMediaCount?: number;
  isUploading?: boolean;
  setSelectedPhotoPreview?: (photo: string | null) => void;
  handleRemoveVideo?: (idx: number) => void;
  handleSetPrimaryPhoto?: (idx: number) => void;
  canEdit?: boolean;
  onSave?: (biz: Business) => void;
  currentUserName?: string;
  currentUserId?: string;
  userRole?: string;
  onOpenMasterDrawer?: (category?: AdminFollowUpCategory) => void;
  onShowNotification?: (msg: string) => void;
}

export const EditMediaTab: React.FC<EditMediaTabProps> = ({
  formData,
  handleChange: customHandleChange,
  setFormData,
  isUploadingPhotos = false,
  isUploadingVideo = false,
  isPullingGooglePhotos = false,
  isRotatingGooglePhoto = false,
  coverFitMode = 'cover',
  setCoverFitMode,
  setPreviewLightbox,
  handlePhotoUpload,
  handleVideoUpload,
  handlePullGooglePhotos,
  handleRotateGooglePhoto,
  handleSetCoverPhoto,
  handleRemovePhoto,
  handleReorderPhoto,
  setSelectedPhotoPreview,
}) => {
  const onChange = (field: keyof Business, value: any) => {
    if (customHandleChange) {
      customHandleChange(field, value);
    } else if (setFormData) {
      setFormData((prev: any) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const openLightbox = (url: string | null) => {
    if (setPreviewLightbox) setPreviewLightbox(url);
    else if (setSelectedPhotoPreview) setSelectedPhotoPreview(url);
  };

  return (
    <div className="space-y-4 text-right">
      {/* Media Action Toolbar */}
      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div>
          <h4 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
            <span>معرض صور وفيديوهات المنشأة</span>
            <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full font-mono">
              {formData.photos?.length || 0} صور
            </span>
          </h4>
          <p className="text-[10.5px] text-slate-500 mt-0.5">
            ارفع صور النشاط مباشرة من هاتفك، أو اختر الغلاف الذي يظهر على بطاقة المنشأة بالدليل
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {/* Upload Photos Button */}
          {handlePhotoUpload && (
            <label className="flex-1 sm:flex-none bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 text-xs font-bold py-2 px-3 rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs active:scale-95">
              {isUploadingPhotos ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <UploadCloud className="w-3.5 h-3.5" />
              )}
              <span>{isUploadingPhotos ? 'جاري الرفع...' : 'إضافة صور 📷'}</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={isUploadingPhotos}
              />
            </label>
          )}

          {/* Upload Video Button */}
          {handleVideoUpload && (
            <label className="flex-1 sm:flex-none bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold py-2 px-2.5 rounded-xl cursor-pointer flex items-center justify-center gap-1 shadow-2xs active:scale-95">
              {isUploadingVideo ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
              ) : (
                <Film className="w-3.5 h-3.5 text-amber-500" />
              )}
              <span>{isUploadingVideo ? 'جاري الرفع...' : 'فيديو قصير 🎥'}</span>
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                className="hidden"
                disabled={isUploadingVideo}
              />
            </label>
          )}

          {/* Pull Cover from Google Maps */}
          {Boolean(formData.googleMapsUrl && formData.googleMapsUrl.trim().length > 0) && handlePullGooglePhotos && (
            <button
              type="button"
              disabled={isPullingGooglePhotos || isRotatingGooglePhoto}
              onClick={handlePullGooglePhotos}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold py-2 px-2.5 rounded-xl cursor-pointer flex items-center justify-center gap-1 shadow-2xs active:scale-95"
              title="سحب صورة الغلاف من خرائط Google"
            >
              {isPullingGooglePhotos ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5" />
              )}
              <span>{isPullingGooglePhotos ? 'جاري السحب...' : 'سحب Google ⚡'}</span>
            </button>
          )}

          {/* Rotate Google Photos */}
          {Boolean(
            (formData.googleMapsUrl && formData.googleMapsUrl.trim().length > 0) ||
            formData.googlePlaceId
          ) && handleRotateGooglePhoto && (
            <button
              type="button"
              disabled={isRotatingGooglePhoto || isPullingGooglePhotos}
              onClick={handleRotateGooglePhoto}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold py-2 px-2.5 rounded-xl cursor-pointer flex items-center justify-center gap-1 shadow-2xs active:scale-95"
              title="تدوير وسحب صورة أخرى من خرائط Google"
            >
              {isRotatingGooglePhoto ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RotateCw className="w-3.5 h-3.5" />
              )}
              <span>{isRotatingGooglePhoto ? 'جاري التدوير...' : 'تدوير صورة 🔄'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Cover Card Display & Framing Controls */}
      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>صورة غلاف بطاقة النشاط بالدليل (Card Display & Framing)</span>
          </span>

          {/* Display Mode Toggle */}
          {setCoverFitMode && (
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-[11px] font-bold">
              <span className="text-slate-500 px-1">طريقة العرض:</span>
              <button
                type="button"
                onClick={() => setCoverFitMode('cover')}
                className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                  coverFitMode === 'cover'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                ملء الإطار (Cover)
              </button>
              <button
                type="button"
                onClick={() => setCoverFitMode('contain')}
                className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                  coverFitMode === 'contain'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                احتواء كامل (Contain)
              </button>
            </div>
          )}
        </div>

        {formData.coverPhoto ? (
          <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-300 h-44 sm:h-52 flex items-center justify-center group">
            <img
              src={formData.coverPhoto}
              alt="غلاف بطاقة المنشأة"
              className={`w-full h-full ${
                coverFitMode === 'cover' ? 'object-cover' : 'object-contain'
              } transition-transform group-hover:scale-[1.02] duration-300`}
            />
            <div className="absolute top-2 right-2 bg-amber-400 text-slate-950 font-black text-[10px] px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1">
              <Star className="w-3 h-3 fill-slate-950" />
              <span>الغلاف المعروض ببطاقة الدليل</span>
            </div>

            <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => openLightbox(formData.coverPhoto || null)}
                className="bg-slate-900/80 hover:bg-slate-900 text-white text-[11px] font-bold px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-sm backdrop-blur-xs cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5" />
                <span>معاينة مكبرة</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="h-32 rounded-2xl border-2 border-dashed border-slate-300 bg-white flex flex-col items-center justify-center text-slate-400 gap-1.5">
            <ImageIcon className="w-6 h-6 opacity-40" />
            <span className="text-xs font-bold">
              لم يتم تعيين صورة غلاف للبطاقة بعد. اختر صورة من المعرض أدناه أو ارفع صورة جديدة.
            </span>
          </div>
        )}

        {/* Direct URLs for cover & video tour */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <div>
            <label className="block text-slate-600 font-bold mb-1 text-[11px]">
              رابط صورة الغلاف المباشر (اختياري)
            </label>
            <input
              type="url"
              value={formData.coverPhoto || ''}
              onChange={(e) => onChange('coverPhoto', e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-mono text-xs focus:ring-2 focus:ring-indigo-500 dir-ltr text-right"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-bold mb-1 text-[11px]">
              رابط جولة الفيديو (YouTube / MP4)
            </label>
            <input
              type="url"
              placeholder="https://... أو رابط يوتيوب أو ملف فيديو"
              value={formData.videoTourUrl || ''}
              onChange={(e) => onChange('videoTourUrl', e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-mono text-xs focus:ring-2 focus:ring-indigo-500 dir-ltr text-right"
            />
          </div>
        </div>
      </div>

      {/* Photos Gallery: Reorder, Set Cover, Delete */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-800 text-xs">
            جميع صور النشاط المحفوظة ({formData.photos?.length || 0}) — اضغط على أي صورة لتحديدها كغلاف للبطاقة
          </span>
        </div>

        {formData.photos && formData.photos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
            {formData.photos.map((photo, idx) => {
              const isCover = formData.coverPhoto ? photo === formData.coverPhoto : idx === 0;

              return (
                <div
                  key={idx}
                  className={`relative group rounded-2xl overflow-hidden bg-slate-900 h-32 transition-all duration-200 ${
                    isCover
                      ? 'ring-3 ring-amber-400 border-2 border-amber-400 shadow-md'
                      : 'border border-slate-200 hover:border-amber-400'
                  }`}
                >
                  <img
                    src={photo}
                    alt={`صورة ${idx + 1}`}
                    onClick={() => openLightbox(photo)}
                    className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Cover Badge */}
                  {isCover ? (
                    <div className="absolute top-1.5 left-1.5 bg-amber-400 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-lg shadow-sm flex items-center gap-1 z-10 pointer-events-none">
                      <Star className="w-2.5 h-2.5 fill-slate-950" />
                      <span>غلاف البطاقة</span>
                    </div>
                  ) : (
                    /* Reorder controls */
                    handleReorderPhoto && (
                      <div className="absolute top-1.5 left-1.5 flex items-center gap-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReorderPhoto(idx, idx - 1);
                            }}
                            className="bg-slate-900/90 hover:bg-amber-500 hover:text-slate-950 text-white w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold cursor-pointer"
                            title="تحريك للأمام"
                          >
                            ▶
                          </button>
                        )}
                        {idx < formData.photos!.length - 1 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReorderPhoto(idx, idx + 1);
                            }}
                            className="bg-slate-900/90 hover:bg-amber-500 hover:text-slate-950 text-white w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold cursor-pointer"
                            title="تحريك للخلف"
                          >
                            ◀
                          </button>
                        )}
                      </div>
                    )
                  )}

                  {/* Delete Photo Button */}
                  {handleRemovePhoto && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemovePhoto(idx);
                      }}
                      className="absolute top-1.5 right-1.5 bg-rose-600/90 hover:bg-rose-700 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shadow cursor-pointer active:scale-90 z-10"
                      title="حذف الصورة"
                    >
                      ✕
                    </button>
                  )}

                  {/* Bottom Action: Set as Cover */}
                  {!isCover && handleSetCoverPhoto && (
                    <div className="absolute bottom-1.5 inset-x-1.5 z-10 opacity-90 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetCoverPhoto(photo);
                        }}
                        className="w-full bg-slate-900/80 hover:bg-amber-500 text-slate-100 hover:text-slate-950 border border-slate-700 hover:border-amber-400 text-[9.5px] font-black py-1 px-1 rounded-lg transition-all flex items-center justify-center gap-1 backdrop-blur-xs shadow cursor-pointer active:scale-95"
                        title="تعيين كغلاف لبطاقة المنشأة"
                      >
                        <Star className="w-2.5 h-2.5 text-amber-400" />
                        <span>تعيين كغلاف</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center text-slate-400 text-xs">
            لا توجد صور مضافة للمنشأة حتى الآن. اضغط على زر "إضافة صور 📷" بالأعلى لرفع صور من هاتفك.
          </div>
        )}
      </div>
    </div>
  );
};
