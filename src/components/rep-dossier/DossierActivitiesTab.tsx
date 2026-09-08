import React from 'react';
import { Business } from '../../types';
import { formatActivityDateTime } from '../../utils/dateFormatters';
import {
  Search,
  Store,
  CheckCircle2,
  Clock,
  Eye,
  Camera,
} from 'lucide-react';

export interface DossierActivitiesTabProps {
  repBusinesses: Business[];
  filteredRepBusinesses: Business[];
  bizSearch: string;
  setBizSearch: (s: string) => void;
  bizFilter: 'all' | 'verified' | 'pending' | 'cash' | 'online' | 'exempt';
  setBizFilter: (f: 'all' | 'verified' | 'pending' | 'cash' | 'online' | 'exempt') => void;
  verifiedCount: number;
  pendingReviewCount: number;
  exemptCount: number;
  effectiveRate: number;
  onEditBusiness?: (biz: Business) => void;
  onSelectReceiptPhoto: (photo: string) => void;
}

export const DossierActivitiesTab: React.FC<DossierActivitiesTabProps> = ({
  repBusinesses,
  filteredRepBusinesses,
  bizSearch,
  setBizSearch,
  bizFilter,
  setBizFilter,
  verifiedCount,
  pendingReviewCount,
  exemptCount,
  effectiveRate,
  onEditBusiness,
  onSelectReceiptPhoto,
}) => {
  return (
    <div className="space-y-3.5">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute right-3 top-3" />
          <input
            type="text"
            placeholder="بحث في أنشطة المندوب بالاسم أو التصنيف أو الفاتورة..."
            value={bizSearch}
            onChange={(e) => setBizSearch(e.target.value)}
            className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold text-xs rounded-xl pr-8 pl-3 py-2 focus:outline-none focus:border-amber-500 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setBizFilter('all')}
            className={`px-2.5 py-1.5 rounded-xl font-black text-[11px] whitespace-nowrap transition-colors ${
              bizFilter === 'all'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            الكل ({repBusinesses.length})
          </button>
          <button
            type="button"
            onClick={() => setBizFilter('verified')}
            className={`px-2.5 py-1.5 rounded-xl font-black text-[11px] whitespace-nowrap transition-colors ${
              bizFilter === 'verified'
                ? 'bg-emerald-600 text-white'
                : 'bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            موثق ({verifiedCount})
          </button>
          <button
            type="button"
            onClick={() => setBizFilter('pending')}
            className={`px-2.5 py-1.5 rounded-xl font-black text-[11px] whitespace-nowrap transition-colors ${
              bizFilter === 'pending'
                ? 'bg-amber-600 text-white'
                : 'bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            قيد التوثيق ({pendingReviewCount})
          </button>
          <button
            type="button"
            onClick={() => setBizFilter('cash')}
            className={`px-2.5 py-1.5 rounded-xl font-black text-[11px] whitespace-nowrap transition-colors ${
              bizFilter === 'cash'
                ? 'bg-blue-600 text-white'
                : 'bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            كاش باليد
          </button>
          <button
            type="button"
            onClick={() => setBizFilter('exempt')}
            className={`px-2.5 py-1.5 rounded-xl font-black text-[11px] whitespace-nowrap transition-colors ${
              bizFilter === 'exempt'
                ? 'bg-teal-600 text-white'
                : 'bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            معفى ({exemptCount})
          </button>
        </div>
      </div>

      {/* Businesses Table */}
      {filteredRepBusinesses.length === 0 ? (
        <div className="p-8 text-center bg-[var(--input-bg)] rounded-3xl border border-[var(--border-color)] space-y-2">
          <Store className="w-8 h-8 text-[var(--text-muted)] mx-auto opacity-50" />
          <p className="font-black text-sm text-[var(--text-muted)]">لا توجد أنشطة مطابقة للبحث أو الفلتر المختار</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--border-color)]">
          <table className="w-full text-xs text-right border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-[var(--input-bg)] text-[var(--text-secondary)] border-b border-[var(--border-color)] font-bold text-[11px]">
                <th className="p-3">اسم المنشأة والتصنيف</th>
                <th className="p-3">تاريخ الإضافة</th>
                <th className="p-3">الباقة والمبلغ</th>
                <th className="p-3">طريقة السداد</th>
                <th className="p-3">عمولة المندوب</th>
                <th className="p-3">حالة التوثيق</th>
                <th className="p-3 text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {filteredRepBusinesses.map((biz) => {
                const isExempt = Boolean(biz.isFeeExempt || biz.packagePrice === 0);
                const isVerified = biz.verificationStatus === 'verified' || biz.googleSyncStatus === 'synced';
                const isCash = !isExempt && (biz.cashCollectedByRep !== undefined ? (biz.cashCollectedByRep || 0) > 0 : biz.paymentMethod === 'cash_by_rep');
                const paid = isExempt ? 0 : Number(biz.amountPaid) || 0;
                const commEarned = isExempt ? 0 : Math.round((paid * effectiveRate) / 100);

                return (
                  <tr key={biz.id} className="hover:bg-amber-500/5 transition-colors">
                    <td className="p-3">
                      <p className="font-extrabold text-sm text-[var(--text-primary)]">{biz.nameAr}</p>
                      <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] mt-0.5">
                        <span className="text-amber-700 dark:text-amber-400 font-bold">{biz.category}</span>
                        <span>•</span>
                        <span>{biz.governorate} ({biz.city})</span>
                      </div>
                    </td>

                    <td className="p-3 text-[11px] font-mono text-[var(--text-muted)]">
                      {formatActivityDateTime(biz.createdDate || biz.invoiceDate)}
                    </td>

                    <td className="p-3 font-bold">
                      {isExempt ? (
                        <span className="text-teal-600 dark:text-teal-400 font-black">إدراج مجاني (0 ج)</span>
                      ) : (
                        <div>
                          <span className="text-[var(--text-primary)]">{biz.packagePrice || 250} ج.م</span>
                          <p className="text-[10px] text-emerald-600 font-black">مسدد: {paid} ج.م</p>
                        </div>
                      )}
                    </td>

                    <td className="p-3">
                      {isExempt ? (
                        <span className="text-[10px] font-bold text-teal-600 bg-teal-500/10 px-2 py-0.5 rounded-md">معفى</span>
                      ) : isCash ? (
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-amber-700 dark:text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-md border border-amber-500/30 inline-block">
                            كاش باليد ({paid} ج)
                          </span>
                          {biz.paymentReceiptPhoto && (
                            <button
                              type="button"
                              onClick={() => onSelectReceiptPhoto(biz.paymentReceiptPhoto!)}
                              className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 px-2 py-0.5 rounded-md border border-emerald-500/30 flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                              title="معاينة وتدقيق صورة إيصال / لقطة شاشة التحصيل"
                            >
                              <Camera className="w-3 h-3 text-emerald-500" />
                              <span>صورة التحصيل</span>
                            </button>
                          )}
                        </div>
                      ) : paid > 0 ? (
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-purple-700 dark:text-purple-300 bg-purple-500/15 px-2 py-0.5 rounded-md border border-purple-500/30 inline-block">
                            تحويل للمنصة
                          </span>
                          {biz.paymentReceiptPhoto && (
                            <button
                              type="button"
                              onClick={() => onSelectReceiptPhoto(biz.paymentReceiptPhoto!)}
                              className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 px-2 py-0.5 rounded-md border border-emerald-500/30 flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                              title="معاينة وتدقيق صورة إيصال / لقطة شاشة التحصيل"
                            >
                              <Camera className="w-3 h-3 text-emerald-500" />
                              <span>صورة التحصيل</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-md">لم يدفع بعد</span>
                      )}
                    </td>

                    <td className="p-3 font-black text-amber-600 dark:text-amber-400 font-mono">
                      {isExempt ? '0 ج.م' : `${commEarned} ج.م`}
                    </td>

                    <td className="p-3">
                      {isVerified ? (
                        <span className="badge-success text-[10px] font-black px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>موثق رسمي</span>
                        </span>
                      ) : (
                        <span className="badge-warning text-[10px] font-black px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>قيد المراجعة</span>
                        </span>
                      )}
                    </td>

                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {onEditBusiness && (
                          <button
                            type="button"
                            onClick={() => onEditBusiness(biz)}
                            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[11px] px-2.5 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            <span>تفاصيل</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
