import React from 'react';
import { Logo } from './Logo';
import { 
  FileText, 
  ShieldCheck, 
  CreditCard, 
  Smartphone, 
  AlertCircle, 
  CheckCircle2, 
  Lock, 
  RefreshCw, 
  Scale,
  Building2,
  ChevronLeft
} from 'lucide-react';

interface TermsModalProps {
  onClose: () => void;
  onOpenAbout?: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ onClose, onOpenAbout }) => {
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

        {/* Header */}
        <div className="text-center space-y-2 pt-1 border-b border-[var(--border-color)] pb-4">
          <div className="flex justify-center mb-2">
            <Logo size="lg" />
          </div>
          <h2 className="font-black text-xl sm:text-2xl text-[var(--text-primary)]">
            شروط وأحكام الاستخدام - منصة دليلك 📜
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-bold max-w-lg mx-auto leading-relaxed">
            يرجى قراءة شروط وأحكام الخدمة بعناية قبل استخدام المنصة أو تسجيل الأنشطة التجارية وسداد الرسوم.
          </p>
        </div>

        {/* Terms Sections Scrollable Body */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 text-xs sm:text-xs">
          {/* Section 1: Acceptance */}
          <div className="bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-color)] space-y-2">
            <div className="flex items-center gap-2 text-amber-500 font-black text-sm">
              <Scale className="w-4 h-4" />
              <h3>1. قبول الشروط والأحكام العامة</h3>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed font-medium">
              باستخدامك لمنصة "دليلك" لخدمات توثيق خرائط جوجل أو تسجيلك لأي نشاط تجاري من خلال مندوبينا أو عبر موقعنا، فإنك تقر وتوافق صراحة على الالتزام الكامل بكافة الشروط والبنود المنصوص عليها في هذه الوثيقة وأي تحديثات تطرأ عليها مستقبلاً.
            </p>
          </div>

          {/* Section 2: Payment Policy - Emphasizing Vodafone Cash */}
          <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/30 space-y-2.5">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-sm">
              <Smartphone className="w-4 h-4" />
              <h3>2. سياسة الدفع والتحصيل المالي (فودافون كاش)</h3>
            </div>
            <ul className="space-y-2 text-[var(--text-secondary)] list-disc list-inside font-medium leading-relaxed">
              <li>
                <strong className="text-[var(--text-primary)]">وسيلة الدفع الوحيدة المعتمدة حالياً:</strong> يتم سداد وتحصيل كافة رسوم الباقات والاشتراكات حصرياً عبر محفظة فودافون كاش الرسمية التابعة للشركة على الرقم: <span className="text-emerald-600 dark:text-emerald-400 font-mono font-black dir-ltr inline-block px-1.5 py-0.5 bg-[var(--input-bg)] rounded">01143888355</span>.
              </li>
              <li>
                <strong className="text-[var(--text-primary)]">طرق الدفع الأخرى:</strong> نود التوضيح أن بوابات الدفع الإلكتروني الإضافية مثل (شبكة فوري Fawry، منظومة إنستاباي InstaPay، بطاقات فيزا / ميزة / ماستركارد البنكية) هي <em>قيد التطوير والربط البرمجي والاعتماد حالياً</em> وستتاح فور اكتمالها رسمياً.
              </li>
              <li>
                <strong className="text-[var(--text-primary)]">إثبات التحويل:</strong> يلتزم العميل أو المندوب بالاحتفاظ برسالة التأكيد النصية أو كود العملية وإدخال القيمة المسددة لإصدار الفاتورة الإلكترونية الفورية.
              </li>
            </ul>
          </div>

          {/* Section 3: Data Accuracy & Responsibility */}
          <div className="bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-color)] space-y-2">
            <div className="flex items-center gap-2 text-amber-500 font-black text-sm">
              <Building2 className="w-4 h-4" />
              <h3>3. دقة البيانات التجارية والمسؤولية القانونية</h3>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed font-medium">
              يقر صاحب النشاط التجاري بصحة ودقة كافة البيانات المقدمة (الاسم التجاري، العنوان بالتفصيل، أرقام الهواتف، صور واجهة المحل، وساعات العمل). وتخلي شركة "دليلك" مسؤوليتها عن أي بيانات مضللة أو غير حقيقية يتم تقديمها من قبل العميل.
            </p>
          </div>

          {/* Section 4: Google Maps Policies & Verification */}
          <div className="bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-color)] space-y-2">
            <div className="flex items-center gap-2 text-amber-500 font-black text-sm">
              <ShieldCheck className="w-4 h-4" />
              <h3>4. إجراءات التوثيق والتوافق مع معايير Google</h3>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed font-medium">
              تتم عمليات توثيق وتثبيت الأنشطة وفقاً للإرشادات الفنية وسياسات الخصوصية والجودة المعتمدة من Google. قد تستغرق فترة المراجعة والظهور الكامل على الخرائط فترة تتراوح بين 24 إلى 72 ساعة عمل بعد التحقق الميداني واستيفاء المتطلبات.
            </p>
          </div>

          {/* Section 5: Electronic Invoices */}
          <div className="bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-color)] space-y-2">
            <div className="flex items-center gap-2 text-amber-500 font-black text-sm">
              <FileText className="w-4 h-4" />
              <h3>5. الفواتير الإلكترونية المعتمدة ورموز QR</h3>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed font-medium">
              تصدر المنصة فاتورة إلكترونية معتمدة برقم موحد وتاريخ إصدار ورمز استجابة سريعة (QR Code) قابل للتحقق عبر الإنترنت، ويتم إرسال نسخة الفاتورة فورياً إلى رقم واتساب المالك المسجل في النظام.
            </p>
          </div>

          {/* Section 6: Privacy & Data Protection */}
          <div className="bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-color)] space-y-2">
            <div className="flex items-center gap-2 text-amber-500 font-black text-sm">
              <Lock className="w-4 h-4" />
              <h3>6. سياسة الخصوصية وحماية البيانات</h3>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed font-medium">
              تلتزم منصة "دليلك" بالحفاظ على سرية وخصوصية البيانات الحساسة لأصحاب الأنشطة والمناديب، وعدم بيعها أو مشاركتها مع أي جهات خارجية غير مفوضة، وتستخدم البيانات فقط لأغراض التوثيق والدعم الفني وإصدار الفواتير.
            </p>
          </div>

          {/* Section 7: Cancellation & Refund */}
          <div className="bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-color)] space-y-2">
            <div className="flex items-center gap-2 text-amber-500 font-black text-sm">
              <RefreshCw className="w-4 h-4" />
              <h3>7. سياسة الإلغاء والتعديل والاسترجاع</h3>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed font-medium">
              يحق للعميل طلب تعديل بيانات النشاط في أي وقت قبل استكمال إجراءات النشر الميداني النهائي. في حال تعذر التوثيق لظروف تقنية ترجع للمنصة، يتم رد المبالغ المحصلة لنفس محفظة فودافون كاش بعد مراجعة الإدارة المختصة.
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
              <span>التعرف أكثر على منصة دليلك (من نحن)</span>
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
    </div>
  );
};
