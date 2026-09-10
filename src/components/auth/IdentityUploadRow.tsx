import React from 'react';
import { Eye, Trash2, UploadCloud } from 'lucide-react';

export interface IdentityUploadRowProps {
  label: string;
  badgeText: string;
  photoData: string;
  onChangeHandler: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveHandler: () => void;
  onPreviewHandler: () => void;
  icon: React.ReactNode;
  helpText: string;
}

export const IdentityUploadRow: React.FC<IdentityUploadRowProps> = ({
  label,
  badgeText,
  photoData,
  onChangeHandler,
  onRemoveHandler,
  onPreviewHandler,
  icon,
  helpText,
}) => {
  return (
    <div className="bg-[var(--bg-card)] p-2.5 rounded-2xl border border-[var(--border-color)] hover:border-amber-500/40 transition-all flex items-center justify-between gap-2 shadow-xs">
      <div className="flex items-center gap-2.5 min-w-0">
        {photoData ? (
          <div className="relative w-10 h-10 rounded-xl overflow-hidden border-2 border-emerald-500/80 shadow-xs shrink-0 group">
            <img src={photoData} alt={label} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={onPreviewHandler}
              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
              title="معاينة"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-500 shrink-0">
            {icon}
          </div>
        )}

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-black text-xs text-[var(--text-primary)] truncate">{label}</span>
            <span className="text-[9px] bg-amber-500/15 text-amber-800 font-bold px-1.5 py-0.2 rounded-md">
              {badgeText}
            </span>
          </div>
          <p className="text-[10px] text-[var(--text-muted)] truncate mt-0.5">{helpText}</p>
        </div>
      </div>

      {photoData ? (
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onPreviewHandler}
            className="p-1.5 rounded-lg bg-[var(--input-bg)] text-blue-600 hover:bg-blue-500/15 cursor-pointer transition-colors"
            title="معاينة"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onRemoveHandler}
            className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 cursor-pointer transition-colors"
            title="حذف وتغيير"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <label className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-[11px] py-1.5 px-3 rounded-xl cursor-pointer shadow-xs flex items-center gap-1 transition-transform active:scale-95 shrink-0">
          <UploadCloud className="w-3.5 h-3.5" />
          <span>إدراج</span>
          <input type="file" accept="image/*" onChange={onChangeHandler} className="hidden" />
        </label>
      )}
    </div>
  );
};
