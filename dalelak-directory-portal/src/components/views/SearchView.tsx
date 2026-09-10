import React, { useState } from 'react';
import { Business } from '../../types';
import { SmartSearchBar } from '../search/SmartSearchBar';
import { FilterBar } from '../search/FilterBar';
import { ActiveFilterChips } from '../search/ActiveFilterChips';
import { FilterDrawer } from '../search/FilterDrawer';
import { BusinessCardGrid } from '../cards/BusinessCardGrid';

export interface SearchViewProps {
  filteredBusinesses: Business[];
  allBusinesses: Business[];
  loading: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedGov: string;
  onGovChange: (g: string) => void;
  selectedCity: string;
  onCityChange: (c: string) => void;
  selectedZone: string;
  onZoneChange: (z: string) => void;
  categoryFilter: string;
  onCategoryChange: (cat: string) => void;
  sortBy: 'default' | 'nearest' | 'newest' | 'has_video' | 'open_now' | 'alpha';
  onSortChange: (s: any) => void;
  openNowOnly: boolean;
  onToggleOpenNow: () => void;
  hasRatingOnly: boolean;
  onToggleHasRating: () => void;
  hasVideoOnly: boolean;
  onToggleHasVideo: () => void;
  userCoords: { lat: number; lng: number } | null;
  isLocatingUser: boolean;
  onRequestLocation: () => void;
  onOpenBusiness: (biz: Business) => void;
  onToggleFavorite: (id: string) => void;
  favorites: string[];
  onResetAllFilters: () => void;
  hasActiveFilters: boolean;
  onOpenVideoModal?: (biz: Business) => void;
  onNavigate: (path: string) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({
  filteredBusinesses,
  allBusinesses,
  loading,
  searchQuery,
  onSearchChange,
  selectedGov,
  onGovChange,
  selectedCity,
  onCityChange,
  selectedZone,
  onZoneChange,
  categoryFilter,
  onCategoryChange,
  sortBy,
  onSortChange,
  openNowOnly,
  onToggleOpenNow,
  hasRatingOnly,
  onToggleHasRating,
  hasVideoOnly,
  onToggleHasVideo,
  userCoords,
  isLocatingUser,
  onRequestLocation,
  onOpenBusiness,
  onToggleFavorite,
  favorites,
  onResetAllFilters,
  hasActiveFilters,
  onOpenVideoModal,
  onNavigate,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const activeFiltersCount = [
    selectedGov !== 'all',
    selectedCity !== 'all',
    selectedZone !== 'all',
    categoryFilter !== 'all',
    openNowOnly,
    hasRatingOnly,
    hasVideoOnly,
    sortBy !== 'default',
  ].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-20">
      {/* 1. Search Bar */}
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-3 sm:p-4 shadow-xs">
        <SmartSearchBar
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          selectedGov={selectedGov}
          onGovChange={onGovChange}
          selectedCity={selectedCity}
          onCityChange={onCityChange}
          userCoords={userCoords}
          isLocatingUser={isLocatingUser}
          onRequestLocation={onRequestLocation}
          businesses={allBusinesses}
          onSelectBusiness={onOpenBusiness}
          compact={true}
        />
      </div>

      {/* 2. Filter Bar */}
      <FilterBar
        categoryFilter={categoryFilter}
        onCategoryChange={onCategoryChange}
        sortBy={sortBy}
        onSortChange={onSortChange}
        openNowOnly={openNowOnly}
        onToggleOpenNow={onToggleOpenNow}
        hasVideoOnly={hasVideoOnly}
        onToggleHasVideo={onToggleHasVideo}
        onOpenFilterDrawer={() => setDrawerOpen(true)}
        activeFiltersCount={activeFiltersCount}
        showViewToggle={true}
        onViewChange={(view) => {
          if (view === 'map') onNavigate('/map');
        }}
      />

      {/* 3. Active Chips */}
      <ActiveFilterChips
        categoryFilter={categoryFilter}
        onClearCategory={() => onCategoryChange('all')}
        selectedGov={selectedGov}
        onClearGov={() => onGovChange('all')}
        selectedCity={selectedCity}
        onClearCity={() => onCityChange('all')}
        openNowOnly={openNowOnly}
        onClearOpenNow={onToggleOpenNow}
        hasVideoOnly={hasVideoOnly}
        onClearHasVideo={onToggleHasVideo}
        sortBy={sortBy}
        onClearSort={() => onSortChange('default')}
        onResetAll={onResetAllFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* 4. Results Header */}
      <div className="flex items-center justify-between pt-1">
        <p className="text-xs sm:text-sm font-black text-slate-800">
          نتائج البحث: <span className="text-amber-700 font-mono">({filteredBusinesses.length})</span> نشاطاً
        </p>
      </div>

      {/* 5. Results Grid */}
      <BusinessCardGrid
        businesses={filteredBusinesses}
        loading={loading}
        onOpenBusiness={onOpenBusiness}
        onToggleFavorite={onToggleFavorite}
        favorites={favorites}
        userCoords={userCoords}
        onResetFilters={onResetAllFilters}
        onOpenVideoModal={onOpenVideoModal}
      />

      {/* 6. Filter Drawer Modal */}
      <FilterDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        selectedGov={selectedGov}
        onGovChange={onGovChange}
        selectedCity={selectedCity}
        onCityChange={onCityChange}
        selectedZone={selectedZone}
        onZoneChange={onZoneChange}
        categoryFilter={categoryFilter}
        onCategoryChange={onCategoryChange}
        openNowOnly={openNowOnly}
        onToggleOpenNow={onToggleOpenNow}
        hasRatingOnly={hasRatingOnly}
        onToggleHasRating={onToggleHasRating}
        hasVideoOnly={hasVideoOnly}
        onToggleHasVideo={onToggleHasVideo}
        sortBy={sortBy}
        onSortChange={onSortChange}
        onResetAll={onResetAllFilters}
        resultsCount={filteredBusinesses.length}
      />
    </div>
  );
};
