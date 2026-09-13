import React from 'react';
import { Phone, MessageCircle, MapPin, Share2 } from 'lucide-react';
import { Business } from '../../types';

interface QuickActionBarProps {
  business: Business;
  compact?: boolean;
}

export const QuickActionBar: React.FC<QuickActionBarProps> = ({ business, compact = false }) => {
  const cleanPhone = (business.phone || '').replace(/\D/g, '');
  const cleanWhatsapp = ((business as any).whatsapp || business.phone || '').replace(/\D/g, '');

  const handleCall = () => {
    if (cleanPhone) {
      window.open(`tel:${cleanPhone}`, '_self');
    }
  };

  const handleWhatsapp = () => {
    if (cleanWhatsapp) {
      const waNumber = cleanWhatsapp.startsWith('0') ? `2${cleanWhatsapp}` : cleanWhatsapp;
      const text = encodeURIComponent(`مرحباً ${business.nameAr}، أتواصل معكم عبر منصة دليلك.`);
      window.open(`https://wa.me/${waNumber}?text=${text}`, '_blank');
    }
  };

  const handleLocation = () => {
    if (business.googleMapsUrl) {
      window.open(business.googleMapsUrl, '_blank');
    } else if (business.lat && business.lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${business.lat},${business.lng}`, '_blank');
    }
  };

  const handleShare = async () => {
    const shareUrl = business.customDirectoryUrl || (typeof window !== 'undefined' ? window.location.href : '');
    const shareData = {
      title: business.nameAr,
      text: `${business.nameAr} • ${business.category} على منصة دليلك`,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {}
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      alert('تم نسخ رابط المنشأة بنجاح!');
    } catch {}
  };

  return (
    <div className={`grid grid-cols-4 gap-2 ${compact ? 'mb-2' : 'mb-4'}`}>
      <button
        type="button"
        onClick={handleCall}
        className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 transition-all active:scale-95 cursor-pointer border border-blue-500/20 shadow-2xs"
      >
        <Phone className="w-4 h-4 mb-1" />
        <span className="text-[11px] font-bold">اتصال</span>
      </button>

      <button
        type="button"
        onClick={handleWhatsapp}
        className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 transition-all active:scale-95 cursor-pointer border border-emerald-500/20 shadow-2xs"
      >
        <MessageCircle className="w-4 h-4 mb-1" />
        <span className="text-[11px] font-bold">واتساب</span>
      </button>

      <button
        type="button"
        onClick={handleLocation}
        className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 transition-all active:scale-95 cursor-pointer border border-amber-500/20 shadow-2xs"
      >
        <MapPin className="w-4 h-4 mb-1" />
        <span className="text-[11px] font-bold">الموقع</span>
      </button>

      <button
        type="button"
        onClick={handleShare}
        className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 transition-all active:scale-95 cursor-pointer border border-purple-500/20 shadow-2xs"
      >
        <Share2 className="w-4 h-4 mb-1" />
        <span className="text-[11px] font-bold">مشاركة</span>
      </button>
    </div>
  );
};
