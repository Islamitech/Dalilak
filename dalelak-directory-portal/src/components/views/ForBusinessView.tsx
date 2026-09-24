import React, { useState } from 'react';
import { FREE_DIRECTORY_SERVICE, EGYPT_GOVERNORATES, PACKAGES } from '../../data/mockData';
import { CATEGORY_TAXONOMY, getCategoryGroupById, getSubcategoryById } from '../../data/categoryTaxonomy';
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
  const [mainCategoryId, setMainCategoryId] = useState('all');
  const [subcategoryId, setSubcategoryId] = useState('all');
  const [submitted, setSubmitted] = useState(false);
  const selectedCategoryGroup = getCategoryGroupById(mainCategoryId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bizName || !phone) return;

    // Send via WhatsApp directly to admin
    const text = `مرحباً دليلك 👋 أود إدراج نشاطي في المنصة:
- اسم النشاط: ${bizName}
- اسم المسؤول: ${ownerName || 'صاحب النشاط'}
- رقم الهاتف: ${phone}
- المحافظة: ${gov}
- الفئة الرئيسية: ${selectedCategoryGroup?.label || 'غير محددة'}
- النوع الفرعي: ${getSubcategoryById(subcategoryId)?.label || 'غير محدد'}
- الخدمة المطلوبة: إدراج مجاني (0 ج) بموقع Google Maps`;

    window.open(`https://wa.me/201556221141?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
    setSubmitted(true);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4 pb-24 text-right" style={{ direction: 'rtl' }}>
      <header className="space-y-1">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900">أضف نشاطك مجاناً</h1>
        <p className="text-sm text-emerald-700">تسجيل نشاطك وظهوره في الدليل مجانيان بالكامل.</p>
      </header>

      {/* Submission Form */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-4">
        <div className="space-y-1">
          <h3 className="text-lg font-black text-slate-900">بيانات النشاط</h3>
          <p className="text-xs text-slate-500 font-medium">
            أدخل بيانات النشاط الأساسية وسيتم التواصل معك لاعتماد ونشر مكانكم على المنصة
          </p>
        </div>

        {submitted ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h4 className="font-black text-sm text-slate-900">أكمل إرسال الطلب عبر واتساب</h4>
            <p className="text-xs text-slate-600 font-medium">
              فُتحت رسالة جاهزة ببياناتك. اضغط إرسال داخل واتساب لإكمال تقديم الطلب.
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
                  aria-label="اسم النشاط"
                  value={bizName}
                  onChange={(e) => setBizName(e.target.value)}
                  placeholder="مثال: مطعم الأهرام، صيدلية السلام..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 min-h-11 py-2.5 text-base sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 block">اسم صاحب النشاط أو المسؤول</label>
                <input
                  type="text"
                  aria-label="اسم المسؤول"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="الاسم الكريم..."
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 min-h-11 py-2.5 text-base sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 block">رقم الهاتف أو الواتساب للتواصل *</label>
                <input
                  type="tel"
                  required
                  aria-label="رقم الهاتف"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 min-h-11 py-2.5 text-base sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 block">المحافظة</label>
                <select
                  aria-label="المحافظة"
                  value={gov}
                  onChange={(e) => setGov(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 min-h-11 py-2.5 text-base sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  {EGYPT_GOVERNORATES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 block">الفئة الرئيسية للنشاط</label>
                <select
                  aria-label="الفئة الرئيسية"
                  value={mainCategoryId}
                  onChange={(e) => {
                    setMainCategoryId(e.target.value);
                    setSubcategoryId('all');
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 min-h-11 py-2.5 text-base sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="all">اختر الفئة الرئيسية</option>
                  {CATEGORY_TAXONOMY.map((group) => (
                    <option key={group.id} value={group.id}>{group.icon} {group.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 block">نوع النشاط أو الخدمة بالتحديد</label>
                <select
                  aria-label="نوع النشاط"
                  value={subcategoryId}
                  onChange={(e) => setSubcategoryId(e.target.value)}
                  disabled={!selectedCategoryGroup}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 min-h-11 py-2.5 text-base sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value="all">{selectedCategoryGroup ? `كل ${selectedCategoryGroup.label}` : 'اختر الفئة الرئيسية أولاً'}</option>
                  {selectedCategoryGroup?.children.map((child) => (
                    <option key={child.id} value={child.id}>{child.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-slate-500">{FREE_DIRECTORY_SERVICE.condition}</p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                type="submit"
                className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs px-8 py-3 rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>متابعة الطلب عبر واتساب</span>
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
