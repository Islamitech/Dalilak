import React from 'react';
import { PackageOption } from '../../types';
import { FREE_DIRECTORY_SERVICE } from '../../data/mockData';
import {
  Sparkles,
  CheckCircle2,
  Check,
  MessageCircle,
  MapPin,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';
import { PackagesHub } from '../PackagesHub';

export interface ShowcasePackagesSectionProps {
  onOpenPackagesModal?: (pkgId: string) => void;
  getPackageWhatsAppUrl?: (pkg: PackageOption) => string;
  onSelectPackageForConsultation?: (pkgTitle: string) => void;
}

export const ShowcasePackagesSection: React.FC<ShowcasePackagesSectionProps> = ({
  onOpenPackagesModal,
  onSelectPackageForConsultation,
}) => {
  return (
    <section
      id="packages"
      className="py-14 sm:py-20 bg-gradient-to-b from-[var(--bg-primary)] via-amber-500/5 to-[var(--bg-primary)] border-t border-b border-[var(--border-color)]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Main Section Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <span className="text-emerald-600 text-xs font-black uppercase tracking-wider bg-emerald-500/15 px-4 py-1.5 rounded-full border border-emerald-500/30 inline-flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>إدراج وظهور مجاني للمواقع الموثقة · وباقات تسويقية وحلول مخصصة للنمو</span>
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-[var(--text-primary)]">
            ظهور منشأتكم في الدليل مجاني وبدون أي رسوم!
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-muted)] font-bold leading-relaxed">
            لا نفرض أي اشتراكات أو تكاليف لإدراج محلك وظهوره لآلاف الزبائن في منصة دليلك بشرط وجود موقع موثق على خرائط Google.
            أما إذا أردت مضاعفة مبيعاتك وتصدر نتائج البحث، نوفر لك باقات وحلول نمو احترافية تختار منها ما يناسب ميزانيتك ومرحلة مشروعك.
          </p>
        </div>

        {/* 🌟 1. STANDALONE FREE LISTING CARD (خدمة إدراج مجانية مشروطة بموقع موثق) */}
        <div
          id="free-listing"
          className="max-w-4xl mx-auto bg-gradient-to-br from-emerald-500/10 via-[var(--bg-card)] to-teal-500/5 border-2 border-emerald-500/80 rounded-3xl p-6 sm:p-9 shadow-2xl shadow-emerald-500/10 space-y-6"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--border-color)] pb-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-800 text-[11px] font-black px-3 py-1 rounded-full border border-emerald-500/40">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>خدمة إدراج مجاني عامة · بدون أي رسوم</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">
                {FREE_DIRECTORY_SERVICE.title}
              </h3>
              <p className="text-xs sm:text-sm text-[var(--text-muted)] font-bold leading-relaxed">
                {FREE_DIRECTORY_SERVICE.description}
              </p>
            </div>

            <div className="text-right sm:text-left bg-emerald-500/15 border border-emerald-500/30 px-5 py-3 rounded-2xl shrink-0">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-black text-emerald-600 font-mono">
                  0
                </span>
                <span className="text-xs font-bold text-emerald-700">جنيه مصري</span>
              </div>
              <span className="text-[11px] font-black text-emerald-800 block mt-0.5">
                مجاني 100% مدى الحياة
              </span>
            </div>
          </div>

          {/* Explicit Condition & Recommendation Callout */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-amber-700 font-black text-xs sm:text-sm">
                <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
                <span>شرط الإدراج المجاني في المنصة:</span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] font-bold leading-relaxed">
                {FREE_DIRECTORY_SERVICE.condition}
              </p>
            </div>

            <div className="bg-[var(--bg-card)] border border-amber-500/30 rounded-xl p-3 text-xs space-y-1.5 shrink-0 max-w-sm">
              <div className="flex items-center gap-1.5 font-black text-amber-600 text-[11px]">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>مكانك ليس موثقاً على خرائط Google حتى الآن؟</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] font-bold leading-relaxed">
                {FREE_DIRECTORY_SERVICE.unverifiedNote}
              </p>
              {onOpenPackagesModal && (
                <button
                  type="button"
                  onClick={() => onOpenPackagesModal('pkg_basic')}
                  className="inline-flex items-center gap-1 text-[11px] font-black text-blue-600 hover:underline cursor-pointer pt-0.5"
                >
                  <span>معاينة وتفاصيل باقة التوثيق الأساسي (250 ج)</span>
                  <ArrowLeft className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Free features list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {FREE_DIRECTORY_SERVICE.features.map((feat, i) => (
              <div key={i} className="flex items-start gap-2.5 text-xs text-[var(--text-secondary)] font-bold">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5 stroke-[3]" />
                <span className="leading-relaxed">{feat}</span>
              </div>
            ))}
          </div>

          {/* Action Buttons for Free */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <a
              href={`https://wa.me/201143888355?text=${encodeURIComponent('مرحباً دليلك 👋 نشاطنا التجاري لديه موقع موثق بالفعل على خرائط Google، ونود طلب إدراج وظهور المكان في الدليل مجاناً 100%.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:flex-1 py-3.5 rounded-2xl font-black text-xs sm:text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/20 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>طلب الإدراج المجاني للأنشطة الموثقة عبر واتساب</span>
            </a>

            {onOpenPackagesModal && (
              <button
                type="button"
                onClick={() => onOpenPackagesModal('pkg_basic')}
                className="w-full sm:w-auto px-5 py-3.5 rounded-2xl font-black text-xs text-blue-600 hover:text-white hover:bg-blue-600 bg-blue-500/10 border border-blue-500/30 text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>طلب التوثيق الأساسي (250 ج) إذا لم تكن موثقاً</span>
              </button>
            )}

            <a
              href="#consultation"
              onClick={() => onSelectPackageForConsultation?.('طلب إدراج مجاني (نشاط موثق)')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-black text-xs text-[var(--text-secondary)] hover:text-emerald-600 bg-[var(--input-bg)] border border-[var(--border-color)] hover:border-emerald-500/40 text-center transition-all cursor-pointer"
            >
              تسجيل البيانات عبر النموذج
            </a>
          </div>
        </div>

        {/* 🌟 2. DECISION-MAKING ENGINE (محرك اتخاذ القرار واختيار الباقة) */}
        <div className="pt-6">
          <PackagesHub 
            mode="public"
            onSelectPackage={onSelectPackageForConsultation}
          />
        </div>
      </div>
    </section>
  );
};
