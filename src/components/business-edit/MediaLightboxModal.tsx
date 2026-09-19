import React from 'react';
import { OverlayLayer } from '../ui/OverlayLayer';
import { X } from 'lucide-react';

export interface MediaLightboxModalProps {
  photoUrl: string | null;
  onClose: () => void;
}

export const MediaLightboxModal: React.FC<MediaLightboxModalProps> = ({
  photoUrl,
  onClose,
}) => {
  if (!photoUrl) return null;

  return (
    <OverlayLayer
      onEscape={onClose}
      aria-label="معاينة صورة النشاط"
      className="fixed inset-0 z-[10000] bg-slate-950/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-slate-300 p-1 cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>
        <img
          src={photoUrl}
          alt="معاينة الصورة"
          className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl border border-white/20 animate-fade-in"
        />
      </div>
    </OverlayLayer>
  );
};
