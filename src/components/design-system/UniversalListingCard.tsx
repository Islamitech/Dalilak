import React from 'react';
import { Star, MapPin, Clock, Film } from 'lucide-react';
import { Business } from '../../types';
import { isTrendingFreeActivity } from '../../utils/categoryMatcher';
import { VerificationPill, PaymentPill } from './StatusPill';
import { QuickActionBar } from './QuickActionBar';

interface UniversalListingCardProps {
  business: Business;
  variant?: 'grid' | 'row';
  onClick?: (business: Business) => void;
  showAdminMetrics?: boolean;
}

export const UniversalListingCard: React.FC<UniversalListingCardProps> = ({
  business,
  variant = 'grid',
  onClick,
  showAdminMetrics = false,
}) => {
  const isExempt = isTrendingFreeActivity(business);
  const cover =
    business.coverPhoto ||
    (business.photos && business.photos.length > 0 ? business.photos[0] : null) ||
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80';

  if (variant === 'row') {
    return (
      <div
        onClick={() => onClick && onClick(business)}
        className="group bg-[var(--bg-card)] rounded-2xl p-3 sm:p-4 border border-[var(--border-color)] hover:border-amber-500/50 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4"
      >
        <div className="flex items-center gap-3.5 w-full md:w-auto">
          <img
            src={cover}
            alt={business.nameAr}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover border border-[var(--border-color)] shrink-0"
            onError={(e: any) => {
              e.target.src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&q=80';
            }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-sm sm:text-base text-[var(--text-primary)] group-hover:text-amber-500 transition-colors truncate">
                {business.nameAr}
              </h3>
              <VerificationPill status={business.verificationStatus} size="sm" />
              {isExempt && <PaymentPill status={business.paymentStatus} isFeeExempt={true} size="sm" />}
              {business.googleRating && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-md border border-amber-500/20">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>{business.googleRating.toFixed(1)}</span>
                  <span className="text-[var(--text-muted)] font-normal">({business.googleReviewsCount || 0})</span>
                </span>
              )}
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-[var(--text-secondary)]">{business.category}</span>
              <span className="text-[var(--text-muted)]">•</span>
              <span className="flex items-center gap-0.5 text-[var(--text-muted)]">
                <MapPin className="w-3 h-3 text-rose-500" />
                {business.governorate} - {business.city}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-2.5 md:pt-0 border-[var(--border-color)]">
          {showAdminMetrics && (
            <div className="text-left md:text-right text-xs shrink-0">
              <div className="font-black text-[var(--text-primary)]">{business.amountPaid || 0} ج.م</div>
              <div className="text-[10px] text-[var(--text-muted)] font-mono">فاتورة #{business.invoiceNumber}</div>
            </div>
          )}
          <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
            <QuickActionBar business={business} compact={true} />
          </div>
        </div>
      </div>
    );
  }

  // Grid Layout
  return (
    <div
      onClick={() => onClick && onClick(business)}
      className="group bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] hover:border-amber-500/50 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden flex flex-col"
    >
      {/* Image Banner */}
      <div className="relative aspect-[16/10] w-full bg-[var(--bg-secondary)] overflow-hidden">
        <img
          src={cover}
          alt={business.nameAr}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e: any) => {
            e.target.src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80';
          }}
        />

        {/* Video Tour Badge Indicator */}
        {business.videos && business.videos.length > 0 && (
          <div className="absolute bottom-2.5 right-2.5 z-10 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-950/80 backdrop-blur-xs text-white border border-white/20 text-[10px] font-bold">
            <Film className="w-3 h-3 text-amber-400" />
            <span>فيديو</span>
          </div>
        )}

        {/* Status badges */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 items-end">
          <VerificationPill status={business.verificationStatus} size="sm" />
          {isExempt && <PaymentPill status={business.paymentStatus} isFeeExempt={true} size="sm" />}
        </div>

        {/* Rating Badge */}
        {business.googleRating && (
          <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-lg bg-slate-950/80 backdrop-blur-xs shadow-xs flex items-center gap-1 text-[11px] font-bold text-white border border-white/10">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{business.googleRating.toFixed(1)}</span>
            <span className="text-slate-300 font-normal text-[10px]">({business.googleReviewsCount || 0})</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="text-[11px] font-bold text-amber-500 mb-1 tracking-wide">
            {business.category}
          </div>
          <h3 className="text-sm sm:text-base font-black text-[var(--text-primary)] group-hover:text-amber-500 transition-colors line-clamp-1">
            {business.nameAr}
          </h3>
          <p className="text-xs text-[var(--text-muted)] mt-1 flex items-center gap-1 line-clamp-1">
            <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
            <span>{business.governorate}، {business.city} - {business.street}</span>
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3 text-[var(--text-muted)] shrink-0" />
            <span className="truncate">{business.workingHours}</span>
          </p>
        </div>

        {/* Quick Actions */}
        <div onClick={(e) => e.stopPropagation()}>
          <QuickActionBar business={business} compact={false} />
        </div>
      </div>
    </div>
  );
};
