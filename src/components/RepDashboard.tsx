import React, { useState } from 'react';
import { Business, Representative } from '../types';
import { calculateTotalRepCommission, calculateBusinessCommission, getPackageCommission } from '../utils/commission';
import { UserAvatar } from './UserAvatar';
import { Store, PlusCircle, CheckCircle2, Clock, AlertCircle, Phone, MapPin, Share2, FileText, ExternalLink, Search, DollarSign, Award } from 'lucide-react';

interface RepDashboardProps {
  rep: Representative;
  businesses: Business[];
  onAddNewClick: () => void;
  onShowInvoice: (biz: Business) => void;
}

export const RepDashboard: React.FC<RepDashboardProps> = ({
  rep,
  businesses,
  onAddNewClick,
  onShowInvoice,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');

  const myBusinesses = businesses.filter((b) => b.repId === rep.id || b.repName === rep.name);
  const totalCollected = myBusinesses.reduce((acc, b) => acc + b.amountPaid, 0);

  const repRate = rep.commissionRate || 42.86;
  const totalCommission = calculateTotalRepCommission(myBusinesses, repRate);

  const targetProgress = Math.min(100, Math.round((myBusinesses.length / rep.targetMonth) * 100));

  const filteredMyBusinesses = myBusinesses.filter((b) => {
    if (searchQuery && !b.nameAr.includes(searchQuery) && !b.ownerName.includes(searchQuery) && !b.city.includes(searchQuery)) {
      return false;
    }
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-20">
      {/* Photo Rejection Alert Banner */}
      {rep.avatarStatus === 'rejected' && (
        <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-red-950 border-2 border-rose-500 p-4.5 rounded-3xl shadow-xl flex flex-wrap items-center justify-between gap-3 text-xs text-white font-bold animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-black shrink-0 shadow">
              <AlertCircle className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-black text-sm text-rose-200">
                ⚠️ إشعار عاجل: تم رفض الصورة الشخصية من مدير النظام
              </h3>
              <p className="text-xs text-slate-100 font-bold mt-1">
                قام مدير النظام برفض الصورة الشخصية المرفوعة مسبقاً. يرجى التوجه لملفك الشخصي واختيار أو التقاط صورة سيلفي جديدة فوراً.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Photo Pending Review Alert Banner */}
      {rep.avatarStatus === 'pending_approval' && (
        <div className="bg-gradient-to-r from-amber-950 via-amber-900 to-yellow-950 border-2 border-amber-500 p-4 rounded-3xl shadow-lg flex items-center justify-between text-xs text-amber-100 font-extrabold animate-fade-in">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400 shrink-0" />
            <span>🔒 صورتك الشخصية مرفوعة وحالياً قيد المراجعة والتدقيق بواسطة مدير النظام.</span>
          </div>
        </div>
      )}

      {/* Rep Welcome Header */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/80 to-slate-900 border border-amber-500/40 p-5 rounded-3xl shadow-xl flex flex-wrap items-center justify-between gap-4 text-white">
        <div className="flex items-center gap-3">
          <UserAvatar avatar={rep.avatar} name={rep.name} role={rep.role} avatarStatus={rep.avatarStatus} size="lg" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white">مرحباً، {rep.name}</h2>
              <span className="bg-amber-500/20 text-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-500/30">
                مندوب {rep.governorate}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">سجل اليوم أنشطة تجارية جديدة وقم بإصدار الفواتير فوراً على الواتساب</p>
          </div>
        </div>

        <button
          onClick={onAddNewClick}
          className="bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-xs px-4 py-3 rounded-2xl shadow-lg flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
        >
          <PlusCircle className="w-5 h-5 stroke-[2.5]" />
          <span>تسجيل نشاط جديد في الميدان</span>
        </button>
      </div>

      {/* Target & Commission Progress Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Monthly Target Progress */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-3xl shadow-md space-y-2 transition-colors duration-300">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] font-bold">
            <span>الهدف الشهري للتسجيل</span>
            <span className="text-amber-500">{myBusinesses.length} / {rep.targetMonth} نشاط</span>
          </div>

          <div className="w-full bg-[var(--input-bg)] h-3 rounded-full overflow-hidden border border-[var(--border-color)]">
            <div
              className="bg-gradient-to-r from-amber-500 to-yellow-400 h-full transition-all duration-500 rounded-full"
              style={{ width: `${targetProgress}%` }}
            />
          </div>

          <p className="text-[10px] text-[var(--text-muted)] font-bold">متبقي {Math.max(0, rep.targetMonth - myBusinesses.length)} نشاط لتحقيق تارجت الشهر</p>
        </div>

        {/* Total Collected */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-3xl shadow-md space-y-1 transition-colors duration-300">
          <span className="text-xs text-[var(--text-muted)] font-bold block">إجمالي تحصيلاتك الميدانية</span>
          <p className="text-xl font-black text-emerald-500">{totalCollected.toLocaleString()} <span className="text-xs text-[var(--text-secondary)]">ج.م</span></p>
          <p className="text-[10px] text-[var(--text-muted)]">مبالغ مستلمة نقداً أو إلكترونياً</p>
        </div>

        {/* Rep Calculated Commission Card */}
        <div className="bg-[var(--bg-card)] border border-amber-500/40 p-4 rounded-3xl shadow-md space-y-1 bg-amber-500/5 transition-colors duration-300">
          <div className="flex items-center justify-between text-xs text-amber-500 font-bold">
            <span>عمولتك المستحقة</span>
            <span className="text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">عمولة معتمدة {repRate}%</span>
          </div>
          <p className="text-xl font-black text-amber-500">{totalCommission.toLocaleString()} <span className="text-xs text-[var(--text-secondary)]">ج.م</span></p>
          <p className="text-[10px] text-emerald-500 font-bold">مستحقات أرباحك الحالية ({repRate}%)</p>
        </div>
      </div>
    </div>
  );
};
