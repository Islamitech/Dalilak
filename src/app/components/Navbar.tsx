'use client';
import React from 'react';
import { LogOut, User as UserIcon, ShieldCheck, MapPin } from 'lucide-react';
import { User } from './store';

interface NavbarProps {
  currentUser: User | null;
  onLogout: () => void;
  onSwitchRole?: (role: 'admin' | 'employee') => void;
}

export default function Navbar({ currentUser, onLogout, onSwitchRole }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 bg-[#1E4A3A] text-white shadow-md border-b border-[#143529] px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Left / Brand Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-950 border border-emerald-500/40 flex items-center justify-center shrink-0 shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="دليلك" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight text-emerald-100 flex items-center gap-1.5">
              <span>دليلك</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-800/80 text-emerald-200 border border-emerald-600/50">
                التوثيق الميداني
              </span>
            </h1>
            {currentUser && (
              <p className="text-xs text-emerald-200/90 flex items-center gap-1 mt-0.5">
                {currentUser.role === 'admin' ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>{currentUser.name}</span>
                <span className="opacity-75">
                  ({currentUser.role === 'admin' ? 'مدير المنظومة' : 'موظف ميداني'})
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Right / Actions & Role Switch & Logout */}
        <div className="flex items-center gap-2">
          {onSwitchRole && currentUser && (
            <button
              onClick={() => onSwitchRole(currentUser.role === 'admin' ? 'employee' : 'admin')}
              className="text-xs bg-emerald-900/90 hover:bg-emerald-800 text-amber-300 border border-amber-400/40 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all"
              title="تبديل الدور للتجربة"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">تبديل إلى:</span>
              <span className="font-bold">{currentUser.role === 'admin' ? 'موظف' : 'مدير'}</span>
            </button>
          )}

          <button
            onClick={onLogout}
            className="bg-rose-900/80 hover:bg-rose-800 text-rose-100 border border-rose-600/50 px-3 py-2 rounded-xl flex items-center gap-1.5 font-bold text-sm transition-all"
            title="تسجيل الخروج"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">خروج</span>
          </button>
        </div>
      </div>
    </header>
  );
}
