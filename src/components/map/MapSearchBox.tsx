import React, { useState, useRef, useEffect } from 'react';
import { Search, Loader2, X, MapPin } from 'lucide-react';
import { searchPlacesInEgypt, parseLocationQuery, PlaceSearchResult } from '../../utils/geocoding';

interface MapSearchBoxProps {
  onSelectPosition: (lat: number, lng: number, flyTo: boolean, customZoom?: number) => void;
}

export const MapSearchBox: React.FC<MapSearchBoxProps> = ({ onSelectPosition }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
  const searchTimeoutRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    // Check if direct coordinate or Google Maps link was pasted
    const parsed = parseLocationQuery(text);
    if (parsed) {
      onSelectPosition(parsed.lat, parsed.lng, true, 18);
      setShowSearchResults(false);
      return;
    }

    if (text.trim().length >= 2) {
      setIsSearching(true);
      setShowSearchResults(true);
      searchTimeoutRef.current = setTimeout(async () => {
        const results = await searchPlacesInEgypt(text);
        setSearchResults(results);
        setIsSearching(false);
      }, 400);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (res: PlaceSearchResult) => {
    onSelectPosition(res.lat, res.lng, true, 18);
    setSearchQuery(res.displayName.split(',')[0]);
    setShowSearchResults(false);
  };

  const handleClear = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  return (
    <div className="relative bg-[var(--map-header-bg)] px-3 py-2 border-b border-[var(--map-header-border)] z-30">
      <div className="relative flex items-center">
        <Search className="absolute right-3 w-4 h-4 text-amber-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          onFocus={() => {
            if (searchResults.length > 0) setShowSearchResults(true);
          }}
          placeholder="🔍 ابحث عن اسم شارع أو ميدان، أو الصق إحداثيات أو رابط جوجل ماب مباشرة..."
          className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] text-xs font-bold rounded-xl pr-9 pl-8 py-2 focus:outline-none focus:border-amber-500 shadow-inner"
        />
        {isSearching && (
          <Loader2 className="absolute left-8 w-4 h-4 text-amber-500 animate-spin" />
        )}
        {searchQuery && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute left-2.5 text-slate-400 hover:text-white p-0.5 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Search Suggestions Dropdown */}
      {showSearchResults && searchResults.length > 0 && (
        <div className="absolute top-full right-3 left-3 mt-1 bg-slate-950/95 border border-amber-500/40 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden z-40 max-h-60 overflow-y-auto divide-y divide-slate-800">
          {searchResults.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectSearchResult(item)}
              className="w-full text-right p-3 hover:bg-amber-500/20 text-xs text-white transition-colors flex items-start gap-2 cursor-pointer"
            >
              <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-amber-300">{item.displayName.split(',')[0]}</div>
                <div className="text-[11px] text-slate-300 line-clamp-1">{item.displayName}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
