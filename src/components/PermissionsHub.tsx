import React, { useState } from 'react';
import {
  ShieldCheck,
  Crown,
  Briefcase,
  Calculator,
  CheckCircle2,
  Sparkles,
  Lock,
} from 'lucide-react';
import { UserRole } from '../types';

export const PermissionsHub: React.FC = () => {
  const [selectedRoleTab, setSelectedRoleTab] = useState<UserRole>('admin');

  const matrixRows = [
    {
      capability: 'تسجيل أنشطة تجارية جديدة ميدانياً',
      category: 'الأنشطة',
      admin: true,
      supervisor: true,
      accountant: true,
      rep: true,
      note: 'تسجيل النشاط بالـ GPS ورفع الصور وتحديد الباقة للجميع',
    },
    {
      capability: 'الوصول للوحة الإدارة والإحصائيات بالكامل',
      category: 'الإدارة',
      admin: true,
      supervisor: true,
      accountant: true,
      rep: false,
      note: 'لوحة الإحصائيات، كشوفات الأنشطة، والحسابات',
    },
    {
      capability: 'تعديل بيانات كافة الأنشطة في كل المحافظات',
      category: 'الأنشطة',
      admin: true,
      supervisor: true,
      accountant: true,
      rep: false,
      note: 'المندوب يعدل أنشطته فقط، والإدارة والمحاسب يعدلون الكل',
    },
    {
      capability: 'مزامنة جوجل ماب وتثبيت Place ID والرابط',
      category: 'التوثيق',
      admin: true,
      supervisor: true,
      accountant: true,
      rep: false,
      note: 'ربط النشاط بحساب info@dalilaak.com الرسمي واعتماد التوثيق',
    },
    {
      capability: 'إدارة الحسابات وإضافة وتعديل المناديب',
      category: 'الحسابات',
      admin: true,
      supervisor: true,
      accountant: true,
      rep: false,
      note: 'إضافة مناديب ومراجعة الوثائق وتفعيل الحسابات',
    },
    {
      capability: 'حذف الحسابات والمناديب نهائياً',
      category: 'الحسابات',
      admin: true,
      supervisor: false,
      accountant: false,
      rep: false,
      note: 'صلاحية سيادية محصورة بمدير النظام (القيد الوحيد للمشرف)',
    },
    {
      capability: 'إدارة بوابات الدفع (فودافون كاش / انستاباي)',
      category: 'المالية',
      admin: true,
      supervisor: true,
      accountant: true,
      rep: false,
      note: 'تعديل أرقام وحسابات استقبال أموال التحصيل',
    },
    {
      capability: 'مراجعة واعتماد وصرف حوالات العمولات',
      category: 'المالية',
      admin: true,
      supervisor: true,
      accountant: true,
      rep: false,
      note: 'مطابقة الأرباح وتسجيل أرقام العمليات وتأكيد الصرف',
    },
    {
      capability: 'تحصيل المبالغ المتبقية وإصدار الفواتير',
      category: 'التحصيل',
      admin: true,
      supervisor: true,
      accountant: true,
      rep: true,
      note: 'تسجيل السداد وإرسال إيصالات وفواتير واتساب للعملاء',
    },
    {
      capability: 'الوصول لكافة العملاء المهتمين (Leads CRM)',
      category: 'المتابعات',
      admin: true,
      supervisor: true,
      accountant: true,
      rep: false,
      note: 'المندوب يرى عملاءه فقط، والإدارة ترى جميع المهتمين',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in font-['Cairo',sans-serif]">
      {/* ========================================================
          HEADER BANNER
          ======================================================== */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 text-slate-950 p-5 sm:p-6 rounded-3xl shadow-xl space-y-2">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-slate-950/20 text-slate-950 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <span className="bg-slate-950/20 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              نظام الأمان والتحكم الميداني المطور
            </span>
            <h2 className="text-xl sm:text-2xl font-black mt-0.5">
              مصفوفة ودليل الصلاحيات والرتب في منصة دليلك 🛡️
            </h2>
          </div>
        </div>
        <p className="text-xs sm:text-sm font-bold text-slate-950/90 leading-relaxed max-w-3xl">
          تمنح المنظومة صلاحيات متكاملة للمحاسب ومشرف الإدارة تشمل لوحة الإحصائيات والحسابات والأنشطة بالكامل مع إمكانية تسجيل الأنشطة، بينما يقتصر حذف الحسابات سيادياً على مدير النظام.
        </p>
      </div>

      {/* ========================================================
          INTERACTIVE ROLES SELECTOR CARDS
          ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Role 1: Admin */}
        <button
          type="button"
          onClick={() => setSelectedRoleTab('admin')}
          className={`p-4 rounded-3xl border-2 text-right transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
            selectedRoleTab === 'admin'
              ? 'bg-amber-500/15 border-amber-500 shadow-md ring-2 ring-amber-500/30'
              : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-amber-500/40'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-bold shadow-md">
              <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="bg-amber-500/20 text-amber-900 dark:text-amber-300 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-amber-500/30">
              صلاحيات كاملة 👑
            </span>
          </div>

          <div>
            <h3 className="font-black text-sm text-[var(--text-primary)]">مدير النظام (Admin)</h3>
            <p className="text-[11px] text-[var(--text-secondary)] font-bold mt-1 leading-relaxed">
              إدارة شاملة وسيادية للمنظومة، الحسابات، بوابات الدفع، الأنشطة، والمزامنة وحذف الحسابات.
            </p>
          </div>

          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-black inline-flex items-center gap-1">
            <span>استعراض التفاصيل الكاملة</span>
            <span>←</span>
          </span>
        </button>

        {/* Role 2: Supervisor */}
        <button
          type="button"
          onClick={() => setSelectedRoleTab('supervisor')}
          className={`p-4 rounded-3xl border-2 text-right transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
            selectedRoleTab === 'supervisor'
              ? 'bg-purple-500/15 border-purple-500 shadow-md ring-2 ring-purple-500/30'
              : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-purple-500/40'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md">
              <Crown className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="bg-purple-500/20 text-purple-900 dark:text-purple-300 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-purple-500/30">
              مشرف الإدارة 👔
            </span>
          </div>

          <div>
            <h3 className="font-black text-sm text-[var(--text-primary)]">مشرف الإدارة (Supervisor)</h3>
            <p className="text-[11px] text-[var(--text-secondary)] font-bold mt-1 leading-relaxed">
              كافة الصلاحيات الإدارية الكاملة على الأنشطة والحسابات والتوثيق (ما عدا حذف الحسابات).
            </p>
          </div>

          <span className="text-[11px] text-purple-600 dark:text-purple-400 font-black inline-flex items-center gap-1">
            <span>استعراض التفاصيل الكاملة</span>
            <span>←</span>
          </span>
        </button>

        {/* Role 3: Accountant */}
        <button
          type="button"
          onClick={() => setSelectedRoleTab('accountant')}
          className={`p-4 rounded-3xl border-2 text-right transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
            selectedRoleTab === 'accountant'
              ? 'bg-emerald-500/15 border-emerald-500 shadow-md ring-2 ring-emerald-500/30'
              : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-emerald-500/40'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold shadow-md">
              <Calculator className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="bg-emerald-500/20 text-emerald-900 dark:text-emerald-300 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              محاسب ومحصل 💳
            </span>
          </div>

          <div>
            <h3 className="font-black text-sm text-[var(--text-primary)]">المحاسب المالي (Accountant)</h3>
            <p className="text-[11px] text-[var(--text-secondary)] font-bold mt-1 leading-relaxed">
              لوحة الإدارة والإحصائيات والحسابات بالكامل + تسجيل الأنشطة والتحصيل وصرف العمولات.
            </p>
          </div>

          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-black inline-flex items-center gap-1">
            <span>استعراض التفاصيل الكاملة</span>
            <span>←</span>
          </span>
        </button>

        {/* Role 4: Representative */}
        <button
          type="button"
          onClick={() => setSelectedRoleTab('rep')}
          className={`p-4 rounded-3xl border-2 text-right transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
            selectedRoleTab === 'rep'
              ? 'bg-blue-500/15 border-blue-500 shadow-md ring-2 ring-blue-500/30'
              : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:border-blue-500/40'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md">
              <Briefcase className="w-5 h-5 stroke-[2.5]" />
            </div>
            <span className="bg-blue-500/20 text-blue-900 dark:text-blue-300 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-blue-500/30">
              مبيعات وميدان 🚀
            </span>
          </div>

          <div>
            <h3 className="font-black text-sm text-[var(--text-primary)]">المندوب المعتمد (Sales Rep)</h3>
            <p className="text-[11px] text-[var(--text-secondary)] font-bold mt-1 leading-relaxed">
              تسجيل الأنشطة، زيارة العملاء المهتمين، متابعة الأرباح، وسحب العمولات.
            </p>
          </div>

          <span className="text-[11px] text-blue-600 dark:text-blue-400 font-black inline-flex items-center gap-1">
            <span>استعراض التفاصيل الكاملة</span>
            <span>←</span>
          </span>
        </button>
      </div>

      {/* ========================================================
          ROLE DEEP DIVE FOCUS CARD
          ======================================================== */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-5 sm:p-7 space-y-5 shadow-sm">
        {selectedRoleTab === 'admin' && (
          <div className="space-y-4 animate-fade-in text-xs">
            <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-xl">
                👑
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-[var(--text-primary)]">
                  رتبة: مدير النظام (System Administrator)
                </h3>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-bold">
                  الصلاحية الإدارية والسيادية العليا لمنصة دليلك
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 bg-[var(--input-bg)] p-4 rounded-2xl border border-[var(--border-color)]">
                <h4 className="font-black text-sm text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>المتاح والمسموح لمدير النظام:</span>
                </h4>
                <ul className="space-y-1.5 text-[11.5px] text-[var(--text-primary)] font-bold leading-relaxed">
                  <li>✅ <strong>لوحة التحكم المركزية:</strong> الاطلاع على كافة الأرقام والإيرادات ونسب التحصيل.</li>
                  <li>✅ <strong>إدارة وحذف الحسابات:</strong> إضافة/تعديل/تجميد/حذف أي حساب وترقية الموظفين وتعيين نسب العمولات.</li>
                  <li>✅ <strong>التوثيق والمزامنة:</strong> الربط المباشر مع حساب المنصة الرسمي info@dalilaak.com واعتماد توثيق الأنشطة.</li>
                  <li>✅ <strong>بوابات الدفع:</strong> تعديل أرقام فودافون كاش وانستاباي وفوري.</li>
                  <li>✅ <strong>صرف العمولات:</strong> قبول ورفض طلبات سحب الأرباح للمناديب.</li>
                  <li>✅ <strong>الحذف والتعديل الشامل:</strong> تعديل أو حذف أي نشاط أو حساب في المنظومة.</li>
                </ul>
              </div>

              <div className="space-y-2 bg-[var(--input-bg)] p-4 rounded-2xl border border-[var(--border-color)]">
                <h4 className="font-black text-sm text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>الاستخدام والممارسات المثالية لهذه الرتبة:</span>
                </h4>
                <ul className="space-y-1.5 text-[11.5px] text-[var(--text-secondary)] font-bold leading-relaxed">
                  <li>💡 <strong>المراجعة اليومية:</strong> فحص الأنشطة المسجلة حديثاً ومزامنتها على خرائط جوجل في خلال 24 ساعة.</li>
                  <li>💡 <strong>متابعة التحصيلات:</strong> فحص تنبيهات الأنشطة المعتمدة التي عليها مبالغ متبقية.</li>
                  <li>💡 <strong>تدقيق صور التفعيل:</strong> مراجعة صور الوجه والبطاقات للمناديب الجدد قبل تفعيل حساباتهم.</li>
                  <li>💡 <strong>تصدير التقارير:</strong> تصدير كشوفات الإكسل دورياً للأرشفة المالية.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {selectedRoleTab === 'supervisor' && (
          <div className="space-y-4 animate-fade-in text-xs">
            <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-500 flex items-center justify-center font-bold text-xl">
                👔
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-[var(--text-primary)]">
                  رتبة: مشرف الإدارة (Administrative Supervisor)
                </h3>
                <p className="text-xs text-purple-600 dark:text-purple-400 font-bold">
                  كامل الصلاحيات الإدارية والميدانية المتقدمة (ما عدا حذف الحسابات)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 bg-[var(--input-bg)] p-4 rounded-2xl border border-[var(--border-color)]">
                <h4 className="font-black text-sm text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>المتاح والمسموح لمشرف الإدارة:</span>
                </h4>
                <ul className="space-y-1.5 text-[11.5px] text-[var(--text-primary)] font-bold leading-relaxed">
                  <li>✅ <strong>تسجيل أنشطة جديدة:</strong> تسجيل المحلات والأنشطة ميدانياً بالـ GPS.</li>
                  <li>✅ <strong>لوحة الإدارة والإحصائيات:</strong> الاطلاع الكامل على كافة المؤشرات والأنشطة والحسابات.</li>
                  <li>✅ <strong>إدارة الحسابات والمناديب:</strong> إضافة حسابات جديدة، مراجعة الوثائق، وتفعيل الحسابات.</li>
                  <li>✅ <strong>تعديل وتدقيق الأنشطة:</strong> تعديل أي نشاط في كافة المحافظات والمزامنة مع خرائط جوجل.</li>
                  <li>✅ <strong>بوابات الدفع وصرف العمولات:</strong> إدارة بوابات التحصيل وصرف طلبات سحب العمولات للمناديب.</li>
                  <li>✅ <strong>مركز المراجعات (Leads CRM):</strong> متابعة كافة العملاء المهتمين في جميع المحافظات.</li>
                </ul>
              </div>

              <div className="space-y-2 bg-[var(--input-bg)] p-4 rounded-2xl border border-[var(--border-color)]">
                <h4 className="font-black text-sm text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                  <Lock className="w-4 h-4" />
                  <span>القيد الوحيد لمشرف الإدارة:</span>
                </h4>
                <ul className="space-y-1.5 text-[11.5px] text-[var(--text-secondary)] font-bold leading-relaxed">
                  <li>🔒 <strong>حذف الحسابات نهائياً:</strong> لا يمكن للمشرف حذف حسابات المناديب نهائياً؛ هذه الصلاحية سيادية وحصرية بمدير النظام فقط لمنع أي فقدان للبيانات.</li>
                  <li>💡 يمكن للمشرف تجميد أو تعديل بيانات الحساب بدلاً من حذفه.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {selectedRoleTab === 'accountant' && (
          <div className="space-y-4 animate-fade-in text-xs">
            <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold text-xl">
                💳
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-[var(--text-primary)]">
                  رتبة: محاسب ومحصل (Financial Accountant)
                </h3>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                  لوحة الإدارة والإحصائيات والحسابات بالكامل + تسجيل الأنشطة والتحصيل المالي
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 bg-[var(--input-bg)] p-4 rounded-2xl border border-[var(--border-color)]">
                <h4 className="font-black text-sm text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>المتاح والمسموح للمحاسب المالي:</span>
                </h4>
                <ul className="space-y-1.5 text-[11.5px] text-[var(--text-primary)] font-bold leading-relaxed">
                  <li>✅ <strong>تسجيل أنشطة جديدة:</strong> إمكانية تسجيل أي نشاط تجاري ميدانياً واحتسابه باسمه.</li>
                  <li>✅ <strong>لوحة الإدارة والإحصائيات:</strong> الوصول الكامل لكافة شاشات الإدارة والإيرادات والأرباح.</li>
                  <li>✅ <strong>كافة الحسابات والأنشطة:</strong> الاطلاع على كافة الحسابات والأنشطة ومتابعة أدائها.</li>
                  <li>✅ <strong>إدارة التحصيل:</strong> متابعة الفواتير غير المسددة وتحصيل الأقساط والمبالغ الآجلة.</li>
                  <li>✅ <strong>صرف العمولات:</strong> مراجعة طلبات سحب العمولات للمناديب وتأكيد الصرف وتدوين أرقام الحوالات.</li>
                  <li>✅ <strong>بوابات الدفع:</strong> متابعة محافظ فودافون كاش وانستاباي واستقبال الإيداعات.</li>
                </ul>
              </div>

              <div className="space-y-2 bg-[var(--input-bg)] p-4 rounded-2xl border border-[var(--border-color)]">
                <h4 className="font-black text-sm text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>الاستخدام والممارسات المثالية للمحاسب:</span>
                </h4>
                <ul className="space-y-1.5 text-[11.5px] text-[var(--text-secondary)] font-bold leading-relaxed">
                  <li>💡 <strong>مطابقة الحوالات:</strong> التأكد من وصول رسالة الإيداع البنكي أو المحفظة الإلكترونية قبل تحويل الفاتورة إلى مدفوعة.</li>
                  <li>💡 <strong>التحصيل الميداني:</strong> عند زيارة المحلات وتسجيلها، تحصيل القيمة وإصدار الفاتورة الفورية عبر واتساب.</li>
                  <li>💡 <strong>سرعة تحويل العمولات:</strong> صرف طلبات المناديب المؤكدة خلال 24 ساعة لرفع حماس الفريق.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {selectedRoleTab === 'rep' && (
          <div className="space-y-4 animate-fade-in text-xs">
            <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-500 flex items-center justify-center font-bold text-xl">
                🚀
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-[var(--text-primary)]">
                  رتبة: المندوب المعتمد (Field Sales Representative)
                </h3>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-bold">
                  محرك المبيعات الميداني، تسجيل الأنشطة، وزيارة ومتابعة العملاء
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 bg-[var(--input-bg)] p-4 rounded-2xl border border-[var(--border-color)]">
                <h4 className="font-black text-sm text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>المتاح والمسموح للمندوب الميداني:</span>
                </h4>
                <ul className="space-y-1.5 text-[11.5px] text-[var(--text-primary)] font-bold leading-relaxed">
                  <li>✅ <strong>تسجيل نشاط جديد:</strong> التقاط الإحداثيات GPS تلقائياً، تصوير المحل، واختيار الباقة.</li>
                  <li>✅ <strong>مركز المراجعات الخاص به:</strong> تسجيل العملاء المهتمين ومتابعتهم وإرسال رسائل واتساب.</li>
                  <li>✅ <strong>لوحة أرباحي:</strong> متابعة العمولات المكتسبة، الرصيد المتاح للسحب، وإرسال طلبات سحب الأرباح.</li>
                  <li>✅ <strong>كود الإحالة والمكافآت:</strong> دعوة مناديب جدد لكسب عمولات إضافية عند كل تسجيل نشاط.</li>
                  <li>✅ <strong>كارنيه المندوب وخطاب التكليف:</strong> تحميل وطباعة الهوية الرسمية لإبرازها لأصحاب المحلات.</li>
                  <li>✅ <strong>إدارة أنشطته فقط:</strong> تعديل وتحديث بيانات الأنشطة التي سجلها بنفسه.</li>
                </ul>
              </div>

              <div className="space-y-2 bg-[var(--input-bg)] p-4 rounded-2xl border border-[var(--border-color)]">
                <h4 className="font-black text-sm text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                  <Lock className="w-4 h-4" />
                  <span>القيود وضوابط حماية البيانات:</span>
                </h4>
                <ul className="space-y-1.5 text-[11.5px] text-[var(--text-secondary)] font-bold leading-relaxed">
                  <li>🔒 لا يمكنه الاطلاع على أرباح أو عمولات مناديب آخرين.</li>
                  <li>🔒 لا يمكنه تعديل أو حذف الأنشطة المسجلة بواسطة مندوبين آخرين.</li>
                  <li>🔒 لا يمكنه الدخول إلى لوحة التحكم الإدارية العامة أو تعديل بوابات الدفع.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================
          FULL COMPARATIVE MATRIX TABLE
          ======================================================== */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-4 sm:p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h3 className="font-black text-base text-[var(--text-primary)]">
              جدول المقارنة الشامل لكافة الصلاحيات
            </h3>
          </div>
          <span className="text-xs text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            تفعيل وتطبيق صارم في النظام ✅
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right border-collapse">
            <thead>
              <tr className="bg-[var(--input-bg)] text-[var(--text-primary)] border-b border-[var(--border-color)]">
                <th className="p-3 font-black rounded-r-xl">الصلاحية / الوظيفة</th>
                <th className="p-3 font-black text-center text-amber-600 dark:text-amber-400">👑 مدير النظام</th>
                <th className="p-3 font-black text-center text-purple-600 dark:text-purple-400">👔 مشرف الإدارة</th>
                <th className="p-3 font-black text-center text-emerald-600 dark:text-emerald-400">💳 محاسب ومحصل</th>
                <th className="p-3 font-black text-center text-blue-600 dark:text-blue-400">🚀 مندوب مبيعات</th>
                <th className="p-3 font-black rounded-l-xl text-[var(--text-muted)]">ملاحظات التحقق</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {matrixRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-amber-500/5 transition-colors">
                  <td className="p-3 font-bold text-[var(--text-primary)]">
                    <span className="block text-[11px] text-[var(--text-muted)]">{row.category}</span>
                    <span>{row.capability}</span>
                  </td>

                  <td className="p-3 text-center">
                    {row.admin ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-600 font-black">
                        ✓
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-500/15 text-rose-600 font-black">
                        ✕
                      </span>
                    )}
                  </td>

                  <td className="p-3 text-center">
                    {row.supervisor ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-600 font-black">
                        ✓
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-500/15 text-rose-600 font-black">
                        ✕
                      </span>
                    )}
                  </td>

                  <td className="p-3 text-center">
                    {row.accountant ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-600 font-black">
                        ✓
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-500/15 text-rose-600 font-black">
                        ✕
                      </span>
                    )}
                  </td>

                  <td className="p-3 text-center">
                    {row.rep ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-600 font-black">
                        ✓
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-500/15 text-rose-600 font-black">
                        ✕
                      </span>
                    )}
                  </td>

                  <td className="p-3 text-[11px] text-[var(--text-muted)] font-bold">
                    {row.note}
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
