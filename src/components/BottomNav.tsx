import React from 'react';
import { Home, Map, PlusCircle, UserCheck, Shield, ShieldCheck } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isAdmin: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, isAdmin }) => {
  const tabs = [
    { id: 'home', label: 'الرئيسية', icon: Home },
    { id: 'map', label: 'الخريطة', icon: Map },
    { id: 'add', label: 'تسجيل جديد', icon: PlusCircle, isPrimary: true },
    { id: 'invoices', label: 'المراجعات', icon: UserCheck },
    { id: isAdmin ? 'admin' : 'profile', label: isAdmin ? 'الإدارة' : 'ملفي', icon: isAdmin ? Shield : ShieldCheck },
  ];

  return (
    <nav role="navigation" aria-label="التنقل الرئيسي" className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--nav-bg)] backdrop-blur-md border-t border-[var(--border-color)] px-2 pt-1.5 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.06)] transition-colors duration-300" style={{ paddingBottom: `max(0.375rem, env(safe-area-inset-bottom, 0.375rem))` }}>
      <div className="max-w-md mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          if (tab.isPrimary) {
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (activeTab === 'add') {
                    window.dispatchEvent(new CustomEvent('dalelak_submit_business_form'));
                  } else {
                    setActiveTab(tab.id);
                  }
                }}
                aria-label={tab.label}
                className="flex flex-col items-center justify-center -mt-6 group cursor-pointer"
              >
                <div
                  className={`w-13 h-13 rounded-2xl flex items-center justify-center text-slate-950 font-extrabold shadow-xl transition-all duration-300 transform active:scale-90 ${
                    isActive
                      ? 'bg-gradient-to-tr from-amber-400 via-amber-500 to-yellow-500 ring-4 ring-amber-500/30 scale-105'
                      : 'bg-gradient-to-tr from-amber-500 to-yellow-500 group-hover:scale-105'
                  }`}
                >
                  <PlusCircle className="w-7 h-7 stroke-[2.5]" />
                </div>
                <span className={`text-[10px] font-black mt-1 transition-colors duration-200 ${isActive ? 'text-amber-500' : 'text-[var(--text-muted)]'}`}>{tab.label}</span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center justify-center py-1.5 px-2.5 rounded-xl transition-all duration-200 min-w-[48px] min-h-[44px] cursor-pointer ${
                isActive
                  ? 'text-amber-500 font-black bg-amber-500/10'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] font-bold'
              }`}
            >
              <Icon className={`w-5 h-5 transition-all duration-200 ${isActive ? 'stroke-[2.5] text-amber-500 scale-110' : 'stroke-[1.8]'}`} />
              <span className="text-[10px] mt-0.5 leading-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
