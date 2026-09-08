import React from 'react';
import { Phone, Eye, ExternalLink } from 'lucide-react';
import { Business } from '../../types';
import { sanitizeExternalUrl } from '../../utils/urlSanitizer';

interface MapSelectedBusinessDrawerProps {
  business: Business;
  onClose: () => void;
  onEditBusiness?: (biz: Business) => void;
}

export const MapSelectedBusinessDrawer: React.FC<MapSelectedBusinessDrawerProps> = ({
  business,
  onClose,
  onEditBusiness,
}) => {
  return (
    <div className="absolute bottom-2.5 sm:bottom-3 left-2.5 sm:left-3 right-2.5 sm:right-3 bg-slate-950/95 border border-amber-500/40 p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl shadow-2xl backdrop-blur-xl z-30 flex flex-col gap-2.5 animate-fade-in-scale">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-amber-500/20 text-amber-300 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-amber-500/40">
              {business.category}
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                business.verificationStatus === 'verified'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}
            >
              {business.verificationStatus === 'verified' ? 'معتمد 🟢' : 'قيد المراجعة ⏳'}
            </span>
          </div>
          <h3 className="text-sm sm:text-base font-black text-white mt-1.5">{business.nameAr}</h3>
          <p className="text-xs text-slate-300 font-medium">
            {business.governorate} - {business.city} {business.street ? `(${business.street})` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-white text-xs font-black w-7 h-7 bg-slate-800 hover:bg-slate-700 rounded-full flex items-center justify-center cursor-pointer transition-colors"
          aria-label="إغلاق"
        >
          ✕
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 border-t border-slate-800 text-xs">
        <div className="flex items-center gap-1.5 text-slate-300 font-mono text-xs">
          <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{business.ownerPhone || 'لا يوجد هاتف'}</span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {onEditBusiness && (
            <button
              type="button"
              onClick={() => onEditBusiness(business)}
              className="flex-1 sm:flex-none bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-[11px] font-black px-3 py-1.5 rounded-xl flex items-center justify-center gap-1 shadow cursor-pointer transition-transform active:scale-95"
              title="عرض وتعديل كافة البيانات في نافذة خاصة"
            >
              <Eye className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>عرض وتعديل</span>
            </button>
          )}
          {business.ownerPhone && (
            <a
              href={`https://wa.me/20${business.ownerPhone.replace(/\D/g, '').replace(/^0/, '')}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 sm:flex-none bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 text-[11px] font-black px-3 py-1.5 rounded-xl flex items-center justify-center gap-1 transition-colors"
            >
              واتساب
            </a>
          )}
          {/* Google Maps Verified Link: Only active when official verified URL exists */}
          {business.googleMapsUrl && business.googleMapsUrl.trim().startsWith('http') ? (
            <a
              href={sanitizeExternalUrl(business.googleMapsUrl.trim())}
              target="_blank"
              rel="noreferrer"
              className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl flex items-center justify-center gap-1 shadow transition-colors"
              title="الموقع موثق رسمياً: فتح على خرائط Google"
            >
              <span>الخريطة الموثقة 🗺️</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          ) : (
            <span
              className="flex-1 sm:flex-none bg-slate-800/90 text-amber-400 text-[10px] font-bold px-2.5 py-1.5 rounded-xl flex items-center justify-center gap-1 border border-amber-500/30 cursor-default"
              title="الموقع غير مدرج بعد على خرائط Google (قيد مراجعة وتوثيق الإدارة ⏳)"
            >
              <span>قيد التوثيق ⏳</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
