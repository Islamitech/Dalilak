import React from 'react';
import { Logo } from '../Logo';
import { Store, ShieldCheck, MapPin, Compass, Heart, HelpCircle, Phone } from 'lucide-react';

export interface AppFooterProps {
  onNavigate: (path: string) => void;
}

export const AppFooter: React.FC<AppFooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-12 pb-8 border-t border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Brand & Mission */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <Logo size="md" showSubtitle={false} lightText={true} />
            </div>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">
              المنصة المعتمدة لاكتشاف وتوثيق المحلات والأنشطة والخدمات الميدانية في مصر. عناوين دقيقة، أرقام تواصل مباشرة، ومواقع موثقة على خرائط Google.
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>بيانات موثقة ميدانياً ومراجعة إدارياً</span>
            </div>
          </div>

          {/* Col 2: Quick Directory Discovery */}
          <div className="space-y-3">
            <h4 className="text-sm font-black text-white">استكشف الدليل</h4>
            <ul className="space-y-1 text-xs font-bold text-slate-300">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/search')}
                  className="hover:text-amber-400 transition-colors cursor-pointer py-1.5 inline-flex items-center min-h-[38px]"
                >
                  جميع الأنشطة والخدمات
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/map')}
                  className="hover:text-amber-400 transition-colors cursor-pointer py-1.5 inline-flex items-center min-h-[38px]"
                >
                  الخريطة الحية للمواقع
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/favorites')}
                  className="hover:text-amber-400 transition-colors cursor-pointer py-1.5 inline-flex items-center min-h-[38px]"
                >
                  الأنشطة المحفوظة (المفضلة)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/search?cat=مطاعم ومأكولات')}
                  className="hover:text-amber-400 transition-colors cursor-pointer py-1.5 inline-flex items-center min-h-[38px]"
                >
                  مطاعم ومأكولات
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/search?cat=طبي وصيدلي')}
                  className="hover:text-amber-400 transition-colors cursor-pointer py-1.5 inline-flex items-center min-h-[38px]"
                >
                  عيادات ورعاية طبية
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Business Owners & Services */}
          <div className="space-y-3">
            <h4 className="text-sm font-black text-white">أصحاب الأنشطة</h4>
            <ul className="space-y-1 text-xs font-bold text-slate-300">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/for-business')}
                  className="hover:text-amber-400 transition-colors cursor-pointer text-amber-400 flex items-center gap-1.5 font-black py-1.5 min-h-[38px]"
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>إدراج النشاط مجاناً (0 ج)</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/pricing')}
                  className="hover:text-amber-400 transition-colors cursor-pointer py-1.5 inline-flex items-center min-h-[38px]"
                >
                  باقات وحلول النمو التسويقي
                </button>
              </li>
              <li>
                <a
                  href={`https://wa.me/201143888355?text=${encodeURIComponent('مرحباً دليلك، أود الاستفسار عن توثيق نشاطي التجاري')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1 py-1.5 min-h-[38px]"
                >
                  <Phone className="w-3 h-3" />
                  <span>خدمة العملاء والتحقق عبر واتساب</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Col 4: Platform & Support */}
          <div className="space-y-3">
            <h4 className="text-sm font-black text-white">عن دليلك</h4>
            <ul className="space-y-1 text-xs font-bold text-slate-300">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate('/about')}
                  className="hover:text-amber-400 transition-colors cursor-pointer py-1.5 inline-flex items-center min-h-[38px]"
                >
                  رسالة ورؤية المنصة
                </button>
              </li>
              <li>
                <span className="text-slate-400 block py-1">جمهورية مصر العربية</span>
              </li>
              <li className="pt-1">
                <span className="text-[11px] text-slate-400 leading-relaxed block font-medium">
                  منظومة مصرية مستقلة لتنظيم وتسهيل الوصول للأعمال والخدمات الميدانية في مختلف المحافظات.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400 font-medium">
          <p>© {new Date().getFullYear()} منصة دليلك. جميع الحقوق محفوظة.</p>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => onNavigate('/about')}
              className="hover:text-slate-200 transition-colors cursor-pointer py-1.5 min-h-[36px]"
            >
              شروط الاستخدام والخصوصية
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => onNavigate('/for-business')}
              className="hover:text-slate-200 transition-colors cursor-pointer py-1.5 min-h-[36px]"
            >
              بوابة الأعمال
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
