import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  MapPin,
  Search,
  ArrowLeft,
  ArrowRight,
  Check,
  X,
  Compass,
  Layers,
} from 'lucide-react';

export type CinematicTourStep =
  | 'welcome'
  | 'typewriter'
  | 'search_spotlight'
  | 'gov_spotlight'
  | 'results_spotlight'
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
  const [selectedSug, setSelectedSug] = useState<string | null>(null);
  const typewriterTimerRef = useRef<any>(null);

  // Target element bounding rectangle for anchored thought-bubble positioning
  const [targetRect, setTargetRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
    bottom: number;
  } | null>(null);

  // Sync step change upward
  useEffect(() => {
    if (onStepChange) {
      onStepChange(step);
    }
  }, [step, onStepChange]);

  // Measure and track target coordinates dynamically
  const updateTargetRect = useCallback(() => {
    let targetId = '';
    if (step === 'search_spotlight') {
      targetId = 'tour-search-box';
    } else if (step === 'gov_spotlight') {
      targetId = 'tour-gov-selector';
    } else if (step === 'results_spotlight') {
      targetId = 'explore';
    }

    if (!targetId) {
      setTargetRect(null);
      return;
    }

    const el = document.getElementById(targetId);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        bottom: rect.bottom,
      });
    }
  }, [step]);

  // Handle stage progressions & initial typewriter sequence
  useEffect(() => {
    if (!isActive) {
      setStep('welcome');
      setTypedChars(0);
      return;
    }

    if (step === 'welcome') {
      const timer = setTimeout(() => {
        setStep('typewriter');
      }, 1500);
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
          setTimeout(() => {
            setStep('search_spotlight');
          }, 900);
        }
      }, 45);

      return () => {
        if (typewriterTimerRef.current) clearInterval(typewriterTimerRef.current);
      };
    }
  }, [isActive, step]);

  // Smooth cinematic camera focus (scroll and center on active target)
  useEffect(() => {
    if (!isActive) return;

    if (step === 'search_spotlight') {
      const el = document.getElementById('tour-search-box');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else if (step === 'gov_spotlight') {
      const el = document.getElementById('tour-gov-selector');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else if (step === 'results_spotlight') {
      const el = document.getElementById('explore');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [isActive, step]);

  // Real-time listener for scroll, resize, and DOM settle
  useEffect(() => {
    if (!isActive) return;

    updateTargetRect();
    const t1 = setTimeout(updateTargetRect, 80);
    const t2 = setTimeout(updateTargetRect, 300);
    const t3 = setTimeout(updateTargetRect, 650);

    const handleScroll = () => updateTargetRect();
    const handleResize = () => updateTargetRect();

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [isActive, step, updateTargetRect]);

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
    }, 350);
  };

  const handleSuggestionClick = (sug: string) => {
    setSelectedSug(sug);
    onSelectSuggestion(sug);
    // Smooth cinematic progression to governorate spotlight
    setTimeout(() => {
      setStep('gov_spotlight');
      setSelectedSug(null);
    }, 450);
  };

  const handleGovernorateClick = (gov: string) => {
    if (onSelectGovernorate) {
      onSelectGovernorate(gov);
    }
    // Smooth cinematic progression to results spotlight framing
    setTimeout(() => {
      setStep('results_spotlight');
    }, 450);
  };

  // Compute anchored thought-bubble coordinates
  const screenW = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const bubbleW = Math.min(screenW - 32, step === 'results_spotlight' ? 440 : 380);
  const bubbleH = step === 'results_spotlight' ? 165 : 145;

  let bubbleTop = 140;
  let bubbleLeft = 20;
  let isAbove = true;
  let tailX = bubbleW / 2;

  if (targetRect) {
    if (step === 'results_spotlight') {
      // Anchored over the top-center edge of the explore container
      bubbleTop = Math.max(85, targetRect.top + 16);
      bubbleLeft = Math.max(16, Math.min(screenW - bubbleW - 16, screenW / 2 - bubbleW / 2));
      isAbove = false;
      tailX = bubbleW / 2;
    } else {
      const targetCenterX = targetRect.left + targetRect.width / 2;
      bubbleLeft = Math.max(16, Math.min(screenW - bubbleW - 16, targetCenterX - bubbleW / 2));

      const spaceAbove = targetRect.top;
      isAbove = spaceAbove >= bubbleH + 75;

      if (isAbove) {
        bubbleTop = targetRect.top - bubbleH - 18;
      } else {
        bubbleTop = targetRect.bottom + 18;
      }

      tailX = Math.max(28, Math.min(bubbleW - 28, targetCenterX - bubbleLeft));
    }
  }

  const isSpotlightActive =
    step === 'search_spotlight' ||
    step === 'gov_spotlight' ||
    step === 'results_spotlight';

  return (
    <>
      {/* 🎬 Cinematic Ambient Vignette Backdrop */}
      <div className="fixed inset-0 z-30 bg-slate-950/65 backdrop-blur-[1.5px] transition-opacity duration-700 pointer-events-none" />

      {/* Floating Top Tour Pill (Skip & Compass Badge) */}
      <div className="fixed top-16 sm:top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-slate-900/95 border border-amber-500/40 text-white px-3.5 py-1.5 rounded-full shadow-2xl backdrop-blur-md text-xs animate-fade-in">
        <div className="flex items-center gap-1.5 text-amber-400 font-black">
          <Compass className="w-3.5 h-3.5 animate-spin-slow text-amber-400" />
          <span className="text-[11px] sm:text-xs">جولة الانطلاق السينمائية</span>
        </div>

        <div className="h-3 w-px bg-slate-700" />

        <button
          type="button"
          onClick={handleSkip}
          className="text-slate-300 hover:text-white transition-colors font-bold cursor-pointer flex items-center gap-1 text-[11px]"
        >
          <X className="w-3 h-3" />
          <span>تخطي</span>
        </button>
      </div>

      {/* 🔍 Optical Spotlight Ring for Active Field (Search / Gov) */}
      {(step === 'search_spotlight' || step === 'gov_spotlight') && targetRect && (
        <div
          className="fixed z-40 pointer-events-none transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            top: `${targetRect.top - 4}px`,
            left: `${targetRect.left - 4}px`,
            width: `${targetRect.width + 8}px`,
            height: `${targetRect.height + 8}px`,
          }}
        >
          <div className="w-full h-full rounded-2xl border-2 border-amber-500 shadow-[0_0_35px_rgba(245,158,11,0.55)] ring-4 ring-amber-500/30 animate-pulse" />
        </div>
      )}

      {/* 🖼️ Cinematic Results Spotlight Framing (Wraps Entire Explore Area) */}
      {step === 'results_spotlight' && targetRect && (
        <div
          className="fixed z-40 pointer-events-none transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            top: `${Math.max(8, targetRect.top - 10)}px`,
            left: `${Math.max(8, targetRect.left - 8)}px`,
            width: `${Math.min(screenW - 16, targetRect.width + 16)}px`,
            height: `${Math.min(window.innerHeight - 20, targetRect.height + 20)}px`,
          }}
        >
          {/* Glowing Animated Outer Border */}
          <div className="w-full h-full rounded-3xl border-2 border-amber-500 shadow-[0_0_50px_rgba(245,158,11,0.4)] ring-4 ring-amber-500/25 animate-pulse" />

          {/* High-Tech Viewfinder Corner Reticles */}
          <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-amber-400 rounded-tr-xl" />
          <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-amber-400 rounded-tl-xl" />
          <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-amber-400 rounded-br-xl" />
          <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-amber-400 rounded-bl-xl" />

          {/* Top Frame Label Badge */}
          <div className="absolute -top-3.5 right-6 px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-[11px] font-black shadow-lg flex items-center gap-1.5 pointer-events-auto">
            <Layers className="w-3.5 h-3.5" />
            <span>منطقة عرض الأنشطة والخدمات الميدانية المعتمدة</span>
          </div>
        </div>
      )}

      {/* 💭 Kinetic Anchored Thought Bubble (سحابة التفكير المدمجة) */}
      {isSpotlightActive && targetRect && (
        <div
          className="fixed z-50 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{
            top: `${bubbleTop}px`,
            left: `${bubbleLeft}px`,
            width: `${bubbleW}px`,
          }}
        >
          <div className="relative bg-slate-900/95 border-2 border-amber-500/60 rounded-2xl p-3.5 sm:p-4 shadow-2xl shadow-amber-500/20 backdrop-blur-xl text-white text-right">
            
            {/* 💬 Step 1: Search Thought Bubble */}
            {step === 'search_spotlight' && (
              <div className="space-y-2.5 animate-fade-in">
                <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5 text-amber-400 font-black text-xs sm:text-sm">
                    <Search className="w-4 h-4 text-amber-400" />
                    <span>عن ماذا تبحث؟</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">
                    خطوة 1 من 2
                  </span>
                </div>

                {/* Micro Suggestion Chips */}
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block mb-1.5">
                    اضغط مثالاً للتجربة وتعبئة الحقل فوراً:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {SEARCH_SUGGESTIONS.map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => handleSuggestionClick(sug)}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 active:scale-95 ${
                          selectedSug === sug
                            ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md font-black'
                            : 'bg-slate-800/80 hover:bg-amber-500 hover:text-slate-950 text-slate-200 border-slate-700/80 hover:border-amber-500'
                        }`}
                      >
                        <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                        <span>{sug}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="text-[11px] text-slate-400 hover:text-slate-200 font-bold cursor-pointer"
                  >
                    تخطي
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep('gov_spotlight')}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-black transition-all shadow-md flex items-center gap-1 cursor-pointer active:scale-95"
                  >
                    <span>التالي: المحافظة</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* 💬 Step 2: Governorate Thought Bubble */}
            {step === 'gov_spotlight' && (
              <div className="space-y-2.5 animate-fade-in">
                <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5 text-amber-400 font-black text-xs sm:text-sm">
                    <MapPin className="w-4 h-4 text-amber-400" />
                    <span>حدد محافظتك أو منطقتك</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">
                    خطوة 2 من 2
                  </span>
                </div>

                {/* Micro Gov Chips */}
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block mb-1.5">
                    اختر المحافظة لتصفية الأقرب إليك:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_GOVERNORATES.map((gov) => (
                      <button
                        key={gov}
                        type="button"
                        onClick={() => handleGovernorateClick(gov)}
                        className={`px-3 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 active:scale-95 ${
                          currentGov === gov
                            ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md font-black'
                            : 'bg-slate-800/80 hover:bg-amber-500 hover:text-slate-950 text-slate-200 border-slate-700/80 hover:border-amber-500'
                        }`}
                      >
                        <MapPin className="w-2.5 h-2.5" />
                        <span>{gov}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                  <button
                    type="button"
                    onClick={() => setStep('search_spotlight')}
                    className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 font-bold cursor-pointer"
                  >
                    <ArrowRight className="w-3 h-3" />
                    <span>رجوع للبحث</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStep('results_spotlight')}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-black transition-all shadow-md flex items-center gap-1 cursor-pointer active:scale-95"
                  >
                    <span>عرض النتائج</span>
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* 💬 Step 3: Results Delivery Thought Bubble */}
            {step === 'results_spotlight' && (
              <div className="space-y-3 animate-fade-in">
                <div className="flex items-center gap-2 text-amber-400 font-black text-xs sm:text-sm border-b border-slate-800 pb-2">
                  <Layers className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>هنا يتم عرض البحث الخاص بك</span>
                </div>

                <p className="text-[11px] sm:text-xs text-slate-300 font-medium leading-relaxed">
                  تظهر هنا نتائج بحثك والأنشطة والخدمات الميدانية المعتمدة، مع أرقام التواصل الفوري والموقع الدقيق.
                </p>

                <button
                  type="button"
                  onClick={handleFinish}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs sm:text-sm font-black transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95 ring-2 ring-amber-500/40"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>تصفح الأنشطة والخدمات الآن</span>
                </button>
              </div>
            )}

            {/* 💭 Thought Bubble Organic Beak & Floating Dots (when anchored above/below input) */}
            {step !== 'results_spotlight' && (
              <>
                {isAbove ? (
                  // Tail pointing downward
                  <div
                    className="absolute -bottom-2 transform -translate-x-1/2 pointer-events-none"
                    style={{ left: `${tailX}px` }}
                  >
                    <div className="w-3.5 h-3.5 bg-slate-900 border-b-2 border-r-2 border-amber-500/60 rotate-45 shadow-md" />
                    <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5">
                      <span className="w-2 h-2 rounded-full bg-slate-900 border border-amber-500/80 shadow-xs" />
                      <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" />
                    </div>
                  </div>
                ) : (
                  // Tail pointing upward
                  <div
                    className="absolute -top-2 transform -translate-x-1/2 pointer-events-none"
                    style={{ left: `${tailX}px` }}
                  >
                    <div className="w-3.5 h-3.5 bg-slate-900 border-t-2 border-l-2 border-amber-500/60 rotate-45 shadow-md" />
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5">
                      <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" />
                      <span className="w-2 h-2 rounded-full bg-slate-900 border border-amber-500/80 shadow-xs" />
                    </div>
                  </div>
                )}
              </>
            )}

          </div>
        </div>
      )}
    </>
  );
};
