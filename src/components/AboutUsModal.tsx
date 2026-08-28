import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Logo } from './Logo';
import { 
  MapPin, 
  Sparkles, 
  Target, 
  Compass, 
  TrendingUp,
  Cpu,
  Scale,
  Megaphone,
  ChevronLeft
} from 'lucide-react';

interface AboutUsModalProps {
  onClose: () => void;
  onOpenTerms?: () => void;
}

export const AboutUsModal: React.FC<AboutUsModalProps> = ({ onClose, onOpenTerms }) => {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto modal-overlay">
      <div className="bg-[var(--modal-bg)] border border-[var(--modal-border)] rounded-3xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl space-y-6 text-[var(--text-primary)] relative modal-content transition-colors duration-300 my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-rose-500 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border border-[var(--border-color)] cursor-pointer transition-colors shadow-sm"
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

        {/* Core Pillars / Services of Dalelak */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm sm:text-base text-[var(--text-primary)] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>محاور وخدمات منظومة دليلك المتكاملة:</span>
            </h3>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-extrabold bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
              حلول 360° متكاملة
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* Pillar 1: Documentation & Maps */}
            <div className="bg-[var(--bg-surface)] p-3.5 rounded-2xl border border-[var(--border-color)] space-y-1.5 hover:border-amber-500/30 transition-colors">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <h4 className="font-black text-xs sm:text-sm text-[var(--text-primary)]">1. التوثيقات الرسمية والتواجد الجغرافي</h4>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                توثيق وتثبيت الأنشطة على خرائط Google Maps والمنصات الجغرافية العالمية بإحداثيات GPS الدقيقة، لضمان وصول العملاء إلى موقعك بسهولة وموثوقية تامة.
              </p>
            </div>

            {/* Pillar 2: Digital Marketing */}
            <div className="bg-[var(--bg-surface)] p-3.5 rounded-2xl border border-[var(--border-color)] space-y-1.5 hover:border-amber-500/30 transition-colors">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Megaphone className="w-4 h-4" />
                </div>
                <h4 className="font-black text-xs sm:text-sm text-[var(--text-primary)]">2. التسويق الرقمي وإدارة الهوية</h4>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                تحسين محركات البحث المحلية (Local SEO)، تصدر الكلمات المفتاحية في منطقتك، وبناء حضور رقمي قوي يجلب المزيد من الاتصالات والزيارات الميدانية.
              </p>
            </div>

            {/* Pillar 3: Technology Solutions */}
            <div className="bg-[var(--bg-surface)] p-3.5 rounded-2xl border border-[var(--border-color)] space-y-1.5 hover:border-amber-500/30 transition-colors">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Cpu className="w-4 h-4" />
                </div>
                <h4 className="font-black text-xs sm:text-sm text-[var(--text-primary)]">3. الخدمات التكنولوجية والبرمجية</h4>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                إصدار الفواتير الإلكترونية المعتمدة مع رموز QR الذكية، الربط البرمجي السحابي، وإدارة بيانات الأعمال عبر لوحات تحكم متطورة ومحمية.
              </p>
            </div>

            {/* Pillar 4: Legal & IP Protection */}
            <div className="bg-[var(--bg-surface)] p-3.5 rounded-2xl border border-[var(--border-color)] space-y-1.5 hover:border-amber-500/30 transition-colors">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Scale className="w-4 h-4" />
                </div>
                <h4 className="font-black text-xs sm:text-sm text-[var(--text-primary)]">4. الخدمات القانونية والحماية الفكرية</h4>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                حماية الهوية والعلامات التجارية والأسماء المسجلة من الانتحال أو التعدي الرقمي، مع استشارات الامتثال للمعايير والسياسات الرسمية المعمول بها.
              </p>
            </div>
          </div>

          {/* Pillar 5: Business Growth & Consulting Full Width */}
          <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-yellow-500/15 p-4 rounded-2xl border border-amber-500/30 space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h4 className="font-black text-xs sm:text-sm text-[var(--text-primary)]">5. استشارات نمو وتنمية الأنشطة التجارية (Business Growth & Consulting)</h4>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed font-medium">
              تقديم استشارات إدارية وتسويقية متخصصة لمساعدة الأنشطة على التوسع الجغرافي، رفع العائد على الاستثمار، وتحليل الفرص السوقية والمنافسين لتحقيق نمو مستدام ومتسارع.
            </p>
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
    </div>,
    document.body
  );
};
