import React from 'react';
import { Phone, MessageCircle, MapPin, Share2 } from 'lucide-react';
import { Business } from '../../types';

interface QuickActionBarProps {
  business: Business;
  compact?: boolean;
}

export const QuickActionBar: React.FC<QuickActionBarProps> = ({ business, compact = false }) => {
  const formatPhone = (phone: string) => {
    let clean = (phone || '').replace(/\D/g, '');
    if (clean.startsWith('0')) {
      clean = '2' + clean;
    } else if (!clean.startsWith('20') && clean.length === 10) {
      clean = '20' + clean;
    }
    return clean;
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const phone = formatPhone(business.phone || business.secondaryPhone || '');
    if (!phone) {
      alert('لا يتوفر رقم هاتف مسجل لهذا النشاط');
      return;
    }
    const msg = encodeURIComponent(
      `مرحباً، أود الاستفسار عن خدمات «${business.nameAr}» عبر منصة دليلك (رقم المنشأة: ${business.id})`
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!business.phone) {
      alert('لا يتوفر رقم هاتف للاتصال');
      return;
    }
    window.location.href = `tel:${business.phone}`;
  };

  const handleDirections = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (business.googleMapsUrl) {
      window.open(business.googleMapsUrl, '_blank');
    } else if (business.lat && business.lng) {
      window.open(`https://maps.google.com/?q=${business.lat},${business.lng}`, '_blank');
    } else {
      alert('لم يتم تحديد إحداثيات موقع هذا النشاط على الخريطة');
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = business.customDirectoryUrl || `${window.location.origin}/?biz=${business.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: business.nameAr,
          text: `اكتشف ${business.nameAr} في ${business.governorate} على دليلك`,
          url: shareUrl,
        });
      } catch {
        // Ignored or cancelled
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('تم نسخ رابط المنشأة بنجاح!');
    }
  };

  const btnClass = compact
    ? 'p-2 rounded-xl text-[var(--text-muted)] hover:text-amber-500 hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer'
    : 'flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer';

  return (
    <div className={`flex items-center ${compact ? 'gap-1' : 'gap-2 w-full pt-3 border-t border-[var(--border-color)]'}`}>
      {/* Call */}
      <button
        onClick={handleCall}
        title="اتصال هاتفي"
        className={`${btnClass} ${!compact ? 'bg-[var(--input-bg)] text-[var(--text-primary)] border-[var(--border-color)] hover:bg-blue-500/10 hover:text-blue-500' : ''}`}
      >
        <Phone className="w-3.5 h-3.5 text-blue-500" />
        {!compact && <span>اتصال</span>}
      </button>

      {/* WhatsApp */}
      <button
        onClick={handleWhatsApp}
        title="محادثة واتساب"
        className={`${btnClass} ${!compact ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20' : ''}`}
      >
        <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
        {!compact && <span>واتساب</span>}
      </button>

      {/* Directions */}
      <button
        onClick={handleDirections}
        title="الموقع على الخريطة"
        className={`${btnClass} ${!compact ? 'bg-[var(--input-bg)] text-[var(--text-primary)] border-[var(--border-color)] hover:bg-rose-500/10 hover:text-rose-500' : ''}`}
      >
        <MapPin className="w-3.5 h-3.5 text-rose-500" />
        {!compact && <span>الموقع</span>}
      </button>

      {/* Share */}
      <button
        onClick={handleShare}
        title="مشاركة"
        className={`${btnClass} ${!compact ? 'bg-[var(--input-bg)] text-[var(--text-muted)] border-[var(--border-color)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]' : ''}`}
      >
        <Share2 className="w-3.5 h-3.5 text-[var(--text-muted)]" />
        {!compact && <span>مشاركة</span>}
      </button>
    </div>
  );
};
