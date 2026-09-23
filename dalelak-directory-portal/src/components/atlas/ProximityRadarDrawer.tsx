import React, { useMemo, useState } from 'react';
import { Business } from '../../types';
import {
  HadayekZone,
  calculateDirectDistanceMeters,
  formatHadayekDistance,
} from '../../data/hadayekAtlasData';
import { getBusinessOpenStatus } from '../../utils/directoryEnhancements';
import {
  Radar,
  Phone,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Store,
  X,
} from 'lucide-react';

export interface ProximityRadarDrawerProps {
  target: {
    zone: HadayekZone;
    buildingNumber: string;
    coords: { lat: number; lng: number };
  } | null;
  businesses: Business[];
  onOpenBusiness: (biz: Business) => void;
  onClose?: () => void;
  className?: string;
}

export const ProximityRadarDrawer: React.FC<ProximityRadarDrawerProps> = ({
  target,
  businesses,
  onOpenBusiness,
  onClose,
  className = '',
}) => {
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // 1. Calculate Distances and Sort Nearby
  const nearbyBusinesses = useMemo(() => {
    if (!target) return [];

    const targetLat = target.coords.lat;
    const targetLng = target.coords.lng;
    const zoneLetter = target.zone.letterAr;

    const list = businesses
      .filter((b) => {
        if (b.verificationStatus !== 'verified') return false;
        return typeof b.lat === 'number' && typeof b.lng === 'number' && b.lat > 0 && b.lng > 0;
      })
      .map((b) => {
        const meters = calculateDirectDistanceMeters(targetLat, targetLng, b.lat!, b.lng!);
        const streetLower = (b.street || '').toLowerCase();
        const isInSameZone = streetLower.includes(`منطقة ${zoneLetter}`) || streetLower.includes(zoneLetter);
        return {
          business: b,
          distanceMeters: meters,
          isInSameZone,
        };
      });

    // Sort by proximity ascending
    list.sort((a, b) => a.distanceMeters - b.distanceMeters);

    return list;
  }, [target, businesses]);

  // 2. Category Filter Options
  const categories = useMemo(() => {
    const set = new Set<string>();
    nearbyBusinesses.slice(0, 30).forEach((item) => {
      if (item.business.category) set.add(item.business.category);
    });
    return Array.from(set).slice(0, 6);
  }, [nearbyBusinesses]);

  // 3. Filtered List (Strictly up to closest 10 activities)
  const displayList = useMemo(() => {
    const maxItems = 10;
    if (activeCategoryFilter === 'all') {
      return nearbyBusinesses.slice(0, maxItems);
    }
    return nearbyBusinesses
      .filter((item) => item.business.category === activeCategoryFilter)
      .slice(0, maxItems);
  }, [nearbyBusinesses, activeCategoryFilter]);

  if (!target) return null;

  const targetLabel = target.buildingNumber
    ? `عمارة ${target.buildingNumber} - ${target.zone.nameAr}`
    : target.zone.nameAr;

    if (isCollapsed) {
      return (
        <div
          className={`absolute bottom-3 right-3 left-3 sm:right-6 sm:left-6 max-w-xl mx-auto z-[1150] bg-white border-2 border-amber-400 rounded-2xl shadow-2xl p-2.5 sm:p-3 text-slate-900 select-none font-['Cairo',sans-serif] animate-slide-up flex items-center justify-between gap-3 ${className}`}
          dir="rtl"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
              <Radar className="w-4 h-4 animate-pulse" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-slate-900">رادار الخدمات والأنشطة</span>
                <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded-full border border-amber-300">
                  أقرب {displayList.length} أنشطة
                </span>
              </div>
              <p className="text-[10px] text-slate-600 truncate">
                حول <strong className="text-amber-700">{targetLabel}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsCollapsed(false)}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
              title="عرض القائمة والأنشطة"
            >
              <ChevronUp className="w-4 h-4" />
              <span>عرض الرادار</span>
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
                title="إغلاق الرادار"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div
        className={`absolute bottom-3 right-3 left-3 sm:right-6 sm:left-6 max-w-3xl mx-auto z-[1150] bg-white border-2 border-amber-400 rounded-2xl sm:rounded-3xl shadow-2xl p-3.5 sm:p-5 text-slate-900 select-none font-['Cairo',sans-serif] animate-slide-up flex flex-col max-h-[62vh] transition-all overflow-hidden ${className}`}
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
              <Radar className="w-5 h-5 animate-pulse" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                  رادار الخدمات والأنشطة المحيطة
                </h3>
                <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300 shrink-0">
                  أقرب {displayList.length} أنشطة
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-600 truncate mt-0.5">
                حول <strong className="text-amber-700">{targetLabel}</strong> (مرتبة بالأمتار لأقرب 10 أنشطة)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsCollapsed(true)}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 px-2 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
              title="تصغير الرادار"
            >
              <ChevronDown className="w-4 h-4 text-slate-600" />
              <span className="text-[11px]">تصغير</span>
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
                aria-label="إغلاق الرادار"
                title="إغلاق الرادار"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Filter Chips */}
        {categories.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 border-b border-slate-100 scrollbar-none shrink-0">
            <button
              type="button"
              onClick={() => setActiveCategoryFilter('all')}
              className={`text-[11px] font-black px-3 py-1 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                activeCategoryFilter === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              الكل ({displayList.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategoryFilter(cat)}
                className={`text-[11px] font-black px-3 py-1 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                  activeCategoryFilter === cat
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Scrollable Cards List */}
        <div className="mt-2.5 overflow-y-auto flex-1 pr-0.5 space-y-2.5 scrollbar-thin">
          {displayList.length === 0 ? (
            <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Store className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-600">
                لا توجد منشآت مسجلة في هذا التصنيف حالياً قرب هذا الموقع.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5">
              {displayList.map(({ business: b, distanceMeters }) => {
                const openStatus = getBusinessOpenStatus(b.workingHours);
                const phone = b.phone || b.secondaryPhone;
                const photo = (b.photos && b.photos[0]) || b.coverPhoto;

                return (
                  <div
                    key={b.id}
                    onClick={() => onOpenBusiness(b)}
                    className="group bg-slate-50 hover:bg-amber-50/20 border border-slate-200 hover:border-amber-400 rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between gap-2 transition-all shadow-xs hover:shadow-md cursor-pointer"
                  >
                    {/* Top Row: Photo + Name + Category + Distance */}
                    <div className="flex items-start gap-2.5">
                      {photo ? (
                        <img
                          src={photo}
                          alt={b.nameAr}
                          className="w-11 h-11 rounded-xl object-cover shrink-0 border border-slate-200 group-hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center shrink-0 font-black text-sm border border-amber-200">
                          {b.nameAr ? b.nameAr.charAt(0) : '🏛️'}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs sm:text-sm font-black text-slate-900 truncate group-hover:text-amber-700 transition-colors">
                          {b.nameAr}
                        </h4>

                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-1.5 py-0.2 rounded">
                            {b.category}
                          </span>
                          <span className="text-[10px] font-black text-emerald-800 bg-emerald-100/80 px-1.5 py-0.2 rounded">
                            {formatHadayekDistance(distanceMeters)}
                          </span>
                        </div>

                        {b.street && (
                          <p className="text-[10px] text-slate-500 truncate mt-1">
                            📍 {b.street}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Bottom Row: Open Status + WhatsApp & Call CTA */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/70">
                      <span
                        className={`text-[10px] font-bold flex items-center gap-1 ${
                          openStatus.isOpen ? 'text-emerald-600' : 'text-slate-400'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            openStatus.isOpen ? 'bg-emerald-500' : 'bg-slate-400'
                          }`}
                        />
                        {openStatus.isOpen ? 'مفتوح الآن' : 'مغلق'}
                      </span>

                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {phone && (
                          <>
                            <a
                              href={`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                                `مرحباً، أود الاستفسار من خلال دليلك حدائق الأهرام بخصوص ${b.nameAr}`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-xs"
                              title="محادثة واتساب"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                            <a
                              href={`tel:${phone.replace(/\D/g, '')}`}
                              className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border border-slate-200"
                              title="اتصال هاتفي"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => onOpenBusiness(b)}
                          className="text-[10px] font-black text-amber-700 hover:underline px-1 py-0.5"
                        >
                          التفاصيل ⬅️
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };
