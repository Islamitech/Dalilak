import React from 'react';
import { Smartphone, Monitor } from 'lucide-react';

interface MobileSimulatorToggleProps {
  isSimulated: boolean;
  onToggle: () => void;
}

export const MobileSimulatorToggle: React.FC<MobileSimulatorToggleProps> = ({ isSimulated, onToggle }) => {
  return (
    <div className="fixed top-20 left-4 z-40 hidden md:flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-amber-500/30 p-2 rounded-2xl shadow-xl">
      <button
        onClick={onToggle}
        className="flex items-center gap-1.5 text-xs font-bold text-amber-300 hover:text-white px-2.5 py-1 rounded-xl hover:bg-slate-800 transition-colors"
      >
        {isSimulated ? <Monitor className="w-4 h-4 text-amber-400" /> : <Smartphone className="w-4 h-4 text-amber-400" />}
        <span>{isSimulated ? 'عرض الشاشة العريضة' : 'محاكاة هاتف المندوب'}</span>
      </button>
    </div>
  );
};
