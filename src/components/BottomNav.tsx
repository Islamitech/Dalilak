import React from 'react';
import { Home, Map, PlusCircle, FileText, Shield, ShieldCheck } from 'lucide-react';

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
    { id: 'invoices', label: 'الفواتير', icon: FileText },
    { id: isAdmin ? 'admin' : 'profile', label: isAdmin ? 'الإدارة' : 'ملفي الشخصي', icon: isAdmin ? Shield : ShieldCheck },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--nav-bg)] backdrop-blur-md border-t border-[var(--border-color)] px-2 py-1.5 shadow-xl transition-colors duration-300">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          if (tab.isPrimary) {
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex flex-col items-center justify-center -mt-6 group"
              >
                <div
                  className={`w-13 h-13 rounded-2xl flex items-center justify-center text-slate-950 font-extrabold shadow-xl transition-all transform active:scale-90 ${
                    isActive
                      ? 'bg-gradient-to-tr from-amber-400 via-amber-500 to-yellow-500 ring-4 ring-amber-500/30 scale-105'
                      : 'bg-gradient-to-tr from-amber-500 to-yellow-500 group-hover:scale-105'
                  }`}
                >
                  <PlusCircle className="w-7 h-7 stroke-[2.5]" />
                </div>
                <span className="text-[10px] font-black text-amber-500 mt-1">{tab.label}</span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                isActive
                  ? 'text-amber-500 font-black bg-amber-500/10'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] font-bold'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5] text-amber-500' : 'stroke-[1.8]'}`} />
              <span className="text-[11px] mt-0.5 leading-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
