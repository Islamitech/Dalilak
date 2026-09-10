import React from 'react';
import { Logo } from './Logo';
import { 
  ShieldCheck, 
  Lock, 
  RefreshCw, 
  Scale,
  Building2,
  Cpu,
  ChevronLeft,
  Briefcase,
} from 'lucide-react';
import { BaseModal } from './ui/BaseModal';
import { Button } from './ui/Button';

export interface TermsModalProps {
  onClose: () => void;
  onOpenAbout?: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ onClose, onOpenAbout }) => {
  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      size="lg"
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
          {onOpenAbout ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenAbout();
              }}
              className="text-xs text-amber-600 hover:underline font-extrabold flex items-center gap-1 cursor-pointer"
            >
              <span>التعرف على منصة دليلك وخدماتنا (من نحن)</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          ) : <div />}

          <Button
            variant="primary"
            size="sm"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            الموافقة والإغلاق
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 border-b border-[var(--border-color)] pb-4">
          <div className="flex justify-center mb-2">
            <Logo size="lg" />
          </div>
          <h2 className="font-black text-xl sm:text-2xl text-[var(--text-primary)]">
            شروط وأحكام الاستخدام - منصة دليلك
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] font-bold max-w-lg mx-auto leading-relaxed">
            يرجى قراءة شروط وأحكام الخدمة والالتزامات العامة قبل استخدام المنصة أو الاستفادة من خدمات رقمنة وتوثيق الأعمال.
          </p>
        </div>

        {/* Terms Sections Scrollable Body */}
        <div className="space-y-3.5 text-xs sm:text-xs">
          {/* Section 1: Acceptance */}
          <div className="bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-color)] space-y-2">
            <div className="flex items-center gap-2 text-amber-500 font-black text-sm">
              <Scale className="w-4 h-4" />
              <h3>1. قبول الشروط والأحكام العامة</h3>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              باستخدامك لمنصة "دليلك" أو تسجيل نشاطك التجاري عبرها، فإنك تقر وتوافق صراحةً على الالتزام الكامل بهذه الشروط والأحكام، بالإضافة إلى أي سياسات وإرشادات تشغيلية أخرى معتمدة يتم نشرها وتحديثها دورياً على المنصة.
            </p>
          </div>

          {/* Section 2: Services Scope */}
          <div className="bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-color)] space-y-2">
            <div className="flex items-center gap-2 text-amber-500 font-black text-sm">
              <Briefcase className="w-4 h-4" />
              <h3>2. نطاق وطبيعة الخدمات المقدمة</h3>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              تعمل منصة "دليلك" كمنظومة رقمية وتطبيق متقدم لإدارة وتوثيق ونشر بيانات الأنشطة التجارية والمهنية والخدمية بجمهورية مصر العربية، وربطها بنظام الخرائط الرقمية (Google Maps) وأدلة البحث الذكية، بما يتيح للمستهلكين والجمهور الوصول المباشر للأنشطة بدقة عالية.
            </p>
          </div>

          {/* Section 3: Information Accuracy */}
          <div className="bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-color)] space-y-2">
            <div className="flex items-center gap-2 text-amber-500 font-black text-sm">
              <Building2 className="w-4 h-4" />
              <h3>3. دقة وصحة بيانات الأنشطة والمنشآت</h3>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              يتحمل صاحب النشاط أو الممثل التجاري المسؤولية القانونية الكاملة عن صحة ودقة البيانات المسجلة، بما في ذلك الاسم التجاري الرسمي، أرقام الهواتف، الإحداثيات الجغرافية لموقع المنشأة، والأسعار المعلنة. تحتفظ إدارة المنصة بالحق في مراجعة وتعديل أو حجب أي بيانات غير دقيقة أو مضللة للمستهلكين.
            </p>
          </div>

          {/* Section 4: Privacy & Data Security */}
          <div className="bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-color)] space-y-2">
            <div className="flex items-center gap-2 text-amber-500 font-black text-sm">
              <Lock className="w-4 h-4" />
              <h3>4. الخصوصية وأمان وحماية البيانات</h3>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              نلتزم بأعلى معايير حماية البيانات والتشفير الرقمي. لا يتم مشاركة البيانات الحساسة لأصحاب الأعمال أو المناديب مع أي أطراف ثالثة لأغراض تجارية، وتقتصر البيانات المنشورة للعامة على ما يخدم ترويج وتسهيل الوصول إلى المنشأة وموقعها الجغرافي ووسائل التواصل المعتمدة.
            </p>
          </div>

          {/* Section 5: Electronic Invoices & Fees */}
          <div className="bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-color)] space-y-2">
            <div className="flex items-center gap-2 text-amber-500 font-black text-sm">
              <ShieldCheck className="w-4 h-4" />
              <h3>5. الفواتير والتحصيل المالي والرسوم</h3>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              تصدر المنصة فواتير إلكترونية رقمية رسمية ومعتمدة لكل اشتراك أو معاملة تحصيل. تسري أسعار الباقات المعلنة بنظام الدفع لمرة واحدة للتأسيس أو التجديد السنوي بحسب الباقة المختارة، ولا يعتبر السداد معتمداً إلا بصدور إشعار السداد الرسمي أو إيصال التحصيل الرقمي الموثق بالنظام.
            </p>
          </div>

          {/* Section 6: IP & Technology Rights */}
          <div className="bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-color)] space-y-2">
            <div className="flex items-center gap-2 text-amber-500 font-black text-sm">
              <Cpu className="w-4 h-4" />
              <h3>6. الملكية الفكرية وحقوق المنظومة</h3>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              جميع حقوق الملكية الفكرية والعلامات التجارية وشفرات البرمجة وقواعد البيانات ونظم التصنيف الخاصة بمنصة "دليلك" وتطبيقها التقني هي ملكية حصرية وحصينة للجهة المالكة والمشغلة للمنظومة، ويحظر كشط البيانات أو الهندسة العكسية أو نسخ الهوية دون تفويض كتابي رسمي.
            </p>
          </div>

          {/* Section 7: Updates to Terms */}
          <div className="bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-color)] space-y-2">
            <div className="flex items-center gap-2 text-amber-500 font-black text-sm">
              <RefreshCw className="w-4 h-4" />
              <h3>7. التعديلات والتحديثات الدورية للشروط</h3>
            </div>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              تحتفظ المنصة بحق تحديث أو تعديل هذه الشروط في أي وقت وفقاً لمتطلبات التطوير التشغيلي أو القوانين المنظمة لخدمات التجارة الرقمية، وتصبح التعديلات نافذة فور نشرها على هذه الصفحة.
            </p>
          </div>

          {/* Official Contact Note */}
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-[var(--text-secondary)] text-center leading-relaxed font-medium">
            <p>
              لأي استفسارات بخصوص شروط الاستخدام، أو طلبات الدعم والتعديل، يرجى التواصل عبر البريد الرسمي المعتمد: <a href="mailto:info@dalilaak.com" className="font-bold text-amber-600 underline font-mono">info@dalilaak.com</a> أو زيارة الموقع الرسمي: <a href="https://www.dalilaak.com/" target="_blank" rel="noopener noreferrer" className="font-bold text-amber-600 underline font-mono">https://www.dalilaak.com/</a>.
            </p>
          </div>
        </div>
      </div>
    </BaseModal>
  );
};
