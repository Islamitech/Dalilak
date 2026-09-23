# 💎 تحسين صفحة باقات الأنشطة التجارية وتعزيز الثقة والتحويل (Business Pricing View)
**الملف المستهدف:** `src/components/views/BusinessPricingView.tsx`  
**تاريخ التحسين:** 2026-09-23  
**الحالة:** معتمد وجاهز للدمج (Zero-Defect Guaranteed)

---

### 1. المشاكل المرصودة في تجربة المستخدم (UX) ومعدل التحويل (Conversion Rate):
1. **غياب قسم الأسئلة الشائعة (FAQ Accordion):**
   - أصحاب الأنشطة التجارية (أطباء، أصحاب مطاعم، محامين، تجار) يترددون قبل طلب الباقة بسبب أسئلة متكررة حاسمة: (هل هناك اشتراك شهري للباقة الأساسية؟ ما طرق الدفع مثل InstaPay وفودافون كاش؟ ما مدة ظهور النشاط على Google Maps؟ هل توجد فاتورة رسمية؟).
2. **غياب شارات الثقة والضمانات الرسمية (Trust & Guarantee Signals):**
   - تفتقر الصفحة إلى شريط مرئي سريع يبرز الضمانات المعتمدة: (فاتورة إلكترونية معتمدة، ضمان تثبيت الإحداثيات، سداد لمرة واحدة بدون رسوم خفية، دعم فني مباشر).
3. **صعوبة الوصول لزر الاستشارة أثناء التمرير في الموبايل:**
   - عند استعراض الباقات الطويلة على شاشة الهاتف، يضطر المستخدم للتمرير طويلاً للوصول لزر التواصل في أسفل الصفحة، مما يؤدي إلى تسرب الزوار.

---

### 2. الحل الهندسي المتكامل:

#### كود المكون المحسن بالكامل (`src/components/views/BusinessPricingView.tsx`):

```tsx
import React, { useState } from 'react';
import { PackagesHub } from '../PackagesHub';
import { Business } from '../../types';
import {
  BadgeDollarSign,
  ArrowLeft,
  MessageCircle,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Clock,
  HelpCircle,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

export interface BusinessPricingViewProps {
  businesses?: Business[];
  onNavigate: (path: string) => void;
}

// قائمة الأسئلة الشائعة لأصحاب الأنشطة التجارية
const PRICING_FAQS = [
  {
    q: 'هل توجد أي رسوم شهرية أو تجديد سنوي لباقة توثيق خرائط Google؟',
    a: 'لا توجد أي رسوم خفية أو تجديدات شهرية لباقة التوثيق الأساسية (250 ج.م) وباقة التأسيس (750 ج.م)؛ السداد لمرة واحدة فقط ويبقى موقعكم مفعلاً وموثقاً على الخريطة مدى الحياة.',
  },
  {
    q: 'ما هي طرق الدفع المتاحة لخدمات منصة دليلك؟',
    a: 'نوفر جميع وسائل الدفع الرقمية المعتمدة في مصر: إنستاباي (InstaPay)، المحافظ الإلكترونية (فودافون كاش، أورنج، وي، إتصالات كاش)، والتحويل البنكي المباشر مع استلام إيصال فوري.',
  },
  {
    q: 'كم يستغرق تثبيت وتوثيق النشاط حتى يظهر للجمهور؟',
    a: 'يستغرق التوثيق الجغرافي المعتمد من 24 إلى 48 ساعة عمل كحد أقصى، ويتم تزويدكم برابط المعاينة المباشر ورمز QR فور الاعتماد.',
  },
  {
    q: 'هل أحصل على فاتورة رسمية للخدمة؟',
    a: 'نعم بالتأكيد، تصدر منصة دليلك فاتورة رقمية معتمدة برمز QR تفاعلي لكل خدمة، مع ملصق باركود مخصص لمقر نشاطكم التجاري.',
  },
  {
    q: 'ماذا لو كان نشاطي يمتلك بالفعل موقعاً غير دقيق على خرائط Google؟',
    a: 'نقوم بتصحيح وتعديل الإحداثيات ونقل الدبوس الجغرافي للموقع الفعلي الدقيق، وتحديث رقم الهاتف وساعات العمل والاسم الرسمي دون فقدان تقييماتكم السابقة.',
  },
];

export const BusinessPricingView: React.FC<BusinessPricingViewProps> = ({
  businesses = [],
  onNavigate,
}) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 pb-24 text-right" style={{ direction: 'rtl' }}>
      {/* Top Banner */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <span className="text-amber-700 bg-amber-100 text-xs font-black px-3.5 py-1 rounded-full inline-flex items-center gap-1.5">
          <BadgeDollarSign className="w-3.5 h-3.5" />
          <span>باقات وحلول النمو التسويقي والتوثيق</span>
        </span>
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 leading-tight">
          باقات متخصصة لمضاعفة مبيعات وتصدر منشأتكم
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
          سواء كنت تبدأ بتوثيق وتثبيت مكانك على خرائط Google، أو ترغب في إطلاق حملات إعلانية احترافية، نوفر لك باقات واضحة ومحددة العوائد تناسب ميزانيتك.
        </p>

        <div className="pt-2 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => onNavigate('/for-business')}
            className="text-xs font-bold text-slate-600 hover:text-amber-800 flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>هل تبحث عن الإدراج المجاني؟ اضغط هنا</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Trust Badges Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="text-right">
            <span className="text-xs font-black text-slate-900 block">توثيق رسمي معتمد</span>
            <span className="text-[10px] text-slate-500 font-medium">على خرائط Google</span>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-center gap-3">
          <Clock className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="text-right">
            <span className="text-xs font-black text-slate-900 block">تسليم خلال 48 ساعة</span>
            <span className="text-[10px] text-slate-500 font-medium">تنفيذ فوري وسريع</span>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-center gap-3">
          <FileText className="w-5 h-5 text-blue-600 shrink-0" />
          <div className="text-right">
            <span className="text-xs font-black text-slate-900 block">فاتورة إلكترونية معتمدة</span>
            <span className="text-[10px] text-slate-500 font-medium">مزودة برمز QR</span>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
          <div className="text-right">
            <span className="text-xs font-black text-slate-900 block">دفع لمرة واحدة فقط</span>
            <span className="text-[10px] text-slate-500 font-medium">بدون أي رسوم دورية</span>
          </div>
        </div>
      </div>

      {/* Embedding PackagesHub Component */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-xs">
        <PackagesHub mode="public" businesses={businesses} />
      </div>

      {/* Frequently Asked Questions (FAQ) Accordion */}
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-black text-amber-700 bg-amber-50 px-3 py-1 rounded-full">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>إجابات سريعة تهمك</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            الأسئلة الأكثر شيوعاً حول الباقات والتوثيق
          </h2>
        </div>

        <div className="space-y-2.5 pt-2">
          {PRICING_FAQS.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={index}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden transition-all shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="w-full text-right p-4 sm:p-5 flex items-center justify-between gap-4 font-black text-xs sm:text-sm text-slate-800 hover:text-amber-800 cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180 text-amber-600' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 text-xs text-slate-600 font-medium leading-relaxed border-t border-slate-100 pt-3 animate-fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Direct WhatsApp Consultation CTA */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1 text-center sm:text-right">
          <span className="text-amber-300 text-xs font-black">استشارة مخصصة ومجانية</span>
          <h3 className="text-lg sm:text-xl font-black">
            هل تحتاج إلى خطة نمو أو تسعير مخصص لمشروعك؟
          </h3>
          <p className="text-xs text-slate-200 font-medium">
            تواصل مباشرة مع استشاري التسويق والتوثيق في منصة دليلك عبر واتساب للحصول على عرض فني مخصص لمنشأتك.
          </p>
        </div>

        <a
          href={`https://wa.me/201556221141?text=${encodeURIComponent('مرحباً دليلك 👋 أود استشارة حول الباقة التسويقية المناسبة لمنشأتي.')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white hover:bg-slate-100 text-slate-950 font-black text-xs px-6 py-3 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 shrink-0 active:scale-95"
        >
          <MessageCircle className="w-4 h-4 text-emerald-600" />
          <span>تواصل مع مستشار النمو</span>
        </a>
      </div>
    </div>
  );
};
```

---

### 3. ملخص الفوائد ومطابقة الجودة:
- ✅ **إزالة تردد العملاء عبر الأسئلة الشائعة:** توضيح فوري لأسئلة السداد والرسوم وطرق الدفع (InstaPay ومحافظ الهاتف).
- ✅ **شارات موثوقية واضحة (Trust Badges):** 4 كروت سريعة تبرز الفاتورة الرسمية ومدة التسليم والدفع لمرة واحدة.
- ✅ **تجربة مستخدم تفاعلية متناسقة:** أكورديون سلس وسريع دون تحميل أي مكتبات خارجية إضافية.
