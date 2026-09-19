import { useState, useRef } from 'react';
import {
  searchPlacesInEgypt,
  parseLocationQuery,
  PlaceSearchResult,
} from '../../../utils/geocoding';

export interface UseMapSearchProps {
  updateSelectedPosition: (lat: number, lng: number, flyTo?: boolean, customZoom?: number) => Promise<void>;
}

export const useMapSearch = ({ updateSelectedPosition }: UseMapSearchProps) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
  const searchTimeoutRef = useRef<any>(null);

  // Search input handler with debounce
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    // Check if direct coordinate or Google Maps link was pasted
    const parsed = parseLocationQuery(text);
    if (parsed) {
      updateSelectedPosition(parsed.lat, parsed.lng, true, 18);
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
    updateSelectedPosition(res.lat, res.lng, true, 18);
    setSearchQuery(res.displayName.split(',')[0]);
    setShowSearchResults(false);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  return {
    searchQuery,
    setSearchQuery,
    isSearching,
    searchResults,
    showSearchResults,
    setShowSearchResults,
    handleSearchChange,
    handleSelectSearchResult,
    handleClearSearch,
  };
};
