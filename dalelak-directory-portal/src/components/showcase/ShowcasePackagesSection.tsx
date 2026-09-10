import React from 'react';
import { PackageOption } from '../../types';
import { PACKAGES } from '../../data/mockData';
import {
  Sparkles,
  CheckCircle2,
  Check,
  MessageCircle,
  Star,
  Crown,
} from 'lucide-react';

export interface ShowcasePackagesSectionProps {
  onOpenPackagesModal: (pkgId: string) => void;
  getPackageWhatsAppUrl: (pkg: PackageOption) => string;
  onSelectPackageForConsultation: (pkgTitle: string) => void;
}

export const ShowcasePackagesSection: React.FC<ShowcasePackagesSectionProps> = ({
  onOpenPackagesModal,
  getPackageWhatsAppUrl,
  onSelectPackageForConsultation,
}) => {
  return (
    <section
      id="packages"
      className="py-14 sm:py-20 bg-gradient-to-b from-[var(--bg-primary)] via-amber-500/5 to-[var(--bg-primary)] border-t border-b border-[var(--border-color)]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Main Section Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider bg-emerald-500/15 px-4 py-1.5 rounded-full border border-emerald-500/30 inline-flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>الظهور مجاني تماماً 100% · والباقات حملات دعائية حسب الطلب</span>
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-[var(--text-primary)]">
            ظهور منشأتكم في الدليل مجاني وبدون أي رسوم!
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] font-bold leading-relaxed">
            لا نفرض أي اشتراكات أو تكاليف لإدراج محلك وظهوره لآلاف الزبائن في منصة دليلك. فقط اطلب الظهور وسيتم نشره مجاناً.
            أما إذا أردت مضاعفة مبيعاتك وتصدر نتائج البحث، نوفر لك حملات دعائية احترافية حسب رغبتك واحتياجك.
          </p>
        </div>

        {/* 🌟 1. STANDALONE FREE LISTING FEATURED CARD */}
        <div
          id="free-listing"
          className="max-w-4xl mx-auto bg-gradient-to-br from-emerald-500/15 via-[var(--bg-card)] to-teal-500/10 border-2 border-emerald-500 rounded-3xl p-6 sm:p-9 shadow-2xl shadow-emerald-500/10 space-y-6"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--border-color)] pb-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 text-[11px] font-black px-3 py-1 rounded-full border border-emerald-500/40">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>إدراج فوري دائم بدون رسوم</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">
                إدراج وظهور المنشأة في دليل المنصة
              </h3>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] font-bold leading-relaxed">
                متاح لكافة المنشآت والمحلات التجارية والخدمية في كافة المحافظات دون دفع أي قرش
              </p>
            </div>

            <div className="text-right sm:text-left bg-emerald-500/15 border border-emerald-500/30 px-5 py-3 rounded-2xl shrink-0">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  0
                </span>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">جنيه مصري</span>
              </div>
              <span className="text-[11px] font-black text-emerald-800 dark:text-emerald-300 block mt-0.5">
                مجاني 100% مدى الحياة
              </span>
            </div>
          </div>

          {/* Free features list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {PACKAGES[0].features.map((feat, i) => (
              <div key={i} className="flex items-start gap-2.5 text-xs text-[var(--text-secondary)] font-bold">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5 stroke-[3]" />
                <span className="leading-relaxed">{feat}</span>
              </div>
            ))}
          </div>

          {/* Action Buttons for Free */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <a
              href={getPackageWhatsAppUrl(PACKAGES[0])}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:flex-1 py-3.5 rounded-2xl font-black text-xs sm:text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/20 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>اطلب ظهور مكانكم مجاناً الآن عبر واتساب</span>
            </a>

            <button
              type="button"
              onClick={() => onOpenPackagesModal('pkg_free')}
              className="w-full sm:w-auto px-5 py-3.5 rounded-2xl font-black text-xs text-emerald-600 dark:text-emerald-400 hover:text-white hover:bg-emerald-600 bg-emerald-500/10 border border-emerald-500/30 text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>استعراض الشرح في النافذة</span>
            </button>

            <a
              href="#consultation"
              onClick={() => onSelectPackageForConsultation(PACKAGES[0].title)}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-black text-xs text-[var(--text-secondary)] hover:text-emerald-600 dark:hover:text-emerald-400 bg-[var(--input-bg)] border border-[var(--border-color)] hover:border-emerald-500/40 text-center transition-all cursor-pointer"
            >
              تسجيل البيانات عبر النموذج
            </a>
          </div>
        </div>

        {/* 🌟 2. ON-DEMAND ADVERTISING CAMPAIGNS HEADER */}
        <div className="pt-8 text-center space-y-3 max-w-3xl mx-auto">
          <span className="text-amber-500 text-xs font-black uppercase tracking-wider bg-amber-500/15 px-3.5 py-1.5 rounded-full border border-amber-500/30 inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>حملات دعائية وترويجية (اختيارية حسب الطلب)</span>
          </span>
          <h3 className="text-xl sm:text-3xl font-black text-[var(--text-primary)]">
            باقات الحملات الدعائية والتسويق الاحترافي
          </h3>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] font-bold leading-relaxed">
            هذه الباقات ليست شرطاً لظهورك في الدليل، بل هي حملات دعائية وتسويقية إضافية تكون حسب رغبتك لتعزيز مبيعاتك وتصدر نتائج البحث وجذب آلاف الزبائن الجدد.
          </p>

          {/* Launch Interactive Guide Modal Button */}
          <div className="pt-2 flex justify-center">
            <button
              type="button"
              onClick={() => onOpenPackagesModal('pkg_basic')}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer border border-amber-400"
            >
              <Sparkles className="w-4 h-4 stroke-[2.5]" />
              <span>عرض الدليل والشرح التفاعلي الشامل للباقات</span>
            </button>
          </div>
        </div>

        {/* 🌟 3. CAMPAIGNS GRID */}
        {(() => {
          const commercialPackages = PACKAGES.filter((p) => p.id !== 'pkg_free' && p.id !== 'pkg_corporate');
          const corporatePackage = PACKAGES.find((p) => p.id === 'pkg_corporate');

          return (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto gap-6 sm:gap-7 items-stretch">
                {commercialPackages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className={`relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between space-y-6 transition-all duration-300 ${
                      pkg.popular
                        ? 'bg-gradient-to-b from-amber-500/15 via-[var(--bg-card)] to-[var(--bg-card)] border-2 border-amber-500 shadow-2xl shadow-amber-500/15 scale-100 z-10'
                        : 'bg-[var(--bg-card)] border border-[var(--border-color)] shadow-md hover:border-amber-500/40'
                    }`}
                  >
                    {pkg.popular && (
                      <div className="absolute -top-3.5 right-1/2 translate-x-1/2 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-[11px] px-4 py-1 rounded-full shadow-lg flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-slate-950" />
                        <span>الحملة الأكثر طلباً واختياراً</span>
                      </div>
                    )}

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 inline-block">
                          حملة دعائية حسب الطلب
                        </span>
                        <h4 className="font-black text-lg text-[var(--text-primary)] leading-tight">{pkg.title}</h4>
                        <p className="text-xs text-[var(--text-muted)] font-bold leading-relaxed">{pkg.description}</p>
                      </div>

                      <div className="pt-2 pb-3 border-b border-[var(--border-color)]">
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl sm:text-3xl font-black text-amber-500 font-mono">
                            {pkg.priceLabel || `${pkg.price} ج.م`}
                          </span>
                        </div>
                        <span className="text-[10.5px] text-[var(--text-muted)] font-bold block mt-1">
                          {pkg.id === 'pkg_vip'
                            ? 'إدارة شهرية شاملة ومتابعة مستمرة (تجديد مخفض 1,000 ج)'
                            : pkg.id === 'pkg_annual_partner'
                            ? 'اشتراك سنوي مع تثبيت وظهور دائم وتحديث فصلي'
                            : 'سداد لمرة واحدة مع فاتورة إلكترونية معتمدة'}
                        </span>
                      </div>

                      {/* Feature list */}
                      <div className="space-y-2">
                        <span className="text-[11px] font-black text-[var(--text-primary)] block">
                          المميزات والتفاصيل:
                        </span>
                        <ul className="space-y-2.5 text-xs text-[var(--text-secondary)]">
                          {pkg.features.map((feat, i) => (
                            <li key={i} className="flex items-start gap-2 leading-relaxed">
                              <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5 stroke-[2.5]" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <button
                        type="button"
                        onClick={() => onOpenPackagesModal(pkg.id)}
                        className="w-full text-center py-2.5 rounded-xl font-black text-xs bg-[var(--input-bg)] hover:bg-amber-500/10 text-[var(--text-secondary)] hover:text-amber-500 border border-[var(--border-color)] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>استعراض الشرح التفصيلي والمقارنة</span>
                      </button>

                      <a
                        href={getPackageWhatsAppUrl(pkg)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`w-full text-center py-3.5 rounded-2xl font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer ${
                          pkg.popular
                            ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black shadow-amber-500/20'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        }`}
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>طلب هذه الحملة الدعائية</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              {/* 🌟 4. THE CORPORATE & LARGE ENTERPRISE PACKAGE */}
              {corporatePackage && (
                <div className="max-w-5xl mx-auto bg-gradient-to-br from-amber-500/15 via-[var(--bg-card)] to-yellow-500/10 border-2 border-amber-500 rounded-3xl p-6 sm:p-9 shadow-2xl shadow-amber-500/15 space-y-8 relative overflow-hidden">
                  {/* Glow circle */}
                  <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/3" />

                  {/* Header */}
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 border-b border-[var(--border-color)] pb-6 relative z-10">
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 text-xs font-black px-3.5 py-1.5 rounded-full shadow-md">
                        <Crown className="w-4 h-4 fill-slate-950" />
                        <span>باقة الشركات والمشاريع الكبرى</span>
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)]">
                        {corporatePackage.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-[var(--text-muted)] font-bold max-w-2xl leading-relaxed">
                        {corporatePackage.description}
                      </p>
                    </div>

                    <div className="text-right lg:text-left bg-gradient-to-b from-amber-500/15 to-amber-500/5 border border-amber-500/40 p-5 rounded-2xl shrink-0 shadow-sm">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl sm:text-3xl font-black text-amber-500">تسعير مخصص</span>
                      </div>
                      <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 block mt-1">
                        حسب حجم النشاط والمتطلبات الفنية للمشروع
                      </span>
                    </div>
                  </div>

                  {/* Features in 2 columns */}
                  <div className="space-y-3 relative z-10">
                    <span className="text-xs font-black text-amber-500 uppercase tracking-wider block">
                      الحلول والخدمات المؤسسية المقدمة في هذه الباقة:
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {corporatePackage.features.map((feat, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2.5 text-xs text-[var(--text-secondary)] font-bold bg-[var(--input-bg)] p-3 rounded-2xl border border-[var(--border-color)]"
                        >
                          <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5 stroke-[3]" />
                          <span className="leading-relaxed">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action CTA */}
                  <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 relative z-10">
                    <a
                      href={getPackageWhatsAppUrl(corporatePackage)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:flex-1 py-4 rounded-2xl font-black text-xs sm:text-sm bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:to-yellow-600 text-slate-950 shadow-xl shadow-amber-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Crown className="w-4 h-4 fill-slate-950" />
                      <span>طلب عرض سعر باقة الشركات والمشاريع الكبرى عبر واتساب</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => onOpenPackagesModal(corporatePackage.id)}
                      className="w-full sm:w-auto px-5 py-4 rounded-2xl font-black text-xs text-amber-500 hover:text-slate-950 hover:bg-amber-500 bg-amber-500/10 border border-amber-500/40 text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Sparkles className="w-4 h-4 stroke-[2.5]" />
                      <span>استعراض الشرح في النافذة</span>
                    </button>

                    <a
                      href="#consultation"
                      onClick={() => onSelectPackageForConsultation(corporatePackage.title)}
                      className="w-full sm:w-auto px-5 py-4 rounded-2xl font-black text-xs text-[var(--text-secondary)] hover:text-amber-500 bg-[var(--input-bg)] border border-[var(--border-color)] hover:border-amber-500/40 text-center transition-all cursor-pointer"
                    >
                      حجز موعد استشارة
                    </a>
                  </div>
                </div>
              )}
            </>
          );
        })()}
      </div>
    </section>
  );
};
