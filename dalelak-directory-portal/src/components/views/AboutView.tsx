import React from 'react';
import { Logo } from '../Logo';
import { ShieldCheck, MapPin, Compass, Users, CheckCircle2, Phone, Mail, Store, ArrowLeft } from 'lucide-react';

export interface AboutViewProps {
  onNavigate: (path: string) => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 pb-24 text-right" style={{ direction: 'rtl' }}>
      {/* Brand Hero */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="flex items-center justify-center">
          <Logo size="lg" showSubtitle={true} />
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 leading-tight">
          الدليل الميداني المعتمد لاكتشاف الأنشطة في مصر
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
          انطلقت منصة «دليلك» لحل مشكلة صعوبة الوصول إلى الأعمال والخدمات والمحلات بدقة، وتوفير تجربة استكشاف حديثة تجمع بين دقة الموقع الجغرافي وسهولة التواصل المباشر.
        </p>
      </div>

      {/* Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-black text-sm text-slate-900">بيانات موثقة ميدانياً</h3>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            يتم التحقق من كل نشاط ومراجعة موقعه الجغرافي وأرقام هواتفه وساعات عمله عبر مندوبي الميدان وفريق التدقيق الإداري.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
            <MapPin className="w-5 h-5" />
          </div>
          <h3 className="font-black text-sm text-slate-900">ربط مع خرائط Google</h3>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            ربط مباشر بكل نقطة معتمدة على خرائط Google وتوفير أزرار ملاحة فورية تصل الزبائن بباب المحل دون عناء.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="font-black text-sm text-slate-900">تواصل مباشر بدون وسطاء</h3>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            لا نقتطع أي عمولات من مشتريات الزبائن أو طلباتهم، ونمكنهم من الاتصال الهاتفي والمحادثة عبر واتساب مباشرة مع المحل.
          </p>
        </div>
      </div>

      {/* Coverage statement */}
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-4">
        <h3 className="font-black text-base text-slate-900">النطاق والتغطية الجغرافية</h3>
        <p className="text-xs text-slate-600 leading-relaxed font-medium">
          تغطي المنصة حالياً كبرى محافظات جمهورية مصر العربية: الجيزة (مع تغطية ميدانية مكثفة لحدائق الأهرام، 6 أكتوبر، الشيخ زايد، وفيصل والهرم)، القاهرة (مدينة نصر، التجمع الخامس، المعادي، مصر الجديدة)، الإسكندرية، والدقهلية، مع خطة توسع مستمرة لتغطية كافة المدن والمحافظات.
        </p>
        <div className="pt-2">
          <button
            type="button"
            onClick={() => onNavigate('/search')}
            className="inline-flex items-center gap-1.5 text-xs font-black text-amber-700 bg-amber-50 hover:bg-amber-100 px-4 py-2 rounded-xl transition-colors cursor-pointer"
          >
            <span>استكشف الدليل الآن</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
