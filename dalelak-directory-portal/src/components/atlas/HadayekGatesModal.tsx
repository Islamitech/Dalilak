import React from 'react';
import { HADAYEK_GATES, HadayekGate } from '../../data/hadayekAtlasData';
import {
  X,
  Compass,
  Clock,
  Car,
} from 'lucide-react';

export interface HadayekGatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectZone?: (zoneLetter: string) => void;
}

export const HadayekGatesModal: React.FC<HadayekGatesModalProps> = ({
  isOpen,
  onClose,
  onSelectZone,
}) => {
  if (!isOpen) return null;

  const handleOpenGateMaps = (gate: HadayekGate) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${gate.lat},${gate.lng}&query=${encodeURIComponent(
      gate.nameAr + ' ' + gate.popularNameAr + ' حدائق الأهرام'
    )}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="bg-[var(--bg-card)] border border-amber-500/30 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border-b border-[var(--border-color)] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md">
              <Compass className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[var(--text-primary)]">
                دليل بوابات حدائق الأهرام ومسارات الدخول
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                تعرف على البوابة المناسبة لعماراتك وأسهل مسار للوصول وتفادي الزحام
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: The 4 Gates Cards */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {HADAYEK_GATES.map((gate) => (
              <div
                key={gate.id}
                className="bg-slate-50 dark:bg-slate-900/60 border border-[var(--border-color)] hover:border-amber-500/50 rounded-2xl p-4 flex flex-col justify-between gap-3 transition-all hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-black flex items-center justify-center">
                        🚪
                      </span>
                      <h3 className="text-sm font-black text-[var(--text-primary)]">
                        {gate.nameAr} ({gate.popularNameAr})
                      </h3>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      24 ساعة
                    </span>
                  </div>

                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-3">
                    {gate.descriptionAr}
                  </p>

                  <div className="space-y-1.5 text-[11px] bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold">
                      <span>🚗 طريق المدخل:</span>
                      <span className="text-[var(--text-primary)]">{gate.accessRoadAr}</span>
                    </div>
                    <div className="flex items-start gap-1.5 font-medium text-[var(--text-secondary)]">
                      <span className="font-bold text-slate-600 dark:text-slate-400 shrink-0">
                        📍 تخدم مناطق:
                      </span>
                      <div className="flex items-center gap-1 flex-wrap">
                        {gate.servedZones.map((z) => (
                          <span
                            key={z}
                            onClick={() => {
                              if (onSelectZone) {
                                onSelectZone(z);
                                onClose();
                              }
                            }}
                            className="text-[10px] font-black bg-amber-500/15 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded cursor-pointer hover:bg-amber-500 hover:text-slate-950 transition-colors"
                            title="اختر هذه المنطقة في الأطلس"
                          >
                            منطقة {z}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-500 leading-normal pt-1 border-t border-slate-100 dark:border-slate-700">
                      💡 {gate.tipsAr}
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleOpenGateMaps(gate)}
                    className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    <Car className="w-3.5 h-3.5" />
                    <span>ملاحة بالسيارة لهذه البوابة</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-[var(--border-color)] flex items-center justify-between text-xs shrink-0">
          <span className="text-[11px] text-[var(--text-secondary)]">
            💡 نصيحة دليلك: ادخل دائماً من أقرب بوابة لعمارة وجهتك لتفادي التباطؤ داخل شوارع الحدائق.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold hover:bg-slate-300 transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
