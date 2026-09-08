import React, { useState } from 'react';
import { CheckCircle2, Copy, Check, ExternalLink } from 'lucide-react';

interface MapFooterBarProps {
  currentLat: number;
  currentLng: number;
  zoomLevel: number;
  gpsAccuracy: number | null;
}

export const MapFooterBar: React.FC<MapFooterBarProps> = ({
  currentLat,
  currentLng,
  zoomLevel,
  gpsAccuracy,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopyCoords = () => {
    const coordsStr = `${currentLat.toFixed(6)}, ${currentLng.toFixed(6)}`;
    navigator.clipboard.writeText(coordsStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${currentLat},${currentLng}`;

  return (
    <div className="bg-[var(--map-footer-bg)] p-2.5 sm:p-3 border-t border-[var(--map-header-border)] flex flex-wrap items-center justify-between gap-2 text-xs z-20">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[var(--text-muted)] font-bold text-[11px]">الإحداثيات الحالية:</span>
        <span className="font-mono bg-[var(--map-coord-bg)] px-2.5 py-1 rounded-xl border border-[var(--border-color)] text-[var(--map-coord-text)] font-black tracking-wide dir-ltr text-xs">
          {currentLat.toFixed(6)}, {currentLng.toFixed(6)}
        </span>
        <span className="text-[10px] text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded-md">
          تكبير: {zoomLevel}x
        </span>
        {gpsAccuracy !== null && (
          <span className="text-[10px] font-black text-sky-400 bg-sky-500/15 border border-sky-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>دقة GPS: ±{gpsAccuracy}متر</span>
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleCopyCoords}
          className="flex items-center gap-1 bg-[var(--input-bg)] hover:bg-amber-500/10 text-[var(--text-primary)] px-2.5 py-1.5 rounded-xl border border-[var(--border-color)] transition-all font-bold text-[11px] cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-[var(--text-muted)]" />}
          <span>{copied ? 'تم النسخ!' : 'نسخ الإحداثيات'}</span>
        </button>

        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-slate-950 font-black text-[11px] bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 px-3 py-1.5 rounded-xl shadow transition-transform active:scale-95"
        >
          <span>مطابقة وفتح في جوجل ماب</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
};
