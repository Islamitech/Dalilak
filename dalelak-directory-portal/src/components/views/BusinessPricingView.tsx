import React from 'react';
import { PackagesHub } from '../PackagesHub';
import { Business } from '../../types';
import { BadgeDollarSign, ArrowLeft, MessageCircle, Sparkles, Store, ShieldCheck } from 'lucide-react';

export interface BusinessPricingViewProps {
  businesses?: Business[];
  onNavigate: (path: string) => void;
}

export const BusinessPricingView: React.FC<BusinessPricingViewProps> = ({
  businesses = [],
  onNavigate,
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 pb-24 text-right" style={{ direction: 'rtl' }}>
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
            className="text-xs font-bold text-slate-600 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
          >
            <span>هل تبحث عن الإدراج المجاني؟ اضغط هنا</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Embedding PackagesHub Component */}
      <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-6 shadow-xs">
        <PackagesHub
          mode="public"
          businesses={businesses}
        />
      </div>

      {/* Direct WhatsApp Consultation CTA */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1 text-center sm:text-right">
          <span className="text-amber-300 text-xs font-black">استشارة مخصصة</span>
          <h3 className="text-lg sm:text-xl font-black">
            هل تحتاج إلى خطة نمو أو تسعير مخصص لمشروعك؟
          </h3>
          <p className="text-xs text-slate-200 font-medium">
            تواصل مباشرة مع استشاري التسويق والتوثيق في منصة دليلك عبر واتساب للحصول على عرض فني مخصص.
          </p>
        </div>

        <a
          href={`https://wa.me/201143888355?text=${encodeURIComponent('مرحباً دليلك 👋 أود استشارة حول الباقة التسويقية المناسبة لمنشأتي.')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white hover:bg-slate-100 text-slate-950 font-black text-xs px-6 py-3 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 shrink-0"
        >
          <MessageCircle className="w-4 h-4 text-emerald-600" />
          <span>تواصل مع مستشار النمو</span>
        </a>
      </div>
    </div>
  );
};
