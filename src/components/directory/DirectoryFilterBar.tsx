import React from 'react';
import { EGYPT_GOVERNORATES, CATEGORY_GROUPS } from '../../data/mockData';
import { triggerHaptic } from '../../utils/haptics';
import { DirectorySortOption } from './types';
import { DirectoryStats } from './DirectoryMetricsBar';
import {
  Search,
  X,
  LayoutGrid,
  List,
  Navigation,
  Shuffle,
  Sparkles,
} from 'lucide-react';

export type DirectoryVerificationFilter =
  | 'all'
  | 'trending'
  | 'needs_followup'
  | 'verified'
  | 'in_progress'
  | 'fully_paid'
  | 'unpaid'
  | 'google_verified';

export interface DirectoryFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  govFilter: string;
  onGovFilterChange: (gov: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (cat: string) => void;
  verificationFilter: DirectoryVerificationFilter;
  onVerificationFilterChange: (filter: DirectoryVerificationFilter) => void;
  sortBy: DirectorySortOption;
  onSortByChange: (sort: DirectorySortOption) => void;
  onReshuffle: () => void;
  viewMode: 'grid' | 'list' | 'map';
  onViewModeChange: (mode: 'grid' | 'list' | 'map') => void;
  isRep: boolean;
  isAdmin?: boolean;
  repScope?: 'my' | 'all';
  myBusinessesCount?: number;
  onToggleRepScope?: (scope: 'my' | 'all') => void;
  stats: DirectoryStats;
  filteredCount: number;
}

export const DirectoryFilterBar: React.FC<DirectoryFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  govFilter,
  onGovFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  verificationFilter,
  onVerificationFilterChange,
  sortBy,
  onSortByChange,
  onReshuffle,
  viewMode,
  onViewModeChange,
  isRep,
  isAdmin = false,
  repScope = 'my',
  myBusinessesCount = 0,
  onToggleRepScope,
  stats,
  filteredCount,
}) => {
  const showAdminFilters = isRep || isAdmin;

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-3 sm:p-4 space-y-3.5 shadow-xs">
      {/* Scope selector for field representatives */}
      {isRep && onToggleRepScope && (
        <div className="flex items-center justify-between bg-[var(--input-bg)] p-1.5 rounded-2xl border border-[var(--border-color)]">
          <div className="flex items-center gap-1.5 w-full">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                onToggleRepScope('my');
              }}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                repScope === 'my'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span>أنشطتي الميدانية فقط</span>
              <span className="bg-slate-950/20 text-slate-950 text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold">
                {myBusinessesCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                onToggleRepScope('all');
              }}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                repScope === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span>كافة أنشطة الدليل المعتمدة</span>
              <span className="text-[10px] opacity-75 font-mono">
                (سحابي)
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Row 1: Search & Governorate Filter */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        {/* Search input with debounced dispatch */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="بحث بالاسم، النشاط، رقم الفاتورة، أو رقم الهاتف..."
            className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] focus:border-amber-500 rounded-2xl py-2.5 pr-10 pl-9 text-xs sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-hidden transition-all shadow-inner font-medium"
          />
          <Search className="w-4 h-4 text-amber-500 absolute right-3.5 top-3 pointer-events-none" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute left-3 top-3 text-[var(--text-muted)] hover:text-rose-500 transition-colors cursor-pointer"
              title="مسح البحث"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters Row: Single Governorate select for visitors, or Grid with Admin Filter for Reps/Admins */}
        {showAdminFilters ? (
          <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
            {/* Governorate Filter */}
            <div className="w-full sm:w-48">
              <select
                value={govFilter}
                onChange={(e) => {
                  triggerHaptic('selection');
                  onGovFilterChange(e.target.value);
                }}
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] focus:border-amber-500 rounded-2xl py-2.5 px-3 text-xs sm:text-sm text-[var(--text-primary)] font-bold focus:outline-hidden transition-all cursor-pointer shadow-inner"
              >
                <option value="all">كل المحافظات ({stats.govs})</option>
                {EGYPT_GOVERNORATES.map((gov) => (
                  <option key={gov} value={gov}>
                    {gov}
                  </option>
                ))}
              </select>
            </div>

            {/* Administrative Verification & Status Filter Dropdown (Hidden from public visitors) */}
            <div className="w-full sm:w-48">
              <select
                value={verificationFilter}
                onChange={(e) => {
                  triggerHaptic('selection');
                  onVerificationFilterChange(e.target.value as DirectoryVerificationFilter);
                }}
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] focus:border-amber-500 rounded-2xl py-2.5 px-3 text-xs sm:text-sm text-[var(--text-primary)] font-bold focus:outline-hidden transition-all cursor-pointer shadow-inner"
              >
                <option value="all">كل الحالات ({stats.totalRegistered})</option>
                <option value="verified">معتمد وموثق 🟢 ({stats.directoryApproved})</option>
                {stats.pendingDirectory > 0 && (
                  <option value="in_progress">قيد المراجعة ⏳ ({stats.pendingDirectory})</option>
                )}
                <option value="fully_paid">مسدد بالكامل 💳 ({stats.fullyPaid})</option>
                <option value="unpaid">غير مدفوع / متبقي ⏳ ({stats.unpaid})</option>
                {stats.needsFollowup > 0 && (
                  <option value="needs_followup">بحاجة لمتابعة ⚠️ ({stats.needsFollowup})</option>
                )}
                {stats.trending > 0 && (
                  <option value="trending">باقة ترويجية مجانية ({stats.trending})</option>
                )}
                {stats.googleMapsVerified > 0 && (
                  <option value="google_verified">موثق بـ Google ({stats.googleMapsVerified})</option>
                )}
              </select>
            </div>
          </div>
        ) : (
          /* Public Visitors View: Clean Governorate Selector Only */
          <div className="w-full sm:w-56">
            <select
              value={govFilter}
              onChange={(e) => {
                triggerHaptic('selection');
                onGovFilterChange(e.target.value);
              }}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] focus:border-amber-500 rounded-2xl py-2.5 px-3 text-xs sm:text-sm text-[var(--text-primary)] font-bold focus:outline-hidden transition-all cursor-pointer shadow-inner"
            >
              <option value="all">كل المحافظات ({stats.govs})</option>
              {EGYPT_GOVERNORATES.map((gov) => (
                <option key={gov} value={gov}>
                  {gov}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Row 3: Sort & Layout Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border-color)]">
        {/* Sort Controls */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-[var(--text-muted)] font-bold hidden sm:inline">الترتيب:</span>
          <div className="flex items-center bg-[var(--input-bg)] p-1 rounded-xl border border-[var(--border-color)]">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                onSortByChange('random');
              }}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1 ${
                sortBy === 'random'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-2xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
              title="عرض مقترح متجدد لمنح جميع الأنشطة ظهوراً متكافئاً"
            >
              <span>المقترح ✨</span>
            </button>
            {sortBy === 'random' && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  onReshuffle();
                }}
                className="p-1 text-amber-600 hover:text-amber-500 hover:rotate-180 transition-all cursor-pointer"
                title="تحديث الترتيب المقترح الآن"
              >
                <Shuffle className="w-3 h-3" />
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                onSortByChange('newest');
              }}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                sortBy === 'newest'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-2xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              الأحدث
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                onSortByChange('oldest');
              }}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                sortBy === 'oldest'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-2xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              الأقدم
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                onSortByChange('alpha');
              }}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                sortBy === 'alpha'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-2xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              أبجدي
            </button>
          </div>
        </div>

        {/* View Mode Controls (Grid, List, Map) */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-[var(--text-muted)]">
            ({filteredCount} نشاط)
          </span>

          <div className="flex items-center bg-[var(--input-bg)] p-1 rounded-xl border border-[var(--border-color)]">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                onViewModeChange('grid');
              }}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-amber-500 text-slate-950 shadow-2xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
              title="عرض الشبكة (بطاقات كاملة)"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                onViewModeChange('list');
              }}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-amber-500 text-slate-950 shadow-2xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
              title="عرض القائمة (جدول بيانات سريع)"
            >
              <List className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                onViewModeChange('map');
              }}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'map'
                  ? 'bg-amber-500 text-slate-950 shadow-2xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
              title="عرض الخريطة التفاعلية"
            >
              <Navigation className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Row 4: Categories Quick Carousel / Horizontal Scroll */}
      {viewMode !== 'map' && (
        <div className="relative border-t border-[var(--border-color)]/60 pt-2">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                onCategoryFilterChange('all');
              }}
              className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                categoryFilter === 'all'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'bg-[var(--input-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]'
              }`}
            >
              كل الأقسام
            </button>
            {CATEGORY_GROUPS.map((grp) => (
              <button
                key={grp.group}
                type="button"
                onClick={() => {
                  triggerHaptic('selection');
                  onCategoryFilterChange(grp.group === categoryFilter ? 'all' : grp.group);
                }}
                className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 shrink-0 ${
                  categoryFilter === grp.group
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                    : 'bg-[var(--input-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]'
                }`}
              >
                <span>{grp.group}</span>
              </button>
            ))}
          </div>
          {/* Visual fading indicators for category pills scroll cue on mobile */}
          <div className="pointer-events-none absolute left-0 top-2 bottom-1 w-6 bg-gradient-to-r from-[var(--bg-card,#ffffff)] to-transparent sm:hidden" />
          <div className="pointer-events-none absolute right-0 top-2 bottom-1 w-6 bg-gradient-to-l from-[var(--bg-card,#ffffff)] to-transparent sm:hidden" />
        </div>
      )}
    </div>
  );
};
