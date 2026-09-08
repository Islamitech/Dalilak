import React, { useState } from 'react';
import {
  Compass,
  Search,
  Sparkles,
  MapPin,
  UtensilsCrossed,
  HeartPulse,
  Wrench,
  ArrowLeft,
} from 'lucide-react';

export interface InteractiveOnboardingExperienceProps {
  onExploreAround: () => void;
  onSearchSpecific: () => void;
  onAddBusinessFree: () => void;
  onSkip: () => void;
}

export const InteractiveOnboardingExperience: React.FC<InteractiveOnboardingExperienceProps> = ({
  onExploreAround,
  onSearchSpecific,
  onAddBusinessFree,
  onSkip,
}) => {
  const [isExiting, setIsExiting] = useState<boolean>(false);
  const [selectedIntent, setSelectedIntent] = useState<string | null>(null);

  const handleAction = (intent: 'explore' | 'search' | 'add' | 'skip') => {
    setSelectedIntent(intent);
    setIsExiting(true);

    try {
      localStorage.setItem('dalelak_onboarding_completed', 'true');
    } catch {}

    setTimeout(() => {
      if (intent === 'explore') onExploreAround();
      else if (intent === 'search') onSearchSpecific();
      else if (intent === 'add') onAddBusinessFree();
      else onSkip();
    }, 450);
  };

  return (
    <div
      className={`fixed inset-0 z-[999999] bg-slate-950/98 backdrop-blur-2xl flex flex-col justify-between text-white font-['Cairo',sans-serif] overflow-hidden select-none transition-all duration-500 ${
        isExiting ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
      style={{ direction: 'rtl' }}
    >
      {/* Dynamic Background Mesh Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:28px_28px] opacity-35" />
      </div>

      {/* Top Header Bar */}
      <header className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 pt-5 sm:pt-7 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shadow-lg shadow-amber-500/10">
            <span className="text-amber-400 font-black text-sm">د</span>
          </div>
          <div>
            <span className="text-xs font-black tracking-wider text-amber-400 uppercase">منظومة دليلك</span>
            <span className="text-[10px] block text-slate-400 font-bold">بوابتك الجغرافية الشاملة</span>
          </div>
        </div>

        <button
          onClick={() => handleAction('skip')}
          className="group flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-500/50 text-slate-300 hover:text-amber-300 text-xs font-bold transition-all duration-200 cursor-pointer shadow-md hover:scale-105 active:scale-95"
          aria-label="تخطي الافتتاحية"
        >
          <span>تخطي وابدأ الاستكشاف</span>
          <ArrowLeft className="w-3.5 h-3.5 text-amber-400 group-hover:-translate-x-0.5 transition-transform" />
        </button>
      </header>

      {/* Middle Interactive Map Canvas with Egypt Silhouette & Golden Pulse */}
      <main className="relative z-10 flex-1 w-full max-w-4xl mx-auto px-4 flex flex-col items-center justify-center my-auto">
        <div className="relative w-full max-w-[420px] sm:max-w-[480px] aspect-[4/3] flex items-center justify-center">
          {/* Stylized Vector Silhouette of Egypt */}
          <svg
            viewBox="0 0 500 400"
            className="w-full h-full opacity-35 drop-shadow-[0_0_25px_rgba(245,158,11,0.15)]"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Egypt Outline & Nile Valley Aesthetic Path */}
            <path
              d="M 120,40 C 180,45 280,42 360,55 C 380,60 410,90 400,120 C 430,160 440,240 420,330 C 370,340 310,345 220,345 C 130,345 110,330 90,280 C 80,210 85,110 120,40 Z"
              fill="url(#egyptGradient)"
              stroke="#d97706"
              strokeWidth="1.5"
              strokeDasharray="4 3"
              className="opacity-50"
            />
            {/* The Nile Flow */}
            <path
              d="M 270,55 Q 260,110 250,150 T 265,230 T 240,310 T 255,345"
              stroke="#0284c7"
              strokeWidth="2"
              strokeLinecap="round"
              className="opacity-40"
            />
            {/* Sinai Peninsula */}
            <path
              d="M 360,55 C 380,80 410,105 385,145 C 370,120 355,90 360,55 Z"
              fill="#d97706"
              fillOpacity="0.08"
              stroke="#d97706"
              strokeWidth="1"
              className="opacity-40"
            />
            <defs>
              <linearGradient id="egyptGradient" x1="100" y1="40" x2="420" y2="345" gradientUnits="userSpaceOnUse">
                <stop stopColor="#f59e0b" stopOpacity="0.07" />
                <stop offset="0.5" stopColor="#0f172a" stopOpacity="0.4" />
                <stop offset="1" stopColor="#10b981" stopOpacity="0.05" />
              </linearGradient>
            </defs>
          </svg>

          {/* Golden Beacon Center (Hadayek El Ahram / Giza Focal Point) */}
          <div className="absolute top-[32%] left-[49%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
            {/* Golden Radiating Waves */}
            <div className="absolute w-28 h-28 rounded-full bg-amber-500/20 animate-ping opacity-60 pointer-events-none" />
            <div className="absolute w-20 h-20 rounded-full border border-amber-400/40 bg-amber-500/10 animate-pulse pointer-events-none" />
            <div className="absolute w-12 h-12 rounded-full border-2 border-amber-400/80 bg-amber-400/30 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.6)]">
              <span className="w-3.5 h-3.5 rounded-full bg-amber-300 shadow-[0_0_10px_#fde047]" />
            </div>

            {/* Current Default Position Pill */}
            <div className="absolute -top-10 whitespace-nowrap bg-gradient-to-r from-slate-900/95 to-slate-950/95 border border-amber-500/50 text-amber-300 px-3 py-1 rounded-full text-[11px] font-black shadow-xl backdrop-blur-md flex items-center gap-1.5 animate-bounce">
              <MapPin className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>موقعك الافتراضي: حدائق الأهرام، الجيزة</span>
            </div>
          </div>

          {/* 1. Micro-Beacon: Restaurant (مطعم) */}
          <div
            className="absolute top-[16%] right-[10%] sm:right-[15%] flex items-center gap-2 bg-slate-900/90 border border-amber-500/40 hover:border-amber-400 px-2.5 py-1.5 rounded-xl shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-105 animate-fade-in"
            style={{ animationDelay: '200ms' }}
          >
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <UtensilsCrossed className="w-3.5 h-3.5" />
            </div>
            <div className="text-right">
              <span className="text-[11px] font-black text-amber-300 block leading-tight">مطعم وكافيه</span>
              <span className="text-[9px] text-slate-400 font-bold">توثيق مباشر</span>
            </div>
          </div>

          {/* 2. Micro-Beacon: Pharmacy (صيدلية) */}
          <div
            className="absolute top-[62%] right-[8%] sm:right-[12%] flex items-center gap-2 bg-slate-900/90 border border-emerald-500/40 hover:border-emerald-400 px-2.5 py-1.5 rounded-xl shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-105 animate-fade-in"
            style={{ animationDelay: '400ms' }}
          >
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <HeartPulse className="w-3.5 h-3.5" />
            </div>
            <div className="text-right">
              <span className="text-[11px] font-black text-emerald-300 block leading-tight">صيدلية وطوارئ</span>
              <span className="text-[9px] text-slate-400 font-bold">خدمة 24 ساعة</span>
            </div>
          </div>

          {/* 3. Micro-Beacon: Auto Service (خدمة سيارات) */}
          <div
            className="absolute top-[50%] left-[8%] sm:left-[12%] flex items-center gap-2 bg-slate-900/90 border border-cyan-500/40 hover:border-cyan-400 px-2.5 py-1.5 rounded-xl shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-105 animate-fade-in"
            style={{ animationDelay: '600ms' }}
          >
            <div className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
              <Wrench className="w-3.5 h-3.5" />
            </div>
            <div className="text-right">
              <span className="text-[11px] font-black text-cyan-300 block leading-tight">خدمة سيارات</span>
              <span className="text-[9px] text-slate-400 font-bold">صيانة وإحداثيات GPS</span>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Action Intent Box */}
      <footer className="relative z-10 w-full max-w-3xl mx-auto px-4 sm:px-6 pb-6 sm:pb-8">
        <div className="bg-gradient-to-b from-slate-900/90 to-slate-950/95 border border-amber-500/30 rounded-3xl p-4 sm:p-6 shadow-2xl backdrop-blur-xl">
          {/* Question Title */}
          <div className="text-center mb-4 sm:mb-5">
            <div className="inline-flex items-center gap-1.5 text-amber-400 text-xs font-black uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>دليلك يبدأ من مكانك</span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black text-white">ما الذي تبحث عنه اليوم؟</h2>
            <p className="text-xs text-slate-400 font-bold mt-1 max-w-md mx-auto">
              اختر وجهتك وسنقوم بضبط الفلاتر وعرض أهم المحلات والخدمات حولك فورياً.
            </p>
          </div>

          {/* 3 Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
            {/* Action 1: Explore Around */}
            <button
              type="button"
              onClick={() => handleAction('explore')}
              className={`group relative overflow-hidden p-3.5 rounded-2xl text-right transition-all duration-200 cursor-pointer border ${
                selectedIntent === 'explore'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 scale-[1.02]'
                  : 'bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border-amber-500/50 hover:border-amber-400 text-white hover:bg-amber-500/30'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Compass className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                  الموصى به
                </span>
              </div>
              <div className="font-black text-sm sm:text-base text-amber-300 group-hover:text-amber-200">
                اكتشف حولي
              </div>
              <div className="text-[10.5px] text-slate-300 font-bold mt-0.5 leading-tight">
                أنشطة وخدمات حدائق الأهرام
              </div>
            </button>

            {/* Action 2: Search Specific */}
            <button
              type="button"
              onClick={() => handleAction('search')}
              className={`group relative overflow-hidden p-3.5 rounded-2xl text-right transition-all duration-200 cursor-pointer border ${
                selectedIntent === 'search'
                  ? 'bg-slate-800 text-white border-white scale-[1.02]'
                  : 'bg-slate-900/80 border-slate-700/80 hover:border-slate-500 text-white hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-200 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Search className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-slate-400">
                  بحث دقيق
                </span>
              </div>
              <div className="font-black text-sm sm:text-base text-white">
                محل أو خدمة محددة
              </div>
              <div className="text-[10.5px] text-slate-400 font-bold mt-0.5 leading-tight">
                بالاسم، التصنيف أو التخصص
              </div>
            </button>

            {/* Action 3: Add Business Free */}
            <button
              type="button"
              onClick={() => handleAction('add')}
              className={`group relative overflow-hidden p-3.5 rounded-2xl text-right transition-all duration-200 cursor-pointer border ${
                selectedIntent === 'add'
                  ? 'bg-emerald-600 text-white border-emerald-400 scale-[1.02]'
                  : 'bg-gradient-to-r from-emerald-500/15 to-teal-500/10 border-emerald-500/40 hover:border-emerald-400 text-white hover:bg-emerald-500/25'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Sparkles className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                  مجاناً 0 ج.م
                </span>
              </div>
              <div className="font-black text-sm sm:text-base text-emerald-300 group-hover:text-emerald-200">
                أضف نشاطك مجاناً
              </div>
              <div className="text-[10.5px] text-slate-300 font-bold mt-0.5 leading-tight">
                وثّق محلك وانضم لدليل مصر
              </div>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
