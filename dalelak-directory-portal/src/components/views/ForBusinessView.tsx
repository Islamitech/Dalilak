import React, { useState } from 'react';
import { FREE_DIRECTORY_SERVICE, EGYPT_GOVERNORATES, PACKAGES } from '../../data/mockData';
import {
  Store,
  CheckCircle2,
  MapPin,
  AlertCircle,
  Sparkles,
  Phone,
  Send,
  ArrowLeft,
  BadgeDollarSign,
  ShieldCheck,
} from 'lucide-react';

export interface ForBusinessViewProps {
  onNavigate: (path: string) => void;
}

export const ForBusinessView: React.FC<ForBusinessViewProps> = ({ onNavigate }) => {
  const [bizName, setBizName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [gov, setGov] = useState('الجيزة');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bizName || !phone) return;

    // Send via WhatsApp directly to admin
    const text = `مرحباً دليلك 👋 أود إدراج نشاطي في المنصة:
- اسم النشاط: ${bizName}
- اسم المسؤول: ${ownerName || 'صاحب النشاط'}
- رقم الهاتف: ${phone}
- المحافظة: ${gov}
- الخدمة المطلوبة: إدراج مجاني (0 ج) بموقع Google Maps`;

    window.open(`https://wa.me/201143888355?text=${encodeURIComponent(text)}`, '_blank');
    setSubmitted(true);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 pb-24 text-right" style={{ direction: 'rtl' }}>
      {/* Header Banner */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="text-emerald-700 bg-emerald-100 text-xs font-black px-3.5 py-1 rounded-full inline-flex items-center gap-1.5">
          <Store className="w-3.5 h-3.5" />
          <span>بوابة أصحاب الأنشطة والشركات</span>
        </span>
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 leading-tight">
          إدراج وظهور منشأتكم في منصة دليلك مجاني بالكامل
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
          نساعدك على الظهور أمام آلاف الزوار والزبائن القريبين في منطقتك، مع ربط مباشر برقم هاتفك والواتساب وموقعك المعتمد على الخريطة.
        </p>
      </div>

      {/* Free Listing Explainer Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>خدمة معتمدة بدون رسوم</span>
            </span>
            <h3 className="text-xl font-black text-slate-900">{FREE_DIRECTORY_SERVICE.title}</h3>
            <p className="text-xs text-slate-500 font-medium max-w-xl leading-relaxed">
              {FREE_DIRECTORY_SERVICE.description}
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 px-5 py-3 rounded-2xl shrink-0 text-center">
            <span className="text-3xl font-black text-slate-900 font-mono block">0 ج.م</span>
            <span className="text-[11px] font-black text-emerald-700">مجاني 100% مدى الحياة</span>
          </div>
        </div>

        {/* Explicit Condition Callout */}
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-amber-900 font-black text-xs sm:text-sm">
              <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
              <span>شرط الإدراج المجاني في الدليل:</span>
            </div>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              {FREE_DIRECTORY_SERVICE.condition}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('/pricing')}
            className="bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-black px-4 py-2.5 rounded-xl transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
          >
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>ليس لديك موقع موثق؟ شاهد باقات التوثيق</span>
          </button>
        </div>

        {/* Feature List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {FREE_DIRECTORY_SERVICE.features.map((feat, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-slate-700 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{feat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Submission Form */}
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="space-y-1">
          <h3 className="text-lg font-black text-slate-900">طلب إدراج وتوثيق منشأة جديدة</h3>
          <p className="text-xs text-slate-500 font-medium">
            أدخل بيانات النشاط الأساسية وسيتم التواصل معك لاعتماد ونشر مكانكم على المنصة
          </p>
        </div>

        {submitted ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h4 className="font-black text-sm text-slate-900">تم إرسال طلبكم بنجاح!</h4>
            <p className="text-xs text-slate-600 font-medium">
              سيقوم فريق مراجعة البيانات في منصة دليلك بالتواصل معكم لمراجعة واعتماد إدراج النشاط.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 block">اسم المنشأة أو المحل التجاري *</label>
                <input
                  type="text"
                  required
                  value={bizName}
                  onChange={(e) => setBizName(e.target.value)}
                  placeholder="مثال: مطعم الأهرام، صيدلية السلام..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 block">اسم صاحب النشاط أو المسؤول</label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="الاسم الكريم..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 block">رقم الهاتف أو الواتساب للتواصل *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 block">المحافظة</label>
                <select
                  value={gov}
                  onChange={(e) => setGov(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  {EGYPT_GOVERNORATES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                type="submit"
                className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs px-8 py-3 rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>إرسال طلب الإدراج المجاني</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('/pricing')}
                className="text-xs font-bold text-slate-600 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
              >
                <BadgeDollarSign className="w-4 h-4 text-amber-600" />
                <span>الاطلاع على باقات التسويق والتأسيس الرقمي</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
