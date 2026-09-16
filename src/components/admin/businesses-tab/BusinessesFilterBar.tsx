import React from 'react';
import { Business } from '../../../types';
import { EGYPT_GOVERNORATES } from '../../../data/mockData';
import { exportBusinessesToCsv } from '../../../utils/exportCsv';
import {
  Search,
  Download,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Globe,
  Sparkles,
} from 'lucide-react';
import { triggerHaptic } from '../../../utils/haptics';

interface BusinessesFilterBarProps {
  businesses: Business[];
  filteredBusinesses: Business[];
  bizSearchQuery: string;
  setBizSearchQuery: (q: string) => void;
  governorateFilter: string;
  setGovernorateFilter: (g: string) => void;
  categoryFilter: string;
  setCategoryFilter: (cat: string) => void;
  categoryStats: { category: string; count: number }[];
  paymentFilter: string;
  setPaymentFilter: (p: string) => void;
  verificationFilter: string;
  setVerificationFilter: (v: string) => void;
  bizPageSize: number;
  setBizPageSize: (s: number) => void;
  setBizPage: React.Dispatch<React.SetStateAction<number>>;
  inProgressCount: number;
  verifiedCount: number;
  notSubmittedCount: number;
  overdueReviewCount: number;
  overdueFollowUpCount?: number;
  verifiedWithDebtCount: number;
  directoryApprovedCount: number;
  pendingApprovalCount?: number;
  trendingFreeCount?: number;
  collectedInvoicesCount?: number;
  unpaidCount?: number;
  onResetFilters?: () => void;
  onOpenPackagesHub?: () => void;
}

export const BusinessesFilterBar: React.FC<BusinessesFilterBarProps> = ({
  businesses,
  filteredBusinesses,
  bizSearchQuery,
  setBizSearchQuery,
  governorateFilter,
  setGovernorateFilter,
  categoryFilter,
  setCategoryFilter,
  categoryStats = [],
  paymentFilter,
  setPaymentFilter,
  verificationFilter,
  setVerificationFilter,
  bizPageSize,
  setBizPageSize,
  setBizPage,
  inProgressCount,
  verifiedCount,
  notSubmittedCount,
  overdueReviewCount,
  overdueFollowUpCount,
  verifiedWithDebtCount,
  directoryApprovedCount,
  pendingApprovalCount,
  trendingFreeCount = 0,
  collectedInvoicesCount = 0,
  unpaidCount = 0,
  onResetFilters,
  onOpenPackagesHub,
}) => {
  return (
    <>
      {/* Quick Filter Pill Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] sm:text-xs">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('selection');
            setVerificationFilter('all');
          }}
          className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
            verificationFilter === 'all'
              ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
              : 'bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-color)]'
          }`}
        >
          الكل ({businesses.length})
        </button>
        <button
          type="button"
          onClick={() => {
            triggerHaptic('selection');
            setVerificationFilter(verificationFilter === 'trending_free' ? 'all' : 'trending_free');
          }}
          className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
            verificationFilter === 'trending_free'
              ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
              : 'bg-amber-500/10 text-amber-800 hover:bg-amber-500/20 border border-amber-500/30'
          }`}
          title="الأنشطة المسجلة بشكل مجاني وبدون تحصيل رسوم"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>الأنشطة الرائجة (المجانية) ({trendingFreeCount})</span>
        </button>
        <button
          type="button"
          onClick={() => {
            triggerHaptic('selection');
            setVerificationFilter(verificationFilter === 'collected_invoices' ? 'all' : 'collected_invoices');
          }}
          className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
            verificationFilter === 'collected_invoices'
              ? 'bg-emerald-600 text-white font-black shadow-xs'
              : 'bg-emerald-500/10 text-emerald-800 hover:bg-emerald-500/20 border border-emerald-500/30'
          }`}
          title="الأنشطة المسددة باقات بفاتورة محصلة"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>فواتير محصلة ({collectedInvoicesCount})</span>
        </button>
        <button
          type="button"
          onClick={() => {
            triggerHaptic('selection');
            setVerificationFilter('pending_approval');
          }}
          className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
            verificationFilter === 'pending_approval'
              ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
              : 'bg-amber-500/10 text-amber-800 hover:bg-amber-500/20 border border-amber-500/30'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>مراجعة المنصة ({pendingApprovalCount ?? businesses.filter(b => b.verificationStatus !== 'verified').length})</span>
        </button>
        <button
          type="button"
          onClick={() => {
            triggerHaptic('selection');
            setVerificationFilter('directory_approved');
          }}
          className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
            verificationFilter === 'directory_approved'
              ? 'bg-emerald-600 text-white font-black shadow-xs'
              : 'bg-emerald-500/10 text-emerald-800 hover:bg-emerald-500/20 border border-emerald-500/30'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>معتمدة بالدليل ({directoryApprovedCount})</span>
        </button>
        <button
          type="button"
          onClick={() => {
            triggerHaptic('selection');
            setVerificationFilter('google_synced');
          }}
          className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
            verificationFilter === 'google_synced'
              ? 'bg-blue-600 text-white font-black shadow-xs'
              : 'bg-blue-500/10 text-blue-800 hover:bg-blue-500/20 border border-blue-500/30'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>خرائط Google ({verifiedCount})</span>
        </button>
        <button
          type="button"
          onClick={() => {
            triggerHaptic('selection');
            setVerificationFilter('google_pending');
          }}
          className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
            verificationFilter === 'google_pending'
              ? 'bg-purple-600 text-white font-black shadow-xs'
              : 'bg-purple-500/10 text-purple-800 hover:bg-purple-500/20 border border-purple-500/30'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>قيد Google ({inProgressCount})</span>
        </button>
        {overdueFollowUpCount !== undefined && overdueFollowUpCount > 0 && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              setVerificationFilter(verificationFilter === 'overdue_followup' ? 'all' : 'overdue_followup');
            }}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
              verificationFilter === 'overdue_followup'
                ? 'bg-rose-600 text-white font-black shadow-xs'
                : 'bg-rose-500/10 text-rose-700 hover:bg-rose-500/20 border border-rose-500/30'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>متابعات متأخرة ({overdueFollowUpCount})</span>
          </button>
        )}
      </div>

      {/* Search and Dropdown Filters (2-column on mobile, 5-column on desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-1.5 sm:gap-2 text-xs">
        <div className="col-span-2 lg:col-span-1 relative">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute right-3 top-2.5" />
          <input
            type="text"
            placeholder="بحث بالاسم، العميل أو الهاتف..."
            value={bizSearchQuery}
            onChange={(e) => setBizSearchQuery(e.target.value)}
            className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl pr-9 pl-3 py-2 focus:outline-none focus:border-amber-500 shadow-xs text-xs"
          />
        </div>

        <select
          value={governorateFilter}
          onChange={(e) => {
            triggerHaptic('selection');
            setGovernorateFilter(e.target.value);
          }}
          className="bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl px-2.5 py-2 focus:outline-none focus:border-amber-500 shadow-xs cursor-pointer text-xs"
        >
          <option value="all">كل المحافظات</option>
          {EGYPT_GOVERNORATES.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => {
            triggerHaptic('selection');
            setCategoryFilter(e.target.value);
          }}
          className="bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl px-2.5 py-2 focus:outline-none focus:border-amber-500 shadow-xs cursor-pointer text-xs"
          title="تصفية وفرز وتعداد المنشآت حسب التصنيفات الرئيسية"
        >
          <option value="all">كل الأقسام ({businesses.length})</option>
          {categoryStats.map(({ category, count }) => (
            <option key={category} value={category}>
              {category} ({count})
            </option>
          ))}
        </select>

        <select
          value={paymentFilter}
          onChange={(e) => {
            triggerHaptic('selection');
            setPaymentFilter(e.target.value);
          }}
          className="bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl px-2.5 py-2 focus:outline-none focus:border-amber-500 shadow-xs cursor-pointer text-xs"
        >
          <option value="all">كل حالات السداد ({businesses.length})</option>
          <option value="trending_free">الأنشطة الرائجة (تسجيل مجاني) ({trendingFreeCount})</option>
          <option value="fully_paid">مسددة بالكامل (فواتير محصلة) ({collectedInvoicesCount})</option>
          <option value="partially_paid">مسدد جزء منها</option>
          <option value="unpaid">بانتظار السداد ({unpaidCount})</option>
        </select>

        <select
          value={verificationFilter}
          onChange={(e) => {
            triggerHaptic('selection');
            setVerificationFilter(e.target.value);
          }}
          className="col-span-2 lg:col-span-1 bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl px-2.5 py-2 focus:outline-none focus:border-amber-500 shadow-xs cursor-pointer text-xs"
        >
          <option value="all">كل حالات التوثيق ({businesses.length})</option>
          <option value="trending_free">الأنشطة الرائجة (المجانية) ({trendingFreeCount})</option>
          <option value="collected_invoices">فواتير محصلة ({collectedInvoicesCount})</option>
          <option value="pending_approval">بانتظار الاعتماد ({pendingApprovalCount ?? businesses.filter(b => b.verificationStatus !== 'verified').length})</option>
          <option value="directory_approved">معتمدة بالدليل ({directoryApprovedCount})</option>
          <option value="google_synced">موثقة بـ Google ({verifiedCount})</option>
          <option value="google_pending">قيد Google ({inProgressCount})</option>
          <option value="google_not_submitted">لم تُرسل لجوجل ({notSubmittedCount})</option>
          <option value="overdue">تجاوزت المراجعة ({overdueReviewCount})</option>
          <option value="overdue_followup">متابعات متأخرة ({overdueFollowUpCount || 0})</option>
          <option value="verified_debt">موثقة ومتبقي سداد ({verifiedWithDebtCount})</option>
          <option value="rejected">مرفوضة بالدليل</option>
        </select>
      </div>

      {/* Header Action Toolbar: Export CSV & Count & Page Size & Reset */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[var(--bg-card)] p-3 rounded-2xl border border-[var(--border-color)] text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[var(--text-secondary)]">
            إجمالي المنشآت المطابقة: <strong className="font-mono font-black text-amber-600">{filteredBusinesses.length}</strong> منشأة
          </span>
          {(bizSearchQuery || governorateFilter !== 'all' || categoryFilter !== 'all' || paymentFilter !== 'all' || verificationFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                if (onResetFilters) {
                  onResetFilters();
                } else {
                  setBizSearchQuery('');
                  setGovernorateFilter('all');
                  setCategoryFilter('all');
                  setPaymentFilter('all');
                  setVerificationFilter('all');
                  setBizPage(1);
                }
              }}
              className="text-[11px] text-rose-600 hover:bg-rose-500/10 font-bold flex items-center gap-1 px-2.5 py-1 rounded-xl transition-colors border border-rose-500/30 cursor-pointer"
              title="إلغاء وتصفير كافة الفلاتر والبحث"
            >
              <RotateCcw className="w-3 h-3" />
              <span>إعادة ضبط</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 mr-auto sm:mr-0">
          {onOpenPackagesHub && (
            <button
              type="button"
              onClick={onOpenPackagesHub}
              className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
              title="استعراض وشرح باقات خدمات منصة دليلك المعتمدة"
            >
              <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>دليل وشرح الباقات 💎</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => exportBusinessesToCsv(filteredBusinesses)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-3.5 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
            title="تصدير السجلات الحالية المصفاة إلى ملف Excel (CSV)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تصدير Excel (CSV)</span>
          </button>

          <div className="flex items-center gap-1 bg-[var(--input-bg)] px-2 py-1 rounded-xl border border-[var(--border-color)] font-bold text-[11px]">
            <span className="text-[var(--text-muted)]">عرض:</span>
            <select
              value={bizPageSize}
              onChange={(e) => setBizPageSize(Number(e.target.value))}
              className="bg-transparent text-[var(--text-primary)] font-black focus:outline-none cursor-pointer"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
          </div>
        </div>
      </div>
    </>
  );
};
