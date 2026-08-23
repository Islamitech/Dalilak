import React from 'react';
import { Logo } from './Logo';
import { 
  MapPin, 
  ShieldCheck, 
  Sparkles, 
  Target, 
  Compass, 
  Award, 
  CheckCircle2, 
  Phone, 
  Smartphone, 
  Users, 
  Building2, 
  HelpCircle,
  Clock,
  Layers,
  FileCheck,
  ChevronLeft
} from 'lucide-react';

interface AboutUsModalProps {
  onClose: () => void;
  onOpenTerms?: () => void;
}

export const AboutUsModal: React.FC<AboutUsModalProps> = ({ onClose, onOpenTerms }) => {
  return (
    <div className="fixed inset-0 z-50 bg-[var(--modal-overlay)] backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto modal-overlay">
      <div className="bg-[var(--modal-bg)] border border-[var(--modal-border)] rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl space-y-6 text-[var(--text-primary)] relative modal-content transition-colors duration-300 my-auto">
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
            من نحن - شركة دليلك لخرائط جوجل والتسويق الرقمي 🗺️
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-bold max-w-lg mx-auto leading-relaxed">
            المنظومة الرقمية الرائدة في جمهورية مصر العربية لتوثيق وتثبيت الأنشطة التجارية والمحلات والشركات على خرائط Google Maps ومحركات البحث العالمية.
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
              أن نكون الجسر الرقمي الأول لكل صاحب عمل ونشاط تجاري في مصر للوصول إلى ملايين العملاء عبر الخرائط الذكية والبحث الجغرافي بأعلى دقة واحترافية.
            </p>
          </div>

          <div className="bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-color)] space-y-2 relative overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center font-bold">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="font-black text-sm text-[var(--text-primary)]">رسالتنا (Our Mission)</h3>
            <p className="text-[var(--text-secondary)] leading-relaxed font-medium">
              تقديم خدمات توثيق وتثبيت ميدانية معتمدة مطابقة لسياسات ومعايير Google، مع إصدار فواتير إلكترونية فورية ومتابعة مستمرة لضمان تصدر نشاطك محلياً.
            </p>
          </div>
        </div>

        {/* What We Offer / Core Features */}
        <div className="space-y-3">
          <h3 className="font-black text-sm text-[var(--text-primary)] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>ما يميز منظومة دليلك:</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="flex items-start gap-2.5 bg-[var(--input-bg)] p-3 rounded-xl border border-[var(--border-color)]">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[var(--text-primary)] block">توثيق رسمي وإحداثيات GPS دقيقة:</span>
                <span className="text-[11px] text-[var(--text-muted)]">تثبيت الموقع الجغرافي وتصنيف النشاط وساعات العمل وأرقام التواصل.</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 bg-[var(--input-bg)] p-3 rounded-xl border border-[var(--border-color)]">
              <Users className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[var(--text-primary)] block">شبكة مناديب ميدانيين معتمدين:</span>
                <span className="text-[11px] text-[var(--text-muted)]">تغطية شاملة لجميع محافظات مصر مع زيارات ميدانية للتحقق وتصوير الموقع.</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 bg-[var(--input-bg)] p-3 rounded-xl border border-[var(--border-color)]">
              <FileCheck className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[var(--text-primary)] block">فواتير إلكترونية معتمدة:</span>
                <span className="text-[11px] text-[var(--text-muted)]">إصدار فاتورة إلكترونية مع رمز QR وإرسالها فورياً عبر الواتساب لصاحب العمل.</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5 bg-[var(--input-bg)] p-3 rounded-xl border border-[var(--border-color)]">
              <ShieldCheck className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[var(--text-primary)] block">توافق كامل مع سياسات Google:</span>
                <span className="text-[11px] text-[var(--text-muted)]">نلتزم بالمعايير الفنية والسياسات الرسمية لضمان ثبات وظهور النشاط واستمراريته.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment & Contact Box */}
        <div className="bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-teal-500/15 border border-emerald-500/30 rounded-2xl p-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <h4 className="font-black text-xs sm:text-sm text-[var(--text-primary)]">طريقة السداد والتحصيل المعتمدة:</h4>
                <p className="text-[11px] text-[var(--text-secondary)]">التحويل الرسمي عبر محفظة فودافون كاش</p>
              </div>
            </div>
            <div className="bg-emerald-600 text-white font-mono font-black text-sm px-3.5 py-1 rounded-xl shadow dir-ltr">
              01143888355
            </div>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
            * تنويه: محفظة فودافون كاش على الرقم أعلاه هي وسيلة الدفع المعتمدة حالياً، وباقي الوسائل الإلكترونية (فوري، إنستاباي، البطاقات البنكية) قيد التطوير والتفعيل قريباً.
          </p>
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
    </div>
  );
};
