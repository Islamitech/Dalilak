import React, { useState } from 'react';
import {
  CheckCircle2,
  Film,
  Play,
  CloudUpload,
  Loader2,
  AlertCircle,
  X,
  FileText,
  Share2,
} from 'lucide-react';
import { Business } from '../../types';
import { VideoWatermarkBadge } from '../VideoWatermarkBadge';
import { GoogleMapsSyncModal } from '../GoogleMapsSyncModal';
import { validateAndProcessShortVideo } from '../../utils/videoProcessor';
import { uploadMediaToSupabaseStorage } from '../../services/storage';
import { updateBusinessInDb } from '../../services/db';

interface BusinessFormSubmittedSuccessProps {
  submittedBusiness: Business;
  onShowInvoice: (biz: Business) => void;
  onSubmitBusiness: (biz: Business) => void;
  setSubmittedBusiness: React.Dispatch<React.SetStateAction<Business | null>>;
  resetForm: () => void;
}

export const BusinessFormSubmittedSuccess: React.FC<BusinessFormSubmittedSuccessProps> = ({
  submittedBusiness,
  onShowInvoice,
  onSubmitBusiness,
  setSubmittedBusiness,
  resetForm,
}) => {
  const [showMapsSyncModal, setShowMapsSyncModal] = useState<boolean>(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState<boolean>(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  // Post-Registration Short Video upload handler (Direct Supabase Storage Stream)
  const handlePostRegistrationVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    setVideoError(null);
    if (files && files.length > 0) {
      setIsUploadingVideo(true);
      const newVideos: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const validation = await validateAndProcessShortVideo(file, 30.5);
          if (!validation.valid) {
            setVideoError(validation.error || 'الملف غير صالح أو يتجاوز 30 ثانية.');
            continue;
          }

          const publicVideoUrl = await uploadMediaToSupabaseStorage(file, 'videos');
          if (publicVideoUrl && (publicVideoUrl.startsWith('http://') || publicVideoUrl.startsWith('https://'))) {
            newVideos.push(publicVideoUrl);
          } else {
            setVideoError('تعذر رفع الفيديو سحابياً لضعف شبكة الإنترنت. يرجى إعادة المحاولة.');
          }
        } catch (err) {
          console.warn('Post-registration video upload error:', err);
          setVideoError('تعذر معالجة ملف الفيديو.');
        }
      }

      if (newVideos.length > 0) {
        const currentVideos = Array.isArray(submittedBusiness.videos) ? submittedBusiness.videos : [];
        const updatedVideos = [...currentVideos, ...newVideos];
        const updatedBusiness: Business = { ...submittedBusiness, videos: updatedVideos };
        setSubmittedBusiness(updatedBusiness);
        onSubmitBusiness(updatedBusiness);
        await updateBusinessInDb(submittedBusiness.id, { videos: updatedVideos });
      }

      e.target.value = '';
      setIsUploadingVideo(false);
    }
  };

  const handleRemoveSubmittedVideo = async (indexToRemove: number) => {
    const currentVideos = Array.isArray(submittedBusiness.videos) ? submittedBusiness.videos : [];
    const updatedVideos = currentVideos.filter((_, idx) => idx !== indexToRemove);
    const updatedBusiness: Business = { ...submittedBusiness, videos: updatedVideos };
    setSubmittedBusiness(updatedBusiness);
    onSubmitBusiness(updatedBusiness);
    await updateBusinessInDb(submittedBusiness.id, { videos: updatedVideos });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in text-right">
      {/* Success Header */}
      <div className="bg-emerald-500/10 border-2 border-emerald-500/40 p-6 rounded-3xl text-center space-y-3">
        <div className="w-16 h-16 bg-emerald-500 text-slate-950 rounded-2xl flex items-center justify-center mx-auto shadow-lg">
          <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
        </div>
        <h2 className="text-xl font-black text-emerald-400">تم تسجيل النشاط بنجاح!</h2>
        <p className="text-xs text-[var(--text-secondary)] font-medium max-w-md mx-auto leading-relaxed">
          تم حفظ بيانات منشأة <span className="font-bold text-[var(--text-primary)] px-1">{submittedBusiness.nameAr}</span> بأمان في المنظومة وإصدار الفاتورة الإلكترونية المعتمدة.
        </p>
      </div>

      {/* ── 🎥 POST-REGISTRATION SHORT VIDEO ATTACHMENT SECTION ── */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-5 rounded-3xl space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <div className="flex items-center gap-2 text-amber-500">
            <Film className="w-5 h-5" />
            <h3 className="font-black text-sm text-[var(--text-primary)]">فيديوهات النشاط التوثيقية المعتمدة</h3>
          </div>
          <div className="flex items-center gap-2">
            <VideoWatermarkBadge className="scale-90 origin-right" />
            <span className="text-[10px] font-bold bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20">
              {(submittedBusiness.videos?.length || 0)} فيديو
            </span>
          </div>
        </div>

        <div className="text-xs text-[var(--text-secondary)] space-y-1 leading-relaxed">
          <p className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
            <span>📹 إرفاق فيديو توثيقي للنشاط (أقل من 30 ثانية):</span>
          </p>
          <p className="text-[11px]">
            يتم رفع الفيديو وتخزينه سحابياً وتطبيق الشعار المائي لمنظومة دليلك لحماية حقوق الملكية والتوثيق الميداني.
          </p>
        </div>

        {/* Upload Button */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <label className={`flex-1 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border-2 border-dashed border-amber-500/40 hover:border-amber-500 bg-amber-500/5 hover:bg-amber-500/10 text-amber-400 font-bold text-xs cursor-pointer transition-all ${isUploadingVideo ? 'opacity-50 pointer-events-none' : ''}`}>
            {isUploadingVideo ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                <span>جاري معالجة ورفع الفيديو سحابياً...</span>
              </>
            ) : (
              <>
                <CloudUpload className="w-5 h-5" />
                <span>إضافة فيديو توثيقي من الجهاز</span>
              </>
            )}
            <input
              type="file"
              accept="video/*"
              multiple
              className="hidden"
              disabled={isUploadingVideo}
              onChange={handlePostRegistrationVideoUpload}
            />
          </label>
        </div>

        {videoError && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{videoError}</span>
          </div>
        )}

        {/* Attached Videos List with Player Preview */}
        {submittedBusiness.videos && submittedBusiness.videos.length > 0 && (
          <div className="space-y-3 pt-2">
            {submittedBusiness.videos.map((vid, idx) => (
              <div
                key={idx}
                className="bg-[var(--input-bg)] border border-[var(--border-color)] rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Play className="w-5 h-5 fill-amber-400" />
                  </div>
                  <div className="text-right flex-1 sm:flex-none">
                    <div className="font-bold text-xs text-[var(--text-primary)]">فيديو توثيقي معتمد #{idx + 1}</div>
                    <div className="text-[10px] text-emerald-400 font-bold">✓ تم الحفظ والتطبيق المائي بنجاح</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <a
                    href={vid}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>معاينة وتنزيل</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubmittedVideo(idx)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="حذف الفيديو"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onShowInvoice(submittedBusiness)}
          className="flex items-center justify-center gap-2 py-3.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <FileText className="w-4 h-4 stroke-[2.5]" />
          <span>عرض وتحميل الفاتورة الإلكترونية</span>
        </button>

        <button
          type="button"
          onClick={() => setShowMapsSyncModal(true)}
          className="flex items-center justify-center gap-2 py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <Share2 className="w-4 h-4 stroke-[2.5]" />
          <span>مزامنة وإرسال كود Google Maps</span>
        </button>
      </div>

      {/* Reset & Add Another Business Button */}
      <button
        type="button"
        onClick={resetForm}
        className="w-full py-3 px-4 bg-[var(--input-bg)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold text-xs rounded-2xl border border-[var(--border-color)] transition-all cursor-pointer"
      >
        تسجيل نشاط تجاري جديد آخر ➕
      </button>

      {/* Google Maps Sync Modal */}
      <GoogleMapsSyncModal
        isOpen={showMapsSyncModal}
        onClose={() => setShowMapsSyncModal(false)}
        business={submittedBusiness}
        onUpdateBusiness={(updated) => {
          setSubmittedBusiness(updated);
          onSubmitBusiness(updated);
        }}
      />
    </div>
  );
};
