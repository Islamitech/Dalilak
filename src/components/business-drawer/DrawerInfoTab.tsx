import React from 'react';
import {
  MapPin,
  Clock,
  User,
  FileText,
  Navigation,
  ExternalLink,
  Star,
  Image,
  Film,
  Play,
  ZoomIn,
  Compass
} from 'lucide-react';
import { Business } from '../../types';

interface DrawerInfoTabProps {
  business: Business;
  isGuest?: boolean;
  allPhotos: string[];
  onOpenLightbox?: (index: number) => void;
  onOpenGmapsModal?: () => void;
  onOpenVideoModal?: () => void;
}

export const DrawerInfoTab: React.FC<DrawerInfoTabProps> = ({
  business,
  isGuest = false,
  allPhotos,
  onOpenLightbox,
  onOpenGmapsModal,
  onOpenVideoModal
}) => {
  return (
    <div className="space-y-4 text-sm">
      {/* Category & Subcategory Taxonomy Card */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs flex-wrap gap-2">
        <span className="text-slate-500 font-medium">تصنيف النشاط:</span>
        <div className="flex items-center gap-1.5 font-bold flex-wrap">
          <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
            {business.category}
          </span>
          {(business as any).subCategory && (
            <span className="px-2.5 py-1 rounded-lg bg-white text-slate-700 border border-slate-200">
              {(business as any).subCategory}
            </span>
          )}
        </div>
      </div>

      {/* Google Maps Rating & Reviews Card */}
      {business.googleRating && (
        <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/80 space-y-2.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white border border-amber-200 flex items-center justify-center text-amber-500 shadow-2xs">
                <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-slate-900 text-base">{business.googleRating.toFixed(1)}</span>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3.5 h-3.5 ${
                          star <= Math.round(business.googleRating || 0)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-xs text-slate-500">تقييم موثق على خرائط Google ({business.googleReviewsCount || 0} تقييم ومراجعة)</span>
              </div>
            </div>
            {business.googleMapsUrl && (
              <a
                href={business.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="py-1 px-3 rounded-lg bg-white hover:bg-amber-100 text-amber-900 font-bold text-xs transition-colors flex items-center gap-1.5 border border-amber-200 shadow-2xs"
              >
                <ExternalLink className="w-3.5 h-3.5 text-amber-600" />
                <span>عرض على خرائط Google</span>
              </a>
            )}
          </div>
        </div>
      )}

      {business.description && (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
          <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>عن المنشأة</span>
          </h4>
          <p className="text-slate-600 leading-relaxed">{business.description}</p>
        </div>
      )}

      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-indigo-600" />
            <span>الموقع والعنوان</span>
          </h4>
          <div className="flex items-center gap-1.5">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${business.lat},${business.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-1 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] transition-colors flex items-center gap-1 border border-emerald-200"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>الملاحة والمسار</span>
            </a>
            {!isGuest && onOpenGmapsModal && (
              <button
                type="button"
                onClick={onOpenGmapsModal}
                className="py-1 px-2.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] transition-colors flex items-center gap-1 border border-indigo-200 cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>مزامنة خرائط Google</span>
              </button>
            )}
          </div>
        </div>

        <p className="text-slate-700 font-medium">
          {business.governorate} - {business.city} - {business.street}
        </p>
        {business.landmark && (
          <p className="text-xs text-slate-500">علامة مميزة: {business.landmark}</p>
        )}

        {/* In-App Interactive Mini Map */}
        {business.lat && business.lng ? (
          <div className="relative h-44 w-full rounded-xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100">
            <iframe
              title="موقع المنشأة التفاعلي"
              width="100%"
              height="100%"
              frameBorder="0"
              scrolling="no"
              marginHeight={0}
              marginWidth={0}
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${business.lng - 0.008}%2C${business.lat - 0.006}%2C${business.lng + 0.008}%2C${business.lat + 0.006}&layer=mapnik&marker=${business.lat}%2C${business.lng}`}
              className="w-full h-full"
            />
            <div className="absolute bottom-2 right-2 bg-white/95 backdrop-blur-xs px-2 py-1 rounded-lg text-[10px] font-mono text-slate-700 shadow-sm border border-slate-200 flex items-center gap-1 pointer-events-none">
              <MapPin className="w-3 h-3 text-rose-500" />
              <span>{business.lat.toFixed(4)}, {business.lng.toFixed(4)}</span>
            </div>
          </div>
        ) : null}
      </div>

      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2.5">
        <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-indigo-600" />
          <span>ساعات العمل والتواصل</span>
        </h4>
        <p className="text-slate-600">ساعات العمل: {business.workingHours || 'غير محدد'}</p>
        <p className="text-slate-600">الهاتف الأساسي: {business.phone}</p>
        {business.secondaryPhone && (
          <p className="text-slate-600">هاتف بديل: {business.secondaryPhone}</p>
        )}
      </div>

      {/* Internal owner and rep details - STRICTLY HIDDEN for guest */}
      {!isGuest && (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2.5">
          <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
            <User className="w-4 h-4 text-indigo-600" />
            <span>بيانات المالك والمندوب</span>
          </h4>
          <p className="text-slate-600">اسم المسؤول/المالك: {business.ownerName || 'غير مسجل'}</p>
          <p className="text-slate-600">هاتف المالك: {business.ownerPhone || 'غير مسجل'}</p>
          <p className="text-slate-600">المندوب الميداني المسؤول: {business.repName || 'غير محدد'}</p>
        </div>
      )}

      {/* Video Tour Feature Card if available */}
      {((business as any).videoTourUrl || (business.videos && business.videos.length > 0)) && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white border border-indigo-900/60 flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-400/30 shrink-0">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h5 className="font-bold text-xs text-white">جولة فيديو ميدانية موثقة</h5>
              <p className="text-[11px] text-slate-300">استعرض جولة الفيديو الميدانية المعتمدة للمكان</p>
            </div>
          </div>

          {onOpenVideoModal && (
            <button
              type="button"
              onClick={onOpenVideoModal}
              className="py-2 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer shrink-0"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>مشاهدة جولة الفيديو</span>
            </button>
          )}
        </div>
      )}

      {/* Photo gallery if available */}
      {allPhotos.length > 0 && (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <Image className="w-4 h-4 text-indigo-600" />
              <span>معرض صور المنشأة ({allPhotos.length} صورة)</span>
            </h4>
            <span className="text-[11px] text-slate-400">انقر للتكبير والتنقل</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {allPhotos.map((photo, i) => (
              <div
                key={i}
                onClick={() => onOpenLightbox && onOpenLightbox(i)}
                className="relative h-20 rounded-lg overflow-hidden border border-slate-200 cursor-pointer group bg-slate-100"
              >
                <img
                  src={photo}
                  alt={`${business.nameAr} - ${i + 1}`}
                  className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-200"
                  onError={(e: any) => {
                    e.target.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <ZoomIn className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
