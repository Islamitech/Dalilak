import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  MapPin, 
  Crown, 
  Zap, 
  Clock, 
  Layers,
  Users
} from 'lucide-react';

export const PackagesHub: React.FC = () => {
  const [selectedPkgId, setSelectedPkgId] = useState<string>('pkg_pro');

  const detailedPackages = [
    {
      id: 'pkg_basic',
      title: 'باقة التوثيق الأساسي',
      englishTitle: 'Basic Google Maps Verification',
      price: 250,
      badge: 'توثيق رسمي 📍',
      badgeColor: 'bg-blue-500/15 text-blue-800 dark:text-blue-300 border-blue-500/30',
      cardBorder: 'hover:border-blue-500/50',
      activeBorder: 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-500/5',
      icon: MapPin,
      iconBg: 'from-blue-500 to-cyan-500',
      summary: 'التفعيل الميداني الرسمي لنشاطك التجاري على خرائط جوجل مع تثبيت الإحداثيات والبيانات الأساسية.',
      deliveryTime: '24 - 48 ساعة عمل',
      targetAudience: 'المحلات والأنشطة التي تحتاج فقط لظهور رسمي سريع على خرائط جوجل لسهولة وصول الزبائن وتوصيل الطلبات.',
      highlights: [
        'تثبيت الموقع الجغرافي الدقيق بنظام GPS',
        'رفع اللوجو وصور الواجهة ومقر النشاط',
        'إضافة أرقام الهواتف ومواعيد العمل الرسمية',
        'إصدار فاتورة إلكترونية معتمدة مع QR Code'
      ],
      featuresIncluded: [
        { name: 'التفعيل الميداني الرسمي على خرائط Google', desc: 'تثبيت مكان محلك بنقطة جغرافية دقيقة تظهر لجميع الباحثين في منطقتك.' },
        { name: 'ضبط بيانات التواصل وساعات العمل', desc: 'إضافة رقم التليفون، الواتساب، وأوقات الفتح والإغلاق طوال أيام الأسبوع.' },
        { name: 'رفع الشعار والواجهة والمنتجات', desc: 'إضافة صور عالية الجودة لواجهة المحل ومنتجاتك لجذب الزبائن.' },
        { name: 'فاتورة إلكترونية معتمدة ومشاركة WhatsApp', desc: 'إصدار رابط وفاتورة رسمية فورية يمكن مشاركتها مع المالك.' }
      ],
      idealPractices: [
        '💡 الممارسة المثالية: تزويد المندوب بأرقام هواتف نشطة طوال اليوم وتحديد مواعيد العمل بدقة.',
        '📸 نصيحة الصور: تجهيز صورة واضحة للواجهة بدون عوائق مع لافتة المحل التجارية.'
      ]
    },
    {
      id: 'pkg_pro',
      title: 'عرض التأسيس والربط الذكي',
      englishTitle: 'Pro Setup & Smart Growth',
      price: 750,
      popular: true,
      badge: 'الأكثر طلباً ومبيعاً ⭐',
      badgeColor: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30',
      cardBorder: 'hover:border-emerald-500/50',
      activeBorder: 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-500/5',
      icon: Zap,
      iconBg: 'from-emerald-500 to-teal-500',
      summary: 'توثيق جوجل + تأسيس وتجهيز صفحات المنصات الاجتماعية وتصميم الإعلانات وهوية العرض مع متابعة 3 أيام.',
      deliveryTime: '3 أيام عمل مع مرافقة',
      targetAudience: 'المحلات والشركات الراغبة في انطلاقة رقمية قوية، زيادة المبيعات، وبناء هوية تسويقية تجذب العملاء الجدد.',
      highlights: [
        'كل مميزات باقة التوثيق الأساسي على جوجل',
        'كتابة وصف تسويقي احترافي وتحسين SEO',
        'تأسيس صفحات فيسبوك والمنصات بهوية مميزة',
        'تصميم إعلان احترافي وطريقة عرض البضائع',
        'متابعة ومرافقة خطوة بخطوة لمدة 3 أيام'
      ],
      featuresIncluded: [
        { name: 'التوثيق الميداني الشامل على Google Maps', desc: 'توثيق رسمي وتثبيت معتمد مع تهيئة محركات البحث الموضعية.' },
        { name: 'تحسين محركات البحث والكلمات المفتاحية (SEO)', desc: 'صياغة اسم ووصف المحل بالكلمات التي يبحث عنها أهالي المنطقة لتتصدر النتائج.' },
        { name: 'تأسيس وبناء صفحات التواصل الاجتماعي', desc: 'إنشاء وضبط صفحات فيسبوك والمنصات باسم وهوية بصرية متناسقة مع نشاطك.' },
        { name: 'تصميم إعلان وطريقة عرض البضائع', desc: 'تصميمات إعلانية جذابة لعرض المنتجات أو قائمة الطعام بطريقة تشد انتباه الزبائن.' },
        { name: 'مرافقة وتوجيه لمدة 3 أيام', desc: 'فريق العمل يرافقك لمدة 3 أيام للرد على الاستفسارات ومساعدتك في نشر أولى العروض.' }
      ],
      idealPractices: [
        '💡 الشرط الأساسي: معرفة صاحب النشاط أو من ينوب عنه باستخدام تطبيقات الموبايل لتحقيق أفضل نتائج.',
        '🎯 نصيحة المبيعات: الاستفادة من تصاميم الإعلانات لنشر عروض افتتاح أو خصومات موسمية.'
      ]
    },
    {
      id: 'pkg_vip',
      title: 'عرض الدعم الميداني والإدارة الشاملة VIP',
      englishTitle: 'VIP Field Support & Monthly Management',
      price: 2000,
      badge: 'الإدارة الكاملة VIP 👑',
      badgeColor: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30',
      cardBorder: 'hover:border-amber-500/50',
      activeBorder: 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-500/5',
      icon: Crown,
      iconBg: 'from-amber-500 to-yellow-400 text-slate-950',
      summary: 'إدارة رقمية متكاملة وزيارات ميدانية وتصوير احترافي وتدريب عملي مع دعم يومي مستمر لمدة شهر.',
      deliveryTime: 'شهر كامل (30 يوماً)',
      targetAudience: 'المبتدئين وأصحاب الأعمال المشغولين الذين يريدون من يتولى عنهم كل شيء من التصوير إلى النشر وإدارة التقييمات.',
      highlights: [
        'كل ميزات باقة التأسيس وتوثيق خرائط جوجل',
        'زيارة ميدانية وتصوير احترافي لمقر النشاط',
        'خطة تسويقية وتصميم بوستات وإعلانات مخصصة',
        'تدريب خطوة بخطوة لصناعة العروض الناجحة',
        'دعم يومي متواصل ومتابعة لمدة شهر كامل',
        'تجديد اختياري مخفض بـ 1000 ج فقط للشهور التالية'
      ],
      featuresIncluded: [
        { name: 'زيارة ميدانية وتصوير احترافي للمحل', desc: 'يقوم مندوب متخصص بزيارة مقرك والتقاط صور مميزة للمكان والمنتجات بجودة فائقة.' },
        { name: 'خطة تسويقية وبناء هوية رقمية كاملة', desc: 'إعداد خطة ترويجية للمحل، تصميم بنرات وبوستات إعلانية متجددة.' },
        { name: 'تدريب عملي خطوة بخطوة لصاحب النشاط', desc: 'تعليمك كيفية إدارة الصفحات، الرد السريع، وعمل إعلانات ممولة ناجحة بنفسك.' },
        { name: 'دعم واستشارات يومية لمدة شهر كامل', desc: 'تواصل ومتابعة يومية للرد على أي استفسار وحل أي عقبات تسويقية.' },
        { name: 'إدارة التقييمات والرد على آراء الزبائن', desc: 'متابعة تقييمات العملاء على خرائط جوجل وحماية سمعة النشاط.' },
        { name: 'ميزة التجديد المخفض (1000 ج/شهر)', desc: 'بعد انتهاء الشهر الأول، يمكنك الاستمرار في خدمة الإدارة الشهرية بنصف السعر فقط.' }
      ],
      idealPractices: [
        '💡 الفئة المستهدفة: للمبتدئين ومن ليس لديهم وقت لإدارة السوشيال ميديا أو من يواجهون صعوبة تقنية.',
        '📈 أفضل استفادة: تحديد أوقات الزيارة الميدانية عندما يكون المحل جاهزاً بأفضل تشكيلة بضائع.'
      ]
    }
  ];

  const selectedPkg = detailedPackages.find((p) => p.id === selectedPkgId) || detailedPackages[1];

  const comparisonRows = [
    {
      feature: 'التفعيل والتوثيق الرسمي على خرائط Google',
      basic: true,
      pro: true,
      vip: true,
    },
    {
      feature: 'تثبيت إحداثيات الموقع الجغرافي بدقة GPS',
      basic: true,
      pro: true,
      vip: true,
    },
    {
      feature: 'إضافة اللوجو وصور الواجهة وساعات العمل',
      basic: true,
      pro: true,
      vip: true,
    },
    {
      feature: 'فاتورة إلكترونية معتمدة مع رمز QR وواتساب',
      basic: true,
      pro: true,
      vip: true,
    },
    {
      feature: 'تحسين محركات البحث والكلمات المفتاحية (SEO)',
      basic: false,
      pro: true,
      vip: true,
    },
    {
      feature: 'تأسيس صفحات السوشيال ميديا باسم وهوية مميزة',
      basic: false,
      pro: true,
      vip: true,
    },
    {
      feature: 'تصميم إعلانات احترافية وطريقة عرض البضائع',
      basic: false,
      pro: true,
      vip: true,
    },
    {
      feature: 'زيارة ميدانية وتصوير احترافي لمقر النشاط',
      basic: false,
      pro: false,
      vip: true,
    },
    {
      feature: 'تدريب عملي خطوة بخطوة لصاحب النشاط',
      basic: false,
      pro: false,
      vip: true,
    },
    {
      feature: 'إدارة ومتابعة يومية للتقييمات والاستفسارات',
      basic: false,
      pro: 'متابعة 3 أيام',
      vip: 'دعم يومي لمدة شهر',
    },
    {
      feature: 'السعر الرسمي الإجمالي',
      basic: '250 ج.م',
      pro: '750 ج.م',
      vip: '2,000 ج.م (تجديد 1,000 ج)',
    },
  ];

  return (
    <div className="space-y-6 font-['Cairo',sans-serif] text-[var(--text-primary)]">
      {/* ========================================================================= */}
      {/* 1. HERO BANNER */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 text-slate-950 p-4 sm:p-6 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-slate-950/20 text-slate-950 text-[11px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider">
              باقات التوثيق والتأسيس والنمو الرقمي 💎
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black">
            دليل وشرح باقات خدمات منصة دليلك في مصر 🚀
          </h2>
          <p className="text-xs sm:text-sm font-bold text-slate-900/90 max-w-2xl leading-relaxed">
            حلول رقمية متدرجة تبدأ من التوثيق الميداني الأساسي على خرائط جوجل، مروراً بالتأسيس وبناء الهوية التسويقية، وحتى الإدارة الشاملة والدعم اليومي المتكامل.
          </p>
        </div>
        <div className="absolute -left-6 -bottom-6 opacity-15 pointer-events-none">
          <Crown className="w-44 h-44" />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TOP 3 PACKAGES INTERACTIVE CARDS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {detailedPackages.map((pkg) => {
          const IconComp = pkg.icon;
          const isSelected = selectedPkgId === pkg.id;

          return (
            <div
              key={pkg.id}
              onClick={() => setSelectedPkgId(pkg.id)}
              className={`p-4 sm:p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 shadow-sm hover:shadow-md ${
                isSelected
                  ? `${pkg.activeBorder} bg-[var(--bg-card)]`
                  : `bg-[var(--bg-card)] border-[var(--border-color)] ${pkg.cardBorder}`
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${pkg.iconBg} flex items-center justify-center font-black shadow-md shrink-0`}>
                    <IconComp className="w-5 h-5 text-white" />
                  </div>
                  <span className={`text-[10px] sm:text-xs font-black px-2.5 py-1 rounded-full border ${pkg.badgeColor}`}>
                    {pkg.badge}
                  </span>
                </div>

                <div>
                  <h3 className="font-black text-base sm:text-lg text-[var(--text-primary)]">
                    {pkg.title}
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)] font-mono font-bold mt-0.5">
                    {pkg.englishTitle}
                  </p>
                </div>

                <div className="flex items-baseline gap-1 pt-1 border-t border-[var(--border-color)]">
                  <span className="text-2xl font-black text-amber-700 dark:text-amber-400">
                    {pkg.price}
                  </span>
                  <span className="text-xs font-black text-[var(--text-muted)]">جنيه مصري</span>
                  {pkg.id === 'pkg_vip' && (
                    <span className="text-[10px] text-[var(--text-muted)] font-bold mr-1">/ للشهر الأول</span>
                  )}
                </div>

                <p className="text-xs text-[var(--text-secondary)] font-bold leading-relaxed">
                  {pkg.summary}
                </p>
              </div>

              <div className="pt-2 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPkgId(pkg.id);
                  }}
                  className={`w-full py-2 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md'
                      : 'bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-amber-500/10'
                  }`}
                >
                  <span>{isSelected ? '✓ الباقة المعروضة حالياً' : 'استعراض التفاصيل الكاملة ←'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 3. DETAILED VIEW FOR SELECTED PACKAGE */}
      {/* ========================================================================= */}
      <div className="bg-[var(--bg-card)] border-2 border-amber-500/30 rounded-3xl p-5 sm:p-6 space-y-6 shadow-md transition-colors duration-300">
        {/* Header of Detail Box */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-color)] pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${selectedPkg.iconBg} flex items-center justify-center text-white font-black shadow-md shrink-0`}>
              <selectedPkg.icon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-lg sm:text-xl text-[var(--text-primary)]">
                  {selectedPkg.title}
                </h3>
                <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${selectedPkg.badgeColor}`}>
                  {selectedPkg.badge}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] font-bold mt-0.5">
                الاستثمار: <span className="text-amber-700 dark:text-amber-400 font-black">{selectedPkg.price} ج.م</span> | مدة التنفيذ: <span className="text-[var(--text-primary)] font-bold">{selectedPkg.deliveryTime}</span>
              </p>
            </div>
          </div>

          <div className="bg-[var(--input-bg)] px-3.5 py-2 rounded-2xl border border-[var(--border-color)] text-xs font-bold text-[var(--text-secondary)] flex items-center gap-2 shrink-0">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>مدة التسليم والمتابعة: {selectedPkg.deliveryTime}</span>
          </div>
        </div>

        {/* 2-Columns Grid: Features Breakdown & Best Practices */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Column 1: Detailed Inclusions */}
          <div className="bg-[var(--bg-surface)] p-4 sm:p-5 rounded-2xl border border-[var(--border-color)] space-y-3.5">
            <h4 className="font-black text-sm text-[var(--text-primary)] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>ما تتضمنه هذه الباقة بدقة:</span>
            </h4>
            
            <div className="space-y-2.5">
              {selectedPkg.featuresIncluded.map((feat, idx) => (
                <div key={idx} className="p-2.5 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] space-y-1">
                  <div className="flex items-center gap-2 font-black text-xs text-[var(--text-primary)]">
                    <span className="w-5 h-5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] shrink-0">
                      ✓
                    </span>
                    <span>{feat.name}</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] font-bold pr-7 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Target Audience & Best Execution Practices */}
          <div className="space-y-4">
            {/* Target Audience Card */}
            <div className="bg-[var(--bg-surface)] p-4 sm:p-5 rounded-2xl border border-[var(--border-color)] space-y-2">
              <h4 className="font-black text-sm text-[var(--text-primary)] flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-500" />
                <span>الأنشطة والفئة المستهدفة:</span>
              </h4>
              <p className="text-xs text-[var(--text-secondary)] font-bold leading-relaxed">
                {selectedPkg.targetAudience}
              </p>
            </div>

            {/* Best Practices Card */}
            <div className="bg-amber-500/5 p-4 sm:p-5 rounded-2xl border border-amber-500/30 space-y-2.5">
              <h4 className="font-black text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>إرشادات ونصائح النجاح:</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-[var(--text-secondary)] font-bold">
                {selectedPkg.idealPractices.map((practice, idx) => (
                  <li key={idx} className="leading-relaxed bg-[var(--bg-card)] p-2 rounded-xl border border-[var(--border-color)]">
                    {practice}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. COMPREHENSIVE COMPARISON MATRIX TABLE */}
      {/* ========================================================================= */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-4 sm:p-6 space-y-4 shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-base sm:text-lg text-[var(--text-primary)]">
              جدول المقارنة الشاملة بين الباقات 📊
            </h3>
            <p className="text-xs text-[var(--text-muted)] font-bold">
              مقارنة تفصيلية دقيقة لتحديد الباقة المثالية لاحتياجات وميزانية كل نشاط تجاري
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs border-collapse min-w-[620px]">
            <thead>
              <tr className="border-b border-[var(--border-color)] text-[var(--text-muted)]">
                <th className="py-3 px-3 font-black text-xs text-[var(--text-primary)]">الخدمة / الميزة</th>
                <th className="py-3 px-3 font-black text-xs text-center text-blue-600 dark:text-blue-400">
                  1. التوثيق الأساسي (250 ج)
                </th>
                <th className="py-3 px-3 font-black text-xs text-center text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 rounded-t-xl">
                  2. التأسيس والربط (750 ج) ⭐
                </th>
                <th className="py-3 px-3 font-black text-xs text-center text-amber-600 dark:text-amber-400">
                  3. الدعم الميداني VIP (2000 ج)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {comparisonRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-[var(--bg-surface)] transition-colors">
                  <td className="py-3 px-3 font-bold text-[var(--text-primary)] text-xs">
                    {row.feature}
                  </td>
                  
                  {/* Basic */}
                  <td className="py-3 px-3 text-center">
                    {typeof row.basic === 'boolean' ? (
                      row.basic ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-600 font-bold">✓</span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-500/10 text-slate-400 font-bold">—</span>
                      )
                    ) : (
                      <span className="font-extrabold text-blue-600 dark:text-blue-400">{row.basic}</span>
                    )}
                  </td>

                  {/* Pro */}
                  <td className="py-3 px-3 text-center bg-emerald-500/5 font-bold">
                    {typeof row.pro === 'boolean' ? (
                      row.pro ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-black">✓</span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-500/10 text-slate-400 font-bold">—</span>
                      )
                    ) : (
                      <span className="font-black text-emerald-700 dark:text-emerald-300">{row.pro}</span>
                    )}
                  </td>

                  {/* VIP */}
                  <td className="py-3 px-3 text-center font-bold">
                    {typeof row.vip === 'boolean' ? (
                      row.vip ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 font-black">✓</span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-500/10 text-slate-400 font-bold">—</span>
                      )
                    ) : (
                      <span className="font-black text-amber-700 dark:text-amber-400">{row.vip}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
