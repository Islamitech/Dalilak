import React, { useEffect, useRef, useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Business } from '../../types';
import { normalizeBuildingQuery } from '../../utils/hadayekBuildingSearch';
import { getDistrictByLetter, isPointInPolygon } from '../../data/hadayekDistrictsGeoData';

export interface ZoneScopedSearchBarProps {
  selectedZone: string;
  businesses: Business[];
  selectedBuilding?: { buildingNumber: string; zoneLetter: string } | null;
  onSelectBuilding: (building: { buildingNumber: string; zoneLetter: string; lat: number; lng: number }) => void;
  onSelectBusiness: (biz: Business) => void;
  onClearBuilding?: () => void;
  onClearZone?: () => void;
}
export const ZoneScopedSearchBar: React.FC<ZoneScopedSearchBarProps> = ({ selectedZone, onSelectBuilding, onClearBuilding }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const requestRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    requestRef.current++;
    setQuery(''); setMessage(''); setLoading(false);
    return () => { requestRef.current++; };
  }, [selectedZone]);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const number = normalizeBuildingQuery(query);
    if (!/^\d+$/.test(number)) { setMessage('اكتب رقم العمارة فقط.'); return; }
    const request = ++requestRef.current;
    setLoading(true); setMessage('');
    try {
      const { default: database } = await import('../../data/hadayekBuildingsCoords.json');
      if (request !== requestRef.current) return;
      const district = getDistrictByLetter(selectedZone);
      const records = (database as Record<string, Array<{lat: number; lng: number}>>)[String(Number(number))] || [];
      const matches = records.filter(p => district?.polygons.some(ring => isPointInPolygon(p.lat, p.lng, ring)));
      const unique = matches.filter((p, i) => matches.findIndex(q => q.lat === p.lat && q.lng === p.lng) === i);
      if (unique.length !== 1) {
        setMessage(unique.length ? 'يوجد أكثر من موقع بهذا الرقم؛ تعذّر تحديد مبنى واحد بدقة.' : `لم نجد موقعاً مؤكداً للعمارة ${number} في منطقة ${selectedZone}. تأكد من الرقم والمنطقة.`);
        return;
      }
      onSelectBuilding({ buildingNumber: String(Number(number)), zoneLetter: selectedZone, ...unique[0] });
      inputRef.current?.blur();
    } catch { if (request === requestRef.current) setMessage('تعذّر تحميل بيانات المباني. حاول مجدداً.'); }
    finally { if (request === requestRef.current) setLoading(false); }
  };
  if (!selectedZone || selectedZone === 'all') return null;
  return (
    <div dir="rtl" className="w-full font-['Cairo',sans-serif]">
      <form onSubmit={submit} className="flex min-w-0 items-center rounded-lg focus-within:ring-2 focus-within:ring-amber-400">
        <input ref={inputRef} type="text" inputMode="numeric" enterKeyHint="search" autoComplete="off"
          aria-label={`رقم العمارة في منطقة ${selectedZone}`} placeholder="رقم المبنى" value={query}
          onChange={e => { requestRef.current++; setLoading(false); setQuery(e.target.value); setMessage(''); }}
          className="directory-search-input min-w-0 flex-1 bg-transparent px-2 text-base h-10 text-slate-800" />
        <button type="submit" disabled={!query.trim() || loading} aria-label="اذهب إلى المبنى" className="h-10 w-8 shrink-0 rounded-lg text-amber-600 disabled:opacity-50 flex items-center justify-center gap-1 text-xs font-bold">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
        </button>
      </form>
      {message && <p role="status" className="absolute top-full inset-x-0 mt-2 rounded-xl bg-white p-3 text-xs text-slate-700 shadow">{message}</p>}
    </div>
  );
};
