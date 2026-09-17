import React from 'react';
import { Home, Map, PlusCircle, UserCheck, Shield, ShieldCheck, FileText } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isAdmin: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, isAdmin }) => {
  const tabs = isAdmin
    ? [
        { id: 'admin', label: 'العمليات', icon: Shield },
        { id: 'home', label: 'الدليل', icon: Home },
        { id: 'add', label: 'تسجيل جديد', icon: PlusCircle, isPrimary: true },
        { id: 'map', label: 'الخريطة', icon: Map },
        { id: 'profile', label: 'حسابي', icon: ShieldCheck },
      ]
    : [
        { id: 'home', label: 'بوابتي', icon: Home },
        { id: 'map', label: 'الخريطة', icon: Map },
        { id: 'add', label: 'تسجيل جديد', icon: PlusCircle, isPrimary: true },
        { id: 'invoices', label: 'الفرص', icon: FileText },
        { id: 'profile', label: 'ملفي', icon: ShieldCheck },
      ];

  return (
    /* hidden on md+ screens — desktop/tablet users navigate via top Navbar */
    <nav role="navigation" aria-label="التنقل الرئيسي" className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--nav-bg)] backdrop-blur-md border-t border-[var(--border-color)] px-1.5 pt-1 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.06)] transition-colors duration-300" style={{ paddingBottom: `max(0.375rem, env(safe-area-inset-bottom, 0.375rem))` }}>
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          if (tab.isPrimary) {
            return (
              <button
                key={tab.id}
                onClick={() => {
                  triggerHaptic('medium');
                  if (activeTab === 'add') {
                    // Safe UX: Smooth scroll to top when already on form instead of accidental submission
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  } else {
                    setActiveTab(tab.id);
                  }
                }}
                aria-label={tab.label}
                className="flex flex-col items-center justify-center -mt-5 group cursor-pointer"
              >
                <div
                  className={`w-[3.15rem] h-[3.15rem] rounded-2xl flex items-center justify-center text-slate-950 font-extrabold shadow-xl transition-all duration-300 transform active:scale-90 ${
                    isActive
                      ? 'bg-gradient-to-tr from-amber-400 via-amber-500 to-yellow-500 ring-4 ring-amber-500/30 scale-105'
                      : 'bg-gradient-to-tr from-amber-500 to-yellow-500 group-hover:scale-105'
                  }`}
                >
                  <PlusCircle className="w-6.5 h-6.5 stroke-[2.5]" />
                </div>
                <span className={`text-[10px] font-black mt-0.5 transition-colors duration-200 ${isActive ? 'text-amber-700' : 'text-[var(--text-muted)]'}`}>{tab.label}</span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => {
                triggerHaptic('selection');
                setActiveTab(tab.id);
              }}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all duration-200 min-w-[42px] cursor-pointer ${
                isActive
                  ? 'text-amber-700 font-black bg-amber-500/15 ring-1 ring-amber-500/20'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] font-bold'
              }`}
            >
              <Icon className={`w-4.5 h-4.5 transition-all duration-200 ${isActive ? 'stroke-[2.5] text-amber-700 scale-110' : 'stroke-[1.8]'}`} />
              <span className={`text-[10px] mt-0.5 leading-tight ${isActive ? 'font-black text-amber-700' : 'font-bold'}`}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
