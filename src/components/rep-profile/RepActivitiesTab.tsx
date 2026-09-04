import React, { useState } from 'react';
import { Business } from '../../types';
import {
  FileText,
  CheckCircle2,
  Clock,
  Phone,
  MessageCircle,
  MapPin,
} from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

interface RepActivitiesTabProps {
  repBusinesses: Business[];
  commissionPercentage: number;
}

export const RepActivitiesTab: React.FC<RepActivitiesTabProps> = ({
  repBusinesses,
  commissionPercentage,
}) => {
  const [bizSearch, setBizSearch] = useState('');
  const [bizFilter, setBizFilter] = useState<'all' | 'verified' | 'pending' | 'cash' | 'online' | 'exempt'>('all');

  const filteredBusinesses = repBusinesses.filter((biz) => {
    const matchesSearch =
      !bizSearch.trim() ||
      biz.nameAr?.toLowerCase().includes(bizSearch.toLowerCase()) ||
      biz.city?.toLowerCase().includes(bizSearch.toLowerCase());
    if (!matchesSearch) return false;
    const isExempt = Boolean(biz.isFeeExempt || biz.packagePrice === 0);
    const isVerified = biz.verificationStatus === 'verified' || biz.googleSyncStatus === 'synced';
    const isCash =
      !isExempt &&
      (biz.cashCollectedByRep !== undefined
        ? (biz.cashCollectedByRep || 0) > 0
        : biz.paymentMethod === 'cash_by_rep');
    if (bizFilter === 'verified') return isVerified;
    if (bizFilter === 'pending') return !isVerified;
    if (bizFilter === 'cash') return isCash;
    if (bizFilter === 'exempt') return isExempt;
    return true;
  });

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header & KPI Summary */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-4 sm:p-5 shadow-md space-y-3.5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 border-b border-[var(--border-color)] pb-3">
          <div>
            <h3 className="font-black text-sm sm:text-base text-[var(--text-primary)] flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-500" />
              <span>سجل الأنشطة والمحلات المسجلة بواسطتك ({repBusinesses.length})</span>
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              متابعة حالة التوثيق على خرائط جوجل وعمولات كل نشاط مسجل
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-xl border border-emerald-500/30">
              {
                repBusinesses.filter(
                  (b) => b.verificationStatus === 'verified' || b.googleSyncStatus === 'synced'
                ).length
              }{' '}
              موثق رسمياً
            </span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <input
            type="text"
            placeholder="بحث في أنشطتك بالاسم أو المدينة أو رقم الفاتورة..."
            value={bizSearch}
            onChange={(e) => setBizSearch(e.target.value)}
            className="flex-1 bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
          />

          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs">
            <button
              type="button"
              onClick={() => setBizFilter('all')}
              className={`px-2.5 py-1.5 rounded-xl font-bold whitespace-nowrap cursor-pointer ${
                bizFilter === 'all'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'bg-[var(--input-bg)] text-[var(--text-muted)]'
              }`}
            >
              الكل ({repBusinesses.length})
            </button>
            <button
              type="button"
              onClick={() => setBizFilter('verified')}
              className={`px-2.5 py-1.5 rounded-xl font-bold whitespace-nowrap cursor-pointer ${
                bizFilter === 'verified'
                  ? 'bg-emerald-600 text-white font-black'
                  : 'bg-[var(--input-bg)] text-[var(--text-muted)]'
              }`}
            >
              🟢 موثق
            </button>
            <button
              type="button"
              onClick={() => setBizFilter('pending')}
              className={`px-2.5 py-1.5 rounded-xl font-bold whitespace-nowrap cursor-pointer ${
                bizFilter === 'pending'
                  ? 'bg-amber-600 text-white font-black'
                  : 'bg-[var(--input-bg)] text-[var(--text-muted)]'
              }`}
            >
              ⏳ قيد التوثيق
            </button>
            <button
              type="button"
              onClick={() => setBizFilter('cash')}
              className={`px-2.5 py-1.5 rounded-xl font-bold whitespace-nowrap cursor-pointer ${
                bizFilter === 'cash'
                  ? 'bg-blue-600 text-white font-black'
                  : 'bg-[var(--input-bg)] text-[var(--text-muted)]'
              }`}
            >
              💵 كاش باليد
            </button>
          </div>
        </div>

        {/* Activities Table & Mobile Cards */}
        {repBusinesses.length === 0 ? (
          <div className="p-8 text-center bg-[var(--input-bg)] rounded-2xl border border-[var(--border-color)] text-[var(--text-muted)] font-bold">
            لم تقم بتسجيل أي أنشطة بعد. اضغط على زر "تسجيل نشاط جديد" للبدء!
          </div>
        ) : filteredBusinesses.length === 0 ? (
          <div className="p-8 text-center bg-[var(--input-bg)] rounded-2xl border border-[var(--border-color)] text-[var(--text-muted)] font-bold">
            لا توجد أنشطة تطابق معايير البحث أو التصفية الحالية.
          </div>
        ) : (
          <>
            {/* Mobile View: High-efficiency touch cards (< md) */}
            <div className="md:hidden space-y-3">
              {filteredBusinesses.map((biz) => {
                const isExempt = Boolean(biz.isFeeExempt || biz.packagePrice === 0);
                const isVerified =
                  biz.verificationStatus === 'verified' || biz.googleSyncStatus === 'synced';
                const isCash =
                  !isExempt &&
                  (biz.cashCollectedByRep !== undefined
                    ? (biz.cashCollectedByRep || 0) > 0
                    : biz.paymentMethod === 'cash_by_rep');
                const paid = isExempt ? 0 : Number(biz.amountPaid) || 0;
                const commEarned = isExempt ? 0 : Math.round((paid * commissionPercentage) / 100);
                const phoneToCall = biz.phone || biz.ownerPhone;
                const cleanPhone = phoneToCall ? phoneToCall.replace(/[^0-9]/g, '') : '';
                const mapUrl =
                  biz.googleMapsUrl ||
                  (biz.lat && biz.lng ? `https://www.google.com/maps?q=${biz.lat},${biz.lng}` : null);

                return (
                  <div
                    key={biz.id}
                    className="p-3.5 rounded-2xl border border-[var(--border-color)] bg-[var(--input-bg)] shadow-sm space-y-3"
                  >
                    {/* Header: Name & Verification Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-extrabold text-sm text-[var(--text-primary)]">
                          {biz.nameAr}
                        </p>
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold mt-0.5">
                          {biz.category} • {biz.city}
                        </p>
                      </div>
                      {isVerified ? (
                        <span className="badge-success text-[10px] font-black px-2.5 py-1 rounded-full shrink-0 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>موثق ✅</span>
                        </span>
                      ) : (
                        <span className="badge-warning text-[10px] font-black px-2.5 py-1 rounded-full shrink-0 inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>قيد التوثيق ⏳</span>
                        </span>
                      )}
                    </div>

                    {/* Stats Grid: Package, Paid, Commission */}
                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] text-center text-xs">
                      <div>
                        <span className="text-[10px] text-[var(--text-muted)] block font-semibold">
                          الباقة
                        </span>
                        <span className="font-extrabold text-[var(--text-primary)] text-xs">
                          {isExempt ? 'معفى' : `${biz.packagePrice || 250} ج`}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[var(--text-muted)] block font-semibold">
                          المدفوع
                        </span>
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-xs">
                          {isExempt ? '0 ج' : `${paid} ج`}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[var(--text-muted)] block font-semibold">
                          عمولتك
                        </span>
                        <span className="font-black text-amber-600 dark:text-amber-400 text-xs">
                          {isExempt ? '0 ج' : `${commEarned} ج`}
                        </span>
                      </div>
                    </div>

                    {/* Payment Method Badge & Date */}
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[var(--text-muted)] font-bold">الدفع:</span>
                        {isExempt ? (
                          <span className="text-[10px] font-bold text-teal-600 bg-teal-500/10 px-2 py-0.5 rounded-md">
                            معفى
                          </span>
                        ) : isCash ? (
                          <span className="text-[10px] font-black text-amber-700 dark:text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-md border border-amber-500/30">
                            💵 كاش بيدك ({paid} ج)
                          </span>
                        ) : paid > 0 ? (
                          <span className="text-[10px] font-black text-purple-700 dark:text-purple-300 bg-purple-500/15 px-2 py-0.5 rounded-md border border-purple-500/30">
                            💳 تحويل للمنصة
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-md">
                            لم يدفع
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-[var(--text-muted)]">
                        {biz.createdDate ? new Date(biz.createdDate).toLocaleDateString('ar-EG') : '—'}
                      </span>
                    </div>

                    {/* Mobile 1-Tap Quick Action Row */}
                    <div className="flex items-center gap-2 pt-1 border-t border-[var(--border-color)]">
                      {phoneToCall && (
                        <a
                          href={`tel:${phoneToCall}`}
                          onClick={() => triggerHaptic('light')}
                          className="flex-1 py-2 px-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors active:scale-95"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>اتصال</span>
                        </a>
                      )}
                      {cleanPhone && (
                        <a
                          href={`https://wa.me/2${cleanPhone}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => triggerHaptic('light')}
                          className="flex-1 py-2 px-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors active:scale-95"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>واتساب</span>
                        </a>
                      )}
                      {mapUrl && (
                        <a
                          href={mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => triggerHaptic('light')}
                          className="flex-1 py-2 px-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors active:scale-95"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          <span>الخريطة</span>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop View: Table (>= md) */}
            <div className="hidden md:block overflow-x-auto rounded-2xl border border-[var(--border-color)]">
              <table className="w-full text-xs text-right border-collapse min-w-[650px]">
                <thead>
                  <tr className="bg-[var(--input-bg)] text-[var(--text-secondary)] border-b border-[var(--border-color)] font-bold text-[11px]">
                    <th className="p-3">اسم النشاط والتصنيف</th>
                    <th className="p-3">تاريخ الإضافة</th>
                    <th className="p-3">الباقة والمبلغ</th>
                    <th className="p-3">طريقة السداد</th>
                    <th className="p-3">عمولتك المستحقة</th>
                    <th className="p-3">حالة التوثيق</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {filteredBusinesses.map((biz) => {
                    const isExempt = Boolean(biz.isFeeExempt || biz.packagePrice === 0);
                    const isVerified =
                      biz.verificationStatus === 'verified' || biz.googleSyncStatus === 'synced';
                    const isCash =
                      !isExempt &&
                      (biz.cashCollectedByRep !== undefined
                        ? (biz.cashCollectedByRep || 0) > 0
                        : biz.paymentMethod === 'cash_by_rep');
                    const paid = isExempt ? 0 : Number(biz.amountPaid) || 0;
                    const commEarned = isExempt ? 0 : Math.round((paid * commissionPercentage) / 100);

                    return (
                      <tr key={biz.id} className="hover:bg-amber-500/5 transition-colors">
                        <td className="p-3">
                          <p className="font-extrabold text-sm text-[var(--text-primary)]">
                            {biz.nameAr}
                          </p>
                          <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold">
                            {biz.category} • {biz.city}
                          </p>
                        </td>

                        <td className="p-3 text-[11px] font-mono text-[var(--text-muted)]">
                          {biz.createdDate
                            ? new Date(biz.createdDate).toLocaleDateString('ar-EG')
                            : '—'}
                        </td>

                        <td className="p-3 font-bold">
                          {isExempt ? (
                            <span className="text-teal-600 dark:text-teal-400 font-black">
                              إدراج مجاني (0 ج)
                            </span>
                          ) : (
                            <div>
                              <span className="text-[var(--text-primary)]">
                                {biz.packagePrice || 250} ج.م
                              </span>
                              <p className="text-[10px] text-emerald-600 font-black">
                                مسدد: {paid} ج.م
                              </p>
                            </div>
                          )}
                        </td>

                        <td className="p-3">
                          {isExempt ? (
                            <span className="text-[10px] font-bold text-teal-600 bg-teal-500/10 px-2 py-0.5 rounded-md">
                              معفى
                            </span>
                          ) : isCash ? (
                            <span className="text-[10px] font-black text-amber-700 dark:text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-md border border-amber-500/30">
                              💵 كاش بيدك ({paid} ج)
                            </span>
                          ) : paid > 0 ? (
                            <span className="text-[10px] font-black text-purple-700 dark:text-purple-300 bg-purple-500/15 px-2 py-0.5 rounded-md border border-purple-500/30">
                              💳 تحويل للمنصة
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-md">
                              لم يدفع بعد
                            </span>
                          )}
                        </td>

                        <td className="p-3 font-black text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                          {isExempt ? '0 ج.م' : `${commEarned} ج.م`}
                        </td>

                        <td className="p-3">
                          {isVerified ? (
                            <span className="badge-success text-[10px] font-black px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>موثق رسمياً ✅</span>
                            </span>
                          ) : (
                            <span className="badge-warning text-[10px] font-black px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>قيد التوثيق ⏳</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
