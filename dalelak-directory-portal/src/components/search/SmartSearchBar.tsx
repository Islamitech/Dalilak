import React, { useState, useRef, useEffect } from 'react';
import { Search, MapPin, Compass, X, History, Sparkles, Navigation } from 'lucide-react';
import { Business } from '../../types';
import { EGYPT_GOVERNORATES, EGYPT_CITIES_BY_GOV } from '../../data/mockData';

export interface SmartSearchBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedGov: string;
  onGovChange: (gov: string) => void;
  selectedCity: string;
  onCityChange: (city: string) => void;
  userCoords: { lat: number; lng: number } | null;
  isLocatingUser: boolean;
  onRequestLocation: () => void;
  businesses: Business[];
  onSelectBusiness?: (biz: Business) => void;
  onSearchSubmit?: () => void;
  compact?: boolean;
}

export const SmartSearchBar: React.FC<SmartSearchBarProps> = ({
  searchQuery,
  onSearchChange,
  selectedGov,
  onGovChange,
  selectedCity,
  onCityChange,
  userCoords,
  isLocatingUser,
  onRequestLocation,
  businesses,
  onSelectBusiness,
  onSearchSubmit,
  compact = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('dalelak_recent_searches');
      return saved ? JSON.parse(saved).slice(0, 5) : [];
    } catch {
      return [];
    }
  });

  const availableCities = selectedGov !== 'all' ? (EGYPT_CITIES_BY_GOV[selectedGov] || []) : [];

  const addRecentSearch = (term: string) => {
    if (!term.trim()) return;
    const clean = term.trim();
    const updated = [clean, ...recentSearches.filter((s) => s !== clean)].slice(0, 5);
    setRecentSearches(updated);
    try {
      localStorage.setItem('dalelak_recent_searches', JSON.stringify(updated));
    } catch {}
  };

  const handleClearRecent = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('dalelak_recent_searches');
    } catch {}
  };

  // Suggestions based on active query
  const suggestions = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.trim().toLowerCase();
    return businesses
      .filter((b) => b.nameAr?.toLowerCase().includes(q) || b.category?.toLowerCase().includes(q))
      .slice(0, 5);
  }, [searchQuery, businesses]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      addRecentSearch(searchQuery.trim());
    }
    setIsFocused(false);
    if (onSearchSubmit) onSearchSubmit();
  };

  return (
    <div className={`relative w-full ${compact ? 'max-w-3xl' : 'max-w-4xl'} mx-auto`}>
      <form
        onSubmit={handleSubmit}
        className="bg-[var(--bg-card)] border-2 border-amber-500/30 hover:border-amber-500/60 focus-within:border-amber-500 rounded-2xl p-1.5 sm:p-2 shadow-lg shadow-amber-500/5 backdrop-blur-md transition-all flex flex-col md:flex-row items-stretch md:items-center gap-1.5"
      >
        {/* Field 1: What? (ماذا تبحث عنه؟) */}
        <div className="relative flex-1 flex items-center min-w-0">
          <Search className="w-4 h-4 text-amber-500 absolute right-3 pointer-events-none shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 250)}
            placeholder="ماذا تبحث عنه؟ مطعم، طبيب، صيدلية، جيم، خدمة..."
            className="w-full bg-transparent pr-9 pl-8 py-2.5 text-xs sm:text-sm font-bold text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute left-2.5 w-5 h-5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
              title="مسح"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="hidden md:block w-px h-7 bg-slate-200 shrink-0" />

        {/* Field 2: Where? (المحافظة / النطاق) */}
        <div className="flex items-center gap-1.5 min-w-[200px] sm:min-w-[240px] px-1">
          <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedGov}
            onChange={(e) => {
              onGovChange(e.target.value);
              onCityChange('all');
            }}
            className="flex-1 bg-transparent py-2 text-xs font-bold text-[var(--text-primary)] focus:outline-none cursor-pointer"
          >
            <option value="all">كل محافظات مصر</option>
            {EGYPT_GOVERNORATES.map((gov) => (
              <option key={gov} value={gov}>
                {gov}
              </option>
            ))}
          </select>

          {/* Near Me GPS Proximity Button */}
          <button
            type="button"
            onClick={onRequestLocation}
            disabled={isLocatingUser}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black flex items-center gap-1 transition-all cursor-pointer shrink-0 ${
              userCoords
                ? 'bg-emerald-500/15 text-emerald-700 border border-emerald-500/30'
                : 'bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-800'
            }`}
            title="تحديد مكاني الحالي عبر GPS"
          >
            <Compass className={`w-3.5 h-3.5 ${isLocatingUser ? 'animate-spin text-amber-600' : userCoords ? 'text-emerald-600' : 'text-slate-500'}`} />
            <span className="hidden sm:inline">{userCoords ? 'موقعي نشط' : 'قربي'}</span>
          </button>
        </div>

        {/* Submit / Action Button */}
        <button
          type="submit"
          className="bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
        >
          <Search className="w-4 h-4" />
          <span>بحث</span>
        </button>
      </form>

      {/* Autocomplete & Suggestions Dropdown */}
      {isFocused && (
        <div className="absolute top-full right-0 left-0 mt-2 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-2xl z-50 overflow-hidden text-xs animate-fade-in">
          <div className="p-3 space-y-3 max-h-72 overflow-y-auto text-right">
            {/* Matching Businesses */}
            {suggestions.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10.5px] font-black text-[var(--text-muted)] block px-2">
                  أنشطة مقترحة
                </span>
                {suggestions.map((biz) => (
                  <button
                    key={biz.id}
                    type="button"
                    onMouseDown={() => {
                      if (onSelectBusiness) onSelectBusiness(biz);
                      else {
                        onSearchChange(biz.nameAr);
                        handleSubmit();
                      }
                    }}
                    className="w-full text-right p-2 rounded-xl hover:bg-slate-100 flex items-center justify-between gap-2 transition-colors cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="font-black text-[var(--text-primary)] truncate">{biz.nameAr}</p>
                      <p className="text-[10px] text-[var(--text-muted)] truncate">{biz.category} • {biz.governorate}</p>
                    </div>
                    <span className="text-[10px] bg-amber-500/15 text-amber-700 px-2 py-0.5 rounded-md shrink-0 font-bold">
                      عرض
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Recent Searches */}
            {!searchQuery && recentSearches.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-2">
                  <span className="text-[10.5px] font-black text-[var(--text-muted)] flex items-center gap-1">
                    <History className="w-3 h-3 text-slate-400" />
                    <span>عمليات البحث الأخيرة</span>
                  </span>
                  <button
                    type="button"
                    onMouseDown={handleClearRecent}
                    className="text-[10px] text-rose-500 hover:text-rose-600 font-bold cursor-pointer"
                  >
                    مسح السجل
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 px-2">
                  {recentSearches.map((term, i) => (
                    <button
                      key={i}
                      type="button"
                      onMouseDown={() => {
                        onSearchChange(term);
                        handleSubmit();
                      }}
                      className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-800 text-[11px] font-bold cursor-pointer transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Popular quick ideas when empty */}
            {!searchQuery && recentSearches.length === 0 && (
              <div className="space-y-1.5 px-2 py-1">
                <span className="text-[10.5px] font-black text-[var(--text-muted)] flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>عمليات بحث شائعة في مصر</span>
                </span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['مطاعم بيتزا', 'صيدلية 24 ساعة', 'عيادة أسنان', 'صيانة سيارات', 'محل ملابس', 'جيم ولياقة'].map(
                    (term, i) => (
                      <button
                        key={i}
                        type="button"
                        onMouseDown={() => {
                          onSearchChange(term);
                          handleSubmit();
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-800 text-[11px] font-bold cursor-pointer transition-colors"
                      >
                        {term}
                      </button>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
