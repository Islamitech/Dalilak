import React from 'react';
import { Logo } from '../Logo';
import { Info, FileText, ShieldCheck, Sparkles } from 'lucide-react';
import { User } from '../../types';

interface AppFooterProps {
  user: User | null;
  onOpenAbout: () => void;
  onOpenTerms: () => void;
  onOpenPermissions: () => void;
  onOpenPackages: () => void;
  onNavigateTab: (tab: string) => void;
}

export const AppFooter: React.FC<AppFooterProps> = ({
  user,
  onOpenAbout,
  onOpenTerms,
  onOpenPermissions,
  onOpenPackages,
  onNavigateTab,
}) => {
  return (
    <footer className="mt-12 pt-8 pb-16 border-t border-[var(--border-color)] text-[var(--text-secondary)] text-xs space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Column 1: Brand & Bio */}
        <div className="space-y-2.5 text-right">
          <Logo size="sm" />
          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed font-bold max-w-sm">
            المنصة الرائدة في مصر لرقمنة الأنشطة التجارية والشركات: توثيقات الخرائط، التسويق الرقمي، الحلول التكنولوجية، الحماية القانونية والفكرية، واستشارات تنمية ونمو الأعمال.
          </p>
        </div>

        {/* Column 2: Quick Links */}
        <div className="space-y-2 text-right">
          <h4 className="font-black text-sm text-[var(--text-primary)]">روابط سريعة</h4>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] font-bold">
            <button
              type="button"
              onClick={onOpenAbout}
              className="hover:text-amber-500 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Info className="w-3.5 h-3.5 text-amber-500" />
              <span>من نحن</span>
            </button>

            <button
              type="button"
              onClick={onOpenTerms}
              className="hover:text-amber-500 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-amber-500" />
              <span>شروط الاستخدام</span>
            </button>

            {user?.role !== 'rep' && (
              <>
                <button
                  type="button"
                  onClick={onOpenPermissions}
                  className="hover:text-amber-500 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                  <span>دليل الصلاحيات</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenPackages}
                  className="hover:text-amber-500 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>باقات دليلك</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => onNavigateTab('home')}
              className="hover:text-amber-500 cursor-pointer transition-colors"
            >
              الرئيسية
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('map')}
              className="hover:text-amber-500 cursor-pointer transition-colors"
            >
              الخريطة التفاعلية
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('add')}
              className="hover:text-amber-500 cursor-pointer transition-colors"
            >
              تسجيل نشاط
            </button>
          </div>
        </div>

        {/* Column 3: Ecosystem Highlights */}
        <div className="space-y-2 text-right bg-[var(--bg-card)] p-3.5 rounded-2xl border border-[var(--border-color)]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <h4 className="font-black text-xs text-[var(--text-primary)]">خدمات المنظومة:</h4>
          </div>
          <ul className="space-y-1 text-[11px] text-[var(--text-secondary)] font-bold">
            <li>• توثيق وتثبيت إحداثيات Google Maps</li>
            <li>• تسويق رقمي وإدارة الهوية التجارية</li>
            <li>• خدمات قانونية وحماية الملكية الفكرية</li>
            <li>• استشارات تنمية ونمو الأعمال والمبيعات</li>
          </ul>
        </div>
      </div>

      <div className="pt-4 border-t border-[var(--border-color)]/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[var(--text-muted)]">
        <p>جميع الحقوق محفوظة © 2026 منصة دليلك لرقمنة وتنمية الأعمال والأنشطة التجارية في مصر</p>
        <div className="flex items-center gap-2 font-bold">
          <span>نتبع معايير الجودة العالمية</span>
          <span>•</span>
          <span className="text-emerald-600">نظام محمي ومعتمد</span>
        </div>
      </div>
    </footer>
  );
};
