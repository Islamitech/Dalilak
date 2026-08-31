import React, { useEffect } from 'react';
import { Business } from '../types';
import { VideoWatermarkBadge } from './VideoWatermarkBadge';
import { 
  X, 
  MapPin, 
  Phone, 
  MessageCircle, 
  Navigation, 
  Clock, 
  Sparkles,
  Share2,
  Film
} from 'lucide-react';

interface VideoPlayerModalProps {
  business: Business | null;
  videoUrl?: string;
  onClose: () => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  business,
  videoUrl,
  onClose,
}) => {
  useEffect(() => {
    if (!business) return;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [business, onClose]);

  if (!business) return null;

  const activeVideo = videoUrl || (business.videos && business.videos.length > 0 ? business.videos[0] : null);
  if (!activeVideo) return null;

  const isVerified = business.verificationStatus === 'verified' || business.googleSyncStatus === 'synced';

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `فيديو نشاط ${business.nameAr} على منصة دليلك`,
        text: `شاهد فيديو نشاط "${business.nameAr}" الموثق في ${business.governorate}:`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('تم نسخ رابط الصفحة بنجاح!');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[99999] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg bg-slate-900 border border-amber-500/40 rounded-3xl overflow-hidden shadow-2xl flex flex-col text-slate-100 my-auto animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950/80 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm text-white line-clamp-1 flex items-center gap-1.5">
                <span>{business.nameAr}</span>
                {isVerified && (
                  <span className="text-[9.5px] font-bold px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    ✓ موثق
                  </span>
                )}
              </h3>
              <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                <span>{business.governorate} • {business.city}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleShare}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="مشاركة"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
              aria-label="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Cinematic Video Player Container */}
        <div className="relative aspect-[9/13] max-h-[58vh] bg-black flex items-center justify-center overflow-hidden">
          <video
            src={activeVideo}
            controls
            autoPlay
            playsInline
            preload="metadata"
            className="w-full h-full object-contain"
          />

          {/* Official Brand Watermark Overlay */}
          <VideoWatermarkBadge position="bottom-right" />
        </div>

        {/* Video Bottom Summary & Fast Actions */}
        <div className="p-4 bg-slate-950/90 border-t border-white/10 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-xl font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>فيديو ميداني موثق (30 ثانية)</span>
            </span>

            {business.workingHours && (
              <span className="text-[10.5px] text-slate-400 font-medium flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-500" />
                <span>{business.workingHours}</span>
              </span>
            )}
          </div>

          {business.description && (
            <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed bg-slate-900/60 p-2.5 rounded-xl border border-white/5 font-medium">
              {business.description}
            </p>
          )}

          {/* Fast Contact Buttons */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {business.phone && (
              <a
                href={`tel:${business.phone}`}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer shadow-md"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>اتصال</span>
              </a>
            )}

            <a
              href={`https://wa.me/20${(business.phone || business.ownerPhone || '').replace(/\D/g, '').replace(/^0/, '')}?text=${encodeURIComponent(`مرحباً بك نشاط "${business.nameAr}"، رأيت الفيديو الخاص بكم على منصة دليلك.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/40 font-black text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>واتساب</span>
            </a>

            {business.googleMapsUrl && business.googleMapsUrl.trim().startsWith('http') ? (
              <a
                href={business.googleMapsUrl.trim()}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer shadow-md"
                title="الموقع موثق رسمياً: فتح على خرائط Google"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>الخريطة 🗺️</span>
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="bg-slate-800 text-slate-500 font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 border border-slate-700 cursor-not-allowed opacity-60"
                title="الموقع غير مدرج بعد على خرائط Google (قيد مراجعة وتوثيق الإدارة ⏳)"
              >
                <Navigation className="w-3.5 h-3.5 opacity-40" />
                <span>قيد التوثيق ⏳</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
