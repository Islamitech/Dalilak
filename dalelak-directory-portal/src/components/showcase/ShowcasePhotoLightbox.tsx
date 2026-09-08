import React, { useState } from 'react';
import { PhotoWatermarkBadge } from '../PhotoWatermarkBadge';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export interface ShowcasePhotoLightboxProps {
  photos: string[];
  previewPhotoIndex: number | null;
  setPreviewPhotoIndex: (index: number | null) => void;
  handlePrevPhoto: () => void;
  handleNextPhoto: () => void;
}

export const ShowcasePhotoLightbox: React.FC<ShowcasePhotoLightboxProps> = ({
  photos,
  previewPhotoIndex,
  setPreviewPhotoIndex,
  handlePrevPhoto,
  handleNextPhoto,
}) => {
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  if (previewPhotoIndex === null || photos.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] bg-slate-950/97 backdrop-blur-md flex items-center justify-center animate-fade-in"
      onClick={() => setPreviewPhotoIndex(null)}
      onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchStartX === null) return;
        const delta = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(delta) > 50) {
          delta > 0 ? handlePrevPhoto() : handleNextPhoto();
        }
        setTouchStartX(null);
      }}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handlePrevPhoto();
        }}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-slate-800/80 hover:bg-amber-500 text-white hover:text-slate-950 flex items-center justify-center transition-all cursor-pointer shadow-xl"
        title="الصورة السابقة"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="relative inline-block max-w-full max-h-[85vh]">
        <img
          src={photos[previewPhotoIndex]}
          alt={`صورة ${previewPhotoIndex + 1}`}
          className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain animate-fade-in-scale"
          onClick={(e) => e.stopPropagation()}
        />
        <PhotoWatermarkBadge
          position="bottom-right"
          size="xl"
          className="!bottom-4 !right-4 sm:!bottom-6 sm:!right-6 shadow-2xl"
        />
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          handleNextPhoto();
        }}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-slate-800/80 hover:bg-amber-500 text-white hover:text-slate-950 flex items-center justify-center transition-all cursor-pointer shadow-xl"
        title="الصورة التالية"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      <button
        type="button"
        onClick={() => setPreviewPhotoIndex(null)}
        className="absolute top-4 left-4 w-10 h-10 rounded-full bg-slate-800/80 hover:bg-rose-600 text-white flex items-center justify-center cursor-pointer transition-all"
        title="إغلاق"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {photos.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setPreviewPhotoIndex(i);
            }}
            className={`rounded-full transition-all cursor-pointer ${
              i === previewPhotoIndex ? 'w-6 h-2 bg-amber-500' : 'w-2 h-2 bg-white/40 hover:bg-white/70'
            }`}
          />
        ))}
      </div>

      <span className="absolute bottom-4 right-4 text-white/70 text-xs font-bold">
        {previewPhotoIndex + 1} / {photos.length}
      </span>
    </div>
  );
};
