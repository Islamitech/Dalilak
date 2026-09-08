import React, { useState } from 'react';
import { ArrowLeft, Compass, HeartPulse, MapPin, Navigation, Search, Sparkles, Store, UtensilsCrossed, Wrench } from 'lucide-react';

export interface InteractiveOnboardingExperienceProps {
  onExploreAround: (governorate?: string, city?: string) => void;
  onSearchSpecific: () => void;
  onAddBusinessFree: () => void;
  onSkip: () => void;
}

type Intent = 'explore' | 'search' | 'add' | 'skip';

const mapStops = [
  { id: 'alex', name: 'الإسكندرية', detail: 'الساحل الشمالي', governorate: 'الإسكندرية', city: 'الإسكندرية', x: '26%', y: '22%' },
  { id: 'giza', name: 'الجيزة', detail: 'حدائق الأهرام', governorate: 'الجيزة', city: 'حدائق الأهرام', x: '44%', y: '38%' },
  { id: 'cairo', name: 'القاهرة', detail: 'القاهرة الكبرى', governorate: 'القاهرة', city: 'مدينة نصر', x: '52%', y: '36%' },
  { id: 'luxor', name: 'الأقصر', detail: 'صعيد مصر', governorate: 'الأقصر', city: 'الأقصر', x: '48%', y: '72%' },
];

export const InteractiveOnboardingExperience: React.FC<InteractiveOnboardingExperienceProps> = ({ onExploreAround, onSearchSpecific, onAddBusinessFree, onSkip }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [selectedIntent, setSelectedIntent] = useState<Intent | null>(null);
  const [selectedStop, setSelectedStop] = useState('giza');

  const handleAction = (intent: Intent, area = mapStops.find((stop) => stop.id === selectedStop)) => {
    if (isExiting) return;
    setSelectedIntent(intent);
    setIsExiting(true);
    try { localStorage.setItem('dalelak_onboarding_completed', 'true'); } catch {}
    window.setTimeout(() => {
      if (intent === 'explore') onExploreAround(area?.governorate, area?.city);
      else if (intent === 'search') onSearchSpecific();
      else if (intent === 'add') onAddBusinessFree();
      else onSkip();
    }, 280);
  };

  return (
    <div className={`fixed inset-0 z-[999999] overflow-y-auto bg-[#f8fafc] font-['Cairo',sans-serif] text-slate-900 transition-all duration-300 ${isExiting ? 'pointer-events-none opacity-0' : 'opacity-100'}`} style={{ direction: 'rtl' }}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(ellipse_at_50%_-12%,rgba(251,191,36,.27),transparent_62%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-5 sm:px-6 sm:py-7">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-amber-400 shadow-lg shadow-slate-900/15"><Compass className="h-5 w-5" /></div><div><p className="text-sm font-black text-slate-950">منصة دليلك</p><p className="text-[11px] font-bold text-slate-500">دليل الأنشطة والخدمات في مصر</p></div></div>
          <button type="button" onClick={() => handleAction('skip')} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 shadow-sm transition hover:border-amber-300 hover:text-amber-700 focus:outline-none focus:ring-4 focus:ring-amber-100 cursor-pointer"><span>تخطي وابدأ الاستكشاف</span><ArrowLeft className="h-3.5 w-3.5" /></button>
        </header>

        <main className="mx-auto grid w-full max-w-5xl flex-1 items-center gap-6 py-6 lg:grid-cols-[1.04fr_.96fr] lg:py-10">
          <section className="order-2 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/[.06] sm:p-7 lg:order-1">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-black text-amber-700"><Sparkles className="h-3.5 w-3.5" /> دليلك يبدأ من مكانك</span>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">ما الذي تبحث عنه اليوم؟</h1><p className="mt-2 max-w-lg text-sm font-bold leading-6 text-slate-500">اختر وجهتك وسنفتح الدليل بالطريقة الأنسب لك فوراً.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <button type="button" onClick={() => handleAction('explore')} className={`rounded-2xl border-2 p-4 text-right transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-amber-100 cursor-pointer ${selectedIntent === 'explore' ? 'border-amber-500 bg-amber-100' : 'border-amber-300 bg-amber-50 hover:bg-amber-100'}`}><span className="mb-5 flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm"><Navigation className="h-4 w-4" /></span><strong className="block text-sm font-black text-slate-900">اكتشف حولي</strong><span className="mt-1 block text-[11px] font-bold leading-5 text-slate-500">خدمات موثوقة قربك</span></button>
              <button type="button" onClick={() => handleAction('search')} className={`rounded-2xl border p-4 text-right transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-slate-100 cursor-pointer ${selectedIntent === 'search' ? 'border-slate-400 bg-slate-100' : 'border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white'}`}><span className="mb-5 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white"><Search className="h-4 w-4" /></span><strong className="block text-sm font-black text-slate-900">ابحث عن خدمة</strong><span className="mt-1 block text-[11px] font-bold leading-5 text-slate-500">بالاسم أو التصنيف</span></button>
              <button type="button" onClick={() => handleAction('add')} className={`rounded-2xl border p-4 text-right transition hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-emerald-100 cursor-pointer ${selectedIntent === 'add' ? 'border-emerald-500 bg-emerald-100' : 'border-emerald-200 bg-emerald-50 hover:emerald-100'}`}><span className="mb-5 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white"><Store className="h-4 w-4" /></span><strong className="block text-sm font-black text-slate-900">أضف نشاطك</strong><span className="mt-1 block text-[11px] font-bold leading-5 text-slate-500">ابدأ ظهورك مجاناً</span></button>
            </div>
          </section>

          <section className="order-1 rounded-[2rem] border border-amber-200 bg-white p-4 shadow-xl shadow-amber-900/[.05] sm:p-6 lg:order-2">
            <div className="mb-3 flex items-start justify-between"><div><h2 className="text-base font-black text-slate-900">استكشف على خريطة مصر</h2><p className="mt-1 text-[11px] font-bold text-slate-500">اختر مدينة للبدء — جميع النقاط قابلة للضغط</p></div><MapPin className="h-5 w-5 text-amber-500" /></div>
            <div className="relative mx-auto aspect-[1.12/1] max-w-md overflow-hidden rounded-3xl border border-slate-100 bg-[linear-gradient(145deg,#f8fcff,#ecf4f6)]">
              <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" role="img" aria-label="خريطة مصر المبسطة"><defs><linearGradient id="egyptLand" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fffdf4" /><stop offset="1" stopColor="#f5ead0" /></linearGradient></defs><path d="M12 20 L61 20 L69 23 L78 21 L88 27 L86 35 L80 42 L74 43 L68 39 L64 44 L61 54 L59 69 L56 87 L51 94 L46 86 L44 70 L42 57 L38 48 L30 44 L21 39 L15 31 Z" fill="url(#egyptLand)" stroke="#c58b22" strokeWidth="1.2" strokeLinejoin="round" /><path d="M63 20 L72 28 L80 42 L74 43 L68 39 L64 44" fill="#f8efdb" stroke="#c58b22" strokeWidth="1" strokeLinejoin="round" /><path d="M48 22 C47 31 45 38 47 46 C49 52 46 59 48 67 C49 76 50 84 51 92" fill="none" stroke="#38bdf8" strokeWidth="1.25" strokeLinecap="round" /><path d="M16 17 H60" stroke="#7dd3fc" strokeWidth="1" strokeDasharray="2 2" /><text x="21" y="14" fill="#64748b" fontSize="3.2" fontWeight="700">البحر المتوسط</text><text x="80" y="62" fill="#94a3b8" fontSize="3.2" fontWeight="700" transform="rotate(72 80 62)">البحر الأحمر</text></svg>
              {mapStops.map((stop) => { const active = selectedStop === stop.id; return <button key={stop.id} type="button" onClick={() => { setSelectedStop(stop.id); handleAction('explore', stop); }} className={`group absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white p-1.5 shadow-lg transition focus:outline-none focus:ring-4 focus:ring-amber-200 cursor-pointer ${active ? 'scale-125 bg-amber-500' : 'bg-slate-900 hover:scale-110 hover:bg-amber-500'}`} style={{ left: stop.x, top: stop.y }} aria-label={`استكشف ${stop.name}`} title={`استكشف ${stop.name}`}><span className="block h-1.5 w-1.5 rounded-full bg-white" /><span className={`pointer-events-none absolute right-1/2 top-full mt-2 w-max translate-x-1/2 rounded-lg border px-2 py-1 text-[10px] font-black shadow-sm transition ${active ? 'border-amber-200 bg-amber-50 text-amber-800 opacity-100' : 'border-slate-200 bg-white text-slate-600 opacity-0 group-hover:opacity-100'}`}>{stop.name} · {stop.detail}</span></button>; })}
              <div className="absolute bottom-3 right-3 left-3 rounded-2xl border border-slate-200 bg-white/95 px-3 py-2.5 shadow-sm backdrop-blur"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black text-slate-900">{mapStops.find((stop) => stop.id === selectedStop)?.name}</p><p className="text-[10px] font-bold text-slate-500">اضغط على أي نقطة لبدء الاستكشاف</p></div><button type="button" onClick={() => handleAction('explore')} className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-slate-950 px-3 py-2 text-[11px] font-black text-white transition hover:bg-amber-500 hover:text-slate-950 cursor-pointer">استكشف <ArrowLeft className="h-3.5 w-3.5" /></button></div></div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px] font-bold text-slate-500"><span className="inline-flex items-center justify-center gap-1 rounded-lg bg-amber-50 py-1.5 text-amber-800"><UtensilsCrossed className="h-3 w-3" /> مطاعم</span><span className="inline-flex items-center justify-center gap-1 rounded-lg bg-rose-50 py-1.5 text-rose-700"><HeartPulse className="h-3 w-3" /> صيدليات</span><span className="inline-flex items-center justify-center gap-1 rounded-lg bg-sky-50 py-1.5 text-sky-700"><Wrench className="h-3 w-3" /> خدمات</span></div>
          </section>
        </main>
        <p className="pb-1 text-center text-[11px] font-bold text-slate-400">يمكنك إعادة هذه الجولة لاحقاً من قائمة الموقع.</p>
      </div>
    </div>
  );
};
