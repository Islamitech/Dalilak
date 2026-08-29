import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Logo } from './Logo';
import { 
  ShieldCheck, 
  Lock, 
  RefreshCw, 
  Scale,
  Building2,
  Cpu,
  ChevronLeft,
  Briefcase
} from 'lucide-react';

interface TermsModalProps {
  onClose: () => void;
  onOpenAbout?: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ onClose, onOpenAbout }) => {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto modal-overlay">
      <div className="bg-[var(--modal-bg)] border border-[var(--modal-border)] rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl space-y-6 text-[var(--text-primary)] relative modal-content transition-colors duration-300 my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-rose-500 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border border-[var(--border-color)] cursor-pointer transition-colors shadow-sm"
          aria-label="إغلاق"
        >
          ✕
        </button>

        {/* Header */}
        <div className="text-center space-y-2 pt-1 border-b border-[var(--border-color)] pb-4">
          <div className="flex justify-center mb-2">
            <Logo size="lg" />
          </div>
          <h2 className="font-black text-xl sm:text-2xl text-[var(--text-primary)]">
            شروط وأحكام الاستخدام - منصة دليلك 📜
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-bold max-w-lg mx-auto leading-relaxed">
            يرجى قراءة شروط وأحكام الخدمة والالتزامات العامة قبل استخدام المنصة أو الاستفادة من خدمات رقمنة وتوثيق الأعمال.
          </p>
        </div>

        {/* Terms Sections Scrollable Body */}
        <div className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1 text-xs sm:text-xs">
          {/* Section 1: Acceptance */}
          <div className="bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-color)] space-y-2">
            <div className="flex items-center gap-2 text-amber-500 font-black text-sm">
              <Scale className="w-4 h-4" />
              <h3>1. قبول الشروط والأحكام العامة</h3>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed font-medium">
              باستخدامك لمنصة "دليلك" لخدمات رقمنة وتوثيق الأعمال والأنشطة التجارية، فإنك تقر وتوافق صراحة على الالتزام الكامل بكافة الشروط والبنود المنصوص عليها في هذه الاتفاقية والسياسات المنظمة لتقديم الخدمات.
            </p>
          </div>

          {/* Section 2: Data Accuracy & Legal Responsibility */}
          <div className="bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-color)] space-y-2">
            <div className="flex items-center gap-2 text-amber-500 font-black text-sm">
              <Building2 className="w-4 h-4" />
              <h3>2. دقة البيانات التجارية والمسؤولية القانونية</h3>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed font-medium">
              يقر صاحب النشاط التجاري بصحة ودقة كافة البيانات والمستندات المقدمة (الاسم التجاري، العنوان بالتفصيل، أرقام الهواتف، الصور، ونوع النشاط). وتخلي المنصة مسؤوليتها عن أي بيانات غير دقيقة يقدمها صاحب العمل أو مفوضه.
            </p>
          </div>

          {/* Section 3: Intellectual Property & Trademark Protection */}
          <div className="bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-color)] space-y-2">
            <div className="flex items-center gap-2 text-amber-500 font-black text-sm">
              <ShieldCheck className="w-4 h-4" />
              <h3>3. الملكية الفكرية وحماية الهوية التجارية</h3>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed font-medium">
              كافة المحتويات والأنظمة والعلامات الخاصة بمنصة "دليلك" محمية بموجب قوانين الملكية الفكرية. كما تلتزم المنصة بالمحافظة على الهوية التجارية للعملاء وحمايتها من أي تعديات أو انتحال رقمي وفق النظم المعمول بها.
            </p>
          </div>

          {/* Section 4: Verification and Google Policies */}
          <div className="bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-color)] space-y-2">
            <div className="flex items-center gap-2 text-amber-500 font-black text-sm">
              <Briefcase className="w-4 h-4" />
              <h3>4. إجراءات التوثيق والامتثال للمعايير الرقمية</h3>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed font-medium">
              تخضع عمليات توثيق وتثبيت الأنشطة وتطويرها للمعايير الفنية والسياسات الصادرة من المنصات الرقمية العالمية ومحركات البحث وGoogle Maps لضمان استمرارية النشاط وظهوره الموثوق.
            </p>
          </div>

          {/* Section 5: Electronic Invoices & Tech Delivery */}
          <div className="bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-color)] space-y-2">
            <div className="flex items-center gap-2 text-amber-500 font-black text-sm">
              <Cpu className="w-4 h-4" />
              <h3>5. الفواتير الإلكترونية المعتمدة ورموز QR</h3>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed font-medium">
              تصدر المنصة فاتورة إلكترونية معتمدة برقم تسلسلي موحد ورمز استجابة سريعة (QR Code) موثق لكل عملية تسجيل ونشاط يتم إنجازه وربطه في المنظومة.
            </p>
          </div>

          {/* Section 6: Privacy & Confidentiality */}
          <div className="bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-color)] space-y-2">
            <div className="flex items-center gap-2 text-amber-500 font-black text-sm">
              <Lock className="w-4 h-4" />
              <h3>6. سرية البيانات والخصوصية</h3>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed font-medium">
              تتعهد المنصة بالمحافظة على سرية وخصوصية البيانات الحساسة لأصحاب الأنشطة والشركات المسجلة وعدم استخدامها إلا للأغراض الخدمية والتشغيلية المعتمدة.
            </p>
          </div>

          {/* Section 7: Modification & Amendments */}
          <div className="bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-color)] space-y-2">
            <div className="flex items-center gap-2 text-amber-500 font-black text-sm">
              <RefreshCw className="w-4 h-4" />
              <h3>7. التعديلات وتحديثات الشروط</h3>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed font-medium">
              تحتفظ إدارة المنصة بالحق في تحديث وتطوير بنود هذه الاتفاقية لتواكب التطورات التكنولوجية والتنظيمية، وتصبح التحديثات سارية فور نشرها على المنصة.
            </p>
          </div>

          {/* Section 8: Official Contact & Legal Inquiries */}
          <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-500/30 space-y-2">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-black text-sm">
              <span>✉️</span>
              <h3>8. قنوات التواصل والاستفسارات القانونية والدعم</h3>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed font-medium">
              لأي استفسارات بخصوص شروط الاستخدام، أو طلبات الدعم والتعديل، يرجى التواصل عبر البريد الرسمي المعتمد: <a href="mailto:info@dalilaak.com" className="font-bold text-amber-600 dark:text-amber-400 underline font-mono">info@dalilaak.com</a> أو زيارة الموقع الرسمي: <a href="https://www.dalilaak.com/" target="_blank" rel="noopener noreferrer" className="font-bold text-amber-600 dark:text-amber-400 underline font-mono">https://www.dalilaak.com/</a>.
            </p>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[var(--border-color)]">
          {onOpenAbout ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAbout();
              }}
              className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-extrabold flex items-center gap-1 cursor-pointer"
            >
              <span>التعرف على منصة دليلك وخدماتنا (من نحن)</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          ) : <div />}

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-6 py-2.5 rounded-xl shadow cursor-pointer transition-all active:scale-95"
          >
            الموافقة والإغلاق
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
