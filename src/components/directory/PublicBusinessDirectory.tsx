import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Business, User } from '../../types';
import { sortBusinessesNewestFirst } from '../../utils/dateFormatters';
import { matchesBusinessSearch } from '../../utils/arabicSearch';
import {
  matchesCategoryFilter,
  isTrendingFreeActivity,
  isCollectedInvoiceActivity,
  isUnpaidActivity,
  isBusinessGoogleVerified,
} from '../../utils/categoryMatcher';
import { safeSetLocalStorageItem, safeGetLocalStorageItem } from '../../utils/storage';
import { getDeletedBusinessIds } from '../../services/db/businessDb';
import { InteractiveMap } from '../InteractiveMap';
import { DirectoryMetricsBar, DirectoryStats } from './DirectoryMetricsBar';
import { DirectoryFilterBar, DirectoryVerificationFilter } from './DirectoryFilterBar';
import { DirectoryGridCard } from './DirectoryGridCard';
import { DirectoryListMobileCard, DirectoryListTableRow } from './DirectoryListRow';
import { DirectorySortOption, shuffleBusinessesWithSeed } from './types';
import { Loader2, PlusCircle } from 'lucide-react';
import { setDynamicSEO, resetSEO } from '../../utils/seoHelper';

export type { DirectorySortOption } from './types';

export interface PublicBusinessDirectoryProps {
  businesses: Business[];
  isLoadingData: boolean;
  hasInitialCloudSynced: boolean;
  currentUser: User | null;
  scopedBusinesses: Business[];
  repScope?: 'my' | 'all';
  myBusinessesCount?: number;
  onToggleRepScope?: (scope: 'my' | 'all') => void;
  onAddNewClick: () => void;
  onShowInvoice: (biz: Business) => void;
  onEditBusiness: (biz: Business) => void;
  onSelectVideoBiz?: (biz: Business) => void;
}

export const PublicBusinessDirectory: React.FC<PublicBusinessDirectoryProps> = ({
  businesses,
  isLoadingData,
  hasInitialCloudSynced,
  currentUser,
  scopedBusinesses,
  repScope = 'my',
  myBusinessesCount = 0,
  onToggleRepScope,
  onAddNewClick,
  onShowInvoice,
  onEditBusiness,
  onSelectVideoBiz = () => {},
}) => {
  // ── 1. LOCAL SEARCH & FILTER STATES ──
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const [govFilter, setGovFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [verificationFilter, setVerificationFilter] = useState<DirectoryVerificationFilter>('all');
  const [sortBy, setSortBy] = useState<DirectorySortOption>('random');
  const [shuffleSeed, setShuffleSeed] = useState<number>(() => Math.floor(Math.random() * 1000000));
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>(() => {
    return (safeGetLocalStorageItem('dalelak_home_view_mode') as 'grid' | 'list' | 'map') || 'list';
  });

  const handleViewModeChange = useCallback((mode: 'grid' | 'list' | 'map') => {
    setViewMode(mode);
    safeSetLocalStorageItem('dalelak_home_view_mode', mode);
  }, []);

  const handleReshuffle = useCallback(() => {
    setShuffleSeed(Date.now() ^ Math.floor(Math.random() * 1000000));
  }, []);

  const isRep = currentUser?.role === 'rep';
  const isManagerial = ['admin', 'supervisor', 'accountant'].includes(currentUser?.role || '');

  // Reset administrative verification filter for public visitors
  useEffect(() => {
    if (!isRep && !isManagerial && verificationFilter !== 'all') {
      setVerificationFilter('all');
    }
  }, [isRep, isManagerial, verificationFilter]);

  // ── 2. SCOPE AND DELETED ENTITIES FILTER ──
  const displayableBusinesses = useMemo(() => {
    const deletedIds = getDeletedBusinessIds();
    const cleanList = businesses.filter(
      (b) =>
        b &&
        !b.isDeleted &&
        !deletedIds.has(String(b.id).toLowerCase().trim()) &&
        b.packageId !== 'pkg_interested_lead' &&
        (b as any).verificationStatus !== 'lead' &&
        !b.id.startsWith('lead_')
    );

    if (isManagerial) {
      return cleanList;
    }
    if (isRep && repScope === 'my') {
      const myId = (currentUser?.id || '').toLowerCase().trim();
      return cleanList.filter((b) => {
        const bRepId = (b.repId || '').toLowerCase().trim();
        return Boolean(myId && bRepId === myId);
      });
    }
    // Rep with 'all' or public visitors
    return cleanList.filter(
      (b) => b.verificationStatus === 'verified' && b.publishedStatus !== 'draft' && b.publishedStatus !== 'unlisted'
    );
  }, [businesses, isRep, isManagerial, repScope, currentUser]);

  const hasRegisteredBiz = displayableBusinesses.length > 0;

  // ── 3. SINGLE-PASS METRICS COMPUTATION ──
  const homeStats: DirectoryStats = useMemo(() => {
    const totalRegistered = displayableBusinesses.length;
    let directoryApproved = 0;
    let pendingDirectory = 0;
    let googleMapsVerified = 0;
    let fullyPaid = 0;
    let trending = 0;
    let unpaid = 0;
    let needsFollowup = 0;
    const govSet = new Set<string>();

    for (let i = 0; i < displayableBusinesses.length; i++) {
      const b = displayableBusinesses[i];
      if (b.governorate) govSet.add(b.governorate);

      const isApproved = b.verificationStatus === 'verified';
      if (isApproved) {
        directoryApproved++;
      } else if (b.verificationStatus !== 'rejected') {
        pendingDirectory++;
      }

      const isDocumented = isBusinessGoogleVerified(b);
      if (isDocumented) {
        googleMapsVerified++;
      }

      const isTrending = isTrendingFreeActivity(b);
      if (isTrending) {
        trending++;
      }

      const isCollected = isCollectedInvoiceActivity(b);
      if (isCollected) {
        fullyPaid++;
      }

      if (isUnpaidActivity(b)) {
        unpaid++;
      }

      const isPaid = isTrending || isCollected;
      if (!(isDocumented && isPaid && isApproved)) {
        needsFollowup++;
      }
    }

    return {
      totalRegistered,
      directoryApproved,
      googleMapsVerified,
      pendingDirectory,
      govs: govSet.size,
      fullyPaid,
      exempt: trending,
      unpaid,
      needsFollowup,
      trending,
      total: totalRegistered,
    };
  }, [displayableBusinesses]);

  // ── 4. FILTERING & SORTING PIPELINE ──
  const filteredBusinesses = useMemo(() => {
    const list = displayableBusinesses.filter((b) => {
      if (debouncedSearchQuery && !matchesBusinessSearch(b, debouncedSearchQuery)) {
        return false;
      }
      if (govFilter !== 'all' && !(b.governorate || '').includes(govFilter)) {
        return false;
      }
      if (categoryFilter !== 'all' && !matchesCategoryFilter(b, categoryFilter)) {
        return false;
      }
      if (verificationFilter === 'trending') {
        if (!isTrendingFreeActivity(b)) return false;
      } else if (verificationFilter === 'google_verified') {
        if (!isBusinessGoogleVerified(b)) return false;
      } else if (verificationFilter === 'fully_paid') {
        if (!isCollectedInvoiceActivity(b)) return false;
      } else if (verificationFilter === 'unpaid') {
        if (!isUnpaidActivity(b)) return false;
      } else if (verificationFilter === 'verified') {
        if (b.verificationStatus !== 'verified') return false;
      } else if (verificationFilter === 'in_progress') {
        if (b.verificationStatus === 'verified' || b.verificationStatus === 'rejected') return false;
      } else if (verificationFilter === 'needs_followup') {
        const isDocumented = isBusinessGoogleVerified(b);
        const isPaid = isTrendingFreeActivity(b) || isCollectedInvoiceActivity(b);
        const isApproved = b.verificationStatus === 'verified';
        if (isDocumented && isPaid && isApproved) return false;
      }
      return true;
    });

    if (sortBy === 'random') {
      const hasFilter = Boolean(
        (debouncedSearchQuery && debouncedSearchQuery.trim().length > 0) ||
          govFilter !== 'all' ||
          categoryFilter !== 'all' ||
          verificationFilter !== 'all'
      );
      if (hasFilter) {
        return sortBusinessesNewestFirst(list);
      }
      return shuffleBusinessesWithSeed(list, shuffleSeed);
    }
    if (sortBy === 'newest') {
      return sortBusinessesNewestFirst(list);
    }
    if (sortBy === 'oldest') {
      return [...list].sort((a, b) => {
        const timeA = a.createdDate ? new Date(a.createdDate).getTime() : a.invoiceDate ? new Date(a.invoiceDate).getTime() : 0;
        const timeB = b.createdDate ? new Date(b.createdDate).getTime() : b.invoiceDate ? new Date(b.invoiceDate).getTime() : 0;
        if (timeA !== timeB) return timeA - timeB;
        return (a.id || '').localeCompare(b.id || '');
      });
    }
    if (sortBy === 'alpha') {
      return [...list].sort((a, b) => (a.nameAr || '').localeCompare(b.nameAr || '', 'ar'));
    }
    return list;
  }, [displayableBusinesses, debouncedSearchQuery, govFilter, categoryFilter, verificationFilter, sortBy, shuffleSeed]);

  // ── 5. PROGRESSIVE WINDOWING (PAGINATION) ──
  const PAGE_SIZE = 24;
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [debouncedSearchQuery, govFilter, categoryFilter, verificationFilter, displayableBusinesses.length, sortBy, shuffleSeed]);

  useEffect(() => {
    if (govFilter !== 'all' || categoryFilter !== 'all') {
      setDynamicSEO({ category: categoryFilter, governorate: govFilter });
    } else {
      resetSEO();
    }
  }, [govFilter, categoryFilter]);

  const renderedBusinesses = useMemo(() => {
    return filteredBusinesses.slice(0, visibleCount);
  }, [filteredBusinesses, visibleCount]);

  const hasMore = visibleCount < filteredBusinesses.length;

  return (
    <div className="space-y-4">
      {/* 1. TOP KPI METRICS BAR */}
      <DirectoryMetricsBar
        stats={homeStats}
        isLoadingData={isLoadingData}
        totalBusinessesCount={businesses.length}
        isRep={isRep}
        hasRegisteredBiz={hasRegisteredBiz}
      />

      {/* 2. FILTERS AND CONTROLS BAR */}
      <DirectoryFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        govFilter={govFilter}
        onGovFilterChange={setGovFilter}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        verificationFilter={verificationFilter}
        onVerificationFilterChange={setVerificationFilter}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        onReshuffle={handleReshuffle}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        isRep={isRep}
        isAdmin={isManagerial}
        repScope={repScope}
        myBusinessesCount={myBusinessesCount}
        onToggleRepScope={onToggleRepScope}
        stats={homeStats}
        filteredCount={filteredBusinesses.length}
      />

      {/* 3. LOADING SKELETON STATE */}
      {isLoadingData && businesses.length === 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2.5 py-3.5 px-4 bg-amber-500/10 border border-amber-500/25 text-amber-600 font-bold text-xs sm:text-sm rounded-2xl animate-pulse shadow-xs">
            <Loader2 className="w-4 h-4 animate-spin text-amber-500 shrink-0" />
            <span>جاري جلب وتحديث الأنشطة التجارية والبيانات من السحابة...</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={`skel-${i}`}
                className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl overflow-hidden shadow-xs flex flex-col justify-between animate-pulse"
              >
                <div className="relative aspect-[16/8.5] bg-slate-200" />
                <div className="p-4 space-y-3">
                  <div className="h-5 bg-slate-200 rounded-lg w-3/4" />
                  <div className="h-3.5 bg-slate-200 rounded-md w-1/2" />
                  <div className="h-3.5 bg-slate-200 rounded-md w-2/3" />
                  <div className="pt-3 border-t border-[var(--border-color)] flex items-center justify-between">
                    <div className="h-4 bg-slate-200 rounded w-20" />
                    <div className="h-7 bg-slate-200 rounded-xl w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. EMPTY STATE */}
      {hasInitialCloudSynced && filteredBusinesses.length === 0 && (
        <div className="text-center py-12 px-4 bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] space-y-3.5 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/15 text-amber-500 flex items-center justify-center mx-auto text-2xl shadow-inner">
            🏪
          </div>
          {currentUser?.role === 'rep' && scopedBusinesses.length === 0 ? (
            <>
              <h3 className="font-black text-base sm:text-lg text-[var(--text-primary)]">
                لم تقم بتسجيل أي نشاط تجاري حتى الآن
              </h3>
              <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
                هذه المساحة مخصصة لعرض وإدارة الأنشطة والزيارات الميدانية الخاصة بك. ابدأ الآن بتوثيق أول محل تجاري لتفعيل حسابك وكسب عمولتك فوراً!
              </p>
              <button
                onClick={onAddNewClick}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 text-slate-950 font-extrabold text-xs px-6 py-3 rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer mt-1"
              >
                <PlusCircle className="w-4 h-4" />
                <span>تسجيل أول نشاط تجاري الآن ➕</span>
              </button>
            </>
          ) : (
            <>
              <h3 className="font-black text-sm sm:text-base text-[var(--text-primary)]">
                لا توجد أنشطة تجارية مطابقة للبحث أو التصفية الحالية
              </h3>
              <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto">
                جرب تغيير خيارات التصفية أو البحث، أو اضغط على "تسجيل نشاط جديد" للبدء في توثيق المحلات.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setGovFilter('all');
                  setCategoryFilter('all');
                  setVerificationFilter('all');
                }}
                className="inline-flex items-center gap-1.5 text-xs font-black text-amber-600 bg-amber-500/10 hover:bg-amber-500/20 px-4 py-2 rounded-xl border border-amber-500/30 cursor-pointer transition-colors"
              >
                إعادة ضبط الفلاتر 🔄
              </button>
            </>
          )}
        </div>
      )}

      {/* 5. GRID MODE */}
      {(!isLoadingData || businesses.length > 0) && viewMode === 'grid' && filteredBusinesses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {renderedBusinesses.map((biz) => (
            <DirectoryGridCard
              key={biz.id}
              biz={biz}
              currentUser={currentUser}
              onShowInvoice={onShowInvoice}
              onEditBusiness={onEditBusiness}
              onSelectVideoBiz={onSelectVideoBiz}
            />
          ))}
        </div>
      )}

      {/* 6. LIST / TABLE MODE */}
      {(!isLoadingData || businesses.length > 0) && viewMode === 'list' && filteredBusinesses.length > 0 && (
        <div className="space-y-3">
          {/* Mobile view (< md) */}
          <div className="md:hidden space-y-2.5">
            {renderedBusinesses.map((biz) => (
              <DirectoryListMobileCard
                key={`mob_${biz.id}`}
                biz={biz}
                currentUser={currentUser}
                onShowInvoice={onShowInvoice}
                onEditBusiness={onEditBusiness}
                onSelectVideoBiz={onSelectVideoBiz}
              />
            ))}
          </div>

          {/* Desktop view (>= md) */}
          <div className="hidden md:block bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs table-auto">
                <thead className="bg-[var(--input-bg)] border-b border-[var(--border-color)] text-[var(--text-muted)] font-black text-[11px]">
                  <tr>
                    <th className="py-3 px-4 min-w-[170px]">النشاط التجاري</th>
                    <th className="py-3 px-3 min-w-[130px]">التصنيف</th>
                    <th className="py-3 px-3 min-w-[130px]">الموقع</th>
                    <th className="py-3 px-3 min-w-[110px]">حالة التوثيق</th>
                    <th className="py-3 px-3 min-w-[125px]">الموقف المالي</th>
                    <th className="py-3 px-3 min-w-[120px]">المندوب المسجل</th>
                    <th className="py-3 px-4 text-center min-w-[140px]">الإجراءات السريعة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]/60">
                  {renderedBusinesses.map((biz) => (
                    <DirectoryListTableRow
                      key={`desktop_list_${biz.id}`}
                      biz={biz}
                      currentUser={currentUser}
                      onShowInvoice={onShowInvoice}
                      onEditBusiness={onEditBusiness}
                      onSelectVideoBiz={onSelectVideoBiz}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 7. PROGRESSIVE PAGINATION CONTROLLER */}
      {(!isLoadingData || businesses.length > 0) &&
        (viewMode === 'grid' || viewMode === 'list') &&
        filteredBusinesses.length > 0 && (
          <div className="pt-2 pb-6 flex flex-col items-center justify-center gap-3 animate-fade-in">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-muted)] bg-[var(--bg-card)] border border-[var(--border-color)] px-4 py-1.5 rounded-full shadow-2xs">
              <span>
                عرض {renderedBusinesses.length} من أصل {filteredBusinesses.length} نشاطاً
              </span>
              {filteredBusinesses.length > renderedBusinesses.length && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              )}
            </div>

            {hasMore && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                  className="bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs sm:text-sm px-6 sm:px-8 py-2.5 rounded-2xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>
                    تحميل المزيد (+{Math.min(PAGE_SIZE, filteredBusinesses.length - renderedBusinesses.length)} نشاط)
                  </span>
                </button>

                {filteredBusinesses.length > PAGE_SIZE * 2 && (
                  <button
                    type="button"
                    onClick={() => setVisibleCount(filteredBusinesses.length)}
                    className="bg-[var(--bg-card)] hover:bg-[var(--input-bg)] active:scale-95 text-[var(--text-primary)] font-bold text-xs px-4 py-2.5 rounded-2xl border border-[var(--border-color)] transition-all cursor-pointer"
                    title="عرض جميع الأنشطة المفلترة في الصفحة دفعة واحدة"
                  >
                    <span>عرض الكل ({filteredBusinesses.length})</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

      {/* 8. INTERACTIVE MAP MODE */}
      {(!isLoadingData || businesses.length > 0) && viewMode === 'map' && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-3 shadow-lg animate-fade-in">
          <InteractiveMap
            businesses={filteredBusinesses}
            mode="view"
            onSelectBusiness={(b) => {
              if (onEditBusiness) onEditBusiness(b);
              else if (onShowInvoice) onShowInvoice(b);
            }}
            onEditBusiness={onEditBusiness}
            heightClass="h-[520px] sm:h-[640px]"
          />
        </div>
      )}
    </div>
  );
};
