import { useState, useRef, useEffect, useCallback } from 'react';
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
  const searchRequestIdRef = useRef<number>(0);
  const updateSelectedPositionRef = useRef(updateSelectedPosition);

  useEffect(() => {
    updateSelectedPositionRef.current = updateSelectedPosition;
  }, [updateSelectedPosition]);

  // Cancel pending search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Search input handler with debounce and race-condition prevention
  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }

    // Check if direct coordinate or Google Maps link was pasted
    const parsed = parseLocationQuery(text);
    if (parsed) {
      updateSelectedPositionRef.current(parsed.lat, parsed.lng, true, 18);
      setShowSearchResults(false);
      setIsSearching(false);
      return;
    }

    if (text.trim().length >= 2) {
      setIsSearching(true);
      setShowSearchResults(true);
      const currentRequestId = ++searchRequestIdRef.current;

      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const results = await searchPlacesInEgypt(text);
          // Only update if this is still the latest request
          if (currentRequestId === searchRequestIdRef.current) {
            setSearchResults(results);
            setIsSearching(false);
          }
        } catch {
          if (currentRequestId === searchRequestIdRef.current) {
            setSearchResults([]);
            setIsSearching(false);
          }
        }
      }, 400);
    } else {
      searchRequestIdRef.current++;
      setSearchResults([]);
      setShowSearchResults(false);
      setIsSearching(false);
    }
  }, []);

  const handleSelectSearchResult = useCallback((res: PlaceSearchResult) => {
    updateSelectedPositionRef.current(res.lat, res.lng, true, 18);
    setSearchQuery(res.displayName.split(',')[0]);
    setShowSearchResults(false);
  }, []);

  const handleClearSearch = useCallback(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    searchRequestIdRef.current++;
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
    setIsSearching(false);
  }, []);

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
