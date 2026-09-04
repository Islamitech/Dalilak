import React from 'react';
import { Business } from '../../../types';
import { EGYPT_GOVERNORATES } from '../../../data/mockData';
import { exportBusinessesToCsv } from '../../../utils/exportCsv';
import { sanitizeExternalUrl } from '../../../utils/urlSanitizer';
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
  verifiedWithDebtCount: number;
  directoryApprovedCount: number;
  onCollectPayment?: (biz: Business) => void;
  onSetSyncModalBiz: (biz: Business | null) => void;
  onSetEditingBusiness: (biz: Business | null) => void;
  onSetEditingBusinessInitialTab: (tab: string | undefined) => void;
  onShowInvoice: (biz: Business) => void;
  onDeleteBusiness: (id: string) => void;
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
  verifiedWithDebtCount,
  directoryApprovedCount,
  onCollectPayment,
  onSetSyncModalBiz,
  onSetEditingBusiness,
  onSetEditingBusinessInitialTab,
  onShowInvoice,
  onDeleteBusiness,
}) => {
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
          onClick={() => setVerificationFilter('in_progress')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
            verificationFilter === 'in_progress'
              ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
              : 'bg-amber-500/10 text-amber-800 dark:text-amber-300 hover:bg-amber-500/20 border border-amber-500/30'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>⏳ قيد مراجعة الدليل ({inProgressCount})</span>
        </button>
        <button
          onClick={() => setVerificationFilter('verified')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
            verificationFilter === 'verified'
              ? 'bg-emerald-600 text-white font-black shadow-xs'
              : 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>🟢 معتمدة بالدليل ({verifiedCount})</span>
        </button>
        <button
          onClick={() => setVerificationFilter('google_synced')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
            verificationFilter === 'google_synced'
              ? 'bg-blue-600 text-white font-black shadow-xs'
              : 'bg-blue-500/10 text-blue-800 dark:text-blue-300 hover:bg-blue-500/20 border border-blue-500/30'
          }`}
        >
          <span>🌐 موثقة بـ Google Maps ({businesses.filter((b) => b.googleSyncStatus === 'synced' || Boolean(b.googleMapsUrl)).length})</span>
        </button>
        <button
          onClick={() => setVerificationFilter('google_pending')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
            verificationFilter === 'google_pending'
              ? 'bg-purple-600 text-white font-black shadow-xs'
              : 'bg-purple-500/10 text-purple-800 dark:text-purple-300 hover:bg-purple-500/20 border border-purple-500/30'
          }`}
        >
          <span>⏳ قيد توثيق Google ({businesses.filter((b) => b.googleSyncStatus === 'in_progress').length})</span>
        </button>
      </div>

      {/* Search and Dropdown Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute right-3 top-3" />
          <input
            type="text"
            placeholder="بحث باسم النشاط، العميل أو الهاتف..."
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
          <option value="all">كل حالات التوثيق ({businesses.length})</option>
          <option value="not_submitted">🚨 لم تُرسل لجوجل بعد ({notSubmittedCount})</option>
          <option value="in_progress">⏳ بانتظار موافقة جوجل ({inProgressCount})</option>
          <option value="overdue">⏱️ تجاوزت مدة المراجعة ({overdueReviewCount})</option>
          <option value="verified_debt">⚠️ موثقة على الخريطة ولها متبقي سداد ({verifiedWithDebtCount})</option>
          <option value="verified">✅ موثقة بخرائط Google ({verifiedCount})</option>
          <option value="directory_verified">🟢 معتمدة بالدليل العام ({directoryApprovedCount})</option>
          <option value="rejected">❌ مرفوضة بالدليل</option>
        </select>
      </div>

      {/* Header Action Toolbar: Export CSV & Count & Page Size */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[var(--bg-card)] p-3 rounded-2xl border border-[var(--border-color)] text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[var(--text-secondary)]">
            إجمالي الأنشطة المطابقة: <strong className="font-mono font-black text-amber-600 dark:text-amber-400">{filteredBusinesses.length}</strong> نشاط
          </span>
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
            لا توجد أنشطة مطابقة للبحث أو التصفية الحالية.
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
                const isGoogleSynced = hasGoogleMap;
                const isInGoogleReview = !hasGoogleMap && biz.googleSyncStatus === 'in_progress';
                const isAlreadyOnGoogle = Boolean(biz.isAlreadyOnGoogle || biz.packageId === 'pkg_already_on_google' || biz.registrationType === 'already_on_google');
                const isExempt = Boolean(isAlreadyOnGoogle || biz.isFeeExempt || biz.packagePrice === 0);
                const debtAmount = isExempt ? 0 : Math.max(0, (biz.packagePrice || 0) - (biz.amountPaid || 0));
                const isPaid = isExempt ? true : (biz.paymentStatus === 'fully_paid' || (biz.amountPaid || 0) >= (biz.packagePrice || 250));
                const isCash = !isExempt && (biz.cashCollectedByRep !== undefined
                  ? (biz.cashCollectedByRep || 0) > 0
                  : biz.paymentMethod !== 'gateway_online' && isPaid);
                const rate = biz.repCommissionRate || 42.86;
                const repComm = isExempt ? 0 : Math.round(((biz.amountPaid || 0) * rate) / 100);
                const platDue = isExempt ? 0 : (biz.amountPaid || 0) - repComm;
                const isGoogleVerifiedWithDebt = hasGoogleMap && !isPaid && !isExempt && debtAmount > 0;

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
                            <span>معتمد بالدليل ✅</span>
                          </span>
                        ) : (
                          <span className="bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 text-[9.5px] font-black px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            <span>قيد مراجعة الدليل ⏳</span>
                          </span>
                        )}

                        {isGoogleSynced ? (
                          <span className="bg-blue-500/15 text-blue-800 dark:text-blue-300 border border-blue-500/30 text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                            🌐 خرائط Google
                          </span>
                        ) : isInGoogleReview ? (
                          <span className="bg-purple-500/15 text-purple-800 dark:text-purple-300 border border-purple-500/30 text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                            ⏳ مراجعة Google
                          </span>
                        ) : null}

                        {Boolean(biz.adminFollowUps && biz.adminFollowUps.length > 0) && (
                          <button
                            type="button"
                            onClick={() => {
                              onSetEditingBusinessInitialTab('admin_followup');
                              onSetEditingBusiness(biz);
                            }}
                            className="bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[9px] font-bold px-1.5 py-0.5 rounded-md inline-flex items-center gap-1 cursor-pointer transition-colors"
                            title="عرض وسجل المتابعات الإدارية"
                          >
                            <ClipboardList className="w-2.5 h-2.5 text-amber-500" />
                            <span>{biz.adminFollowUps!.length} متابعة</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Urgent Alert if Verified on Google with Remaining Debt */}
                    {isGoogleVerifiedWithDebt && (
                      <div className="bg-rose-500/15 border border-rose-500/40 text-rose-700 dark:text-rose-300 p-2.5 rounded-xl text-xs font-black flex items-center justify-between gap-2 animate-pulse">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                          <span className="truncate">🚨 تم التوثيق على خرائط Google ومطلوب التحصيل! (مستحق: {debtAmount} ج)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (onCollectPayment) {
                              onCollectPayment(biz);
                            } else {
                              onSetEditingBusiness(biz);
                            }
                          }}
                          className="bg-rose-600 hover:bg-rose-500 text-white font-black text-[10px] px-2.5 py-1 rounded-lg shadow-xs cursor-pointer shrink-0"
                        >
                          تحصيل الآن 💰
                        </button>
                      </div>
                    )}

                    {/* Location, Rep, and Date Grid */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-[var(--input-bg)]/60 p-2.5 rounded-xl border border-[var(--border-color)]">
                      <div className="min-w-0">
                        <span className="text-[9px] text-[var(--text-muted)] block font-bold">الموقع والمندوب:</span>
                        <span className="font-bold text-[var(--text-primary)] block truncate">{biz.governorate} ({biz.city})</span>
                        <span className="text-[10px] text-[var(--text-secondary)] block truncate">مندوب: {biz.repName}</span>
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
                        <span className="font-black text-amber-600 dark:text-amber-400">{isExempt ? 'مجاني 0 ج' : `${biz.packagePrice || 250} ج`}</span>
                      </div>
                      <div className="flex items-center justify-between font-mono">
                        <span className="text-[10.5px] text-[var(--text-secondary)]">المبلغ المسدد:</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{biz.amountPaid || 0} ج</span>
                      </div>
                      {debtAmount > 0 && (
                        <div className="flex items-center justify-between font-mono font-bold text-rose-500">
                          <span className="text-[10.5px]">المتبقي للتحصيل:</span>
                          <span>{debtAmount} ج</span>
                        </div>
                      )}
                      {isCash && (
                        <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] font-mono pt-1 border-t border-[var(--border-color)]">
                          <span>نصيب المندوب: {repComm} ج</span>
                          <span>مستحق للمنصة: {platDue} ج</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-1.5 pt-1">
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
                        <span>التفاصيل والتعديل</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`هل أنت متأكد من رغبتك في حذف نشاط "${biz.nameAr}" نهائياً؟`)) {
                            onDeleteBusiness(biz.id);
                          }
                        }}
                        className="bg-rose-500/15 hover:bg-rose-500 text-rose-500 hover:text-white p-2 rounded-xl border border-rose-500/30 cursor-pointer transition-colors"
                        title="حذف النشاط"
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
                    <th className="p-3">اسم النشاط والتصنيف</th>
                    <th className="p-3">المسؤول والموقع</th>
                    <th className="p-3">المندوب وتاريخ التسجيل</th>
                    <th className="p-3">الباقة والموقف المالي</th>
                    <th className="p-3">حالة التوثيق</th>
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
                    const debtAmount = isExempt ? 0 : Math.max(0, (biz.packagePrice || 0) - (biz.amountPaid || 0));
                    const isPaid = isExempt ? true : (biz.paymentStatus === 'fully_paid' || (biz.amountPaid || 0) >= (biz.packagePrice || 250));
                    const isCash = !isExempt && (biz.cashCollectedByRep !== undefined
                      ? (biz.cashCollectedByRep || 0) > 0
                      : biz.paymentMethod !== 'gateway_online' && isPaid);
                    const rate = biz.repCommissionRate || 42.86;
                    const repComm = isExempt ? 0 : Math.round(((biz.amountPaid || 0) * rate) / 100);
                    const platDue = isExempt ? 0 : (biz.amountPaid || 0) - repComm;

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
                        </td>

                        <td className="p-3">
                          <p className="font-bold text-[var(--text-primary)]">{biz.repName}</p>
                          <p className="text-[10px] text-[var(--text-muted)] font-mono">{biz.createdDate ? new Date(biz.createdDate).toLocaleDateString('ar-EG') : 'غير محدد'}</p>
                        </td>

                        <td className="p-3">
                          <div className="space-y-1">
                            {isExempt ? (
                              <span className="badge-success text-[10px] font-black px-2 py-0.5 rounded-full inline-block">
                                معفى (مجاني)
                              </span>
                            ) : debtAmount > 0 && (biz.amountPaid || 0) === 0 ? (
                              <>
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full inline-block bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                                  فاتورة مؤجلة حتى التوثيق ⏳
                                </span>
                                <p className="text-[10.5px] font-extrabold text-purple-700 dark:text-purple-300">
                                  💳 تحويل إلكتروني ({debtAmount} ج)
                                </p>
                                <p className="text-[9px] text-[var(--text-muted)] font-medium">
                                  سداد إلكتروني بعد اكتمال التوثيق
                                </p>
                              </>
                            ) : (
                              <>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full inline-block ${
                                  debtAmount === 0 ? 'badge-success' : 'badge-warning'
                                }`}>
                                  {debtAmount === 0 ? 'مدفوع بالكامل' : `مدفوع ${biz.amountPaid || 0} (متبقي ${debtAmount})`}
                                </span>
                                <p className="text-[10.5px] font-extrabold text-[var(--text-primary)]">
                                  {isCash ? (
                                    <span className="text-amber-700 dark:text-amber-300">💵 كاش بيد المندوب</span>
                                  ) : (
                                    <span className="text-purple-700 dark:text-purple-300">💳 تحويل إلكتروني</span>
                                  )}
                                </p>
                                {isCash && (
                                  <p className="text-[9.5px] text-[var(--text-muted)] font-mono">
                                    المندوب: {repComm} ج • مستحق: {platDue} ج
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        </td>

                        <td className="p-3">
                          <div className="space-y-1">
                            {isDirectoryApproved ? (
                              <span className="badge-success text-[10.5px] font-black px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                <span>معتمد بالدليل 🟢</span>
                              </span>
                            ) : (
                              <span className="badge-warning text-[10.5px] font-black px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-500" />
                                <span>قيد مراجعة الدليل ⏳</span>
                              </span>
                            )}
                            {hasGoogleMap ? (
                              <span className="text-[9.5px] bg-blue-500/15 text-blue-700 dark:text-blue-300 font-bold px-2 py-0.5 rounded-md border border-blue-500/30 flex items-center gap-1 w-fit">
                                <span>📍 خريطة Google مفعلة</span>
                              </span>
                            ) : (
                              <span className="text-[9.5px] text-slate-500 font-medium px-1.5 py-0.5 rounded border border-slate-700/40 flex items-center gap-1 w-fit opacity-70">
                                <span>⚪ خريطة غير مفعلة</span>
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {!isExempt && !isPaid && onCollectPayment && (
                              <button
                                type="button"
                                onClick={() => onCollectPayment(biz)}
                                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-[10px] px-2.5 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1"
                                title="تحصيل الفاتورة والمبلغ المتبقي فوراً"
                              >
                                <DollarSign className="w-3 h-3" />
                                <span>تحصيل ({debtAmount} ج)</span>
                              </button>
                            )}

                            {!isDirectoryApproved && (
                              <button
                                type="button"
                                onClick={() => onSetSyncModalBiz(biz)}
                                className="bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] px-2.5 py-1.5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1"
                                title="رفع وتوثيق النشاط مباشرة إلى Google Maps"
                              >
                                <Zap className="w-3 h-3" />
                                <span>رفع لجوجل</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                onSetEditingBusinessInitialTab('admin_followup');
                                onSetEditingBusiness(biz);
                              }}
                              className="bg-[var(--input-bg)] hover:bg-amber-500/15 text-[var(--text-secondary)] hover:text-amber-600 border border-[var(--border-color)] font-bold text-[11px] px-2.5 py-1.5 rounded-xl transition-all shadow-2xs cursor-pointer inline-flex items-center gap-1"
                              title="فتح سجل المتابعات والملاحظات الإدارية"
                            >
                              <ClipboardList className="w-3.5 h-3.5 text-amber-500" />
                              <span>ملاحظات ({biz.adminFollowUps?.length || 0})</span>
                            </button>

                            <button
                              onClick={() => onSetEditingBusiness(biz)}
                              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[11px] px-3 py-1.5 rounded-xl transition-all shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                              title="عرض كل البيانات التي أدخلها المندوب والتعديل عليها"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>التفاصيل والتعديل</span>
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
    </div>
  );
};
