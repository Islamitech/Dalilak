import React from 'react';
import {
  MapPin,
  Star,
  ShieldCheck,
  X,
  ExternalLink,
  Navigation,
  MessageCircle,
  Phone,
} from 'lucide-react';
import { Business } from '../../types';
import {
  getBusinessMapDetails,
  getSmartWhatsAppUrl,
  getBusinessOpenStatus,
} from '../../utils/directoryEnhancements';

interface MapSelectedBusinessDrawerProps {
  business: Business;
  onClose: () => void;
  onSelectBusiness?: (biz: Business) => void;
  onEditBusiness?: (biz: Business) => void;
}

export const MapSelectedBusinessDrawer: React.FC<MapSelectedBusinessDrawerProps> = ({
  business,
  onClose,
  onSelectBusiness,
  onEditBusiness,
}) => {
  const { effectiveUrl, isOfficial } = getBusinessMapDetails(business);
  const smartWhatsAppUrl = getSmartWhatsAppUrl(business);
  const openStatus = getBusinessOpenStatus(business.workingHours);
  const phone = business.phone || business.ownerPhone || '';
  const photoUrl =
    business.coverPhoto ||
    (business.photos && business.photos.length > 0 ? business.photos[0] : null);

  const handleOpenDetails = () => {
    if (onSelectBusiness) {
      onSelectBusiness(business);
    } else if (onEditBusiness) {
      onEditBusiness(business);
    }
  };

  const isVerified = business.verificationStatus === 'verified';
  const rating = business.googleRating || (isVerified ? 4.8 : null);

  return (
    <div className="absolute bottom-3 right-3 left-3 sm:left-auto sm:w-[390px] z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-4 space-y-3 animate-fade-in font-['Tajawal',sans-serif]">
      {/* Top Header: Photo, Name, Category & Close */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={business.nameAr}
              className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0 shadow-2xs"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-slate-800 dark:to-slate-700 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xl shrink-0 shadow-2xs">
              🏢
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h4 className="font-extrabold text-slate-900 dark:text-white text-sm truncate">
              {business.nameAr}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
              {business.category}
            </p>
            <div className="flex items-center gap-1 mt-0.5 text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
              <MapPin className="w-3 h-3 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="truncate">
                {business.governorate} - {business.city}
                {business.street ? ` (${business.street})` : ''}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
          aria-label="إغلاق البطاقة"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Middle Badges Row: Verified Pill + Rating + Open Status */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          {isVerified && (
            <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800/60 font-bold text-[11px]">
              <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>موثق ومعتمد</span>
            </span>
          )}

          {rating && (
            <span className="flex items-center gap-1 text-slate-700 dark:text-slate-200 font-bold text-[11px] bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-800/60">
              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span>{typeof rating === 'number' ? rating.toFixed(1) : rating}</span>
            </span>
          )}

          <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium px-1.5 py-0.5 rounded bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className={`w-1.5 h-1.5 rounded-full ${openStatus.dotColor}`} />
            <span>{openStatus.isOpen ? 'مفتوح' : 'مغلق'}</span>
          </span>
        </div>
      </div>

      {/* Bottom Action Buttons: Image 2 Full Details Button + Quick Actions */}
      <div className="flex items-center gap-1.5 pt-1">
        {/* Main CTA: "عرض التفاصيل الكاملة" */}
        <button
          type="button"
          onClick={handleOpenDetails}
          className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm active:scale-98 cursor-pointer"
        >
          <span>عرض التفاصيل الكاملة</span>
          <ExternalLink className="w-3 h-3" />
        </button>

        {/* Quick Directions */}
        {effectiveUrl && (
          <a
            href={effectiveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`p-2 rounded-xl border text-center flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95 ${
              isOfficial
                ? 'bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                : 'bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
            }`}
            title="الملاحة والمسار على خرائط Google"
          >
            <Navigation className="w-3.5 h-3.5" />
          </a>
        )}

        {/* Quick WhatsApp */}
        {smartWhatsAppUrl && (
          <a
            href={smartWhatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 transition-colors active:scale-95 cursor-pointer shadow-2xs"
            title="محادثة واتساب مباشرة"
          >
            <MessageCircle className="w-3.5 h-3.5" />
          </a>
        )}

        {/* Quick Call */}
        {phone && (
          <a
            href={`tel:${phone}`}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors active:scale-95 cursor-pointer shadow-2xs"
            title="اتصال هاتفي مباشر"
          >
            <Phone className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
};
