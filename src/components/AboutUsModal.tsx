import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Logo } from './Logo';
import { 
  MapPin, 
  Sparkles, 
  Target, 
  Compass, 
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Building,
  Users,
  Briefcase,
  Coffee,
  Calendar
} from 'lucide-react';

interface AboutUsModalProps {
  onClose: () => void;
  onOpenTerms?: () => void;
}

const HQ_PHOTOS = [
  {
    id: 'building',
    src: '/images/hq/hq-building.jpg',
    title: 'المبنى الرئيسي والواجهة المعتمدة',
    desc: 'مقر الإدارة الرئيسي لمنظومة دليلك (الفرع 145) في جمهورية مصر العربية.',
    icon: <Building className="w-3.5 h-3.5" />
  },
  {
    id: 'workspace',
    src: '/images/hq/hq-workspace.jpg',
    title: 'بيئة العمل وغرفة العمليات',
    desc: 'فريق الدعم الفني والميداني لخدمة المناديب والعملاء على مدار الساعة.',
    icon: <Users className="w-3.5 h-3.5" />
  },
  {
    id: 'executive',
    src: '/images/hq/hq-executive.jpg',
    title: 'مكتب الإدارة التنفيذية',
    desc: 'إدارة الاستراتيجيات وتطوير الأعمال ومتابعة خطط التوسع والنمو.',
    icon: <Briefcase className="w-3.5 h-3.5" />
  },
  {
    id: 'lounge',
    src: '/images/hq/hq-lounge.jpg',
    title: 'ردهة الاستقبال وكافيه الضيافة',
    desc: 'استقبال الشركاء، أصحاب الأعمال، والمناديب في بيئة عصرية ومريحة.',
    icon: <Coffee className="w-3.5 h-3.5" />
  },
  {
    id: 'meeting',
    src: '/images/hq/hq-meeting.jpg',
    title: 'قاعة الاجتماعات والمؤتمرات',
    desc: 'عقد الصفقات الكبرى، تدريب فرق العمل الميدانية، والاجتماعات الدورية.',
    icon: <Calendar className="w-3.5 h-3.5" />
  },
];

export const AboutUsModal: React.FC<AboutUsModalProps> = ({ onClose, onOpenTerms }) => {
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleNextPhoto = () => {
    setActivePhotoIdx((prev) => (prev + 1) % HQ_PHOTOS.length);
  };

  const handlePrevPhoto = () => {
    setActivePhotoIdx((prev) => (prev - 1 + HQ_PHOTOS.length) % HQ_PHOTOS.length);
  };

  const currentPhoto = HQ_PHOTOS[activePhotoIdx];

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto modal-overlay" dir="rtl">
      <div className="bg-[var(--modal-bg)] border border-[var(--modal-border)] rounded-3xl max-w-3xl w-full p-4 sm:p-7 shadow-2xl space-y-6 text-[var(--text-primary)] relative modal-content transition-colors duration-300 my-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-rose-500 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border border-[var(--border-color)] cursor-pointer transition-colors shadow-sm z-10"
          aria-label="إغلاق"
        >
          ✕
        </button>

        {/* Brand Header */}
        <div className="text-center space-y-2 pt-1 border-b border-[var(--border-color)] pb-4">
          <div className="flex justify-center mb-2">
            <Logo size="lg" />
          </div>
          <h2 className="font-black text-xl sm:text-2xl text-[var(--text-primary)]">
            من نحن - منصة دليلك الشاملة لرقمنة وتنمية الأعمال 🚀
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-bold max-w-2xl mx-auto leading-relaxed">
            منظومة متكاملة رائدة في مصر لرقمنة الأنشطة التجارية والشركات؛ نقدم باقة شاملة من التوثيقات الرسمية، التسويق الرقمي، الحلول التكنولوجية، الحماية القانونية والفكرية، واستشارات تنمية ونمو الأعمال.
          </p>
        </div>

        {/* Vision & Mission Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
          <div className="bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-color)] space-y-2 relative overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center font-bold">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="font-black text-sm text-[var(--text-primary)]">رؤيتنا (Our Vision)</h3>
            <p className="text-[var(--text-secondary)] leading-relaxed font-medium">
              أن نكون الشريك الاستراتيجي والمنظومة الأولى في مصر لتمكين كافة الأنشطة التجارية والشركات من التحول الرقمي الكامل، وحماية حقوقها، ومضاعفة أرباحها وانتشارها في السوق.
            </p>
          </div>

          <div className="bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-color)] space-y-2 relative overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center font-bold">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="font-black text-sm text-[var(--text-primary)]">رسالتنا (Our Mission)</h3>
            <p className="text-[var(--text-secondary)] leading-relaxed font-medium">
              توفير بيئة رقمية وتكنولوجية وقانونية محكمة لكل صاحب عمل تضمن له الظهور الجغرافي الدقيق، والحماية القانونية لعلامته، وخطط نمو وتطوير مدروسة تواكب أحدث التقنيات.
            </p>
          </div>
        </div>

        {/* ── INTERACTIVE HEADQUARTERS & OFFICE TOUR GALLERY ───────────── */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-xs sm:text-sm text-[var(--text-primary)] flex items-center gap-2">
              <Building className="w-4 h-4 text-amber-500" />
              <span>جولة داخل المقر الرئيسي لمنظومة دليلك 🏢</span>
            </h3>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-extrabold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              {activePhotoIdx + 1} من {HQ_PHOTOS.length}
            </span>
          </div>

          {/* Main Showcase Image */}
          <div className="relative rounded-2xl overflow-hidden border-2 border-amber-500/30 bg-slate-950 shadow-lg group">
            <img
              src={currentPhoto.src}
              alt={currentPhoto.title}
              onClick={() => setLightboxPhoto(currentPhoto.src)}
              className="w-full h-56 sm:h-72 object-cover object-center cursor-pointer transition-transform duration-500 group-hover:scale-102"
            />

            {/* Overlay Caption */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/30 to-transparent flex flex-col justify-between p-3.5 sm:p-4 pointer-events-none">
              <div className="flex items-center justify-between">
                <span className="bg-slate-950/80 backdrop-blur-xs text-amber-400 border border-amber-500/40 text-[10px] sm:text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5 shadow">
                  {currentPhoto.icon}
                  <span>{currentPhoto.title}</span>
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxPhoto(currentPhoto.src);
                  }}
                  className="pointer-events-auto bg-white/20 hover:bg-white/40 text-white p-1.5 rounded-xl backdrop-blur-xs transition-colors cursor-pointer"
                  title="تكبير الصورة"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>

              <div>
                <p className="text-xs sm:text-sm font-bold text-white drop-shadow-md">
                  {currentPhoto.desc}
                </p>
                <div className="flex items-center gap-1 mt-1 text-[10px] text-amber-300 font-medium">
                  <MapPin className="w-3 h-3" />
                  <span>المقر الرئيسي — القاهرة، جمهورية مصر العربية</span>
                </div>
              </div>
            </div>

            {/* Slider Navigation Arrows */}
            <button
              type="button"
              onClick={handlePrevPhoto}
              className="absolute top-1/2 right-2 -translate-y-1/2 bg-slate-950/70 hover:bg-amber-500 hover:text-slate-950 text-white w-8 h-8 rounded-full flex items-center justify-center border border-white/20 backdrop-blur-xs transition-all cursor-pointer shadow-lg"
              title="السابق"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextPhoto}
              className="absolute top-1/2 left-2 -translate-y-1/2 bg-slate-950/70 hover:bg-amber-500 hover:text-slate-950 text-white w-8 h-8 rounded-full flex items-center justify-center border border-white/20 backdrop-blur-xs transition-all cursor-pointer shadow-lg"
              title="التالي"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Thumbnail Bar */}
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
            {HQ_PHOTOS.map((photo, idx) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => setActivePhotoIdx(idx)}
                className={`relative rounded-xl overflow-hidden border-2 transition-all cursor-pointer h-12 sm:h-16 ${
                  activePhotoIdx === idx
                    ? 'border-amber-500 ring-2 ring-amber-500/40 scale-102'
                    : 'border-[var(--border-color)] opacity-60 hover:opacity-100'
                }`}
              >
                <img src={photo.src} alt={photo.title} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Official Communication & Support Channel */}
        <div className="bg-[var(--bg-surface)] p-3.5 rounded-2xl border border-[var(--border-color)] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-right">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-black shrink-0">
              🌐
            </div>
            <div>
              <div className="font-black text-[var(--text-primary)] text-xs">الموقع الرسمي والدليل المعتمد:</div>
              <a href="https://www.dalilaak.com/" target="_blank" rel="noopener noreferrer" className="text-amber-600 dark:text-amber-400 font-mono font-bold hover:underline dir-ltr text-right inline-block">
                https://www.dalilaak.com/
              </a>
            </div>
          </div>

          <div className="flex items-center gap-2 text-right">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-500 flex items-center justify-center font-black shrink-0">
              ✉️
            </div>
            <div>
              <div className="font-black text-[var(--text-primary)] text-xs">البريد الإلكتروني والتواصل الرسمي:</div>
              <a href="mailto:info@dalilaak.com" className="text-blue-600 dark:text-blue-400 font-mono font-bold hover:underline dir-ltr text-right inline-block">
                info@dalilaak.com
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[var(--border-color)]">
          {onOpenTerms ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenTerms();
              }}
              className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-extrabold flex items-center gap-1 cursor-pointer"
            >
              <span>الاطلاع على شروط وأحكام الاستخدام</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          ) : <div />}

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-6 py-2.5 rounded-xl shadow cursor-pointer transition-all active:scale-95"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-[10050] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          <div className="relative max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightboxPhoto(null)}
              className="absolute -top-10 left-0 bg-white/20 hover:bg-white/40 text-white w-8 h-8 rounded-full flex items-center justify-center font-black cursor-pointer text-sm"
            >
              ✕
            </button>
            <img
              src={lightboxPhoto}
              alt="معاينة المقر"
              className="max-w-full max-h-[80vh] object-contain rounded-2xl border-2 border-amber-500/50 shadow-2xl mx-auto"
            />
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};
