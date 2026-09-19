import React from 'react';
import {
  CheckCircle2,
  Camera,
  Eye,
  Loader2,
  CheckSquare,
  Square,
  MapPin,
  Phone,
  Star,
  ShieldCheck,
} from 'lucide-react';
import { getCategoryFallbackCover } from '../../../../../utils/categoryPhotos';
import { CandidatePlace } from '../types';

interface PlaceCardItemProps {
  place: CandidatePlace;
  isSelected: boolean;
  loadingPreviewId: string | null;
  currentSectorSubZone: string;
  onTogglePlace: (id: string) => void;
  onPreviewPhoto: (id: string, name: string, category: string) => void;
}

export const PlaceCardItem: React.FC<PlaceCardItemProps> = ({
  place: p,
  isSelected,
  loadingPreviewId,
  currentSectorSubZone,
  onTogglePlace,
  onPreviewPhoto,
}) => {
  return (
    <div
      onClick={() => !p.isDuplicate && onTogglePlace(p.id)}
      className={`bg-[var(--bg-card)] border rounded-3xl p-4 sm:p-5 transition-all relative flex flex-col justify-between cursor-pointer ${
        p.isDuplicate
          ? 'opacity-50 border-[var(--border-color)] bg-slate-900/40 cursor-not-allowed'
          : isSelected
          ? 'border-amber-500 shadow-md bg-amber-500/5'
          : 'border-[var(--border-color)] hover:border-slate-500'
      }`}
    >
      {/* Photo Banner / Thumbnail */}
      {p.coverPhoto ? (
        <div className="relative w-full h-32 rounded-2xl overflow-hidden mb-3 border border-slate-700/50 bg-slate-950 shrink-0">
          <img
            src={p.coverPhoto}
            alt={p.displayName}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e: any) => {
              e.target.src = getCategoryFallbackCover(p.category);
            }}
          />
          <div className="absolute top-2 right-2 bg-emerald-500/90 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-lg shadow-sm flex items-center gap-1 backdrop-blur-xs">
            <CheckCircle2 className="w-3 h-3" />
            <span>تم توثيق الصورة</span>
          </div>
        </div>
      ) : (
        <div className="relative w-full h-20 rounded-2xl mb-3 border border-dashed border-slate-700/60 bg-slate-900/40 flex items-center justify-between px-3 text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
              <Camera className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] text-slate-300 font-bold">
              تُسحب الصورة تلقائياً عند السحب
            </span>
          </div>
          {!p.isDuplicate && (
            <button
              type="button"
              disabled={loadingPreviewId === p.id}
              onClick={(e) => {
                e.stopPropagation();
                onPreviewPhoto(p.id, p.displayName, p.category);
              }}
              className="text-[9.5px] bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 px-2 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              {loadingPreviewId === p.id ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Eye className="w-3 h-3" />
              )}
              <span>معاينة الصورة</span>
            </button>
          )}
        </div>
      )}

      <div className="space-y-3">
        {/* Card Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {!p.isDuplicate && (
              <div className="shrink-0 mt-0.5">
                {isSelected ? (
                  <CheckSquare className="w-4 h-4 text-amber-500" />
                ) : (
                  <Square className="w-4 h-4 text-slate-400" />
                )}
              </div>
            )}
            <div>
              <h4 className="text-xs sm:text-sm font-black text-[var(--text-primary)] line-clamp-1">
                {p.displayName}
              </h4>
              <span className="text-[10px] text-amber-500 font-bold">
                {p.category}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`text-[9.5px] font-black px-2 py-0.5 rounded-full ${
              p.bucket === 'COMMERCIAL'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : p.bucket === 'RESIDENTIAL'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : p.bucket === 'INFRASTRUCTURE'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
            }`}>
              {p.bucket === 'COMMERCIAL' ? '🏪 تجاري' :
               p.bucket === 'RESIDENTIAL' ? '🏢 سكني' :
               p.bucket === 'INFRASTRUCTURE' ? '🛣️ بنية تحتية' : '🏛️ مدني'}
            </span>
            {p.isDuplicate && (
              <span className="text-[9.5px] font-black bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                مسجل مسبقاً
              </span>
            )}
          </div>
        </div>

        {/* Address & Sector */}
        <div className="text-[11px] text-[var(--text-muted)] line-clamp-2 leading-relaxed flex items-start gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
          <span>{p.formattedAddress || `${currentSectorSubZone} - حدائق الأهرام`}</span>
        </div>

        {/* Phone & Rating */}
        <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-1 border-t border-[var(--border-color)]">
          <span className="flex items-center gap-1 font-mono">
            <Phone className="w-3 h-3 text-slate-400" />
            <span>{p.phone || 'غير مسجل'}</span>
          </span>
          <span className="flex items-center gap-1 font-bold text-amber-400">
            <Star className="w-3 h-3 fill-amber-400" />
            <span>{(p.rating ?? 0) > 0 ? `${p.rating} (${p.userRatingCount || 0})` : 'جديد'}</span>
          </span>
        </div>
      </div>

      {/* Quality Badge */}
      <div className="mt-3 pt-2 text-[10px] font-bold text-emerald-400 flex items-center gap-1">
        <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
        <span className="line-clamp-1">{p.qualityBadgeText}</span>
      </div>
    </div>
  );
};
