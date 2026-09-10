import React, { useState } from 'react';
import {
  ArrowRight,
  Check,
  Sparkles,
  MapPin,
  Compass,
  Grid,
  X,
  ChevronLeft,
} from 'lucide-react';
import { CATEGORY_GROUPS, EGYPT_GOVERNORATES, EGYPT_CITIES_BY_GOV } from '../../data/mockData';

export interface InteractiveOnboardingExperienceProps {
  onComplete: (selectedCategory: string, selectedGovernorate: string, selectedCity: string) => void;
  onSkip: () => void;
}

type Step = 0 | 1 | 2;

export const InteractiveOnboardingExperience: React.FC<InteractiveOnboardingExperienceProps> = ({
  onComplete,
  onSkip,
}) => {
  const [step, setStep] = useState<Step>(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedGovernorate, setSelectedGovernorate] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');

  const finish = () => {
    try {
      localStorage.setItem('dalelak_onboarding_completed', 'true');
    } catch {}
    onComplete(selectedCategory, selectedGovernorate, selectedCity);
  };

  const handleSkip = () => {
    try {
      localStorage.setItem('dalelak_onboarding_completed', 'true');
    } catch {}
    onSkip();
  };

  const stepsData = [
    { title: 'النشاط', icon: Grid },
    { title: 'المنطقة', icon: MapPin },
    { title: 'الانطلاق', icon: Compass },
  ];

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto"
    >
      {/* Ambient background glow effects */}
      <div className="fixed top-1/4 -right-20 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 -left-20 w-80 h-80 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Modal Card */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-amber-500/20 overflow-hidden flex flex-col my-auto transition-all duration-300">
        
        {/* Top Header Bar */}
        <div className="px-5 sm:px-8 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((prev) => (prev - 1) as Step)}
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors cursor-pointer py-1 px-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ArrowRight className="w-4 h-4" />
              <span>رجوع</span>
            </button>
          ) : (
            <div className="w-16" />
          )}

          {/* Stepper Dots / Badges */}
          <div className="flex items-center gap-2">
            {stepsData.map((s, idx) => {
              const isCurrent = step === idx;
              const isDone = step > idx;
              return (
                <div key={idx} className="flex items-center gap-1.5">
                  <div
                    className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs font-black transition-all ${
                      isCurrent
                        ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-500/20 shadow-md scale-105'
                        : isDone
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : idx + 1}
                  </div>
                  <span
                    className={`hidden sm:inline text-xs font-bold ${
                      isCurrent
                        ? 'text-amber-600 dark:text-amber-400'
                        : isDone
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {s.title}
                  </span>
                  {idx < stepsData.length - 1 && (
                    <div
                      className={`w-5 sm:w-8 h-0.5 rounded transition-all ${
                        isDone ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Skip Button */}
          <button
            type="button"
            onClick={handleSkip}
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors cursor-pointer py-1 px-2.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <span>تخطي</span>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-8 space-y-6">

          {/* Step 0: Category Selection */}
          {step === 0 && (
            <div className="space-y-5 animate-fade-in">
              <div className="text-center space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>دليلك الذكي بين يديك</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  على ماذا تبحث اليوم؟
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  اختر مجال النشاط الذي ترغب في استكشافه أو تصفح كل الأنشطة دفعة واحدة
                </p>
              </div>

              {/* Category Options Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 max-h-[50vh] overflow-y-auto p-1 custom-scrollbar">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('all');
                    setStep(1);
                  }}
                  className={`col-span-2 sm:col-span-3 p-3.5 rounded-2xl border transition-all text-center flex items-center justify-center gap-2.5 cursor-pointer font-black text-sm ${
                    selectedCategory === 'all'
                      ? 'border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-2 ring-amber-500/30'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 hover:border-amber-400 hover:bg-amber-50/50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <span className="text-xl">⭐</span>
                  <span>تصفح كل الأنشطة والمجالات</span>
                </button>

                {CATEGORY_GROUPS.map((group) => {
                  const isSelected = selectedCategory === group.group;
                  return (
                    <button
                      key={group.group}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(group.group);
                        setStep(1);
                      }}
                      className={`p-3 sm:p-4 rounded-2xl border text-center flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/15 text-amber-800 dark:text-amber-300 shadow-md ring-2 ring-amber-500/30 scale-[1.02]'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-amber-400 hover:bg-amber-50/50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:scale-[1.02]'
                      }`}
                    >
                      <span className="text-2xl sm:text-3xl group-hover:scale-110 transition-transform">
                        {group.icon}
                      </span>
                      <span className="text-xs sm:text-sm font-bold line-clamp-2 leading-tight">
                        {group.group}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 1: Governorate & City Selection */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div className="text-center space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>تحديد النطاق الجغرافي</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  هل تفضل منطقة محددة؟
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  اختر المحافظة أو تصفح كل المحافظات لرؤية جميع الأماكن
                </p>
              </div>

              <div className="space-y-4 max-h-[50vh] overflow-y-auto p-1 custom-scrollbar">
                {/* All Governorates Pill */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedGovernorate('all');
                    setSelectedCity('all');
                    setStep(2);
                  }}
                  className={`w-full py-3 px-4 rounded-2xl border font-black text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    selectedGovernorate === 'all'
                      ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:border-amber-400 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <span>📍 تصفح جميع محافظات ومناطق مصر</span>
                </button>

                {/* Governorates List */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 block pr-1">
                    أو اختر المحافظة:
                  </label>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {EGYPT_GOVERNORATES.map((gov) => {
                      const isSelected = selectedGovernorate === gov;
                      return (
                        <button
                          key={gov}
                          type="button"
                          onClick={() => {
                            setSelectedGovernorate(gov);
                            setSelectedCity('all');
                          }}
                          className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md font-black'
                              : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-amber-400 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {gov}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Cities List (shown when a specific governorate is picked) */}
                {selectedGovernorate !== 'all' && (
                  <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-slate-800/80 border border-amber-500/20 space-y-2.5 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-amber-800 dark:text-amber-300">
                        المدن والمناطق في ({selectedGovernorate}):
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                      <button
                        type="button"
                        onClick={() => setSelectedCity('all')}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          selectedCity === 'all'
                            ? 'bg-amber-600 text-white font-black'
                            : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:border-amber-400'
                        }`}
                      >
                        كل مدن {selectedGovernorate}
                      </button>

                      {EGYPT_CITIES_BY_GOV[selectedGovernorate]?.map((city) => {
                        const isCitySelected = selectedCity === city;
                        return (
                          <button
                            key={city}
                            type="button"
                            onClick={() => setSelectedCity(city)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              isCitySelected
                                ? 'bg-amber-600 text-white font-black'
                                : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:border-amber-400'
                            }`}
                          >
                            {city}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Continue to Step 2 Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full sm:w-auto px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                >
                  <span>متابعة</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Final Confirmation & Explore */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in text-center">
              <div className="space-y-2">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 shadow-xl shadow-amber-500/20 text-3xl sm:text-4xl animate-bounce-subtle">
                  🚀
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                  أنت جاهز لبدء الاستكشاف!
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  تم إعداد الدليل وتطبيق الفلاتر المناسبة لتجربة بحث سريعة ومباشرة
                </p>
              </div>

              {/* Selections Summary Card */}
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-4 space-y-3 max-w-md mx-auto text-right">
                <div className="text-xs font-black text-slate-400">ملخص اختياراتك:</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700">
                    <span className="text-slate-400 block mb-0.5 font-bold">النشاط:</span>
                    <span className="font-black text-amber-600 dark:text-amber-400">
                      {selectedCategory === 'all' ? 'جميع الأنشطة' : selectedCategory}
                    </span>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700">
                    <span className="text-slate-400 block mb-0.5 font-bold">المحافظة:</span>
                    <span className="font-black text-amber-600 dark:text-amber-400">
                      {selectedGovernorate === 'all' ? 'جميع المحافظات' : selectedGovernorate}
                    </span>
                  </div>
                  {selectedGovernorate !== 'all' && (
                    <div className="col-span-2 bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700">
                      <span className="text-slate-400 block mb-0.5 font-bold">المدينة / المنطقة:</span>
                      <span className="font-black text-amber-600 dark:text-amber-400">
                        {selectedCity === 'all' ? 'كل المدن' : selectedCity}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Big CTA */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={finish}
                  className="w-full sm:w-auto min-w-[240px] px-8 py-3.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-base rounded-2xl shadow-xl shadow-amber-500/25 hover:scale-105 active:scale-95 transition-all cursor-pointer inline-flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5 fill-slate-950" />
                  <span>ابدأ الاستكشاف الآن</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
