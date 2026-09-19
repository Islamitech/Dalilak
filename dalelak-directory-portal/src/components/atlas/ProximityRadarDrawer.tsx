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
} from 'lucide-react';

export interface ProximityRadarDrawerProps {
  target: {
    zone: HadayekZone;
    buildingNumber: string;
    coords: { lat: number; lng: number };
  } | null;
  businesses: Business[];
  onOpenBusiness: (biz: Business) => void;
  className?: string;
}

export const ProximityRadarDrawer: React.FC<ProximityRadarDrawerProps> = ({
  target,
  businesses,
  onOpenBusiness,
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

  // 3. Filtered List
  const displayList = useMemo(() => {
    if (activeCategoryFilter === 'all') {
      return nearbyBusinesses.slice(0, 15);
    }
    return nearbyBusinesses
      .filter((item) => item.business.category === activeCategoryFilter)
      .slice(0, 15);
  }, [nearbyBusinesses, activeCategoryFilter]);

  if (!target) return null;

  const targetLabel = target.buildingNumber
    ? `عمارة ${target.buildingNumber} - ${target.zone.nameAr}`
    : target.zone.nameAr;

  return (
    <div
      className={`bg-[var(--bg-card)] border border-amber-500/25 rounded-3xl p-4 sm:p-6 shadow-xl relative overflow-hidden transition-all ${className}`}
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center">
            <Radar className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black text-[var(--text-primary)]">
                رادار الخدمات والأنشطة المحيطة
              </h3>
              <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md">
                {displayList.length} أنشطة قريبة
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
              حول <span className="font-bold text-amber-600">{targetLabel}</span> (مرتبة بالأمتار الأقرب فالأقرب)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-xs font-black text-slate-500 hover:text-slate-800 p-2 rounded-xl hover:bg-slate-100 transition-colors"
          aria-label="طي أو توسيع الرادار"
        >
          {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
        </button>
      </div>

      {!isCollapsed && (
        <div className="mt-3 space-y-3">
          {/* Quick Filter Chips */}
          {categories.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveCategoryFilter('all')}
                className={`text-[11px] font-black px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                  activeCategoryFilter === 'all'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                الكل
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategoryFilter(cat)}
                  className={`text-[11px] font-black px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                    activeCategoryFilter === cat
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Cards List */}
          {displayList.length === 0 ? (
            <div className="py-8 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              <Store className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-[var(--text-secondary)]">
                لا توجد منشآت مسجلة في هذا التصنيف حالياً قرب هذا الموقع.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
              {displayList.map(({ business: b, distanceMeters }) => {
                const openStatus = getBusinessOpenStatus(b.workingHours);
                const phone = b.phone || b.secondaryPhone;
                const photo = (b.photos && b.photos[0]) || b.coverPhoto;

                return (
                  <div
                    key={b.id}
                    onClick={() => onOpenBusiness(b)}
                    className="group bg-slate-50/80 dark:bg-slate-900/70 hover:bg-white dark:hover:bg-slate-800 border border-[var(--border-color)] hover:border-amber-500/50 rounded-2xl p-3 flex flex-col justify-between gap-2.5 transition-all shadow-xs hover:shadow-md cursor-pointer"
                  >
                    {/* Top Row: Photo + Name + Category + Distance */}
                    <div className="flex items-start gap-2.5">
                      {photo ? (
                        <img
                          src={photo}
                          alt={b.nameAr}
                          className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200 dark:border-slate-700 group-hover:scale-105 transition-transform"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0 font-black text-sm">
                          {b.nameAr ? b.nameAr.charAt(0) : '🏛️'}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs sm:text-sm font-black text-[var(--text-primary)] truncate group-hover:text-amber-600 transition-colors">
                            {b.nameAr}
                          </h4>
                        </div>

                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">
                            {b.category}
                          </span>
                          <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                            على بعد {formatHadayekDistance(distanceMeters)}
                          </span>
                        </div>

                        {b.street && (
                          <p className="text-[10px] text-[var(--text-secondary)] truncate mt-1">
                            📍 {b.street}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Bottom Row: Open Status + WhatsApp & Call CTA */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                      <span
                        className={`text-[10px] font-bold flex items-center gap-1 ${
                          openStatus.isOpen
                            ? 'text-emerald-600'
                            : 'text-slate-400'
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
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                              title="اتصال هاتفي"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => onOpenBusiness(b)}
                          className="text-[10px] font-black text-amber-700 dark:text-amber-400 hover:underline px-1.5 py-1"
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
      )}
    </div>
  );
};
