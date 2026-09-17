import React from 'react';
import { createPortal } from 'react-dom';

export interface ImagePreviewModalProps {
  previewImage: { url: string; title: string } | null;
  onClose: () => void;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  previewImage,
  onClose,
}) => {
  if (!previewImage) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative max-w-xl w-full text-center space-y-2">
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-10 left-0 bg-white/20 hover:bg-white/40 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-black cursor-pointer"
        >
          ✕
        </button>
        <h4 className="text-white font-black text-sm">{previewImage.title}</h4>
        <img
          src={previewImage.url}
          alt={previewImage.title}
          className="max-w-full max-h-[75vh] object-contain rounded-2xl border-2 border-amber-500 shadow-2xl mx-auto"
        />
      </div>
    </div>,
    document.body
  );
};
