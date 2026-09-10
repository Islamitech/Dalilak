import React from 'react';
import { Phone, Eye, ExternalLink, Navigation, MessageCircle } from 'lucide-react';
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

  return (
    <div className="absolute bottom-2.5 sm:bottom-3 left-2.5 sm:left-3 right-2.5 sm:right-3 bg-slate-950/95 border-2 border-amber-500/50 p-3 sm:p-4 rounded-2xl sm:rounded-3xl shadow-2xl backdrop-blur-xl z-30 flex flex-col gap-2.5 animate-fade-in-scale">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt={business.nameAr}
              className="w-12 h-12 rounded-xl object-cover border border-amber-500/30 shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-slate-900 border border-amber-500/30 flex items-center justify-center text-xl shrink-0">
              🏢
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="bg-amber-500/20 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-500/40">
                {business.category}
              </span>
              <span
                className={`text-[9.5px] font-black px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                  business.verificationStatus === 'verified'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${openStatus.dotColor}`} />
                <span>{openStatus.isOpen ? 'مفتوح' : 'مغلق'}</span>
              </span>
              <span
                className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded-full border ${
                  business.verificationStatus === 'verified'
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}
              >
                {business.verificationStatus === 'verified' ? 'معتمد 🟢' : 'قيد المراجعة ⏳'}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-white truncate mt-0.5">
              {business.nameAr}
            </h3>
            <p className="text-[11px] text-slate-300 font-medium truncate">
              {business.governorate} • {business.city} {business.street ? `(${business.street})` : ''}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-white text-xs font-black w-7 h-7 bg-slate-800 hover:bg-slate-700 rounded-full flex items-center justify-center cursor-pointer transition-colors shrink-0"
          aria-label="إغلاق البطاقة"
        >
          ✕
        </button>
      </div>

      {/* Direct 4-Action Button Grid */}
      <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-slate-800 text-xs font-black">
        {/* 1. Directions */}
        {effectiveUrl ? (
          <a
            href={effectiveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`py-2 px-1 rounded-xl text-center flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95 ${
              isOfficial
                ? 'bg-blue-500/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30'
                : 'bg-emerald-500/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30'
            }`}
            title="فتح الاتجاهات على خرائط Google"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span className="text-[11px]">اتجاهات</span>
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="py-2 px-1 rounded-xl bg-slate-900 text-slate-500 text-center flex items-center justify-center gap-1 opacity-50"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span className="text-[11px]">اتجاهات</span>
          </button>
        )}

        {/* 2. WhatsApp */}
        {smartWhatsAppUrl ? (
          <a
            href={smartWhatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2 px-1 rounded-xl bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 text-center flex items-center justify-center gap-1 transition-colors active:scale-95 cursor-pointer"
            title="محادثة واتساب مباشرة"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span className="text-[11px]">واتساب</span>
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="py-2 px-1 rounded-xl bg-slate-900 text-slate-500 text-center flex items-center justify-center gap-1 opacity-50"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span className="text-[11px]">واتساب</span>
          </button>
        )}

        {/* 3. Phone Call */}
        {phone ? (
          <a
            href={`tel:${phone}`}
            className="py-2 px-1 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/30 text-center flex items-center justify-center gap-1 transition-colors active:scale-95 cursor-pointer"
            title="اتصال هاتفي مباشر"
          >
            <Phone className="w-3.5 h-3.5" />
            <span className="text-[11px]">اتصال</span>
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="py-2 px-1 rounded-xl bg-slate-900 text-slate-500 text-center flex items-center justify-center gap-1 opacity-50"
          >
            <Phone className="w-3.5 h-3.5" />
            <span className="text-[11px]">اتصال</span>
          </button>
        )}

        {/* 4. Full Details / Edit Modal */}
        <button
          type="button"
          onClick={handleOpenDetails}
          className="py-2 px-1 rounded-xl bg-amber-500 hover:bg-yellow-400 text-slate-950 text-center flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow"
          title="عرض كامل التفاصيل في نافذة مخصصة"
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="text-[11px]">تفاصيل</span>
        </button>
      </div>
    </div>
  );
};
