import React, { useState } from 'react';
import { Business } from '../types';
import { VideoWatermarkBadge } from './VideoWatermarkBadge';
import { BaseModal, Button, Badge } from './ui';
import { useWhatsAppAction } from '../hooks/useWhatsAppAction';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';
import { 
  MapPin, 
  Phone, 
  MessageCircle, 
  Navigation, 
  Clock, 
  Sparkles,
  Share2,
  Film,
  Check
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
  const { send } = useWhatsAppAction();
  const { copy, copied } = useCopyToClipboard();
  const [shareSuccess, setShareSuccess] = useState(false);

  if (!business) return null;

  const activeVideo = videoUrl || (business.videos && business.videos.length > 0 ? business.videos[0] : null);
  if (!activeVideo) return null;

  const isVerified = business.verificationStatus === 'verified' || business.googleSyncStatus === 'synced';

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `فيديو نشاط ${business.nameAr} على منصة دليلك`,
          text: `شاهد فيديو نشاط "${business.nameAr}" الموثق في ${business.governorate}:`,
          url: window.location.href,
        });
      } catch {
        // Ignored or dismissed share
      }
    } else {
      await copy(window.location.href);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    }
  };

  const handleWhatsApp = () => {
    const waPhone = business.phone || business.ownerPhone;
    if (!waPhone) return;
    send(
      waPhone,
      `مرحباً بك نشاط "${business.nameAr}"، رأيت الفيديو الخاص بكم على منصة دليلك.`
    );
  };

  const hasMapsUrl = Boolean(business.googleMapsUrl && business.googleMapsUrl.trim().startsWith('http'));

  const headerActions = (
    <div className="flex items-center gap-1.5">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleShare}
        icon={shareSuccess || copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
        title="مشاركة رابط الصفحة"
      >
        <span className="text-xs">{shareSuccess || copied ? 'تم النسخ' : ''}</span>
      </Button>
    </div>
  );

  return (
    <BaseModal
      isOpen={Boolean(business && activeVideo)}
      onClose={onClose}
      title={business.nameAr}
      subtitle={`${business.governorate} • ${business.city}`}
      icon={<Film className="w-5 h-5 text-amber-500" />}
      headerActions={headerActions}
      size="sm"
      bodyClassName="!p-0"
    >
      <div className="flex flex-col bg-slate-950 text-slate-100" dir="rtl">
        {/* Verification Status Bar */}
        {isVerified && (
          <div className="px-4 py-1.5 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between text-xs">
            <Badge variant="success" size="sm" dot>
              نشاط موثق رسمياً
            </Badge>
            {business.workingHours && (
              <span className="text-[10.5px] text-slate-400 font-medium flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-500" />
                <span>{business.workingHours}</span>
              </span>
            )}
          </div>
        )}

        {/* Cinematic Video Player Container */}
        <div className="relative aspect-[9/13] max-h-[55vh] bg-black flex items-center justify-center overflow-hidden">
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
        <div className="p-4 bg-slate-900/95 border-t border-white/10 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-xl font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>فيديو ميداني موثق (30 ثانية)</span>
            </span>

            {!isVerified && business.workingHours && (
              <span className="text-[10.5px] text-slate-400 font-medium flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-500" />
                <span>{business.workingHours}</span>
              </span>
            )}
          </div>

          {business.description && (
            <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed bg-slate-800/60 p-2.5 rounded-xl border border-white/5 font-medium">
              {business.description}
            </p>
          )}

          {/* Fast Contact Buttons */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {business.phone ? (
              <a
                href={`tel:${business.phone}`}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer shadow-md"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>اتصال</span>
              </a>
            ) : <div />}

            {(business.phone || business.ownerPhone) ? (
              <button
                type="button"
                onClick={handleWhatsApp}
                className="bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/40 font-black text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>واتساب</span>
              </button>
            ) : <div />}

            {hasMapsUrl ? (
              <a
                href={business.googleMapsUrl!.trim()}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-transform active:scale-95 cursor-pointer shadow-md"
                title="الموقع موثق رسمياً: فتح على خرائط Google"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>الخريطة</span>
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="bg-slate-800 text-slate-500 font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 border border-slate-700 cursor-not-allowed opacity-60"
                title="الموقع قيد المراجعة والتوثيق من قبل الإدارة"
              >
                <Navigation className="w-3.5 h-3.5 opacity-40" />
                <span>قيد التوثيق</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </BaseModal>
  );
};
