import React, { useState } from 'react';
import { Business, Representative } from '../types';
import { calculateTotalRepCommission, calculateBusinessCommission, getPackageCommission } from '../utils/commission';
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
      {/* Rep Welcome Header */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/80 to-slate-900 border border-amber-500/40 p-5 rounded-3xl shadow-xl flex flex-wrap items-center justify-between gap-4 text-white">
        <div className="flex items-center gap-3">
          <img src={rep.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'} alt={rep.name} className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-500 shadow-md" />
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

      {/* My Registrations List */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-4 sm:p-5 space-y-4 shadow-md transition-colors duration-300">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <h3 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-2">
            <Store className="w-4 h-4 text-amber-500" />
            <span>الأنشطة التجارة المسجلة بواسطتك ({myBusinesses.length})</span>
          </h3>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute right-3 top-2.5" />
            <input
              type="text"
              placeholder="بحث في أنشطتك المسجلة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold text-xs rounded-xl pr-8 pl-3 py-1.5 focus:outline-none focus:border-amber-500 shadow-sm"
            />
          </div>
        </div>

        {filteredMyBusinesses.length === 0 ? (
          <div className="text-center py-10 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-color)] space-y-2">
            <p className="text-sm font-bold text-[var(--text-primary)]">لم تقم بتسجيل أي أنشطة بعد أو لا توجد نتائج للبحث</p>
            <p className="text-xs text-[var(--text-muted)]">اضغط على زر "تسجيل نشاط جديد" للبدء في إضافة الأنشطة من الميدان.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMyBusinesses.map((biz) => {
              const remaining = Math.max(0, biz.packagePrice - biz.amountPaid);
              const bizComm = calculateBusinessCommission(biz.packagePrice, biz.amountPaid, repRate);
              const fullComm = getPackageCommission(biz.packagePrice, repRate);

              return (
                <div key={biz.id} className="bg-[var(--bg-surface)] p-4 rounded-2xl border border-[var(--border-color)] space-y-3 hover:border-amber-500/30 transition-all shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="bg-amber-500/10 text-amber-500 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/20">
                          {biz.category}
                        </span>
                        <span className="text-xs text-[var(--text-muted)]">{biz.invoiceDate}</span>
                      </div>
                      <h4 className="font-bold text-base text-[var(--text-primary)] mt-1">{biz.nameAr}</h4>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {biz.governorate} - {biz.city} ({biz.street})
                      </p>
                    </div>

                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border shrink-0 shadow-sm ${
                      biz.verificationStatus === 'verified'
                        ? 'bg-emerald-500/15 text-emerald-900 dark:text-emerald-400 border-emerald-500/40'
                        : 'bg-amber-500/15 text-amber-900 dark:text-amber-400 border-amber-500/40'
                    }`}>
                      {biz.verificationStatus === 'verified' ? 'تم التوثيق والظهور' : 'جاري المعالجة'}
                    </span>
                  </div>

                  {/* Financial & Commission Summary Bar */}
                  <div className="bg-[var(--input-bg)] p-3 rounded-xl border border-[var(--border-color)] grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-[var(--text-muted)] font-extrabold block">إجمالي سعر الباقة:</span>
                      <span className="font-mono font-bold text-[var(--text-primary)]">{biz.packagePrice} ج.م</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-[var(--text-muted)] font-extrabold block">المحصل من العملاء:</span>
                      <span className="font-mono font-black text-emerald-700 dark:text-emerald-400">{biz.amountPaid} ج.م</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-[var(--text-muted)] font-extrabold block">عمولتك المحصلة ({repRate}%):</span>
                      <span className="font-mono font-black text-amber-800 dark:text-amber-400">{bizComm} ج.م</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-[var(--text-muted)] font-extrabold block">إجمالي العمولة المستحقة:</span>
                      <span className="font-mono font-extrabold text-[var(--text-primary)]">{fullComm} ج.م</span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                    <div className="flex items-center gap-1.5 text-[var(--text-muted)] text-[11px]">
                      <span>العميل: <strong className="text-[var(--text-primary)]">{biz.ownerName}</strong> ({biz.ownerPhone})</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onShowInvoice(biz)}
                        className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 dark:text-amber-300 font-extrabold px-3 py-1.5 rounded-xl border border-amber-500/30 flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>عرض واستخراج الفاتورة</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
