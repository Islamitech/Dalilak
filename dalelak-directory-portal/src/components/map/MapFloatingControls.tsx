import React from 'react';
import {
  ZoomIn,
  ZoomOut,
  Target,
  Crosshair,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Layers,
} from 'lucide-react';

import { MapTileLayerType } from './constants/mapConstants';

export interface MapFloatingControlsProps {
  mode: 'picker' | 'view';
  centerReticleActive: boolean;
  setCenterReticleActive: (active: boolean) => void;
  handleZoomIn: () => void;
  handleZoomOut: () => void;
  handlePinCenterOfMap: () => void;
  handleResetPosition: () => void;
  handlePan: (direction: 'up' | 'down' | 'left' | 'right') => void;
  tileLayer: MapTileLayerType;
  switchTileLayer: (layer: MapTileLayerType) => void;
}

export const MapFloatingControls: React.FC<MapFloatingControlsProps> = ({
  mode,
  centerReticleActive,
  setCenterReticleActive,
  handleZoomIn,
  handleZoomOut,
  handlePinCenterOfMap,
  handleResetPosition,
  handlePan,
  tileLayer,
  switchTileLayer,
}) => {
  return (
    <>
      {/* 🎯 Precision Center Reticle Crosshair (Overlay in center of screen) */}
      {centerReticleActive && mode === 'picker' && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-[1000]">
          <div className="relative flex items-center justify-center">
            {/* Outer Crosshair Ring */}
            <div className="w-16 h-16 rounded-full border-2 border-amber-400/80 border-dashed animate-spin-slow flex items-center justify-center shadow-2xl bg-amber-500/10" />
            {/* Center Cross lines */}
            <div className="absolute w-24 h-0.5 bg-amber-400/90" />
            <div className="absolute h-24 w-0.5 bg-amber-400/90" />
            {/* Center Dot */}
            <div className="absolute w-3 h-3 rounded-full bg-amber-400 border-2 border-slate-950 shadow-lg" />
          </div>
        </div>
      )}

      {/* FLOATING CONTROLS TOOLBAR OVER MAP */}
      {/* 1. Zoom, Center Pin, & Reset Controls (Top Right Overlay) */}
      <div className="absolute top-20 right-3 sm:right-5 flex flex-col gap-1.5 sm:gap-2 z-[900]">
        <button
          type="button"
          onClick={handleZoomIn}
          className="bg-white/95 backdrop-blur-md hover:bg-amber-500 text-slate-700 hover:text-slate-950 p-2.5 sm:p-2 rounded-2xl border border-slate-200/90 shadow-lg hover:shadow-xl transition-all font-bold text-xs flex items-center justify-center active:scale-95 cursor-pointer"
          title="تكبير الخريطة (+)"
        >
          <ZoomIn className="w-5 h-5 sm:w-4 sm:h-4 stroke-[2.5]" />
        </button>

        <button
          type="button"
          onClick={handleZoomOut}
          className="bg-white/95 backdrop-blur-md hover:bg-amber-500 text-slate-700 hover:text-slate-950 p-2.5 sm:p-2 rounded-2xl border border-slate-200/90 shadow-lg hover:shadow-xl transition-all font-bold text-xs flex items-center justify-center active:scale-95 cursor-pointer"
          title="تصغير الخريطة (-)"
        >
          <ZoomOut className="w-5 h-5 sm:w-4 sm:h-4 stroke-[2.5]" />
        </button>

        {mode === 'picker' && (
          <button
            type="button"
            onClick={handlePinCenterOfMap}
            className="bg-white/95 backdrop-blur-md hover:bg-amber-500 text-amber-600 hover:text-slate-950 p-2.5 sm:p-2 rounded-2xl border border-slate-200/90 shadow-lg hover:shadow-xl transition-all font-bold text-xs flex items-center justify-center active:scale-95 cursor-pointer"
            title="تثبيت الدبوس في منتصف شاشة الخريطة الحالية"
          >
            <Target className="w-5 h-5 sm:w-4 sm:h-4 stroke-[2.5]" />
          </button>
        )}

        {mode === 'picker' && (
          <button
            type="button"
            onClick={() => setCenterReticleActive(!centerReticleActive)}
            className={`p-2.5 sm:p-2 rounded-2xl border shadow-lg hover:shadow-xl transition-all font-bold text-xs flex items-center justify-center active:scale-95 cursor-pointer ${
              centerReticleActive
                ? 'bg-amber-500 text-slate-950 border-amber-400'
                : 'bg-white/95 hover:bg-amber-50 text-amber-600 border-slate-200/90'
            }`}
            title="تفعيل/إلغاء علامة التصويب الدقيقة (Crosshair Target)"
          >
            <Crosshair className="w-5 h-5 sm:w-4 sm:h-4 stroke-[2.5]" />
          </button>
        )}

        <button
          type="button"
          onClick={handleResetPosition}
          className="bg-white/95 backdrop-blur-md hover:bg-amber-50 text-amber-600 hover:text-amber-800 p-2.5 sm:p-2 rounded-2xl border border-slate-200/90 shadow-lg hover:shadow-xl transition-all font-bold text-xs flex items-center justify-center active:scale-95 cursor-pointer"
          title="إعادة ضبط الموضع لحدائق الأهرام"
        >
          <RotateCcw className="w-5 h-5 sm:w-4 sm:h-4" />
        </button>
      </div>

      {/* 2. D-PAD Directional Pan Movement Controls (Only for Picker Mode) */}
      {mode === 'picker' && (
        <div className="absolute top-20 left-3 bg-white/95 border border-slate-200 p-1.5 rounded-2xl shadow-xl backdrop-blur-md z-[900] flex flex-col items-center gap-1">
          <span className="text-[9px] font-bold text-amber-600 uppercase tracking-tighter">تحريك دقيق</span>

          <button
            type="button"
            onClick={() => handlePan('up')}
            className="bg-slate-50 hover:bg-amber-500 text-slate-700 hover:text-slate-950 p-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
            title="تحريك لأعلى"
          >
            <ChevronUp className="w-4 h-4 stroke-[3]" />
          </button>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handlePan('left')}
              className="bg-slate-50 hover:bg-amber-500 text-slate-700 hover:text-slate-950 p-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
              title="تحريك لليسار"
            >
              <ChevronLeft className="w-4 h-4 stroke-[3]" />
            </button>

            <div className="w-5 h-5 rounded-md bg-amber-500/20 text-amber-600 flex items-center justify-center text-[10px] font-bold">
              <Crosshair className="w-3 h-3" />
            </div>

            <button
              type="button"
              onClick={() => handlePan('right')}
              className="bg-slate-50 hover:bg-amber-500 text-slate-700 hover:text-slate-950 p-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
              title="تحريك لليمين"
            >
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => handlePan('down')}
            className="bg-slate-50 hover:bg-amber-500 text-slate-700 hover:text-slate-950 p-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
            title="تحريك لأسفل"
          >
            <ChevronDown className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      )}
    </>
  );
};
