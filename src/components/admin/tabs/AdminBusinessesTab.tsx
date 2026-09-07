import React, { useState } from 'react';
import { Business, User } from '../../../types';
import { EGYPT_GOVERNORATES } from '../../../data/mockData';
import { exportBusinessesToCsv } from '../../../utils/exportCsv';
import { sanitizeExternalUrl } from '../../../utils/urlSanitizer';
import { formatEGP } from '../../../utils/formatCurrency';
import { formatStandardDateTime } from '../../../utils/dateFormatters';
import { isRepAccountDeleted } from '../../../utils/accountStatus';
import { getBusinessFollowUpSummary } from '../../../utils/followUpUtils';
import { BusinessFollowUpModal } from '../modals/BusinessFollowUpModal';
import { ConfirmDialog } from '../../ConfirmDialog';
import {
  Search,
  Download,
  Clock,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  Zap,
  ClipboardList,
  Eye,
  ChevronRight,
  ChevronLeft,
  Trash2,
  FileText,
  RotateCcw,
} from 'lucide-react';

interface AdminBusinessesTabProps {
  businesses: Business[];
  filteredBusinesses: Business[];
  pagedBusinesses: Business[];
  bizSearchQuery: string;
  setBizSearchQuery: (q: string) => void;
  governorateFilter: string;
  setGovernorateFilter: (g: string) => void;
  paymentFilter: string;
  setPaymentFilter: (p: string) => void;
  verificationFilter: string;
  setVerificationFilter: (v: string) => void;
  bizPageSize: number;
  setBizPageSize: (s: number) => void;
  bizPage: number;
  setBizPage: React.Dispatch<React.SetStateAction<number>>;
  totalBizPages: number;
  inProgressCount: number;
  verifiedCount: number;
  notSubmittedCount: number;
  overdueReviewCount: number;
  overdueReviewBusinesses: Business[];
  overdueFollowUpCount?: number;
  verifiedWithDebtCount: number;
  directoryApprovedCount: number;
  pendingApprovalCount?: number;
  onCollectPayment?: (biz: Business) => void;
  onSetSyncModalBiz: (biz: Business | null) => void;
  onSetEditingBusiness: (biz: Business | null) => void;
  onSetEditingBusinessInitialTab: (tab: string | undefined) => void;
  onUpdateBusiness?: (updated: Business) => void;
  currentUser?: User | null;
  onShowInvoice: (biz: Business) => void;
  onDeleteBusiness: (id: string) => void;
  onResetFilters?: () => void;
}

export const AdminBusinessesTab: React.FC<AdminBusinessesTabProps> = ({
  businesses,
  filteredBusinesses,
  pagedBusinesses,
  bizSearchQuery,
  setBizSearchQuery,
  governorateFilter,
  setGovernorateFilter,
  paymentFilter,
  setPaymentFilter,
  verificationFilter,
  setVerificationFilter,
  bizPageSize,
  setBizPageSize,
  bizPage,
  setBizPage,
  totalBizPages,
  inProgressCount,
  verifiedCount,
  notSubmittedCount,
  overdueReviewCount,
  overdueReviewBusinesses,
  overdueFollowUpCount,
  verifiedWithDebtCount,
  directoryApprovedCount,
  pendingApprovalCount,
  onCollectPayment,
  onSetSyncModalBiz,
  onSetEditingBusiness,
  onSetEditingBusinessInitialTab,
  onUpdateBusiness,
  currentUser,
  onShowInvoice,
  onDeleteBusiness,
  onResetFilters,
}) => {
  // State for custom delete confirmation dialog
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
  // State for fast CRM Follow-up modal
  const [selectedFollowUpBiz, setSelectedFollowUpBiz] = useState<Business | null>(null);

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-3xl p-4 sm:p-5 space-y-4 shadow-sm animate-fade-in transition-colors duration-300">
      {/* Quick Filter Pill Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setVerificationFilter('all')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
            verificationFilter === 'all'
              ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
              : 'bg-[var(--input-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-color)]'
          }`}
        >
          الكل ({businesses.length})
        </button>
        <button
          onClick={() => setVerificationFilter('pending_approval')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
            verificationFilter === 'pending_approval'
              ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
              : 'bg-amber-500/10 text-amber-800 dark:text-amber-300 hover:bg-amber-500/20 border border-amber-500/30'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>⏳ قيد مراجعة المنصة ({pendingApprovalCount ?? businesses.filter(b => b.verificationStatus !== 'verified').length})</span>
        </button>
        <button
          onClick={() => setVerificationFilter('directory_approved')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
            verificationFilter === 'directory_approved'
              ? 'bg-emerald-600 text-white font-black shadow-xs'
              : 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>🟢 معتمدة بالدليل ({directoryApprovedCount})</span>
        </button>
        <button
          onClick={() => setVerificationFilter('google_synced')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
            verificationFilter === 'google_synced'
              ? 'bg-blue-600 text-white font-black shadow-xs'
              : 'bg-blue-500/10 text-blue-800 dark:text-blue-300 hover:bg-blue-500/20 border border-blue-500/30'
          }`}
        >
          <span>🌐 خرائط Google ({verifiedCount})</span>
        </button>
        <button
          onClick={() => setVerificationFilter('google_pending')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
            verificationFilter === 'google_pending'
              ? 'bg-purple-600 text-white font-black shadow-xs'
              : 'bg-purple-500/10 text-purple-800 dark:text-purple-300 hover:bg-purple-500/20 border border-purple-500/30'
          }`}
        >
          <span>⏳ قيد توثيق Google ({inProgressCount})</span>
        </button>
        {(overdueFollowUpCount !== undefined && overdueFollowUpCount > 0) && (
          <button
            onClick={() => setVerificationFilter(verificationFilter === 'overdue_followup' ? 'all' : 'overdue_followup')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
              verificationFilter === 'overdue_followup'
                ? 'bg-rose-600 text-white font-black shadow-xs'
                : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 hover:bg-rose-500/20 border border-rose-500/30'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>🚨 متابعات متأخرة ({overdueFollowUpCount})</span>
          </button>
        )}
      </div>

      {/* Search and Dropdown Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute right-3 top-3" />
          <input
            type="text"
            placeholder="بحث بالاسم، العميل أو الهاتف..."
            value={bizSearchQuery}
            onChange={(e) => setBizSearchQuery(e.target.value)}
            className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl pr-9 pl-3 py-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
          />
        </div>

        <select
          value={governorateFilter}
          onChange={(e) => setGovernorateFilter(e.target.value)}
          className="bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
        >
          <option value="all">كل المحافظات</option>
          {EGYPT_GOVERNORATES.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>

        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
        >
          <option value="all">كل حالات السداد</option>
          <option value="fully_paid">مدفوعة بالكامل</option>
          <option value="partially_paid">مدفوع جزء منها</option>
          <option value="unpaid">لم يتم الدفع نهائياً</option>
        </select>

        <select
          value={verificationFilter}
          onChange={(e) => setVerificationFilter(e.target.value)}
          className="bg-[var(--input-bg)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
        >
          <option value="all">كل حالات التوثيق والاعتماد ({businesses.length})</option>
          <option value="pending_approval">⏳ بانتظار اعتماد المنصة ({pendingApprovalCount ?? businesses.filter(b => b.verificationStatus !== 'verified').length})</option>
          <option value="directory_approved">🟢 معتمدة بالدليل العام ({directoryApprovedCount})</option>
          <option value="google_synced">🌐 موثقة بخرائط Google ({verifiedCount})</option>
          <option value="google_pending">⏳ قيد توثيق خرائط Google ({inProgressCount})</option>
          <option value="google_not_submitted">🚨 لم تُرسل لجوجل بعد ({notSubmittedCount})</option>
          <option value="overdue">⏱️ تجاوزت مدة المراجعة ({overdueReviewCount})</option>
          <option value="overdue_followup">🚨 متابعات متأخرة ({overdueFollowUpCount || 0})</option>
          <option value="verified_debt">⚠️ موثقة ولها متبقي سداد ({verifiedWithDebtCount})</option>
          <option value="rejected">❌ مرفوضة بالدليل</option>
        </select>
      </div>

      {/* Header Action Toolbar: Export CSV & Count & Page Size & Reset */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[var(--bg-card)] p-3 rounded-2xl border border-[var(--border-color)] text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[var(--text-secondary)]">
            إجمالي المنشآت المطابقة: <strong className="font-mono font-black text-amber-600 dark:text-amber-400">{filteredBusinesses.length}</strong> منشأة
          </span>
          {(bizSearchQuery || governorateFilter !== 'all' || paymentFilter !== 'all' || verificationFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                if (onResetFilters) {
                  onResetFilters();
                } else {
                  setBizSearchQuery('');
                  setGovernorateFilter('all');
                  setPaymentFilter('all');
                  setVerificationFilter('all');
                  setBizPage(1);
                }
              }}
              className="text-[11px] text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 font-bold flex items-center gap-1 px-2.5 py-1 rounded-xl transition-colors border border-rose-500/30 cursor-pointer"
              title="إلغاء وتصفير كافة الفلاتر والبحث"
            >
              <RotateCcw className="w-3 h-3" />
              <span>إعادة ضبط ↺</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 mr-auto sm:mr-0">
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

      {/* Businesses Data: Mobile Cards (< md) + Desktop Table (>= md) */}
      <div className="space-y-3">
        {pagedBusinesses.length === 0 ? (
          <div className="p-8 text-center text-[var(--text-muted)] font-bold bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)]">
            لا توجد منشآت مطابقة للبحث أو التصفية الحالية.
          </div>
        ) : (
          <>
            {/* 1. Mobile Cards View (Hidden on md and larger) */}
            <div className="block md:hidden space-y-3">
              {pagedBusinesses.map((biz) => {
                const isDirectoryApproved = biz.verificationStatus === 'verified';
                const hasGoogleMap = Boolean(
                  biz.googleMapsUrl &&
                  typeof biz.googleMapsUrl === 'string' &&
                  biz.googleMapsUrl.trim().startsWith('http') &&
                  !biz.googleMapsUrl.includes('search/?api=1&query=')
                );
                const isGoogleSynced = hasGoogleMap || biz.googleSyncStatus === 'synced';
                const isInGoogleReview = !hasGoogleMap && biz.googleSyncStatus === 'in_progress';
                const isAlreadyOnGoogle = Boolean(biz.isAlreadyOnGoogle || biz.packageId === 'pkg_already_on_google' || biz.registrationType === 'already_on_google');
                const isExempt = Boolean(isAlreadyOnGoogle || biz.isFeeExempt || biz.packagePrice === 0);
                const packageDebt = isExempt ? 0 : Math.max(0, (biz.packagePrice || 0) - (biz.amountPaid || 0));
                const additionalDebt = isExempt ? 0 : (biz.additionalInvoices || []).reduce(
                  (sum, inv) => sum + Math.max(0, (Number(inv.amount) || 0) - (Number(inv.amountPaid) || 0)),
                  0
                );
                const debtAmount = packageDebt + additionalDebt;
                const isPaid = isExempt ? true : debtAmount === 0;
                const isCash = !isExempt && (biz.cashCollectedByRep !== undefined
                  ? (biz.cashCollectedByRep || 0) > 0
                  : biz.paymentMethod !== 'gateway_online' && isPaid);
                const rate = biz.repCommissionRate || 42.86;
                const repComm = isExempt ? 0 : Math.round(((biz.amountPaid || 0) * rate) / 100);
                const platDue = isExempt ? 0 : (biz.amountPaid || 0) - repComm;
                const isGoogleVerifiedWithDebt = hasGoogleMap && !isPaid && !isExempt && debtAmount > 0;
                const fuSummary = getBusinessFollowUpSummary(biz);

                return (
                  <div key={`m-${biz.id}`} className="bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-2xl space-y-3 shadow-sm hover:border-amber-500/40 transition-all">
                    {/* Header: Name + Dual Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-black text-sm text-[var(--text-primary)] truncate">{biz.nameAr}</h4>
                        {biz.nameEn && <p className="text-[10px] text-[var(--text-muted)] font-mono truncate">{biz.nameEn}</p>}
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="inline-block text-[11px] text-amber-700 dark:text-amber-400 font-bold">{biz.category}</span>
                          {isExempt && (
                            <span className="text-[9.5px] bg-teal-500/20 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-md font-black border border-teal-500/30">
                              🌟 رائج (معفى مجاناً)
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-1">
                        {isDirectoryApproved ? (
                          <span className="bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/40 text-[9.5px] font-black px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>معتمد بالدليل 🟢</span>
                          </span>
                        ) : biz.verificationStatus === 'rejected' ? (
                          <span className="bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-500/40 text-[9.5px] font-black px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            <span>مرفوض بالدليل 🔴</span>
                          </span>
                        ) : (
                          <span className="bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 text-[9.5px] font-black px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            <span>قيد مراجعة الدليل ⏳</span>
                          </span>
                        )}

                        {hasGoogleMap ? (
                          <span className="bg-blue-500/15 text-blue-800 dark:text-blue-300 border border-blue-500/30 text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                            🌐 موثق بـ Google
                          </span>
                        ) : isInGoogleReview ? (
                          <span className="bg-purple-500/15 text-purple-800 dark:text-purple-300 border border-purple-500/30 text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                            ⏳ قيد توثيق Google
                          </span>
                        ) : (
                          <span className="bg-slate-800/80 text-slate-400 border border-slate-700 text-[9px] font-medium px-1.5 py-0.5 rounded-md">
                            ⚪ غير مربوط بـ Google
                          </span>
                        )}

                        {fuSummary.isOverdue ? (
                          <button
                            type="button"
                            onClick={() => setSelectedFollowUpBiz(biz)}
                            className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-700 dark:text-rose-300 border border-rose-500/40 text-[9px] font-black px-1.5 py-0.5 rounded-md inline-flex items-center gap-1 cursor-pointer animate-pulse"
                            title="متابعات متأخرة تحتاج تدخلاً عاجلاً"
                          >
                            <AlertTriangle className="w-2.5 h-2.5 text-rose-500" />
                            <span>🚨 {fuSummary.overdueCount} متأخرة</span>
                          </button>
                        ) : fuSummary.dueTodayCount > 0 ? (
                          <button
                            type="button"
                            onClick={() => setSelectedFollowUpBiz(biz)}
                            className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-300 border border-amber-500/40 text-[9px] font-black px-1.5 py-0.5 rounded-md inline-flex items-center gap-1 cursor-pointer"
                            title="متابعات مستحقة اليوم"
                          >
                            <Clock className="w-2.5 h-2.5 text-amber-500" />
                            <span>🟡 اليوم ({fuSummary.dueTodayCount})</span>
                          </button>
                        ) : Boolean(biz.adminFollowUps && biz.adminFollowUps.length > 0) ? (
                          <button
                            type="button"
                            onClick={() => setSelectedFollowUpBiz(biz)}
                            className="bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[9px] font-bold px-1.5 py-0.5 rounded-md inline-flex items-center gap-1 cursor-pointer transition-colors"
                            title="عرض وسجل المتابعات الإدارية"
                          >
                            <ClipboardList className="w-2.5 h-2.5 text-amber-500" />
                            <span>{biz.adminFollowUps!.length} متابعة</span>
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {/* Urgent Alert if Verified on Google with Remaining Debt */}
                    {isGoogleVerifiedWithDebt && (
                      <div className="bg-rose-500/15 border border-rose-500/40 text-rose-700 dark:text-rose-300 p-2.5 rounded-xl text-xs font-black flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                          <span className="truncate">⚠️ موثقة ومطلوب التحصيل</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (packageDebt > 0 && onCollectPayment) {
                              onCollectPayment(biz);
                            } else {
                              onSetEditingBusinessInitialTab('payment');
                              onSetEditingBusiness(biz);
                            }
                          }}
                          className="bg-rose-600 hover:bg-rose-500 text-white font-black text-[10px] px-2.5 py-1 rounded-lg shadow-xs cursor-pointer shrink-0"
                        >
                          تحصيل 💰
                        </button>
                      </div>
                    )}

                    {/* Location, Rep, and Date Grid */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-[var(--input-bg)]/60 p-2.5 rounded-xl border border-[var(--border-color)]">
                      <div className="min-w-0">
                        <span className="text-[9px] text-[var(--text-muted)] block font-bold">الموقع والمندوب:</span>
                        <span className="font-bold text-[var(--text-primary)] block truncate">{biz.governorate} ({biz.city})</span>
                        <span className="text-[10px] text-[var(--text-secondary)] flex items-center gap-1 truncate">
                          <span>مندوب: {biz.repName}</span>
                          {isRepAccountDeleted({ id: biz.repId, name: biz.repName }) && (
                            <span className="bg-rose-500/15 text-rose-500 text-[9px] font-black px-1.5 py-0.2 rounded-md border border-rose-500/30 shrink-0">
                              محذوف ⚠️
                            </span>
                          )}
                        </span>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <a
                            href={sanitizeExternalUrl(biz.repLocationUrl || `https://www.google.com/maps?q=${biz.lat},${biz.lng}`)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[9px] text-amber-600 dark:text-amber-400 font-bold hover:underline"
                          >
                            📍 موقع المندوب
                          </a>
                          {hasGoogleMap && (
                            <a
                              href={sanitizeExternalUrl(biz.googleMapsUrl)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                            >
                              • ✅ الخريطة الموثقة
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="min-w-0 text-left">
                        <span className="text-[9px] text-[var(--text-muted)] block font-bold">المسؤول والهاتف:</span>
                        <span className="font-bold text-[var(--text-primary)] block truncate">{biz.ownerName}</span>
                        <span className="text-[10px] text-[var(--text-secondary)] font-mono block dir-ltr truncate">{biz.ownerPhone}</span>
                      </div>
                    </div>

                    {/* Financial Summary Box */}
                    <div className="bg-[var(--input-bg)] p-2.5 rounded-xl border border-[var(--border-color)] text-xs space-y-1">
                      <div className="flex items-center justify-between font-mono">
                        <span className="text-[10.5px] text-[var(--text-secondary)]">سعر الباقة الإجمالي:</span>
                        <span className="font-black text-amber-600 dark:text-amber-400">{isExempt ? 'مجاني (0 ج.م)' : formatEGP(biz.packagePrice || 250)}</span>
                      </div>
                      <div className="flex items-center justify-between font-mono">
                        <span className="text-[10.5px] text-[var(--text-secondary)]">المبلغ المسدد:</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatEGP(biz.amountPaid || 0)}</span>
                      </div>
                      {debtAmount > 0 && (
                        <div className="flex items-center justify-between font-mono font-bold text-rose-500">
                          <span className="text-[10.5px]">المتبقي للتحصيل:</span>
                          <span>{formatEGP(debtAmount)}</span>
                        </div>
                      )}
                      {biz.additionalInvoices && biz.additionalInvoices.length > 0 && (
                        <div className="flex items-center justify-between text-[10.5px] font-bold text-sky-600 dark:text-sky-400 pt-1 border-t border-[var(--border-color)]">
                          <span>خدمات إضافية ({biz.additionalInvoices.length}):</span>
                          <span className="font-mono">
                            {formatEGP(biz.additionalInvoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0))} محصل
                          </span>
                        </div>
                      )}
                      {isCash && (
                        <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] font-mono pt-1 border-t border-[var(--border-color)]">
                          <span>نصيب المندوب: {formatEGP(repComm)}</span>
                          <span>مستحق للمنصة: {formatEGP(platDue)}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setSelectedFollowUpBiz(biz)}
                        className={`font-bold text-xs p-2 rounded-xl border cursor-pointer relative ${
                          fuSummary.isOverdue
                            ? 'bg-rose-500/20 border-rose-500 text-rose-600 animate-pulse'
                            : fuSummary.dueTodayCount > 0
                            ? 'bg-amber-500/20 border-amber-500 text-amber-600'
                            : 'bg-[var(--input-bg)] hover:bg-amber-500/20 text-[var(--text-primary)] border-[var(--border-color)]'
                        }`}
                        title={`سجل المتابعات الإدارية (${biz.adminFollowUps?.length || 0})`}
                      >
                        <ClipboardList className="w-4 h-4 text-amber-500" />
                        {fuSummary.isOverdue ? (
                          <span className="absolute -top-1 -right-1 bg-rose-600 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs animate-bounce">
                            {fuSummary.overdueCount}
                          </span>
                        ) : Boolean(biz.adminFollowUps && biz.adminFollowUps.length > 0) ? (
                          <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                            {biz.adminFollowUps!.length}
                          </span>
                        ) : null}
                      </button>

                      <button
                        type="button"
                        onClick={() => onShowInvoice(biz)}
                        className="bg-[var(--input-bg)] hover:bg-amber-500/20 text-[var(--text-primary)] font-bold text-xs p-2 rounded-xl border border-[var(--border-color)] cursor-pointer"
                        title="عرض وإصدار الفاتورة"
                      >
                        <FileText className="w-4 h-4 text-amber-500" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onSetSyncModalBiz(biz)}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1 cursor-pointer"
                        title="ربط خرائط جوجل"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Google</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onSetEditingBusiness(biz)}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl flex items-center gap-1 cursor-pointer flex-1 justify-center"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>التفاصيل</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setConfirmDelete({ id: biz.id, name: biz.nameAr })}
                        className="bg-rose-500/15 hover:bg-rose-500 text-rose-500 hover:text-white p-2 rounded-xl border border-rose-500/30 cursor-pointer transition-colors"
                        title="حذف المكان"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 2. Desktop Table View (>= md) */}
            <div className="hidden md:block overflow-x-auto rounded-2xl border border-[var(--border-color)]">
              <table className="w-full text-xs text-right border-collapse min-w-[950px]">
                <thead>
                  <tr className="bg-[var(--input-bg)] text-[var(--text-secondary)] border-b border-[var(--border-color)] font-bold text-[11px]">
                    <th className="p-3">الاسم والتصنيف</th>
                    <th className="p-3">المسؤول والموقع</th>
                    <th className="p-3">المندوب وتاريخ التسجيل</th>
                    <th className="p-3">الباقة والموقف المالي</th>
                    <th className="p-3">الاعتماد والتوثيق</th>
                    <th className="p-3 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {pagedBusinesses.map((biz) => {
                    const isDirectoryApproved = biz.verificationStatus === 'verified';
                    const hasGoogleMap = Boolean(
                      biz.googleMapsUrl &&
                      typeof biz.googleMapsUrl === 'string' &&
                      biz.googleMapsUrl.trim().startsWith('http') &&
                      !biz.googleMapsUrl.includes('search/?api=1&query=')
                    );
                    const isAlreadyOnGoogle = Boolean(biz.isAlreadyOnGoogle || biz.packageId === 'pkg_already_on_google' || biz.registrationType === 'already_on_google');
                    const isExempt = Boolean(isAlreadyOnGoogle || biz.isFeeExempt || biz.packagePrice === 0);
                    const packageDebt = isExempt ? 0 : Math.max(0, (biz.packagePrice || 0) - (biz.amountPaid || 0));
                    const additionalDebt = isExempt ? 0 : (biz.additionalInvoices || []).reduce(
                      (sum, inv) => sum + Math.max(0, (Number(inv.amount) || 0) - (Number(inv.amountPaid) || 0)),
                      0
                    );
                    const debtAmount = packageDebt + additionalDebt;
                    const isPaid = isExempt ? true : debtAmount === 0;
                    const isCash = !isExempt && (biz.cashCollectedByRep !== undefined
                      ? (biz.cashCollectedByRep || 0) > 0
                      : biz.paymentMethod !== 'gateway_online' && isPaid);
                    const rate = biz.repCommissionRate || 42.86;
                    const repComm = isExempt ? 0 : Math.round(((biz.amountPaid || 0) * rate) / 100);
                    const platDue = isExempt ? 0 : (biz.amountPaid || 0) - repComm;
                    const fuSummary = getBusinessFollowUpSummary(biz);

                    return (
                      <tr key={biz.id} className="hover:bg-amber-500/5 transition-colors">
                        <td className="p-3">
                          <p className="font-black text-[var(--text-primary)]">{biz.nameAr}</p>
                          <p className="text-[10px] text-[var(--text-muted)] font-mono">{biz.nameEn || biz.category}</p>
                          {isExempt && (
                            <span className="text-[9.5px] bg-teal-500/20 text-teal-700 dark:text-teal-300 px-1.5 py-0.5 rounded font-bold inline-block mt-0.5">
                              🌟 رائج (معفى مجاناً)
                            </span>
                          )}
                        </td>

                        <td className="p-3">
                          <p className="font-bold text-[var(--text-primary)]">{biz.ownerName}</p>
                          <p className="text-[10px] text-[var(--text-muted)] font-mono">{biz.ownerPhone}</p>
                          <p className="text-[10px] text-[var(--text-secondary)]">{biz.governorate} - {biz.city}</p>
                          {biz.repLocationUrl && (
                            <a
                              href={sanitizeExternalUrl(biz.repLocationUrl)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[9px] text-amber-600 dark:text-amber-400 font-bold hover:underline inline-flex items-center gap-0.5 mt-0.5"
                              title="معاينة إحداثيات موقع المندوب الميداني"
                            >
                              <span>📍 موقع المندوب</span>
                            </a>
                          )}
                        </td>

                        <td className="p-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-bold text-[var(--text-primary)]">{biz.repName}</p>
                            {isRepAccountDeleted({ id: biz.repId, name: biz.repName }) && (
                              <span className="bg-rose-500/15 text-rose-500 text-[9.5px] font-black px-1.5 py-0.5 rounded-md border border-rose-500/30 inline-block">
                                حساب محذوف ⚠️
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-[var(--text-muted)] font-mono dir-ltr">{formatStandardDateTime(biz.createdDate)}</p>
                        </td>

                        <td className="p-3">
                          <div className="space-y-1">
                            {isExempt ? (
                              <span className="badge-success text-[10px] font-black px-2 py-0.5 rounded-full inline-block">
                                معفى ✓
                              </span>
                            ) : debtAmount > 0 && (biz.amountPaid || 0) === 0 ? (
                              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full inline-block bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                غير مدفوعة ⏳
                              </span>
                            ) : debtAmount === 0 ? (
                              <span className="badge-success text-[10px] font-black px-2.5 py-0.5 rounded-full inline-block">
                                مدفوعة ✓
                              </span>
                            ) : (
                              <>
                                <span className="badge-warning text-[10px] font-black px-2 py-0.5 rounded-full inline-block">
                                  مقدم (متبقي {formatEGP(debtAmount)})
                                </span>
                                {isCash && (
                                  <p className="text-[9.5px] text-amber-700 dark:text-amber-300 font-bold font-mono">
                                    💵 كاش (مستحق: {formatEGP(platDue)})
                                  </p>
                                )}
                              </>
                            )}
                            {biz.additionalInvoices && biz.additionalInvoices.length > 0 && (
                              <span className="text-[9.5px] bg-sky-500/15 text-sky-700 dark:text-sky-300 font-bold px-1.5 py-0.5 rounded-md border border-sky-500/30 inline-block">
                                +{biz.additionalInvoices.length} خدمات إضافية ({formatEGP(biz.additionalInvoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0))})
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="p-3">
                          <div className="space-y-1">
                            <div>
                              {isDirectoryApproved ? (
                                <span className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-black px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                                  <span>معتمد بالدليل 🟢</span>
                                </span>
                              ) : biz.verificationStatus === 'rejected' ? (
                                <span className="bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 text-[10px] font-black px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                  <AlertTriangle className="w-2.5 h-2.5 text-rose-500" />
                                  <span>مرفوض بالدليل 🔴</span>
                                </span>
                              ) : (
                                <span className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[10px] font-black px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                  <Clock className="w-2.5 h-2.5 text-amber-500" />
                                  <span>قيد مراجعة الدليل ⏳</span>
                                </span>
                              )}
                            </div>
                            <div>
                              {hasGoogleMap ? (
                                <a
                                  href={sanitizeExternalUrl(biz.googleMapsUrl)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[9.5px] bg-blue-500/15 hover:bg-blue-500/25 text-blue-700 dark:text-blue-300 font-bold px-2 py-0.5 rounded-md border border-blue-500/30 inline-flex items-center gap-1 transition-colors cursor-pointer"
                                  title="فتح الرابط المعتمد على خرائط Google"
                                >
                                  <span>🌐 موثق بـ Google</span>
                                </a>
                              ) : biz.googleSyncStatus === 'in_progress' ? (
                                <span className="text-[9.5px] bg-purple-500/15 text-purple-700 dark:text-purple-300 font-bold px-2 py-0.5 rounded-md border border-purple-500/30 inline-flex items-center gap-1">
                                  <span>⏳ قيد توثيق Google</span>
                                </span>
                              ) : (
                                <span className="text-[9.5px] text-slate-500 dark:text-slate-400 font-medium px-1.5 py-0.5 rounded border border-slate-700/40 inline-flex items-center gap-1 opacity-70">
                                  <span>⚪ غير مربوط بـ Google</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* 1. زر رفع ومزامنة Google (⚡) */}
                            {!hasGoogleMap ? (
                              <button
                                type="button"
                                onClick={() => onSetSyncModalBiz(biz)}
                                className="w-8 h-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-2xs transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0"
                                title="رفع ومزامنة النشاط مباشرة إلى Google Maps"
                              >
                                <Zap className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled
                                className="w-8 h-8 rounded-xl bg-slate-500/10 text-slate-400 dark:text-slate-600 border border-slate-500/20 flex items-center justify-center cursor-not-allowed opacity-50 shrink-0"
                                title="النشاط موثق ومربوط بخرائط Google بالفعل"
                              >
                                <Zap className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* 2. زر التحصيل المالي (💲) */}
                            {!isExempt && debtAmount > 0 ? (
                              <button
                                type="button"
                                onClick={() => {
                                  if (packageDebt > 0 && onCollectPayment) {
                                    onCollectPayment(biz);
                                  } else {
                                    onSetEditingBusinessInitialTab('payment');
                                    onSetEditingBusiness(biz);
                                  }
                                }}
                                className="w-8 h-8 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white flex items-center justify-center shadow-2xs transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0"
                                title={`تحصيل متبقي السداد: ${formatEGP(debtAmount)}`}
                              >
                                <DollarSign className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled
                                className="w-8 h-8 rounded-xl bg-slate-500/10 text-slate-400 dark:text-slate-600 border border-slate-500/20 flex items-center justify-center cursor-not-allowed opacity-50 shrink-0"
                                title={isExempt ? 'نشاط معفى مجاناً من الرسوم' : 'الحساب مسدد بالكامل'}
                              >
                                <DollarSign className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* 3. زر سجل الملاحظات والمتابعات (🗒️) */}
                            <button
                              type="button"
                              onClick={() => setSelectedFollowUpBiz(biz)}
                              className={`w-8 h-8 rounded-xl border flex items-center justify-center relative transition-all shadow-2xs cursor-pointer hover:scale-105 active:scale-95 shrink-0 ${
                                fuSummary.isOverdue
                                  ? 'bg-rose-500/20 border-rose-500 text-rose-600 animate-pulse'
                                  : fuSummary.dueTodayCount > 0
                                  ? 'bg-amber-500/20 border-amber-500 text-amber-600'
                                  : 'bg-[var(--input-bg)] hover:bg-amber-500/15 text-[var(--text-secondary)] hover:text-amber-600 border-[var(--border-color)]'
                              }`}
                              title={
                                fuSummary.isOverdue
                                  ? `🚨 هناك ${fuSummary.overdueCount} متابعة متأخرة!`
                                  : fuSummary.dueTodayCount > 0
                                  ? `🟡 متابعة مستحقة اليوم (${fuSummary.dueTodayCount})`
                                  : `سجل الملاحظات والمتابعات الإدارية (${biz.adminFollowUps?.length || 0})`
                              }
                            >
                              <ClipboardList className="w-3.5 h-3.5 text-amber-500" />
                              {fuSummary.isOverdue ? (
                                <span className="absolute -top-1 -right-1 bg-rose-600 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs animate-bounce">
                                  {fuSummary.overdueCount}
                                </span>
                              ) : (biz.adminFollowUps && biz.adminFollowUps.length > 0) ? (
                                <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                                  {biz.adminFollowUps.length}
                                </span>
                              ) : null}
                            </button>

                            {/* 4. زر معاينة وإصدار الفاتورة (📄) */}
                            <button
                              type="button"
                              onClick={() => onShowInvoice(biz)}
                              className="w-8 h-8 rounded-xl bg-[var(--input-bg)] hover:bg-amber-500/15 text-[var(--text-secondary)] hover:text-amber-600 border border-[var(--border-color)] flex items-center justify-center transition-all shadow-2xs cursor-pointer hover:scale-105 active:scale-95 shrink-0"
                              title="معاينة وإصدار الفاتورة"
                            >
                              <FileText className="w-3.5 h-3.5 text-sky-500" />
                            </button>

                            {/* 5. زر عرض وتعديل التفاصيل (👁️) */}
                            <button
                              type="button"
                              onClick={() => onSetEditingBusiness(biz)}
                              className="w-8 h-8 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 flex items-center justify-center shadow-2xs transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0"
                              title="عرض وتعديل التفاصيل الكاملة (مع خيارات الحذف الإداري)"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
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

      {/* Pagination Controls */}
      {totalBizPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs">
          <span className="text-[var(--text-muted)] font-bold">
            عرض {((bizPage - 1) * bizPageSize) + 1} إلى {Math.min(filteredBusinesses.length, bizPage * bizPageSize)} من {filteredBusinesses.length} نشاط
          </span>

          <div className="flex items-center gap-1 bg-[var(--bg-card)] p-1 rounded-xl border border-[var(--border-color)]">
            <button
              type="button"
              disabled={bizPage === 1}
              onClick={() => setBizPage((p) => Math.max(1, p - 1))}
              className="px-2.5 py-1 rounded-lg text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-amber-500/10 cursor-pointer flex items-center gap-1"
            >
              <ChevronRight className="w-4 h-4" />
              <span>السابق</span>
            </button>

            <div className="flex items-center gap-1 px-2 font-mono font-bold text-[var(--text-primary)]">
              <span>{bizPage}</span> / <span>{totalBizPages}</span>
            </div>

            <button
              type="button"
              disabled={bizPage === totalBizPages}
              onClick={() => setBizPage((p) => Math.min(totalBizPages, p + 1))}
              className="px-2.5 py-1 rounded-lg text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-amber-500/10 cursor-pointer flex items-center gap-1"
            >
              <span>التالي</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Fast CRM Follow-up Modal ── */}
      {selectedFollowUpBiz && (
        <BusinessFollowUpModal
          business={selectedFollowUpBiz}
          currentUser={currentUser || null}
          isOpen={Boolean(selectedFollowUpBiz)}
          onClose={() => setSelectedFollowUpBiz(null)}
          onUpdateBusiness={(updated) => {
            setSelectedFollowUpBiz(updated);
            if (onUpdateBusiness) {
              onUpdateBusiness(updated);
            }
          }}
          onOpenFullEdit={(biz) => {
            setSelectedFollowUpBiz(null);
            onSetEditingBusinessInitialTab('admin_followup');
            onSetEditingBusiness(biz);
          }}
        />
      )}

      {/* ── Custom Confirmation Dialog (replaces window.confirm) ── */}
      <ConfirmDialog
        isOpen={Boolean(confirmDelete)}
        title="تأكيد حذف النشاط"
        message={`هل أنت متأكد من حذف نشاط "${confirmDelete?.name || ''}" من المنظومة؟ سيتم نقله إلى سلة المحذوفات.`}
        confirmLabel="حذف النشاط"
        cancelLabel="إلغاء"
        variant="danger"
        onConfirm={() => {
          if (confirmDelete) {
            onDeleteBusiness(confirmDelete.id);
          }
          setConfirmDelete(null);
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
};
