import React from 'react';
import { Navigation, MessageCircle, Phone, Eye } from 'lucide-react';
import { Business } from '../../types';
import {
  getBusinessMapDetails,
  getSmartWhatsAppUrl,
  getBusinessOpenStatus,
} from '../../utils/directoryEnhancements';

export interface MapSelectedBusinessDrawerProps {
  selectedBiz: Business | null;
  setSelectedBiz: (biz: Business | null) => void;
  onSelectBusiness?: (biz: Business) => void;
  onStartNavigation?: (biz: Business) => void;
}

export const MapSelectedBusinessDrawer: React.FC<MapSelectedBusinessDrawerProps> = ({
  selectedBiz,
  setSelectedBiz,
  onSelectBusiness,
  onStartNavigation,
}) => {
  if (!selectedBiz) return null;

  const { effectiveUrl, isOfficial } = getBusinessMapDetails(selectedBiz);
  const smartWhatsAppUrl = getSmartWhatsAppUrl(selectedBiz);
  const openStatus = getBusinessOpenStatus(selectedBiz.workingHours);
  const phone = selectedBiz.phone || selectedBiz.ownerPhone;
  const photoUrl =
    selectedBiz.coverPhoto ||
    (selectedBiz.photos && selectedBiz.photos.length > 0
      ? selectedBiz.photos[0]
      : `/api/biz-og?biz=${selectedBiz.id}`);

  return (
    <div className="absolute bottom-2.5 sm:bottom-4 left-2.5 sm:left-4 right-2.5 sm:right-4 max-w-2xl mx-auto bg-white border-2 border-slate-200/90 p-3 sm:p-4 rounded-2xl sm:rounded-3xl shadow-2xl z-[1100] flex flex-col gap-2.5 animate-fade-in-scale text-slate-900 select-none font-['Cairo',sans-serif]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <img
            src={photoUrl}
            alt={selectedBiz.nameAr}
            className="w-12 h-12 rounded-xl object-cover border border-amber-200 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="bg-amber-50 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-200/80">
                {selectedBiz.category}
              </span>
              <span
                className={`text-[9.5px] font-black px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                  selectedBiz.verificationStatus === 'verified'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${openStatus.dotColor}`} />
                <span>{openStatus.isOpen ? 'مفتوح' : 'مغلق'}</span>
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-black text-slate-900 truncate mt-0.5">
              {selectedBiz.nameAr}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium truncate">
              {selectedBiz.governorate} • {selectedBiz.city} {selectedBiz.street ? `(${selectedBiz.street})` : ''}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setSelectedBiz(null)}
          className="text-slate-400 hover:text-slate-700 text-xs font-black w-7 h-7 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center cursor-pointer transition-colors shrink-0"
          aria-label="إغلاق البطاقة"
        >
          ✕
        </button>
      </div>

      {/* Direct Seeker Action Buttons */}
      <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-slate-100 text-xs font-black">
        {/* Directions */}
        {onStartNavigation ? (
          <button
            type="button"
            onClick={() => onStartNavigation(selectedBiz)}
            className="py-2 px-1 rounded-xl text-center flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black border border-amber-400"
            title="بدء التوجيه والملاحة إلى هذا النشاط"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span className="text-[11px]">ملاحة</span>
          </button>
        ) : effectiveUrl ? (
          <a
            href={effectiveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2 px-1 rounded-xl text-center flex items-center justify-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
            title="فتح الاتجاهات على خرائط Google"
          >
            <Navigation className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-[11px]">اتجاهات</span>
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="py-2 px-1 rounded-xl bg-slate-50 text-slate-400 text-center flex items-center justify-center gap-1 opacity-50"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span className="text-[11px]">اتجاهات</span>
          </button>
        )}

        {/* WhatsApp */}
        {phone ? (
          <a
            href={smartWhatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2 px-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-center flex items-center justify-center gap-1 transition-colors active:scale-95 cursor-pointer shadow-xs"
            title="محادثة واتساب مباشرة"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[11px]">واتساب</span>
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="py-2 px-1 rounded-xl bg-slate-50 text-slate-400 text-center flex items-center justify-center gap-1 opacity-50"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span className="text-[11px]">واتساب</span>
          </button>
        )}

        {/* Phone Call */}
        {phone ? (
          <a
            href={`tel:${phone}`}
            className="py-2 px-1 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 text-center flex items-center justify-center gap-1 transition-colors active:scale-95 cursor-pointer shadow-xs"
            title="اتصال هاتفي مباشر"
          >
            <Phone className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-[11px]">اتصال</span>
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="py-2 px-1 rounded-xl bg-slate-50 text-slate-400 text-center flex items-center justify-center gap-1 opacity-50"
          >
            <Phone className="w-3.5 h-3.5" />
            <span className="text-[11px]">اتصال</span>
          </button>
        )}

        {/* Full Details Modal */}
        <button
          type="button"
          onClick={() => {
            if (onSelectBusiness) onSelectBusiness(selectedBiz);
          }}
          className="py-2 px-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-center flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-xs font-black"
          title="عرض كامل التفاصيل والصور"
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="text-[11px]">تفاصيل</span>
        </button>
      </div>
    </div>
  );
};
