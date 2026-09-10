import React from 'react';
import { EGYPT_GOVERNORATES, PACKAGES } from '../../data/mockData';
import { Logo } from '../Logo';
import {
  TrendingUp,
  Navigation,
  Sparkles,
  ShieldCheck,
  Send,
  Gift,
  Rocket,
} from 'lucide-react';

export interface ShowcaseConsultationFooterProps {
  consultSuccess: boolean;
  handleConsultationSubmit: (e: React.FormEvent) => void;
  formBizName: string;
  setFormBizName: (s: string) => void;
  formOwnerName: string;
  setFormOwnerName: (s: string) => void;
  formPhone: string;
  setFormPhone: (s: string) => void;
  formGov: string;
  setFormGov: (s: string) => void;
  formSelectedPackage: string;
  setFormSelectedPackage: (s: string) => void;
  openPackagesModal: (pkgId?: string) => void;
}

export const ShowcaseConsultationFooter: React.FC<ShowcaseConsultationFooterProps> = ({
  consultSuccess,
  handleConsultationSubmit,
  formBizName,
  setFormBizName,
  formOwnerName,
  setFormOwnerName,
  formPhone,
  setFormPhone,
  formGov,
  setFormGov,
  formSelectedPackage,
  setFormSelectedPackage,
  openPackagesModal,
}) => {
  return (
    <>
      {/* ============================================================
          🌟 5. WHY DALELAK
          ============================================================ */}
      <section id="why-dalelak" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-10">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-amber-500 text-xs font-black uppercase tracking-wider bg-amber-500/15 px-3 py-1 rounded-full border border-amber-500/30">
            القيمة المضافة لمنشأتكم
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)]">
            لماذا توثقون مكانكم ومنشأتكم مع منصة دليلك؟
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              icon: <TrendingUp className="w-6 h-6" />,
              colorClass: 'amber',
              badgeClass: 'text-amber-600 bg-amber-500/10 border-amber-500/20',
              iconBg: 'bg-amber-500/15 text-amber-500',
              hoverBorder: 'hover:border-amber-500/40',
              title: 'تصدر نتائج البحث الجغرافي',
              desc: 'ظهور مكانكم في أعلى اقتراحات Google عندما يبحث العملاء عن خدمات في منطقتكم الجغرافية.',
              stat: '3x أكثر ظهوراً',
            },
            {
              icon: <Navigation className="w-6 h-6" />,
              colorClass: 'emerald',
              badgeClass: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20',
              iconBg: 'bg-emerald-500/15 text-emerald-500',
              hoverBorder: 'hover:border-emerald-500/40',
              title: 'توجيه GPS فوري وسهل',
              desc: 'تسهيل وصول الزبائن وسائقي التوصيل ومندوبي الشحن إلى باب محلك بدقة دون تيه.',
              stat: '100% دقة GPS',
            },
            {
              icon: <Sparkles className="w-6 h-6" />,
              colorClass: 'blue',
              badgeClass: 'text-blue-600 bg-blue-500/10 border-blue-500/20',
              iconBg: 'bg-blue-500/15 text-blue-500',
              hoverBorder: 'hover:border-blue-500/40',
              title: 'تصوير فاخر بالذكاء الاصطناعي',
              desc: 'تحسين إضاءة وألوان وتباين صور واجهة مكانكم لتبدو بمظهر تسويقي فندقي يجذب الأنظار.',
              stat: '+200% جاذبية',
            },
            {
              icon: <ShieldCheck className="w-6 h-6" />,
              colorClass: 'purple',
              badgeClass: 'text-purple-600 bg-purple-500/10 border-purple-500/20',
              iconBg: 'bg-purple-500/15 text-purple-500',
              hoverBorder: 'hover:border-purple-500/40',
              title: 'ثقة ومصداقية وفاتورة رسمية',
              desc: 'الحصول على فاتورة توثيق رسمية برمز QR وشارة التوثيق المعتمدة التي تزيد ثقة العملاء.',
              stat: 'شارة معتمدة',
            },
          ].map((item, i) => (
            <div
              key={i}
              className={`bg-[var(--bg-card)] border border-[var(--border-color)] p-5 rounded-3xl space-y-3 shadow-sm ${item.hoverBorder} hover:-translate-y-1 hover:shadow-lg transition-all duration-300`}
            >
              <div className={`w-12 h-12 rounded-2xl ${item.iconBg} flex items-center justify-center font-bold`}>
                {item.icon}
              </div>
              <div>
                <h3 className="font-black text-sm text-[var(--text-primary)]">{item.title}</h3>
                <span className={`text-[10px] font-black ${item.badgeClass} px-2 py-0.5 rounded-full border inline-block mt-1`}>
                  {item.stat}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] font-bold leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================
          🌟 6. CONSULTATION & REQUEST FORM
          ============================================================ */}
      <section id="consultation" className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="bg-gradient-to-br from-amber-500/15 via-[var(--bg-card)] to-yellow-500/15 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-9 space-y-6 shadow-xl text-center">
          <div className="space-y-2">
            <span className="text-emerald-600 text-xs font-black uppercase tracking-wider bg-emerald-500/15 px-3 py-1 rounded-full border border-emerald-500/30 inline-block">
              الظهور مجاني 100% · والحملات الدعائية حسب الطلب
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">
              جاهز للانضمام؟ اطلب الظهور المجاني أو احجز حملتك الدعائية الآن
            </h2>
            <p className="text-xs text-[var(--text-muted)] font-bold">
              سجل بياناتك وسيتواصل معك المندوب المعتمد لمحافظتك لتأكيد الظهور المجاني في الدليل أو ترتيب الحملة الدعائية المطلوبة
            </p>
          </div>

          {consultSuccess && (
            <div className="bg-emerald-500/20 border border-emerald-500 text-emerald-800 p-3.5 rounded-2xl text-xs font-black animate-fade-in">
              تم تجهيز طلبك وسيتم فتح تطبيق WhatsApp للتواصل المباشر مع فريق المنظومة
            </div>
          )}

          <form onSubmit={handleConsultationSubmit} className="space-y-4 text-right">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[var(--text-primary)] font-black mb-1">اسم المحل أو المنشأة *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: مطعم الشرق، صيدلية الأمل..."
                  value={formBizName}
                  onChange={(e) => setFormBizName(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-3 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-bold text-[var(--text-primary)] shadow-xs"
                />
              </div>

              <div>
                <label className="block text-[var(--text-primary)] font-black mb-1">اسم صاحب المكان / المسؤول</label>
                <input
                  type="text"
                  placeholder="اسم حضرتك"
                  value={formOwnerName}
                  onChange={(e) => setFormOwnerName(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-3 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-bold text-[var(--text-primary)] shadow-xs"
                />
              </div>

              <div>
                <label className="block text-[var(--text-primary)] font-black mb-1">رقم الهاتف (واتساب) للتواصل *</label>
                <input
                  type="tel"
                  required
                  placeholder="010XXXXXXXX"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-3 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-mono font-bold text-[var(--text-primary)] dir-ltr text-right shadow-xs"
                />
              </div>

              <div>
                <label className="block text-[var(--text-primary)] font-black mb-1">المحافظة *</label>
                <select
                  value={formGov}
                  onChange={(e) => setFormGov(e.target.value)}
                  className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-3 focus:outline-none focus:border-amber-500 font-bold text-[var(--text-primary)] shadow-xs cursor-pointer"
                >
                  {EGYPT_GOVERNORATES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[var(--text-primary)] font-black text-xs">
                  نوع الطلب (الظهور المجاني أو الحملة الدعائية)
                </label>
                <button
                  type="button"
                  onClick={() => openPackagesModal('pkg_basic')}
                  className="text-[11px] font-black text-amber-500 hover:text-amber-400 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>دليل وشرح تفاصيل الباقات</span>
                </button>
              </div>
              <select
                value={formSelectedPackage}
                onChange={(e) => setFormSelectedPackage(e.target.value)}
                className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-xl p-3 focus:outline-none focus:border-amber-500 font-bold text-amber-600 text-xs shadow-xs cursor-pointer"
              >
                {PACKAGES.map((p) => (
                  <option key={p.id} value={p.title}>
                    {p.price === 0 ? `${p.title} (مجاناً 0 ج.م)` : `${p.title} (${p.price} ج.م)`}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-sm py-4 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer hover:shadow-amber-500/30 hover:shadow-2xl"
            >
              <Send className="w-4 h-4" />
              <span>
                {formSelectedPackage.includes('مجاني') || formSelectedPackage.includes('0')
                  ? 'إرسال طلب الظهور المجاني في الدليل'
                  : 'إرسال طلب الحملة الدعائية والتواصل مع المندوب'}
              </span>
            </button>
          </form>
        </div>
      </section>

      {/* ============================================================
          🌟 6.5. FOOTER
          ============================================================ */}
      <footer className="border-t border-[var(--border-color)] bg-[var(--nav-bg)] py-12 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-right">
            {/* Col 1: About */}
            <div className="space-y-3">
              <Logo size="md" showSubtitle={true} />
              <p className="text-[var(--text-muted)] font-bold leading-relaxed">
                منصة دليلك الرقمية للأنشطة التجارية والميدانية المعتمدة. دليلك الموثوق للوصول لأفضل المحلات والخدمات في مصر.
              </p>
            </div>

            {/* Col 2: Free Listing Notice */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-emerald-600 font-black text-sm">
                <Gift className="w-4 h-4" />
                <span>الظهور المجاني في الدليل</span>
              </div>
              <p className="text-[var(--text-muted)] font-bold leading-relaxed">
                إدراج وظهور المنشأة في دليل منصة دليلك مجاني تماماً 100% وبدون أي رسوم أو اشتراكات شهرية أو سنوية.
              </p>
              <a
                href="#free-listing"
                className="inline-flex items-center gap-1.5 text-emerald-600 font-black hover:underline"
              >
                <span>اطلب الظهور مجاناً الآن ←</span>
              </a>
            </div>

            {/* Col 3: Promotional Campaigns */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-amber-500 font-black text-sm">
                <Rocket className="w-4 h-4 text-amber-500" />
                <span>الحملات الدعائية (حسب الطلب)</span>
              </div>
              <p className="text-[var(--text-muted)] font-bold leading-relaxed">
                حملات تسويقية وترويجية اختيارية لتصدر نتائج بحث Google والخرائط وتأسيس المنصات الرقمية وتنمية المبيعات.
              </p>
              <a
                href="#packages"
                className="inline-flex items-center gap-1.5 text-amber-600 font-black hover:underline"
              >
                <span>استعراض مميزات الحملات ←</span>
              </a>
            </div>

            {/* Col 4: Quick Links & Contact */}
            <div className="space-y-3">
              <h4 className="font-black text-[var(--text-primary)] text-sm">روابط وتواصل سريع</h4>
              <ul className="space-y-2 text-[var(--text-secondary)] font-bold">
                <li>
                  <a href="#explore" className="hover:text-amber-500 transition-colors">
                    معرض الأنشطة والخدمات
                  </a>
                </li>
                <li>
                  <a href="#map" className="hover:text-amber-500 transition-colors">
                    الخريطة المباشرة
                  </a>
                </li>
                <li>
                  <a href="#why-dalelak" className="hover:text-amber-500 transition-colors">
                    لماذا توثق في دليلك؟
                  </a>
                </li>
                <li>
                  <a href="#consultation" className="hover:text-amber-500 transition-colors">
                    تسجيل طلب جديد
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-[var(--border-color)] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-right text-[11px] text-[var(--text-muted)] font-bold">
            <p>© {new Date().getFullYear()} منصة دليلك · جميع الحقوق محفوظة | الظهور مجاني تماماً 100%</p>
            <p className="flex items-center justify-center gap-1">
              <span>تواصل مباشر:</span>
              <a
                href="https://wa.me/201143888355"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 hover:underline dir-ltr font-mono font-bold"
              >
                +20 114 388 8355
              </a>
            </p>
          </div>
        </div>
      </footer>
    </>
  );
};
