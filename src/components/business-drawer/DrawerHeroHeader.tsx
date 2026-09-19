import React from 'react';
import { ShieldCheck, Building2 } from 'lucide-react';
import { Business } from '../../types';
import { getCategoryFallbackCover } from '../../utils/categoryPhotos';

interface DrawerHeroHeaderProps {
  business: Business;
  isGuest?: boolean;
  onOpenLightbox?: () => void;
}

export const DrawerHeroHeader: React.FC<DrawerHeroHeaderProps> = ({
  business,
  isGuest = false,
  onOpenLightbox
}) => {
  const fallbackCover = getCategoryFallbackCover(business.category);
  const coverUrl = business.coverPhoto || (business.photos && business.photos[0]) || fallbackCover;
  const isVerified = business.verificationStatus === 'verified';
  const isPending = business.verificationStatus === 'pending';
  const subCat = (business as any).subCategory;

  return (
    <div
      onClick={onOpenLightbox}
      className={`relative w-full h-48 sm:h-56 rounded-3xl overflow-hidden shadow-md bg-slate-900 mb-4 border border-[var(--border-color)] ${
        onOpenLightbox ? 'cursor-pointer group' : ''
      }`}
    >
      <img
        src={coverUrl}
        alt={business.nameAr}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        onError={(e: any) => {
          if (e.target.src !== fallbackCover) {
            e.target.src = fallbackCover;
          }
        }}
      />

      {/* Subtle bottom dark gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />

      {/* Top Watermark Badge (Matching Image 1) */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950/70 backdrop-blur-md text-white border border-white/20 shadow-xs">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-[10px] font-black tracking-tight text-white/95">
          موثق ميدانياً • دليلك
        </span>
      </div>

      {/* Bottom-left Verification Pill (Matching Image 1) */}
      <div className="absolute bottom-3 left-3 z-10">
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black shadow-sm backdrop-blur-md border ${
            isVerified
              ? 'bg-emerald-500/85 text-white border-emerald-400/40'
              : isPending
              ? 'bg-amber-500/85 text-white border-amber-400/40'
              : 'bg-slate-800/85 text-white border-slate-700/40'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{isVerified ? 'موثق ومعتمد' : isPending ? 'قيد المراجعة' : 'غير معتمد'}</span>
        </span>
      </div>

      {/* Bottom-right Title & Category (Matching Image 1) */}
      <div className="absolute bottom-3 right-3 z-10 max-w-[70%] text-right space-y-0.5">
        <h2 className="text-base sm:text-lg font-black text-white drop-shadow-md truncate">
          {business.nameAr}
        </h2>
        <p className="text-[11px] text-slate-200 font-bold drop-shadow-xs truncate">
          {business.category} {subCat ? `• ${subCat}` : ''}
        </p>
      </div>
    </div>
  );
};
