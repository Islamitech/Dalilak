import React from 'react';
import { createPortal } from 'react-dom';
import { Representative } from '../../../types';

interface AdminAvatarModalProps {
  rep: Representative | null;
  onClose: () => void;
  onUpdateRepresentative?: (rep: Representative) => void;
}

export const AdminAvatarModal: React.FC<AdminAvatarModalProps> = ({
  rep,
  onClose,
  onUpdateRepresentative,
}) => {
  if (!rep) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl relative text-[var(--text-primary)] my-auto transition-colors duration-300 max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)] w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border border-[var(--border-color)] cursor-pointer"
        >
          ✕
        </button>

        <div className="text-center space-y-1 pt-1">
          <h3 className="font-black text-base text-[var(--text-primary)]">معاينة وثيقة الهوية المرفوعة</h3>
          <p className="text-xs text-amber-500 font-bold">
            {rep.name} • {rep.governorate}
          </p>
        </div>

        <div className="bg-[var(--input-bg)] p-3 rounded-2xl border border-[var(--border-color)] flex flex-col items-center justify-center space-y-3">
          {rep.avatar ? (
            <img
              src={rep.avatar}
              alt={rep.name}
              loading="lazy"
              decoding="async"
              className="max-w-full max-h-[60vh] object-contain rounded-2xl border-2 border-amber-500 shadow-xl"
            />
          ) : (
            <div className="w-40 h-40 rounded-2xl bg-slate-800 flex items-center justify-center text-amber-400 font-black text-4xl">
              {rep.name.charAt(0)}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            type="button"
            onClick={() => {
              if (onUpdateRepresentative) {
                onUpdateRepresentative({ ...rep, avatarStatus: 'approved' });
              }
              onClose();
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-2.5 rounded-xl shadow cursor-pointer transition-transform active:scale-95"
          >
            ✔ قبول وتوثيق
          </button>

          <button
            type="button"
            onClick={() => {
              if (onUpdateRepresentative) {
                onUpdateRepresentative({ ...rep, avatarStatus: 'rejected' });
              }
              onClose();
            }}
            className="bg-rose-600 hover:bg-rose-700 text-white font-black text-xs py-2.5 rounded-xl shadow cursor-pointer transition-transform active:scale-95"
          >
            ✕ رفض الوثيقة
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
