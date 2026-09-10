import React from 'react';
import { Navigation, MapPin } from 'lucide-react';

interface MapCardProps {
  title: string;
  coordinates: string;
  activeLocations: number;
}

export const MapCard: React.FC<MapCardProps> = ({
  title,
  coordinates,
  activeLocations,
}) => {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-5 shadow-sm space-y-4 transition-all duration-300">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-base text-[var(--text-primary)] flex items-center gap-2">
          <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
          <span>{title}</span>
        </h3>
        <span className="bg-emerald-500/15 text-emerald-600 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-500/30">
          نشط 24/7
        </span>
      </div>

      <div className="relative h-44 rounded-2xl bg-[var(--map-bg)] border border-[var(--border-color)] overflow-hidden flex items-center justify-center">
        {/* Animated map pin */}
        <div className="absolute top-1/3 start-1/3 flex flex-col items-center animate-bounce">
          <span className="pin-icon shadow-lg"></span>
        </div>
        <div className="absolute top-1/2 end-1/3 flex flex-col items-center">
          <span className="pin-icon shadow-lg w-3.5 h-3.5"></span>
        </div>

        <div className="absolute bottom-3 start-3 bg-slate-900/80 backdrop-blur-md text-amber-300 text-[10px] font-mono px-2.5 py-1 rounded-xl border border-amber-500/30 flex items-center gap-1 shadow">
          <Navigation className="w-3 h-3 text-amber-400" />
          <span>{coordinates}</span>
        </div>

        <div className="absolute top-3 end-3 bg-emerald-500/20 backdrop-blur-md text-emerald-600 text-[10px] font-bold px-2.5 py-1 rounded-xl border border-emerald-500/30 shadow">
          <span>{activeLocations} مواقع نشطة</span>
        </div>
      </div>
    </div>
  );
};
