import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  MapPin,
  Search,
  ArrowLeft,
  ArrowRight,
  Check,
  X,
  Compass,
} from 'lucide-react';

export type CinematicTourStep =
  | 'welcome'
  | 'typewriter'
  | 'search_spotlight'
  | 'gov_spotlight'
  | 'completed';

export interface CinematicHeroTourProps {
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
  onSelectSuggestion: (query: string) => void;
  onSelectGovernorate?: (gov: string) => void;
  currentGov?: string;
  onStepChange?: (step: CinematicTourStep) => void;
}

const SEARCH_SUGGESTIONS = [
  'مطعم مشويات',
  'طبيب أسنان',
  'محل ملابس',
  'صيدلية 24 ساعة',
  'سوبر ماركت',
];

const QUICK_GOVERNORATES = ['الجيزة', 'القاهرة', 'الإسكندرية'];

const FULL_HEADLINE_TEXT = 'ابحث عن أي نشاط، وتواصل في ثوانٍ';

export const CinematicHeroTour: React.FC<CinematicHeroTourProps> = ({
  isActive,
  onComplete,
  onSkip,
  onSelectSuggestion,
  onSelectGovernorate,
  currentGov = 'all',
  onStepChange,
}) => {
  const [step, setStep] = useState<CinematicTourStep>('welcome');
  const [typedChars, setTypedChars] = useState<number>(0);
  const typewriterTimerRef = useRef<any>(null);

  // Sync step change upward
  useEffect(() => {
    if (onStepChange) {
      onStepChange(step);
    }
  }, [step, onStepChange]);

  // Handle stage progressions
  useEffect(() => {
    if (!isActive) {
      setStep('welcome');
      setTypedChars(0);
      return;
    }

    if (step === 'welcome') {
      // Show smooth welcome for 1800ms then transition to typewriter
      const timer = setTimeout(() => {
        setStep('typewriter');
      }, 1800);
      return () => clearTimeout(timer);
    }

    if (step === 'typewriter') {
      setTypedChars(0);
      let charIndex = 0;
      typewriterTimerRef.current = setInterval(() => {
        charIndex += 1;
        setTypedChars(charIndex);
        if (charIndex >= FULL_HEADLINE_TEXT.length) {
          clearInterval(typewriterTimerRef.current);
          // After typing finishes, pause briefly then move spotlight to search input
          setTimeout(() => {
            setStep('search_spotlight');
          }, 1100);
        }
      }, 48); // ~48ms per character for cinematic video typing speed

      return () => {
        if (typewriterTimerRef.current) clearInterval(typewriterTimerRef.current);
      };
    }
  }, [isActive, step]);

  if (!isActive) return null;

  const handleSkip = () => {
    try {
      localStorage.setItem('dalelak_onboarding_completed', 'true');
    } catch {}
    onSkip();
  };

  const handleFinish = () => {
    try {
      localStorage.setItem('dalelak_onboarding_completed', 'true');
    } catch {}
    setStep('completed');
    setTimeout(() => {
      onComplete();
    }, 400);
  };

  return (
    <>
      {/* 🎬 Cinematic Ambient Vignette Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-[2px] transition-opacity duration-700 pointer-events-none"
        style={{
          maskImage: 'radial-gradient(ellipse 90% 70% at 50% 30%, transparent 40%, black 90%)',
          WebkitMaskImage: 'radial-gradient(ellipse 90% 70% at 50% 30%, transparent 40%, black 90%)',
        }}
      />

      {/* Floating Top Tour Control Pill (Skip & Badge) */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-slate-900/90 border border-amber-500/40 text-white px-4 py-2 rounded-full shadow-2xl backdrop-blur-md text-xs animate-fade-in">
        <div className="flex items-center gap-1.5 text-amber-400 font-black">
          <Compass className="w-4 h-4 animate-spin-slow" />
          <span>جولة الانطلاق السينمائية</span>
        </div>

        <div className="h-3 w-px bg-slate-700" />

        <button
          type="button"
          onClick={handleSkip}
          className="text-slate-300 hover:text-white transition-colors font-bold cursor-pointer flex items-center gap-1 text-[11px]"
        >
          <X className="w-3.5 h-3.5" />
          <span>تخطي الجولة</span>
        </button>
      </div>

      {/* 💡 Tooltip for Step 2: Search Input Spotlight */}
      {step === 'search_spotlight' && (
        <div className="relative max-w-4xl mx-auto px-4 z-50 mt-3 animate-fade-in-up">
          <div className="bg-white dark:bg-slate-900 border-2 border-amber-500 rounded-2xl p-4 sm:p-5 shadow-2xl shadow-amber-500/20 text-right">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                  <Search className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    ما الذي تبحث عنه اليوم؟
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    اكتب اسم أي نشاط، مطعم، صيدلية، عيادة، أو خدمة تريد الوصول إليها
                  </p>
                </div>
              </div>

              <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                خطوة 1 من 2
              </span>
            </div>

            {/* Quick Suggestion Pills */}
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-black text-slate-400 block mb-2">
                أنماط بحث مقترحة للتجربة فوراً:
              </span>
              <div className="flex flex-wrap gap-2">
                {SEARCH_SUGGESTIONS.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => {
                      onSelectSuggestion(sug);
                      // Move smoothly to next step after brief delay
                      setTimeout(() => setStep('gov_spotlight'), 600);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500 hover:text-slate-950 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-500/30 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>{sug}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Controls Bar */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={handleSkip}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-bold cursor-pointer"
              >
                تخطي والدخول للدليل
              </button>

              <button
                type="button"
                onClick={() => setStep('gov_spotlight')}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <span>التالي: اختيار المحافظة</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 💡 Tooltip for Step 3: Governorate Spotlight */}
      {step === 'gov_spotlight' && (
        <div className="relative max-w-4xl mx-auto px-4 z-50 mt-3 animate-fade-in-up">
          <div className="bg-white dark:bg-slate-900 border-2 border-amber-500 rounded-2xl p-4 sm:p-5 shadow-2xl shadow-amber-500/20 text-right">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                    حدد محافظتك أو منطقتك
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    لتصفية النتائج والوصول إلى الأماكن والخدمات الأقرب لموقعك الجغرافي
                  </p>
                </div>
              </div>

              <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                خطوة 2 من 2
              </span>
            </div>

            {/* Quick Gov Pills */}
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-black text-slate-400 block mb-2">
                اختيار سريع لمحافظات شائعة:
              </span>
              <div className="flex flex-wrap gap-2">
                {QUICK_GOVERNORATES.map((gov) => (
                  <button
                    key={gov}
                    type="button"
                    onClick={() => {
                      if (onSelectGovernorate) onSelectGovernorate(gov);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                      currentGov === gov
                        ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm'
                        : 'bg-[var(--input-bg)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-amber-500'
                    }`}
                  >
                    <MapPin className="w-3 h-3" />
                    <span>{gov}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Controls Bar */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep('search_spotlight')}
                className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-bold cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>الرجوع للبحث</span>
              </button>

              <button
                type="button"
                onClick={handleFinish}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs sm:text-sm font-black transition-all shadow-lg flex items-center gap-1.5 cursor-pointer ring-2 ring-amber-500/30"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>ابدأ الاستكشاف الآن</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
